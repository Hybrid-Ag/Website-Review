(function () {
  'use strict';
  var hero = document.querySelector('.resources-hero--library');
  if (!hero) return;
  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)');
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)');
  var forced = window.matchMedia('(forced-colors:active)');
  var connection = navigator.connection;
  var frame = 0, x = 0, y = 0;
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    hero.style.setProperty('--mx', '0px');
    hero.style.setProperty('--my', '0px');
  }
  hero.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse' || reduced.matches || !fine.matches || forced.matches || document.hidden || (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType)))) return;
    var rect = hero.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - .5) * 12;
    y = ((event.clientY - rect.top) / rect.height - .5) * 10;
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      hero.style.setProperty('--mx', x.toFixed(2) + 'px');
      hero.style.setProperty('--my', y.toFixed(2) + 'px');
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', function () { if (document.hidden) reset(); });
  [reduced, fine, forced].forEach(function (policy) { policy.addEventListener('change', reset); });
  if (connection && connection.addEventListener) connection.addEventListener('change', reset);
  reset();
}());
