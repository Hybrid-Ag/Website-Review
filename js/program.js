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
  var drillOpener = null, popoutOpener = null, inertSiblings = [];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
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
      matrix.appendChild(cell);
    });
    // Only crop sources that include testing receive this extra row.
    if (C.stages.some(function (s) { return s.testing; })) {
      matrix.appendChild(el('div', 'mx-testing-label', 'Testing'));
      C.stages.forEach(function (s) {
        var cell = el('div', 'mx-cell mx-testing-cell');
        if (s.testing) cell.appendChild(el('span', 'mx-testing-badge', s.testing));
        matrix.appendChild(cell);
      });
    }
    C.cats.forEach(function (cat) {
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
      var active = C.products.filter(function (p) { return p.rates[i]; });
      var item = el('div', 'step-item');
      var metadata = [s.bbch, s.month, active.length + ' input' + (active.length === 1 ? '' : 's'), s.testing ? 'Testing shown: ' + s.testing : ''].filter(Boolean).join(' &middot; ');
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
          (chips ? '<div class="step-inputs">' + chips + '</div>' : '<p class="step-none">No products are listed for this stage. Discuss your crop with an agronomist.</p>') +
        '</div>';
      stepper.appendChild(item);
    });
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
    tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
  }
  function hideTip() { tooltip.classList.remove('show'); }
  matrix.addEventListener('mouseover', function (e) {
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
  });
  matrix.addEventListener('mousemove', function (e) { if (tooltip.classList.contains('show')) moveTip(e); });
  matrix.addEventListener('mouseleave', hideTip);

  // ---------- Layer 3: click stage / rate → drill ----------
  function openDrill(i, opener) {
    var s = C.stages[i];
    if (drillOpener) drillOpener.setAttribute('aria-expanded', 'false');
    drillOpener = opener;
    drillOpener.setAttribute('aria-expanded', 'true');
    var active = C.products.filter(function (p) { return p.rates[i]; });
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
        '<div><h4>Products shown for this stage &middot; ' + active.length + '</h4><div class="drill-prods">' + prods + '</div></div>' +
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
    if (drillOpener) { drillOpener.setAttribute('aria-expanded', 'false'); restoreFocus(drillOpener); }
    drillOpener = null;
  }
  function restoreFocus(opener) {
    if (opener && opener.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
  }

  // ---------- Layer 2: click input → popout ----------
  function openPopout(p, opener) {
    if (!p) return;
    popoutOpener = opener;
    var wins = C.stages.map(function (s, i) { return p.rates[i] ? '<span class="badge">' + p.rates[i] + ' &middot; ' + s.name + '</span>' : ''; }).filter(Boolean).join(' ');
    popout.innerHTML =
      '<div class="popout-head"><div><h3 id="program-popout-title">' + p.name + '</h3>' + (p.role ? '<span class="popout-role">' + p.role + '</span>' : '') + '</div><button type="button" class="popout-close" aria-label="Close product detail">&times;</button></div>' +
      '<div class="popout-body"><p>' + p.why + '</p>' +
      '<h4 style="font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:0;text-transform:uppercase;margin:0 0 10px;color:var(--ink)">Entries in this draft</h4>' +
      '<div class="popout-win">' + wins + '</div>' +
      '<p class="popout-rate-note">' + rateNote() + ' Products shown at the same stage are not necessarily a tank mix.</p>' +
      (p.href ? '<a class="pill pill--teal popout-product-link" href="' + p.href + '">View product &rarr;</a>' : '') + '</div>';
    popout.setAttribute('aria-labelledby', 'program-popout-title');
    popout.removeAttribute('aria-label');
    backdrop.classList.add('show');
    backdrop.removeAttribute('aria-hidden');
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
  function closePopout() {
    if (!backdrop.classList.contains('show')) return;
    backdrop.classList.remove('show');
    inertSiblings.forEach(function (sibling) { sibling.inert = false; });
    inertSiblings = [];
    restoreFocus(popoutOpener);
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
