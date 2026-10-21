/* Homepage-only film overlay. Native sticky navigation; no scroll interception. */
(function () {
  'use strict';
  function mount() {
    var body = document.body;
    var hero = document.querySelector('[data-feedback-hero]');
    var header = document.getElementById('site-header');
    if (!body.classList.contains('home-feedback') || !hero || !header ||
        !header.querySelector('.nav') || !('IntersectionObserver' in window)) return;
    var observer;
    function refresh() {
      if (observer) observer.disconnect();
      var height = Math.ceil(header.getBoundingClientRect().height);
      // Anchor links leave a small clearance below the sticky bar. Switch tone
      // before that gap so a direct link to the next section is already solid.
      var next = hero.nextElementSibling;
      var anchorGap = next ? parseFloat(getComputedStyle(next).scrollMarginTop) || 0 : 0;
      var boundary = Math.max(height, anchorGap) + 1;
      try {
        observer = new IntersectionObserver(function (entries) {
          body.classList.toggle('home-nav-over-hero', entries[0].isIntersecting);
        }, { rootMargin: '-' + boundary + 'px 0px 0px 0px', threshold: 0 });
        observer.observe(hero);
        body.style.setProperty('--home-header-height', height + 'px');
        body.classList.add('home-nav-ready');
        var rect = hero.getBoundingClientRect();
        body.classList.toggle('home-nav-over-hero', rect.bottom > boundary && rect.top < innerHeight);
      } catch (_) {
        // Keep the original solid navigation if the enhancement is unavailable.
        if (observer) observer.disconnect();
        body.classList.remove('home-nav-ready', 'home-nav-over-hero');
        body.style.removeProperty('--home-header-height');
      }
    }
    refresh();
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('pageshow', refresh);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
