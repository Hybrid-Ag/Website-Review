/* Selected Digester brochure: local page images, no commerce or external embeds. */
(function () {
  'use strict';
  var dialog = document.getElementById('brochure-viewer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var options = { b: { name: 'Mycro-Tec Digester brochure', pages: 4 } };
  var image = document.getElementById('brochure-page');
  var pane = dialog.querySelector('.digester-viewer-page');
  var canvas = dialog.querySelector('.digester-page-canvas');
  var thumbnails = Array.from(dialog.querySelectorAll('[data-brochure-page]'));
  var count = document.getElementById('brochure-count');
  var previous = dialog.querySelector('[data-brochure-prev]');
  var next = dialog.querySelector('[data-brochure-next]');
  var closeButton = dialog.querySelector('[data-brochure-close]');
  var fitButton = dialog.querySelector('[data-brochure-fit]');
  var zoomOut = dialog.querySelector('[data-brochure-zoom-out]');
  var zoomIn = dialog.querySelector('[data-brochure-zoom-in]');
  var zoomStatus = document.getElementById('brochure-zoom-status');
  var key = 'b', page = 1, zoom = 1, opener = null, restoreFocus = true, oldOverflow = '', resizeFrame = 0;
  function resetPan() { pane.scrollLeft = 0; pane.scrollTop = 0; }
  function sizePage(preserveCentre) {
    if (!dialog.open) return;
    var paneRect = pane.getBoundingClientRect();
    var canvasRect = canvas.getBoundingClientRect();
    var centre = preserveCentre && canvasRect.width && canvasRect.height ? {
      x: (paneRect.left + pane.clientLeft + pane.clientWidth / 2 - canvasRect.left) / canvasRect.width,
      y: (paneRect.top + pane.clientTop + pane.clientHeight / 2 - canvasRect.top) / canvasRect.height
    } : null;
    var styles = window.getComputedStyle(pane);
    var borderWidth = parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
    var borderHeight = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    // A stable gutter is reserved at every zoom. Ignore transient scrollbars when deriving the fit size.
    var gutter = String(styles.scrollbarGutter || '').indexOf('stable') !== -1 ? Math.max(0, pane.offsetWidth - pane.clientWidth - borderWidth) : 0;
    var width = paneRect.width - borderWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight) - gutter;
    var height = paneRect.height - borderHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    if (width <= 0 || height <= 0) return;
    var scale = Math.min(width / 1587, height / 2246) * zoom;
    canvas.style.width = Math.floor(1587 * scale * 100) / 100 + 'px';
    canvas.style.height = Math.floor(2246 * scale * 100) / 100 + 'px';
    if (centre) {
      canvasRect = canvas.getBoundingClientRect();
      pane.scrollLeft += canvasRect.left + canvasRect.width * centre.x - (paneRect.left + pane.clientLeft + pane.clientWidth / 2);
      pane.scrollTop += canvasRect.top + canvasRect.height * centre.y - (paneRect.top + pane.clientTop + pane.clientHeight / 2);
    } else resetPan();
  }
  function updateZoom() {
    var focused = document.activeElement;
    dialog.classList.toggle('is-fit', zoom === 1);
    zoomOut.disabled = zoom === 1;
    zoomIn.disabled = zoom === 3;
    zoomStatus.textContent = Math.round(zoom * 100) + '% of fit size';
    if (dialog.open && focused === zoomOut && zoomOut.disabled) zoomIn.focus();
    else if (dialog.open && focused === zoomIn && zoomIn.disabled) zoomOut.focus();
  }
  function changeZoom(value) {
    var previousZoom = zoom;
    zoom = Math.max(1, Math.min(3, value));
    if (zoom === previousZoom) return;
    updateZoom();
    sizePage(zoom !== 1);
  }
  function render() {
    var focused = document.activeElement;
    image.src = 'assets/review/digester-residue-led-2026-10-29/digester-dir-' + key + '-' + String(page).padStart(2, '0') + '.webp';
    image.alt = options[key].name + ', page ' + page + ' of ' + options[key].pages + '. Use the PDF for selectable text.';
    count.textContent = 'Page ' + page + ' of ' + options[key].pages;
    previous.disabled = page === 1;
    next.disabled = page === options[key].pages;
    thumbnails.forEach(function (thumbnail) {
      var active = Number(thumbnail.dataset.brochurePage) === page;
      thumbnail.classList.toggle('is-active', active);
      if (active) thumbnail.setAttribute('aria-current', 'page');
      else thumbnail.removeAttribute('aria-current');
    });
    sizePage(false);
    // A disabled focused control can drop focus out of the dialog in Chromium.
    if (dialog.open && focused === next && next.disabled) previous.focus();
    else if (dialog.open && focused === previous && previous.disabled) next.focus();
    if (dialog.open) {
      var selected = thumbnails.find(function (thumbnail) { return Number(thumbnail.dataset.brochurePage) === page; });
      if (selected) selected.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  function close(restore) { restoreFocus = restore !== false; if (dialog.open) dialog.close(); }
  document.querySelectorAll('[data-brochure]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!options[link.dataset.brochure]) return;
      event.preventDefault();
      key = link.dataset.brochure; page = 1; zoom = 1; opener = link; restoreFocus = true;
      document.getElementById('brochure-title').textContent = options[key].name;
      document.getElementById('brochure-download').href = link.href;
      updateZoom();
      render();
      if (window.HybridAgPanels) window.HybridAgPanels.open('digester-brochure', close);
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      sizePage(false);
      closeButton.focus();
    });
  });
  previous.addEventListener('click', function () { if (page > 1) { page--; render(); } });
  next.addEventListener('click', function () { if (page < options[key].pages) { page++; render(); } });
  thumbnails.forEach(function (thumbnail) {
    thumbnail.addEventListener('click', function () {
      var selectedPage = Number(thumbnail.dataset.brochurePage);
      if (selectedPage < 1 || selectedPage > options[key].pages || selectedPage === page) return;
      page = selectedPage;
      render();
    });
  });
  closeButton.addEventListener('click', function () { close(true); });
  fitButton.addEventListener('click', function () { zoom = 1; updateZoom(); sizePage(false); });
  zoomOut.addEventListener('click', function () { changeZoom(zoom - 0.25); });
  zoomIn.addEventListener('click', function () { changeZoom(zoom + 0.25); });
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
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(zoom + 0.25); }
    if (event.key === '-' || event.key === '_') { event.preventDefault(); changeZoom(zoom - 0.25); }
  });
  function scheduleSize() {
    if (!dialog.open || resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(function () { resizeFrame = 0; sizePage(zoom !== 1); });
  }
  if ('ResizeObserver' in window) new ResizeObserver(scheduleSize).observe(pane, { box: 'border-box' });
  window.addEventListener('resize', scheduleSize, { passive: true });
  var links = Array.from(document.querySelectorAll('.product-tabs a'));
  var header = document.getElementById('site-header');
  var tabs = document.querySelector('.product-tabs');
  function alignTabs() {
    var height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    var hidden = header && header.classList.contains('nav-scroll-hidden') && !header.matches(':focus-within');
    document.body.style.setProperty('--product-header-height', height + 'px');
    document.body.style.setProperty('--digester-header-offset', (hidden ? 0 : height) + 'px');
    document.body.style.setProperty('--digester-tabs-height', (tabs ? Math.ceil(tabs.getBoundingClientRect().height) : 0) + 'px');
  }
  if ('ResizeObserver' in window) {
    var navigationSize = new ResizeObserver(alignTabs);
    if (header) navigationSize.observe(header);
    if (tabs) navigationSize.observe(tabs);
  }
  if (header) {
    if ('MutationObserver' in window) new MutationObserver(alignTabs).observe(header, { attributes: true, attributeFilter: ['class'] });
    header.addEventListener('focusin', alignTabs);
    header.addEventListener('focusout', function () { window.requestAnimationFrame(alignTabs); });
  }
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
