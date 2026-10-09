/* Homepage film hero: four supplied film strips, one per sector.
   Plain script, no build step, loads after components.js. Replaces js/home-hero-video.js on the homepage.
   Sector navigation is ordinary HTML; this adds film playback and hover behaviour only.
   No analytics, no network beyond assets/video/hero/. */
(function () {
  'use strict';

  var hero = document.querySelector('#home-hero');
  if (!hero || !hero.classList.contains('home-hero--film')) return;

  var BASE = 'assets/video/hero/';

  var stage = hero.querySelector('#film-stage');
  var filmEl = hero.querySelector('#film');
  var strips = Array.prototype.slice.call(filmEl.querySelectorAll('.film-strip[data-index]'));
  var establishing = filmEl.querySelector('.film-strip--establishing');
  var all = [establishing].concat(strips);
  var sectors = Array.prototype.slice.call(hero.querySelectorAll('.film-sector'));
  var toggle = document.querySelector('[data-film-toggle]');
  var motionRow = toggle.closest('.film-motion-row');
  var toggleLabel = toggle.querySelector('[data-film-toggle-label]');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var phoneQuery = window.matchMedia('(max-width: 680px)');
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var hovered = -1, userPaused = false, autoplayBlocked = false;
  var visible = !('IntersectionObserver' in window);
  var motionFrame = 0, motionTime = 0;
  var widths = [0.25, 0.25, 0.25, 0.25], speeds = [0, 0, 0, 0];
  var targets = widths.slice(), planeWidth = 2.6 / 4.76;
  var stageBox, labelHalves = [], boxDirty = true;
  var px = 0, py = 0, tx = 0, ty = 0;
  function posterOnly() { return reduceMotion.matches || Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))); }
  function paused() { return userPaused || autoplayBlocked || posterOnly() || !visible || document.hidden; }
  function phone() { return phoneQuery.matches; }

  /* ---------- video ---------- */
  function src(clip) {
    // Refresh only the two improved aerials, preserving all playback guards.
    var version = clip === 'horticulture' ? '?v=13779169-2' : clip === 'viticulture' ? '?v=32915339-2' : '';
    return BASE + 'hero-' + clip + (phone() ? '-640' : '-1280') + '.mp4' + version;
  }
  function video(strip) {
    var v = strip.querySelector('video');
    var want = src(strip.getAttribute('data-clip'));
    if (v.getAttribute('data-src') !== want) {
      v.setAttribute('data-src', want); v.src = want; v.load();
      strip.setAttribute('data-ready', 'false');
    }
    return v;
  }
  function shouldPlay(strip) { return !paused() && wanted().indexOf(strip) >= 0; }
  function play(strip) {
    // Gate source assignment as well as playback: constrained visitors fetch no MP4s.
    if (!shouldPlay(strip)) { stop(strip); return; }
    var v = video(strip);
    if (v.dataset.failed === 'true' || v.dataset.pending === 'true' || !v.paused) return;
    v.dataset.pending = 'true';
    var generation = Number(v.dataset.generation || 0) + 1;
    v.dataset.generation = String(generation);
    var interrupted = false;
    var attempt = v.play();
    if (attempt) attempt.then(function () {
      if (!shouldPlay(strip)) v.pause();
    }).catch(function (error) {
      if (Number(v.dataset.generation) !== generation) return;
      if (error.name === 'AbortError') { interrupted = true; return; }
      strip.setAttribute('data-ready', 'false');
      if (error.name === 'NotAllowedError') { autoplayBlocked = true; sync(); }
      else { v.dataset.failed = 'true'; updateControl(); }
    }).finally(function () {
      if (Number(v.dataset.generation) !== generation) return;
      v.dataset.pending = 'false';
      if (interrupted && shouldPlay(strip)) play(strip);
    });
    else v.dataset.pending = 'false';
  }
  function stop(strip) { var v = strip.querySelector('video'); if (v.getAttribute('data-src')) v.pause(); }
  function wanted() {
    return phone() ? [establishing] : strips;
  }
  function sync() {
    var set = wanted();
    all.forEach(function (strip) { !paused() && set.indexOf(strip) >= 0 ? play(strip) : stop(strip); });
    if (paused()) { resetDrift(); settleGeometry(); }
    updateControl();
  }
  all.forEach(function (strip) {
    var v = strip.querySelector('video');
    v.addEventListener('playing', function () {
      if (!shouldPlay(strip)) { v.pause(); return; }
      strip.setAttribute('data-ready', 'true'); updateControl();
    });
    v.addEventListener('error', function () {
      if (!v.hasAttribute('src')) return;
      strip.setAttribute('data-ready', 'false'); v.dataset.failed = 'true'; updateControl();
    });
  });

  /* ---------- layout ---------- */
  function measure() {
    // Read all geometry together, only when the viewport, fonts or position
    // changes. Animation frames below write transforms/clips without DOM reads.
    stageBox = stage.getBoundingClientRect();
    labelHalves = sectors.map(function (item) { return item.offsetWidth / 2 + 10; });
    var heroTop = hero.offsetTop;
    boxDirty = false;
    document.body.style.setProperty('--film-hero-top', heroTop + 'px');
    paintGeometry();
  }
  function paintGeometry() {
    if (!stageBox || phone()) return;
    var filmWidth = stageBox.width * 1.04, left = 0, labelPositions = [];
    strips.forEach(function (strip, i) {
      var centre = left + widths[i] / 2;
      strip.style.setProperty('--film-left', ((centre - planeWidth / 2) * filmWidth).toFixed(3) + 'px');
      strip.style.setProperty('--film-clip', (Math.max(0, planeWidth - widths[i]) * filmWidth / 2).toFixed(3) + 'px');
      var x = centre * filmWidth - stageBox.width * 0.02 + px;
      x = Math.min(stageBox.width - labelHalves[i], Math.max(labelHalves[i], x));
      labelPositions.push(x);
      left += widths[i];
    });
    // Compressed edge sectors can be narrower than their labels on tablets.
    // Keep the full native link hit areas separate, using cached widths only.
    for (var i = 1; i < sectors.length; i++) {
      labelPositions[i] = Math.max(labelPositions[i], labelPositions[i - 1] + labelHalves[i - 1] + labelHalves[i]);
    }
    labelPositions[3] = Math.min(labelPositions[3], stageBox.width - labelHalves[3]);
    for (var j = sectors.length - 2; j >= 0; j--) {
      labelPositions[j] = Math.min(labelPositions[j], labelPositions[j + 1] - labelHalves[j + 1] - labelHalves[j]);
    }
    sectors.forEach(function (item, index) { item.style.setProperty('--film-label-x', labelPositions[index].toFixed(3) + 'px'); });
  }
  function queueMotion() {
    if (!motionFrame) { motionTime = performance.now(); motionFrame = window.requestAnimationFrame(animate); }
  }
  function settleGeometry() {
    if (motionFrame) window.cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    widths = targets.slice(); speeds = [0, 0, 0, 0];
    paintGeometry();
  }
  function animate(now) {
    motionFrame = 0;
    if (paused() || phone()) { resetDrift(); settleGeometry(); return; }
    var dt = Math.min((now - motionTime) / 1000, 0.064), omega = 13;
    motionTime = now;
    var decay = Math.exp(-omega * dt), moving = false;
    widths.forEach(function (value, i) {
      // Exact critically damped step: retargeting retains position and velocity
      // instead of restarting an easing curve each time another strip is hit.
      var error = value - targets[i], momentum = speeds[i] + omega * error;
      widths[i] = targets[i] + (error + momentum * dt) * decay;
      speeds[i] = (speeds[i] - omega * momentum * dt) * decay;
      if (Math.abs(widths[i] - targets[i]) > 0.00002 || Math.abs(speeds[i]) > 0.0002) moving = true;
    });
    var follow = 1 - Math.exp(-9 * dt);
    px += (tx - px) * follow; py += (ty - py) * follow;
    if (Math.abs(tx - px) > 0.05 || Math.abs(ty - py) > 0.05) moving = true;
    if (!moving) { widths = targets.slice(); speeds = [0, 0, 0, 0]; px = tx; py = ty; }
    filmEl.style.setProperty('--px', px.toFixed(3) + 'px');
    filmEl.style.setProperty('--py', py.toFixed(3) + 'px');
    paintGeometry();
    if (moving) motionFrame = window.requestAnimationFrame(animate);
  }
  function layout() {
    targets = strips.map(function (_, i) { return hovered < 0 ? 0.25 : (i === hovered ? 2.6 : 0.72) / 4.76; });
    if (paused() || phone()) settleGeometry();
    else queueMotion();
  }

  /* ---------- state ---------- */
  function render() {
    hero.setAttribute('data-hover', String(hovered));
    sectors.forEach(function (item, index) {
      item.setAttribute('data-hover', String(index === hovered));
    });
    layout();
  }
  function hover(index) { if (index === hovered) return; hovered = index; render(); }

  function sectorIndex(target) {
    var item = target && target.closest && target.closest('.film-sector,.film-strip[data-index]');
    return item ? Number(item.getAttribute('data-index')) : -1;
  }
  // Only real pointer movement retargets the opening. Animated clip boundaries
  // moving beneath a stationary pointer cannot trigger a leave/reset cycle.
  hero.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'touch' && finePointer.matches && !phone()) hover(sectorIndex(event.target));
  }, {passive: true});
  hero.addEventListener('pointerleave', function () { hover(-1); });
  sectors.forEach(function (item, index) {
    item.addEventListener('focusin', function () { hover(index); });
    item.addEventListener('focusout', function (event) { hover(sectorIndex(event.relatedTarget)); });
  });

  /* ---------- pointer drift, native cursor kept ---------- */
  function resetDrift() {
    px = 0; py = 0; tx = 0; ty = 0;
    filmEl.style.removeProperty('--px'); filmEl.style.removeProperty('--py');
  }
  stage.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch' || !finePointer.matches || phone() || paused()) return;
    if (boxDirty) measure();
    tx = ((event.clientX - stageBox.left) / stageBox.width - 0.5) * -14;
    ty = ((event.clientY - stageBox.top) / stageBox.height - 0.5) * -8;
    queueMotion();
  }, {passive: true});
  stage.addEventListener('pointerleave', function () { tx = 0; ty = 0; if (!paused() && !phone()) queueMotion(); });

  /* ---------- motion control ---------- */
  function updateControl() {
    var failed = wanted().every(function (strip) { return strip.querySelector('video').dataset.failed === 'true'; });
    var stopped = userPaused || autoplayBlocked || failed;
    hero.setAttribute('data-render', posterOnly() ? 'poster' : 'film');
    hero.setAttribute('data-motion-paused', String(paused()));
    document.body.classList.toggle('film-hero-in-view', visible);
    toggle.hidden = posterOnly();
    if (motionRow) motionRow.hidden = posterOnly();
    toggle.setAttribute('aria-pressed', String(stopped));
    toggle.setAttribute('aria-label', stopped ? 'Play background motion' : 'Pause background motion');
    if (toggleLabel) toggleLabel.textContent = stopped ? 'Play background motion' : 'Pause background motion';
  }
  function unload() {
    all.forEach(function (strip) {
      var v = strip.querySelector('video');
      v.dataset.generation = String(Number(v.dataset.generation || 0) + 1);
      v.dataset.pending = 'false';
      if (v.hasAttribute('src')) { v.pause(); v.removeAttribute('src'); v.removeAttribute('data-src'); v.load(); }
      delete v.dataset.failed; strip.setAttribute('data-ready', 'false');
    });
  }
  toggle.addEventListener('click', function () {
    userPaused = toggle.getAttribute('aria-pressed') !== 'true';
    if (!userPaused) {
      autoplayBlocked = false;
      all.forEach(function (strip) {
        var v = strip.querySelector('video');
        if (v.dataset.failed === 'true') { delete v.dataset.failed; v.load(); }
      });
    }
    sync();
  });
  function policyChanged() { if (posterOnly()) unload(); sync(); }
  reduceMotion.addEventListener('change', policyChanged);
  if (connection && connection.addEventListener) connection.addEventListener('change', policyChanged);

  /* ---------- lifecycle ---------- */
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, {threshold: 0.05}).observe(stage);
  document.addEventListener('visibilitychange', sync);
  phoneQuery.addEventListener('change', function () {
    unload();
    hovered = -1; resetDrift(); measure(); render(); sync();
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  else window.addEventListener('resize', measure);
  window.addEventListener('scroll', function () { boxDirty = true; }, {passive: true});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  measure();
  filmEl.setAttribute('data-geometry', 'clip');
  hero.setAttribute('data-film-geometry', 'clip');
  render(); sync();
})();
