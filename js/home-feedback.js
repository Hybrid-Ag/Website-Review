/* One passive hero film. No cursor-driven geometry or scroll capture. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-feedback-hero]');
  if (!hero) return;
  var video = hero.querySelector('video');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var playbackBlocked = false, visible = true, failed = false;
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-feedback-reveal]'));
  var photoScenes = Array.prototype.slice.call(document.querySelectorAll('.feedback-testing__image,.sector-scene'));
  var motionObserver = null, motionReleased = false;
  function constrained() { return reduced.matches || Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))); }
  function releaseMotion() {
    motionReleased = true;
    if (motionObserver) motionObserver.disconnect();
    document.documentElement.classList.remove('feedback-motion-ready');
    panels.forEach(function (panel) { panel.classList.add('is-visible'); });
  }
  function sync() {
    if (constrained() || !visible || document.hidden || playbackBlocked || failed) {
      video.pause();
      if (constrained()) hero.dataset.playing = 'false';
      return;
    }
    if (!video.getAttribute('src')) {
      video.src = window.matchMedia('(max-width: 680px)').matches ? video.dataset.srcMobile : video.dataset.src;
      video.load();
    }
    var attempt = video.play();
    if (attempt) attempt.catch(function (error) {
      // Leaving the viewport can interrupt a pending load/play request. That is
      // not an autoplay refusal; allow the next visible sync.
      if (error && error.name === 'AbortError') return;
      playbackBlocked = true;
      // Keep the still poster if this browser does not allow background playback.
      hero.dataset.playing = 'false';
    });
  }
  video.addEventListener('playing', function () { hero.dataset.playing = 'true'; });
  video.addEventListener('error', function () { failed = true; hero.dataset.playing = 'false'; });
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change', function () { if (reduced.matches) { hero.dataset.playing = 'false'; releaseMotion(); } sync(); });
  if (connection && connection.addEventListener) connection.addEventListener('change', function () { if (constrained()) releaseMotion(); sync(); });
  if ('IntersectionObserver' in window) {
    try {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: .02 }).observe(hero);
    } catch (_) { visible = true; }
  }
  if (!constrained() && 'IntersectionObserver' in window) {
    try {
      panels.forEach(function (panel) {
        var step = 80;
        Array.prototype.forEach.call(panel.children, function (part, index) {
          part.setAttribute('data-feedback-part', '');
          part.style.setProperty('--feedback-delay', Math.min(index * step, 180) + 'ms');
        });
      });
      motionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var target = entry.target;
          if (target.hasAttribute('data-feedback-photo-scene')) {
            target.setAttribute('data-feedback-in-view', String(entry.isIntersecting));
            if (entry.isIntersecting) target.classList.add('is-photo-visible');
          } else if (entry.isIntersecting) {
            target.classList.add('is-visible');
            motionObserver.unobserve(target);
          }
        });
      }, { threshold: .08 });
      photoScenes.forEach(function (scene) {
        var photo = scene.querySelector(':scope>img');
        if (!photo) return;
        scene.setAttribute('data-feedback-photo-scene', '');
        scene.setAttribute('data-feedback-in-view', 'false');
        photo.setAttribute('data-feedback-photo', '');
        photo.addEventListener('animationend', function (event) {
          if (event.animationName === 'feedback-photo-settle' && motionObserver) motionObserver.unobserve(scene);
        }, { once: true });
      });
      document.documentElement.classList.add('feedback-motion-ready');
      photoScenes.forEach(function (scene) { motionObserver.observe(scene); });
      panels.forEach(function (panel) { motionObserver.observe(panel); });
    } catch (_) { releaseMotion(); }
  } else { releaseMotion(); }
  document.addEventListener('focusin', function (event) {
    var panel = event.target.closest && event.target.closest('[data-feedback-reveal]');
    if (!panel) return;
    panel.classList.add('is-focus-revealed', 'is-visible');
    if (motionObserver && !motionReleased) motionObserver.unobserve(panel);
  });
  function syncMotionVisibility() {
    document.documentElement.classList.toggle('feedback-page-hidden', document.hidden);
  }
  document.addEventListener('visibilitychange', syncMotionVisibility);
  syncMotionVisibility();
  video.muted = true;
  sync();
})();
