/* Hybrid Ag — global behaviour. Restrained, rural-fast, reduced-motion aware. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showAll() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }
  if (reduce || !('IntersectionObserver' in window)) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showAll);
    else showAll();
    return;
  }
  document.documentElement.classList.add('reveal-ready');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  function arm() {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm);
  else arm();
  window.setTimeout(showAll, 1200);
})();

/* Three Signals — a quiet, local field response shared by every public page. */
(function () {
  'use strict';

  var body = document.body;
  var main = document.querySelector('main');
  if (!body || !main || body.hasAttribute('data-motion-study')) return;
  if (!window.matchMedia || !window.requestAnimationFrame || typeof window.IntersectionObserver !== 'function') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
  var forcedColours = window.matchMedia('(forced-colors: active)');
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var pageFocused = document.hasFocus();
  var resizeFrame = 0;
  var states = [];
  var surfaces = [];
  var accentColours = readAccentColours();

  function parseColour(value) {
    var source = String(value || '').trim();
    var hex = source.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (hex) {
      var digits = hex[1].length === 3 ? hex[1].replace(/(.)/g, '$1$1') : hex[1];
      return [parseInt(digits.slice(0, 2), 16), parseInt(digits.slice(2, 4), 16), parseInt(digits.slice(4, 6), 16), 1];
    }
    var match = source.match(/[\d.]+/g);
    if (!match || match.length < 3) return null;
    return [Number(match[0]), Number(match[1]), Number(match[2]), match.length > 3 ? Number(match[3]) : 1];
  }

  function colourLuminance(colour) {
    if (!colour) return 255;
    return colour[0] * .2126 + colour[1] * .7152 + colour[2] * .0722;
  }

  function readAccentColours() {
    var styles = window.getComputedStyle(document.documentElement);
    return ['--teal', '--orange', '--berry'].map(function (property, index) {
      var fallback = [[1, 141, 138], [220, 104, 0], [138, 79, 125]][index];
      var colour = parseColour(styles.getPropertyValue(property));
      return colour ? colour.slice(0, 3) : fallback;
    });
  }

  function addSurface(element) {
    if (element && surfaces.indexOf(element) === -1) surfaces.push(element);
  }

  function isDarkSection(element) {
    if (!element || element.tagName !== 'SECTION' || element.hidden) return false;
    var rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    var styles = window.getComputedStyle(element);
    if (styles.display === 'none' || styles.visibility === 'hidden') return false;
    var background = parseColour(styles.backgroundColor);
    return Boolean(background && background[3] >= .9 && colourLuminance(background) < 145);
  }

  Array.prototype.forEach.call(main.children, function (element) {
    if (element.hasAttribute && element.hasAttribute('data-home-field')) addSurface(element);
  });

  if (!surfaces.length) {
    if (main.classList.contains('not-found')) addSurface(main);
    else {
      Array.prototype.some.call(main.children, function (element) {
        if (element.tagName !== 'HEADER') return false;
        addSurface(element);
        return true;
      });
    }
  }

  if (!main.classList.contains('not-found')) {
    Array.prototype.forEach.call(main.children, function (element) {
      if (surfaces.indexOf(element) !== -1 || !isDarkSection(element)) return;
      addSurface(element);
    });
  }

  if (!surfaces.length) return;

  function constrainedData() {
    if (!connection) return false;
    return Boolean(connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''));
  }

  function fieldAvailable() {
    return finePointer.matches && !reduceMotion.matches && !forcedColours.matches && !constrainedData();
  }

  function canTrack(state) {
    return fieldAvailable() && !document.hidden && pageFocused && state.visible;
  }

  function seededRandom(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      var value = Math.imul(seed ^ seed >>> 15, 1 | seed);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildNodes(state) {
    var width = state.width;
    var height = state.height;
    var maximum = state.index === 0 ? 56 : 40;
    var minimum = state.index === 0 ? 22 : 18;
    var count = Math.max(minimum, Math.min(maximum, Math.round(width * height / 18000)));
    var ratio = Math.max(.7, width / Math.max(1, height));
    var columns = Math.max(3, Math.ceil(Math.sqrt(count * ratio)));
    var rows = Math.ceil(count / columns);
    var cellWidth = width / columns;
    var cellHeight = height / rows;
    var random = seededRandom(317 + state.index * 101);
    var nodes = [];

    for (var index = 0; index < count; index += 1) {
      var column = index % columns;
      var row = Math.floor(index / columns);
      nodes.push({
        x: (column + .5 + (random() - .5) * .44) * cellWidth,
        y: (row + .5 + (random() - .5) * .44) * cellHeight,
        dx: 0,
        dy: 0,
        intensity: 0,
        accent: -1
      });
    }

    var links = [];
    var seen = Object.create(null);
    nodes.forEach(function (node, nodeIndex) {
      var nearest = nodes.map(function (other, otherIndex) {
        var x = other.x - node.x;
        var y = other.y - node.y;
        return { index: otherIndex, distance: Math.sqrt(x * x + y * y) };
      }).filter(function (item) {
        return item.index !== nodeIndex;
      }).sort(function (first, second) {
        return first.distance - second.distance;
      }).slice(0, 2);

      nearest.forEach(function (item) {
        if (item.distance > Math.max(cellWidth, cellHeight) * 1.85) return;
        var low = Math.min(nodeIndex, item.index);
        var high = Math.max(nodeIndex, item.index);
        var key = low + ':' + high;
        if (seen[key]) return;
        seen[key] = true;
        links.push([low, high]);
      });
    });

    state.nodes = nodes;
    state.links = links;
  }

  function surfaceIsDark(element) {
    var heading = element.querySelector('h1,h2,h3');
    var foreground = parseColour(window.getComputedStyle(heading || element).color);
    if (foreground) return colourLuminance(foreground) > 165;
    var background = parseColour(window.getComputedStyle(element).backgroundColor);
    return Boolean(background && colourLuminance(background) < 145);
  }

  function sizeCanvas(state) {
    var rect = state.element.getBoundingClientRect();
    // Opening overlays are scaled briefly. Size in local CSS pixels so the
    // canvas follows that transform once rather than baking the scale in twice.
    var overlay = state.element.hasAttribute('data-signals-overlay');
    var width = Math.max(1, Math.round(overlay ? state.element.clientWidth : rect.width));
    var height = Math.max(1, Math.round(overlay ? state.element.clientHeight : rect.height));
    var dpr = Math.min(1.5, window.devicePixelRatio || 1);
    state.width = width;
    state.height = height;
    state.dark = surfaceIsDark(state.element);
    state.canvas.width = Math.round(width * dpr);
    state.canvas.height = Math.round(height * dpr);
    state.canvas.style.width = width + 'px';
    state.canvas.style.height = height + 'px';
    state.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNodes(state);
    draw(state, false);
  }

  function rgba(colour, alpha) {
    return 'rgba(' + colour[0] + ',' + colour[1] + ',' + colour[2] + ',' + alpha.toFixed(3) + ')';
  }

  function draw(state, reactive) {
    var context = state.context;
    var neutral = state.dark ? [255, 255, 255] : [26, 23, 20];
    var lineBase = state.dark ? .045 : .026;
    var lineEnergy = state.dark ? .27 : .16;
    var dotBase = state.dark ? .13 : .072;
    var dotEnergy = state.dark ? .18 : .12;
    context.clearRect(0, 0, state.width, state.height);

    // Match the homepage's soft teal field without adding a second halo there.
    // Paint beneath the geometry; existing section pseudo-elements stay intact.
    if (state.dark && state.glow > .001) {
      var glowRadius = 260;
      var glowX = state.pointer.localX;
      var glowY = state.pointer.localY;
      var glow = context.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
      glow.addColorStop(0, rgba(accentColours[0], .14 * state.glow));
      glow.addColorStop(.72, rgba(accentColours[0], 0));
      context.fillStyle = glow;
      context.fillRect(glowX - glowRadius, glowY - glowRadius, glowRadius * 2, glowRadius * 2);
    }

    state.links.forEach(function (link) {
      var first = state.nodes[link[0]];
      var second = state.nodes[link[1]];
      var energy = Math.min(first.intensity, second.intensity);
      context.beginPath();
      context.moveTo(first.x + first.dx, first.y + first.dy);
      context.lineTo(second.x + second.dx, second.y + second.dy);
      context.lineWidth = .55;
      context.strokeStyle = rgba(neutral, lineBase + energy * lineEnergy);
      context.stroke();
    });

    state.nodes.forEach(function (node) {
      var radius = .78 + node.intensity * .48;
      var fill = rgba(neutral, dotBase + node.intensity * dotEnergy);
      if (reactive && node.accent > -1) {
        radius = 1.22 + node.intensity * .62;
        fill = rgba(accentColours[node.accent], .52 + node.intensity * .28);
      }
      context.beginPath();
      context.arc(node.x + node.dx, node.y + node.dy, radius, 0, Math.PI * 2);
      context.fillStyle = fill;
      context.fill();
    });
  }

  function hasOffset(state) {
    return state.glow > .01 || state.nodes.some(function (node) {
      return Math.abs(node.dx) > .08 || Math.abs(node.dy) > .08 || node.intensity > .015;
    });
  }

  function render(state, time) {
    state.frame = 0;
    if (!canTrack(state) && !state.settling) return;
    if (time - state.lastPaint < 32) {
      state.frame = window.requestAnimationFrame(function (nextTime) { render(state, nextTime); });
      return;
    }
    state.lastPaint = time;

    var pointerX = -1000;
    var pointerY = -1000;
    var reactive = state.pointer.active && canTrack(state);
    var radius = state.pointer.interactive ? 195 : 180;
    if (reactive) {
      if (state.pointer.dirty) {
        var rect = state.element.getBoundingClientRect();
        state.pointer.localX = state.pointer.clientX - rect.left;
        state.pointer.localY = state.pointer.clientY - rect.top;
        state.pointer.dirty = false;
      }
      pointerX = state.pointer.localX;
      pointerY = state.pointer.localY;
    }

    var ranked = [];
    var targetGlow = reactive && state.dark && (body.dataset.page !== 'home' || state.element.hasAttribute('data-signals-overlay')) ? 1 : 0;
    var maximumDelta = Math.abs(targetGlow - state.glow);
    state.glow += (targetGlow - state.glow) * .24;
    state.nodes.forEach(function (node, nodeIndex) {
      var x = node.x - pointerX;
      var y = node.y - pointerY;
      var distance = Math.sqrt(x * x + y * y) || 1;
      var intensity = reactive ? Math.max(0, 1 - distance / radius) : 0;
      var push = intensity * intensity * (state.pointer.interactive ? 7 : 5.5);
      var targetX = reactive ? x / distance * push : 0;
      var targetY = reactive ? y / distance * push : 0;
      maximumDelta = Math.max(maximumDelta, Math.abs(targetX - node.dx), Math.abs(targetY - node.dy), Math.abs(intensity - node.intensity));
      node.dx += (targetX - node.dx) * .26;
      node.dy += (targetY - node.dy) * .26;
      node.intensity += (intensity - node.intensity) * .24;
      node.accent = -1;
      if (intensity > 0) ranked.push({ index: nodeIndex, distance: distance });
    });

    ranked.sort(function (first, second) { return first.distance - second.distance; }).slice(0, 3).forEach(function (item, accentIndex) {
      state.nodes[item.index].accent = accentIndex;
    });
    draw(state, reactive || state.settling);

    if (state.settling && !hasOffset(state)) {
      state.settling = false;
      state.glow = 0;
      state.nodes.forEach(function (node) {
        node.dx = 0;
        node.dy = 0;
        node.intensity = 0;
        node.accent = -1;
      });
      draw(state, false);
      return;
    }

    if ((state.pointer.active && maximumDelta > .012) || state.settling) {
      state.frame = window.requestAnimationFrame(function (nextTime) { render(state, nextTime); });
    }
  }

  function wake(state) {
    if (!state.frame && (canTrack(state) || state.settling)) {
      state.frame = window.requestAnimationFrame(function (time) { render(state, time); });
    }
  }

  function resetState(state, immediate) {
    var wasReactive = state.pointer.active || state.settling || hasOffset(state);
    state.pointer.active = false;
    state.pointer.interactive = false;
    state.pointer.dirty = false;
    if (!wasReactive) return;

    if (immediate) {
      if (state.frame) window.cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.settling = false;
      state.glow = 0;
      state.nodes.forEach(function (node) {
        node.dx = 0;
        node.dy = 0;
        node.intensity = 0;
        node.accent = -1;
      });
      draw(state, false);
      return;
    }

    state.settling = true;
    wake(state);
  }

  function resetAll(immediate) {
    states.forEach(function (state) { resetState(state, immediate); });
  }

  var visibilityObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var state = states.find(function (candidate) { return candidate.element === entry.target; });
      if (!state) return;
      state.visible = entry.isIntersecting;
      if (!state.visible) resetState(state, true);
    });
  }, { rootMargin: '80px 0px' });

  function prepareSurface(element, index) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d', { alpha: true });
    if (!context) return null;
    canvas.className = 'site-signals-field';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.hidden = true;
    element.classList.add('site-signals-surface');
    element.appendChild(canvas);

    var state = {
      index: index,
      element: element,
      canvas: canvas,
      context: context,
      width: 1,
      height: 1,
      dark: false,
      glow: 0,
      nodes: [],
      links: [],
      frame: 0,
      lastPaint: 0,
      visible: false,
      settling: false,
      pointer: { active: false, interactive: false, dirty: false, clientX: 0, clientY: 0, localX: 0, localY: 0 }
    };

    element.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'mouse' || !canTrack(state)) return;
      state.pointer.active = true;
      state.pointer.clientX = event.clientX;
      state.pointer.clientY = event.clientY;
      state.pointer.dirty = true;
      state.pointer.interactive = Boolean(event.target.closest('a,button'));
      state.settling = false;
      wake(state);
    });
    element.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse' || !canTrack(state)) return;
      state.pointer.active = true;
      state.pointer.clientX = event.clientX;
      state.pointer.clientY = event.clientY;
      state.pointer.dirty = true;
      state.pointer.interactive = Boolean(event.target.closest('a,button'));
      state.settling = false;
      wake(state);
    }, { passive: true });
    element.addEventListener('pointerleave', function () { resetState(state, false); });
    element.addEventListener('pointercancel', function () { resetState(state, true); });
    sizeCanvas(state);
    visibilityObserver.observe(element);
    return state;
  }

  function ensureStates() {
    surfaces.forEach(function (surface, index) {
      if (states.some(function (state) { return state.element === surface; })) return;
      var state = prepareSurface(surface, index);
      if (state) states.push(state);
    });
  }

  function scheduleResize() {
    if (resizeFrame || !states.length) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = 0;
      states.forEach(function (state) {
        resetState(state, true);
        sizeCanvas(state);
      });
    });
  }

  function syncMotionPreference() {
    var available = fieldAvailable();
    if (available) ensureStates();
    var ready = available && states.length > 0;
    document.documentElement.classList.toggle('site-signals-ready', ready);
    states.forEach(function (state) {
      state.canvas.hidden = !ready;
      if (ready) draw(state, false);
    });
    if (!ready) resetAll(true);
  }

  function listenMedia(query) {
    if (query.addEventListener) query.addEventListener('change', syncMotionPreference);
    else if (query.addListener) query.addListener(syncMotionPreference);
  }

  listenMedia(reduceMotion);
  listenMedia(finePointer);
  listenMedia(forcedColours);
  if (connection && connection.addEventListener) connection.addEventListener('change', syncMotionPreference);
  window.addEventListener('resize', scheduleResize, { passive: true });
  window.addEventListener('load', scheduleResize, { once: true });
  window.addEventListener('scroll', function () { resetAll(true); }, { passive: true });
  window.addEventListener('blur', function () {
    pageFocused = false;
    resetAll(true);
  });
  window.addEventListener('focus', function () {
    pageFocused = true;
    syncMotionPreference();
  });
  window.addEventListener('pagehide', function () { resetAll(true); });
  window.addEventListener('pageshow', syncMotionPreference);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) resetAll(true);
    else syncMotionPreference();
  });
  document.documentElement.addEventListener('pointerleave', function () { resetAll(false); });
  // Shared overlays join the existing field; do not load a second motion runtime.
  var surfaceResizeObserver = typeof window.ResizeObserver === 'function' ? new ResizeObserver(scheduleResize) : null;
  window.HybridAgSignals = {
    prepareSurface: function (element) {
      if (!element || !element.hasAttribute('data-signals-overlay')) return;
      var known = surfaces.indexOf(element) !== -1;
      addSurface(element);
      if (!known && surfaceResizeObserver) surfaceResizeObserver.observe(element);
      syncMotionPreference();
      scheduleResize();
    }
  };
  syncMotionPreference();
  window.dispatchEvent(new Event('hybridag:signals-ready'));
}());
