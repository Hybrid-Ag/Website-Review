/* Design review editions: technical directions withheld, no commerce or external embeds. */
(function () {
  'use strict';
  var dialog = document.getElementById('brochure-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var options = { a: { name: 'A · Field guide', pages: 4 }, b: { name: 'B · Residue-led', pages: 4 }, c: { name: 'C · Compact reference', pages: 2 } };
  var image = document.getElementById('brochure-page');
  var pane = dialog.querySelector('.digester-viewer-page');
  var count = document.getElementById('brochure-count');
  var previous = dialog.querySelector('[data-brochure-prev]');
  var next = dialog.querySelector('[data-brochure-next]');
  var closeButton = dialog.querySelector('[data-brochure-close]');
  var fitButton = dialog.querySelector('[data-brochure-fit]');
  var key = 'a', page = 1, opener = null, restoreFocus = true, oldOverflow = '';
  function render() {
    var focused = document.activeElement;
    image.src = 'assets/review/digester-concepts-2026-10-28/digester-dir-' + key + '-' + String(page).padStart(2, '0') + '.webp';
    image.alt = 'Digester direction ' + options[key].name + ', page ' + page + ' of ' + options[key].pages + '. Use the PDF for selectable text.';
    count.textContent = 'Page ' + page + ' of ' + options[key].pages;
    previous.disabled = page === 1;
    next.disabled = page === options[key].pages;
    pane.scrollTop = 0;
    // A disabled focused control can drop focus out of the dialog in Chromium.
    if (dialog.open && focused === next && next.disabled) previous.focus();
    else if (dialog.open && focused === previous && previous.disabled) next.focus();
  }
  function close(restore) { restoreFocus = restore !== false; if (dialog.open) dialog.close(); }
  document.querySelectorAll('[data-brochure]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!options[link.dataset.brochure]) return;
      event.preventDefault();
      key = link.dataset.brochure; page = 1; opener = link; restoreFocus = true;
      document.getElementById('brochure-title').textContent = 'Direction ' + options[key].name;
      document.getElementById('brochure-download').href = link.href;
      dialog.classList.add('is-fit');
      fitButton.textContent = 'Enlarge page';
      fitButton.setAttribute('aria-pressed', 'false');
      render();
      if (window.HybridAgPanels) window.HybridAgPanels.open('digester-brochure', close);
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal(); closeButton.focus();
    });
  });
  previous.addEventListener('click', function () { if (page > 1) { page--; render(); } });
  next.addEventListener('click', function () { if (page < options[key].pages) { page++; render(); } });
  closeButton.addEventListener('click', function () { close(true); });
  fitButton.addEventListener('click', function () {
    var fit = dialog.classList.toggle('is-fit');
    fitButton.textContent = fit ? 'Enlarge page' : 'Fit page';
    fitButton.setAttribute('aria-pressed', String(!fit));
    pane.scrollTop = 0;
  });
  dialog.addEventListener('click', function (event) { if (event.target !== dialog) return; var rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(true); });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = oldOverflow;
    if (window.HybridAgPanels) window.HybridAgPanels.close('digester-brochure');
    if (restoreFocus && opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Tab') {
      var stops = Array.from(dialog.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')).filter(function (element) { return element.getClientRects().length > 0; });
      var first = stops[0], last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === 'ArrowRight' && !next.disabled) { event.preventDefault(); page++; render(); }
    if (event.key === 'ArrowLeft' && !previous.disabled) { event.preventDefault(); page--; render(); }
  });
  var links = Array.from(document.querySelectorAll('.product-tabs a'));
  var header = document.getElementById('site-header');
  function alignTabs() {
    document.body.style.setProperty('--product-header-height', (header ? Math.ceil(header.getBoundingClientRect().height) : 0) + 'px');
  }
  if (header && 'ResizeObserver' in window) new ResizeObserver(alignTabs).observe(header);
  window.addEventListener('resize', alignTabs, { passive: true });
  alignTabs();
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    links.forEach(function (link) { var section = document.querySelector(link.hash); if (section) observer.observe(section); });
  }
})();
