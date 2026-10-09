(function () {
  'use strict';

  var media = document.querySelector('[data-hero-video]');
  var toggle = document.querySelector('[data-hero-video-toggle]');
  if (!media || !toggle) return;

  var video = media.closest('.home-hero__video');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compactViewport = window.matchMedia && window.matchMedia('(max-width: 620px)').matches;
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var constrainedData = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
  var paused = true;

  function renderState() {
    toggle.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  }

  media.addEventListener('playing', function () {
    paused = false;
    if (video) video.classList.add('is-ready');
    renderState();
  });

  media.addEventListener('pause', function () {
    paused = true;
    renderState();
  });

  toggle.addEventListener('click', function () {
    if (paused) {
      var playAttempt = media.play();
      if (playAttempt) playAttempt.catch(function () {});
    } else {
      media.pause();
    }
  });

  media.muted = true;
  function attemptAutoplay() {
    var autoplayAttempt = media.play();
    if (autoplayAttempt) {
      autoplayAttempt.catch(function () {
        paused = true;
        renderState();
      });
    }
  }

  if (!reduceMotion && !constrainedData && !compactViewport) {
    if (document.readyState === 'complete') {
      window.setTimeout(attemptAutoplay, 150);
    } else {
      window.addEventListener('load', function () {
        window.setTimeout(attemptAutoplay, 150);
      }, { once: true });
    }
  }

  renderState();
})();
