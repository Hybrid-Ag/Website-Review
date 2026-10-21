/* Decorative pack outline -> existing photograph, alongside unchanged sections.
   No cellular structures, delivery mechanisms or product-response claims. */
(function () {
  'use strict';
  function mount() {
    var body = document.body;
    if (!body.hasAttribute('data-product-detail')) return;
    var slugs = ['agri-vive-rf', 'product', 'opti-trace-budmax', 'bio-sea-fkf'];
    if (slugs.indexOf(body.getAttribute('data-product-slug')) === -1) return;
    var main = document.getElementById('main');
    var sections = ['overview', 'specification', 'application', 'documents'].map(function (id) { return document.getElementById(id); });
    var photo = document.querySelector('[data-product-photo]');
    var name = document.querySelector('.product-purchase h1');
    var tabs = document.querySelector('.product-tabs');
    if (!main || !photo || !name || !tabs || !sections.every(function (section) { return section && section.parentElement === main; })) return;
    var wide = window.matchMedia('(min-width:1180px) and (min-height:680px)');
    var reduced = window.matchMedia('(prefers-reduced-motion:reduce)');
    var connection = navigator.connection;
    var wrapper, label, count, observer, frame = 0, visible = false, enabled = false;

    function element(tag, className, text) {
      var node = document.createElement(tag);
      node.className = className;
      if (text) node.textContent = text;
      return node;
    }
    function build() {
      wrapper = element('div', 'product-scroll-story');
      wrapper.setAttribute('data-product-story', '');
      var visual = element('aside', 'product-story-visual');
      visual.setAttribute('aria-hidden', 'true');
      visual.appendChild(element('p', 'product-story-product', name.textContent.trim()));
      var canvas = element('div', 'product-story-canvas');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'product-story-outline');
      svg.setAttribute('viewBox', '0 0 1200 1200');
      svg.setAttribute('focusable', 'false');
      // A simplified outline of the pictured 20 L container, not its contents.
      ['M294 338 Q294 220 391 220 H806 Q907 220 907 338 V873 Q907 1017 812 1017 H389 Q294 1017 294 873 Z',
        'M402 220 L453 187 H642 L675 220 M440 220 L470 203 H630 L646 220',
        'M717 220 V198 Q717 191 725 191 H873 Q883 191 883 201 V237',
        'M393 470 H819 V773 H393 Z',
        'M150 600 H255 M945 600 H1050 M600 100 V150 M600 1068 V1115'].forEach(function (pathData, index) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        if (index === 4) path.setAttribute('class', 'product-story-guide');
        svg.appendChild(path);
      });
      canvas.appendChild(svg);
      var reference = photo.cloneNode(false);
      reference.removeAttribute('data-product-photo');
      reference.removeAttribute('fetchpriority');
      reference.alt = '';
      reference.loading = 'lazy';
      reference.decoding = 'async';
      canvas.appendChild(reference);
      visual.appendChild(canvas);
      var position = element('div', 'product-story-position');
      label = element('span', 'product-story-label', 'Overview');
      count = element('span', 'product-story-count', '01 / 04');
      position.appendChild(label);
      position.appendChild(count);
      visual.appendChild(position);
      visual.appendChild(element('div', 'product-story-track'));
      var content = element('div', 'product-story-sections');
      main.insertBefore(wrapper, sections[0]);
      wrapper.appendChild(visual);
      wrapper.appendChild(content);
      sections.forEach(function (section) { content.appendChild(section); });
      observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) queue();
      }, { rootMargin: '200px 0px' });
    }
    function draw() {
      frame = 0;
      if (!enabled || !visible || document.hidden) return;
      var header = parseFloat(getComputedStyle(body).getPropertyValue('--product-header-height')) || 0;
      // Match the existing product tabs' reading line, rather than competing with it.
      var line = header + tabs.getBoundingClientRect().height + 35;
      var tops = sections.map(function (section) { return section.getBoundingClientRect().top; });
      var active = 0;
      tops.forEach(function (top, index) { if (top <= line) active = index; });
      var progress = Math.max(0, Math.min(1, (line - tops[0]) / Math.max(1, tops[3] - tops[0])));
      var reveal = Math.max(0, Math.min(1, (line - tops[0]) / Math.max(1, tops[2] - tops[0])));
      wrapper.style.setProperty('--story-photo', reveal.toFixed(3));
      wrapper.style.setProperty('--story-progress', progress.toFixed(3));
      wrapper.setAttribute('data-product-story-step', sections[active].id);
      label.textContent = ['Overview', 'Analysis', 'Application', 'Documents'][active];
      count.textContent = '0' + (active + 1) + ' / 04';
    }
    function queue() {
      if (!frame && enabled && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function configure() {
      enabled = wide.matches && !reduced.matches && !(connection && connection.saveData) && 'IntersectionObserver' in window;
      body.setAttribute('data-product-story-motion', enabled ? 'on' : 'off');
      if (enabled) {
        if (!wrapper) build();
        observer.observe(wrapper);
        queue();
      } else {
        if (observer) observer.disconnect();
        visible = false;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('pageshow', configure);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
      else queue();
    });
    [wide, reduced].forEach(function (query) {
      if (query.addEventListener) query.addEventListener('change', configure);
      else query.addListener(configure);
    });
    if (connection && connection.addEventListener) connection.addEventListener('change', configure);
    configure();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
