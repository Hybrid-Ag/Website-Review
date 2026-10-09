/* Hybrid Ag homepage motion: visible-first, input-aware and deliberately restrained. */
(function () {
  'use strict';

  if (!document.body || document.body.dataset.page !== 'home') return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = Boolean(connection && connection.saveData);
  var motionTargets = Array.prototype.slice.call(document.querySelectorAll('[data-home-motion], [data-home-media]'));

  function revealAll() {
    motionTargets.forEach(function (element) { element.classList.add('in'); });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('home-motion-ready');
    var motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        motionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    motionTargets.forEach(function (element) { motionObserver.observe(element); });
  } else {
    revealAll();
  }

  var hero = document.querySelector('.home-hero:not(.home-hero--film)');
  var heroState = { pointerX: 0, pointerY: 0, scrollY: 0, scale: 1.025 };
  var heroFrame = 0;
  var heroDepthFrame = 0;
  var heroInView = false;

  function renderHero() {
    heroFrame = 0;
    if (!hero) return;
    hero.style.setProperty('--hero-x', heroState.pointerX.toFixed(2) + 'px');
    hero.style.setProperty('--hero-y', (heroState.pointerY + heroState.scrollY).toFixed(2) + 'px');
    hero.style.setProperty('--hero-scale', heroState.scale.toFixed(4));
  }

  function requestHeroRender() {
    if (!heroFrame) heroFrame = window.requestAnimationFrame(renderHero);
  }

  function updateHeroDepth() {
    heroDepthFrame = 0;
    if (!hero || !heroInView) return;
    var rect = hero.getBoundingClientRect();
    var progress = Math.max(0, Math.min(1, -rect.top / rect.height));
    heroState.scrollY = progress * 10;
    heroState.scale = 1.025 + progress * 0.018;
    requestHeroRender();
  }

  function requestHeroDepth() {
    if (!heroDepthFrame) heroDepthFrame = window.requestAnimationFrame(updateHeroDepth);
  }

  function prepareField(element) {
    var pointerFrame = 0;
    var nextX = 50;
    var nextY = 46;

    function renderField() {
      pointerFrame = 0;
      element.style.setProperty('--field-x', nextX.toFixed(2) + '%');
      element.style.setProperty('--field-y', nextY.toFixed(2) + '%');
      if (element !== hero) return;
      heroState.pointerX = (nextX - 50) * -0.09;
      heroState.pointerY = (nextY - 50) * -0.05;
      requestHeroRender();
    }

    element.addEventListener('pointerenter', function () {
      element.classList.add('is-field-active');
    });
    element.addEventListener('pointermove', function (event) {
      var rect = element.getBoundingClientRect();
      nextX = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      nextY = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
      if (!pointerFrame) pointerFrame = window.requestAnimationFrame(renderField);
    });
    element.addEventListener('pointerleave', function () {
      element.classList.remove('is-field-active');
      if (element !== hero) return;
      heroState.pointerX = 0;
      heroState.pointerY = 0;
      requestHeroRender();
    });
  }

  if (!reduceMotion && !saveData && finePointer) {
    document.documentElement.classList.add('home-rich-motion-ready');
    Array.prototype.forEach.call(document.querySelectorAll('[data-home-field]'), prepareField);
    if (hero && 'IntersectionObserver' in window) {
      var heroVisibilityObserver = new IntersectionObserver(function (entries) {
        heroInView = entries.some(function (entry) { return entry.isIntersecting; });
        if (heroInView) requestHeroDepth();
      }, { rootMargin: '120px 0px' });
      heroVisibilityObserver.observe(hero);
      window.addEventListener('scroll', requestHeroDepth, { passive: true });
      window.addEventListener('resize', requestHeroDepth);
    }
  }

})();
