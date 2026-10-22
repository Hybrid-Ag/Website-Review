/* Hybrid-Ag — reusable crop program interaction.
   Desktop: stage×input matrix + 3 disclosure layers (hover=why · click stage=drill · click input=popout).
   Mobile: a vertical stage-stepper (tap a stage → its inputs + the why). Same data, same depth. */
(function () {
  var C = window.CROP_PROGRAM || window.CHERRY;
  if (!C) return;
  var matrix = document.getElementById('matrix');
  var stepper = document.getElementById('stepper');
  var drill = document.getElementById('drill');
  var tooltip = document.getElementById('tooltip');
  var backdrop = document.getElementById('popoutBackdrop');
  var popout = document.getElementById('popout');
  var drillOpener = null, popoutOpener = null, inertSiblings = [], scrollLock = null;
  var stageImages = null;
  if (document.body.classList.contains('cherry-program-page') && C === window.CHERRY) stageImages = window.CHERRY_STAGE_IMAGES;
  else if (document.body.classList.contains('apple-program-page') && C === window.CROP_PROGRAM && C.meta && C.meta.crop === 'Apples') stageImages = window.APPLE_STAGE_IMAGES;
  else if (document.body.classList.contains('citrus-program-page') && C === window.CROP_PROGRAM && C.meta && C.meta.crop === 'Citrus') stageImages = window.CITRUS_STAGE_IMAGES;
  var ratesPending = document.body.classList.contains('citrus-program-page') && C.meta && C.meta.crop === 'Citrus' && C.sourceDataset && C.sourceDataset.mappingStatus === 'pending';
  var pendingNote = 'Products, rates and application timing are awaiting source verification. No application recommendation is shown here.';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function stagePhoto(s, size) {
    var source = stageImages && stageImages[s.key];
    if (!source) return null;
    var photo = el('img', 'stage-photo');
    photo.src = source.src; photo.alt = '';
    photo.setAttribute('aria-hidden', 'true');
    photo.width = size; photo.height = size;
    photo.loading = 'lazy'; photo.decoding = 'async';
    if (source.objectPosition) photo.style.objectPosition = source.objectPosition;
    return photo;
  }
  function findProd(name, cat) { for (var i = 0; i < C.products.length; i++) { if (C.products[i].name === name && C.products[i].cat === cat) return C.products[i]; } return null; }
  // Keep Cherry's existing emphasis unless another crop explicitly opts out.
  function isBackbone(p) { return C.emphasizePowerCal !== false && p.name.indexOf('Power-Cal') >= 0; }
  function catLabel(k) { for (var i = 0; i < C.cats.length; i++) if (C.cats[i].key === k) return C.cats[i].label; return k; }
  function roleLine(p) { return p.role ? '<span class="tip-role">' + p.role + '</span>' : ''; }
  // A displayed quantity is a sample entry, not an approved block rate.
  function rateNote() {
    return 'Sample rate, not a recommendation for your block.' +
      (C.sourceDataset && C.sourceDataset.rateBasis ? '' : ' Rate basis needs confirmation before use.');
  }

  // ---------- build matrix (desktop) ----------
  if (matrix) {
    matrix.style.setProperty('--program-stage-count', C.stages.length);
    matrix.appendChild(el('div', 'mx-corner', 'Input  /  Stage →'));
    C.stages.forEach(function (s, i) {
      var cell = el('div', 'mx-stage'); cell.dataset.stage = i;
      cell.setAttribute('role', 'button'); cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-controls', 'drill'); cell.setAttribute('aria-expanded', 'false');
      cell.setAttribute('aria-label', s.name + (s.bbch ? ', ' + s.bbch : '') + '. Open stage detail.');
      cell.innerHTML = '<div class="sname">' + s.name + '</div>' +
        (s.bbch ? '<div class="sbbch">' + s.bbch + '</div>' : '') +
        (s.month ? '<div class="smonth">' + s.month + '</div>' : '') +
        (s.phase ? '<div class="sphase ph-' + s.phase + '"></div>' : '');
      var photo = stagePhoto(s, 44);
      if (photo) cell.insertBefore(photo, cell.firstChild);
      matrix.appendChild(cell);
    });
    if (ratesPending) matrix.appendChild(el('div', 'mx-pending', pendingNote));
    // Only crop sources that include testing receive this extra row.
    if (!ratesPending && C.stages.some(function (s) { return s.testing; })) {
      matrix.appendChild(el('div', 'mx-testing-label', 'Testing'));
      C.stages.forEach(function (s) {
        var cell = el('div', 'mx-cell mx-testing-cell');
        cell.dataset.stage = C.stages.indexOf(s);
        if (s.testing) cell.appendChild(el('span', 'mx-testing-badge', s.testing));
        matrix.appendChild(cell);
      });
    }
    if (!ratesPending) C.cats.forEach(function (cat) {
      var lab = el('div', 'mx-cat cat-' + cat.key);
      lab.innerHTML = '<span class="dot"></span><span>' + cat.label + '</span>';
      matrix.appendChild(lab);
      C.products.filter(function (p) { return p.cat === cat.key; }).forEach(function (p) {
        var bb = isBackbone(p);
        var name = el(p.href ? 'a' : 'div', 'mx-prod' + (bb ? ' is-backbone' : ''), p.name);
        if (p.href) { name.href = p.href; name.setAttribute('aria-label', 'Open ' + p.name + ' product page'); }
        else { name.setAttribute('role', 'button'); name.setAttribute('tabindex', '0'); name.setAttribute('aria-label', p.name + '. Open product detail.'); }
        name.dataset.prod = p.name; name.dataset.cat = p.cat;
        matrix.appendChild(name);
        C.stages.forEach(function (s, i) {
          var cell = el('div', 'mx-cell');
          cell.dataset.stage = i;
          var rate = p.rates[i];
          if (rate) {
            var chip = el('button', 'chip ' + (bb ? 'chip-backbone' : 'chip-' + cat.key), rate);
            chip.type = 'button';
            chip.dataset.prod = p.name; chip.dataset.cat = cat.key; chip.dataset.stage = i; chip.dataset.rate = rate;
            chip.setAttribute('aria-label', p.name + ', ' + rate + ', ' + s.name + '. Open product detail.');
            cell.appendChild(chip);
          }
          matrix.appendChild(cell);
        });
      });
    });
  }

  // ---------- build stepper (mobile) ----------
  if (stepper) {
    C.stages.forEach(function (s, i) {
      var active = ratesPending ? [] : C.products.filter(function (p) { return p.rates[i]; });
      var item = el('div', 'step-item');
      var metadata = ratesPending ? 'Timing and rates to confirm' : [s.bbch, s.month, active.length + ' input' + (active.length === 1 ? '' : 's'), s.testing ? 'Testing shown: ' + s.testing : ''].filter(Boolean).join(' &middot; ');
      var chips = active.map(function (p) {
        var tag = p.href ? 'a' : 'div';
        var href = p.href ? ' href="' + p.href + '"' : '';
        return '<' + tag + ' class="step-chip chip-' + p.cat + (isBackbone(p) ? ' is-backbone' : '') + '"' + href + '><b>' + p.name + '</b>' +
          (p.role ? '<span class="step-role">' + p.role + '</span>' : '') + '<span class="step-rate">' + p.rates[i] + '</span></' + tag + '>';
      }).join('');
      item.innerHTML =
        '<button type="button" class="step-head" id="program-step-' + i + '" aria-controls="program-step-panel-' + i + '" aria-expanded="false">' +
          '<span class="step-n">' + ('0' + (i + 1)).slice(-2) + '</span>' +
          '<span class="step-main"><span class="step-name">' + s.name + '</span>' +
            '<span class="step-meta">' + metadata + '</span></span>' +
          (s.phase ? '<span class="step-phase ph-' + s.phase + '"></span>' : '') + '<span class="step-x" aria-hidden="true">+</span>' +
        '</button>' +
        '<div class="step-panel" id="program-step-panel-' + i + '" aria-labelledby="program-step-' + i + '" hidden>' +
          (s.why ? '<p class="step-why">' + s.why + '</p>' : '') +
          (s.seeing ? '<p class="step-seeing"><b>Crop development:</b> ' + s.seeing + '</p>' : '') +
          (ratesPending ? '<p class="step-none">' + pendingNote + '</p>' : (chips ? '<div class="step-inputs">' + chips + '</div>' : '<p class="step-none">No products are listed for this stage. Discuss your crop with an agronomist.</p>')) +
        '</div>';
      var photo = stagePhoto(s, 48);
      if (photo) item.querySelector('.step-head').insertBefore(photo, item.querySelector('.step-main'));
      stepper.appendChild(item);
    });
    // Match the tallest actual heading, including wrapped labels and loaded fonts.
    // Only header content is measured, so opening a stage does not resize its peers.
    function alignStageHeads() {
      if (!stepper.clientWidth) return;
      var height = 100;
      stepper.querySelectorAll('.step-head').forEach(function (head) {
        var contentHeight = 0, style = window.getComputedStyle(head);
        Array.prototype.forEach.call(head.children, function (child) {
          contentHeight = Math.max(contentHeight, child.offsetHeight);
        });
        height = Math.max(height, Math.ceil(contentHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)));
      });
      stepper.style.setProperty('--program-step-height', height + 'px');
    }
    alignStageHeads();
    if (window.ResizeObserver) {
      var stageSizeObserver = new ResizeObserver(alignStageHeads);
      stepper.querySelectorAll('.step-main').forEach(function (content) { stageSizeObserver.observe(content); });
    } else window.addEventListener('resize', alignStageHeads, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignStageHeads);
    stepper.addEventListener('click', function (e) {
      var head = e.target.closest('.step-head'); if (!head) return;
      var item = head.parentNode, panel = head.nextElementSibling, open = panel.hasAttribute('hidden');
      if (open) { panel.removeAttribute('hidden'); } else { panel.setAttribute('hidden', ''); }
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      item.classList.toggle('is-open', open);
    });
  }

  if (!matrix) return;

  drill.setAttribute('role', 'region');
  drill.setAttribute('aria-label', 'Stage detail');
  drill.setAttribute('tabindex', '-1');
  popout.setAttribute('role', 'dialog');
  popout.setAttribute('aria-modal', 'true');
  popout.setAttribute('aria-label', 'Product detail');
  popout.setAttribute('tabindex', '-1');
  backdrop.setAttribute('aria-hidden', 'true');

  // ---------- Layer 1: hover tooltip ----------
  function showTip(html, e) { tooltip.innerHTML = html; tooltip.classList.add('show'); moveTip(e); }
  function moveTip(e) {
    var x = e.clientX + 14, y = e.clientY + 16, w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    if (x + w > window.innerWidth - 12) x = e.clientX - w - 14;
    if (y + h > window.innerHeight - 12) y = e.clientY - h - 16;
    tooltip.style.left = Math.max(12, Math.min(x, window.innerWidth - w - 12)) + 'px';
    tooltip.style.top = Math.max(12, Math.min(y, window.innerHeight - h - 12)) + 'px';
  }
  function hideTip() { tooltip.classList.remove('show'); }
  function showTargetTip(e) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var chip = e.target.closest('.chip'), stage = e.target.closest('.mx-stage'), prod = e.target.closest('.mx-prod');
    if (chip) {
      var p = findProd(chip.dataset.prod, chip.dataset.cat), s = C.stages[+chip.dataset.stage];
      showTip('<b>' + chip.dataset.rate + ' &middot; ' + chip.dataset.prod + '</b>' + roleLine(p) + (p ? p.why : '') + '<br><span class="tip-rate-note">' + rateNote() + '</span><br><span style="opacity:.65">' + s.name + (s.bbch ? ' (' + s.bbch + ')' : '') + ' &middot; View product detail →</span>', e);
    } else if (stage) {
      var s2 = C.stages[+stage.dataset.stage];
      showTip('<b>' + s2.name + (s2.bbch ? ' &middot; ' + s2.bbch : '') + '</b>' + (s2.why || '') + '<br><span style="opacity:.65">View stage detail →</span>', e);
    } else if (prod) {
      var pp = findProd(prod.dataset.prod, prod.dataset.cat);
      showTip('<b>' + pp.name + '</b>' + roleLine(pp) + pp.why + '<br><span style="opacity:.65">' + (pp.href ? 'Click to open the product page →' : 'View product detail →') + '</span>', e);
    } else hideTip();
  }
  matrix.addEventListener('mouseover', showTargetTip);
  matrix.addEventListener('mousemove', function (e) {
    if (tooltip.classList.contains('show')) moveTip(e);
    else showTargetTip(e); // Resume naturally after scrolling without requiring a cell exit.
  });
  matrix.addEventListener('mouseleave', hideTip);
  matrix.parentElement.addEventListener('scroll', hideTip, { passive: true });
  window.addEventListener('scroll', hideTip, { passive: true });

  // ---------- Layer 3: click stage / rate → drill ----------
  function openDrill(i, opener) {
    var s = C.stages[i];
    if (drillOpener) drillOpener.setAttribute('aria-expanded', 'false');
    drillOpener = opener;
    drillOpener.setAttribute('aria-expanded', 'true');
    matrix.querySelectorAll('.mx-cell').forEach(function (cell) {
      cell.classList.toggle('is-stage-active', +cell.dataset.stage === i);
    });
    var active = ratesPending ? [] : C.products.filter(function (p) { return p.rates[i]; });
    var prods = active.map(function (p) {
      var tag = p.href ? 'a' : 'div';
      var href = p.href ? ' href="' + p.href + '"' : '';
      return '<' + tag + ' class="drill-prod"' + href + '><b>' + p.name + '</b><span>' + p.rates[i] + '</span>' + (p.role ? '<em>' + p.role + '</em>' : '') + '</' + tag + '>';
    }).join('');
    drill.innerHTML =
      '<button type="button" class="drill-close" aria-label="Close stage detail">&times;</button>' +
      '<div class="drill-head"><h3 id="program-drill-title">' + s.name + '</h3>' +
        (s.bbch ? '<span class="drill-bbch">' + s.bbch + '</span>' : '') +
        (s.month ? '<span class="drill-month">' + s.month + '</span>' : '') +
        (s.testing ? '<span class="drill-testing">Testing shown: ' + s.testing + '</span>' : '') + '</div>' +
      '<div class="drill-grid">' +
        '<div>' + (s.why ? '<h4>About this stage</h4><p>' + s.why + '</p>' : '') +
          (s.seeing ? '<h4 style="margin-top:18px">Crop development</h4><p>' + s.seeing + '</p>' : '') + '</div>' +
        (ratesPending ? '<div><h4>Application details to confirm</h4><p>' + pendingNote + '</p></div>' : '<div><h4>Products shown for this stage &middot; ' + active.length + '</h4><div class="drill-prods">' + prods + '</div></div>') +
      '</div>';
    drill.setAttribute('aria-labelledby', 'program-drill-title');
    drill.removeAttribute('aria-label');
    drill.classList.add('show');
    hideTip();
    drill.querySelector('.drill-close').addEventListener('click', closeDrill);
    drill.focus({ preventScroll: true });
    drill.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  function closeDrill() {
    if (!drill.classList.contains('show')) return;
    drill.classList.remove('show');
    matrix.querySelectorAll('.is-stage-active').forEach(function (cell) { cell.classList.remove('is-stage-active'); });
    if (drillOpener) { drillOpener.setAttribute('aria-expanded', 'false'); restoreFocus(drillOpener); }
    drillOpener = null;
  }
  function restoreFocus(opener) {
    if (opener && opener.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
  }

  // ---------- Layer 2: click input → popout ----------
  function lockPageScroll() {
    if (scrollLock) return;
    scrollLock = {
      root: document.documentElement.classList.contains('programme-modal-lock'),
      body: document.body.classList.contains('programme-modal-lock'),
      gutter: document.documentElement.classList.contains('programme-modal-gutter')
    };
    if (window.innerWidth > document.documentElement.clientWidth) document.documentElement.classList.add('programme-modal-gutter');
    document.documentElement.classList.add('programme-modal-lock');
    document.body.classList.add('programme-modal-lock');
  }
  function unlockPageScroll() {
    if (!scrollLock) return;
    if (!scrollLock.root) document.documentElement.classList.remove('programme-modal-lock');
    if (!scrollLock.body) document.body.classList.remove('programme-modal-lock');
    if (!scrollLock.gutter) document.documentElement.classList.remove('programme-modal-gutter');
    scrollLock = null;
  }
  function openPopout(p, opener) {
    if (!p) return;
    if (backdrop.classList.contains('show')) closePopout(false);
    if (window.HybridAgPanels) window.HybridAgPanels.open('programme-product', closePopout);
    popoutOpener = opener;
    var signalField = popout.querySelector('.site-signals-field');
    var wins = C.stages.map(function (s, i) { return p.rates[i] ? '<div class="popout-entry"><span>' + s.name + '</span><strong>' + p.rates[i] + '</strong></div>' : ''; }).filter(Boolean).join('');
    popout.innerHTML =
      '<div class="popout-head"><div><h3 id="program-popout-title">' + p.name + '</h3>' + (p.role ? '<span class="popout-role">' + p.role + '</span>' : '') + '</div><button type="button" class="popout-close" aria-label="Close product detail">&times;</button></div>' +
      '<div class="popout-body"><p>' + p.why + '</p>' +
      '<h4 class="popout-entries-title">Entries in this draft</h4>' +
      '<div class="popout-win">' + wins + '</div>' +
      '<p class="popout-rate-note">' + rateNote() + ' Products shown at the same stage are not necessarily a tank mix.</p>' +
      (p.href ? '<a class="pill pill--teal popout-product-link" href="' + p.href + '">View product &rarr;</a>' : '') + '</div>';
    if (signalField) popout.appendChild(signalField);
    popout.setAttribute('aria-labelledby', 'program-popout-title');
    popout.removeAttribute('aria-label');
    backdrop.classList.add('show');
    backdrop.removeAttribute('aria-hidden');
    // Reuse the site's single motion engine. The header is rebuilt on each open;
    // the stable dialog hosts the field so detached headers never accumulate.
    if (window.HybridAgSignals && !popout.hasAttribute('data-signals-overlay')) {
      popout.setAttribute('data-signals-overlay', '');
      popout.setAttribute('data-signals-polish', '');
      window.HybridAgSignals.prepareSurface(popout);
    }
    lockPageScroll();
    hideTip();
    var close = popout.querySelector('.popout-close');
    close.addEventListener('click', closePopout);
    close.focus({ preventScroll: true });
    // Preserve any pre-existing inert state owned by another component.
    Array.prototype.forEach.call(document.body.children, function (sibling) {
      if (sibling !== backdrop && !sibling.contains(backdrop) && !sibling.inert) {
        sibling.inert = true;
        inertSiblings.push(sibling);
      }
    });
  }
  function closePopout(returnFocus) {
    if (!backdrop.classList.contains('show') && !scrollLock) return;
    backdrop.classList.remove('show');
    inertSiblings.forEach(function (sibling) { sibling.inert = false; });
    inertSiblings = [];
    unlockPageScroll();
    if (window.HybridAgPanels) window.HybridAgPanels.close('programme-product');
    if (returnFocus !== false) restoreFocus(popoutOpener);
    popoutOpener = null;
    backdrop.setAttribute('aria-hidden', 'true');
  }

  matrix.addEventListener('click', function (e) {
    var stage = e.target.closest('.mx-stage'), chip = e.target.closest('.chip'), prod = e.target.closest('.mx-prod');
    if (chip) { openPopout(findProd(chip.dataset.prod, chip.dataset.cat), chip); }
    else if (stage) { openDrill(+stage.dataset.stage, stage); }
    else if (prod && !prod.href) { openPopout(findProd(prod.dataset.prod, prod.dataset.cat), prod); }
  });
  matrix.addEventListener('keydown', function (e) {
    var stage = e.target.closest('.mx-stage'), prod = e.target.closest('.mx-prod');
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (stage) { e.preventDefault(); openDrill(+stage.dataset.stage, stage); }
    else if (prod && !prod.href) { e.preventDefault(); openPopout(findProd(prod.dataset.prod, prod.dataset.cat), prod); }
  });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closePopout(); });
  document.addEventListener('keydown', function (e) {
    if (backdrop.classList.contains('show')) {
      if (e.key === 'Escape') { e.preventDefault(); closePopout(); }
      else if (e.key === 'Tab') {
        var focusable = popout.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]');
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || !popout.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !popout.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    } else if (e.key === 'Escape') { closeDrill(); hideTip(); }
  });
})();
