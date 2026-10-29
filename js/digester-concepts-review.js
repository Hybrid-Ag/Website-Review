/* Digester product tabs follow the shared auto-hiding navigation. */
(function () {
  'use strict';
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
