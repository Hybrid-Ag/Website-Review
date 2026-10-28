/* Hybrid Ag - complete catalogue rendering, search and category filtering. */
(function () {
  var productImages = {};
  // Digester remains local-only until its brochure directions and commercial identity are cleared.
  var localReview = document.body.hasAttribute('data-local-digester-review') && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  // Separate design-review editions are enabled only in local and signed Pages reviews.
  var conceptsReview = document.body.hasAttribute('data-digester-concepts-review') &&
    (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || window.HybridAgReleaseMode === 'pages-review');

  function money(value) {
    return '$' + Number(value).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function slugFromHref(href) {
    return (href || '').replace(/^.*\//, '').replace(/\.html$/, '');
  }

  function priceFor(slug) {
    var data = (window.PRODUCT_VARIANTS || {})[slug];
    if (!data || !data.variants || !data.variants.length) return 'Pricing on request';
    var prices = data.variants.map(function (variant) { return Number(variant.price); }).filter(function (price) { return price > 0; });
    return prices.length ? 'From ' + money(Math.min.apply(Math, prices)) : 'Pricing on request';
  }

  function card(category, item) {
    var slug = slugFromHref(item.href);
    var search = (item.name + ' ' + category.label).toLowerCase();
    var image = productImages[slug] && productImages[slug].default
      ? productImages[slug].default.path
      : 'assets/products/' + slug + '.webp';
    return '<a class="card catalogue-card" href="' + item.href + '" data-category="' + category.key + '" data-range="' + (slug.indexOf('mycro-tec-') === 0 ? 'mycro-tec' : '') + '" data-search="' + search + '">' +
      '<div class="card-img"><img src="' + image + '" alt="' + item.name + '" loading="lazy" decoding="async" width="1200" height="1200"></div>' +
      '<div class="card-body"><span class="meta">' + category.label + '</span><h3>' + item.name + '</h3>' +
      '<span class="price">' + priceFor(slug) + '</span><span class="card-link">View product</span></div></a>';
  }

  function mountCardLight(grid) {
    var allowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
    var active = null;
    var frame = 0;
    var x = 0;
    var y = 0;

    function clear() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (active) {
        active.classList.remove('is-pointer-lit');
        active.style.removeProperty('--shop-light-x');
        active.style.removeProperty('--shop-light-y');
      }
      active = null;
    }

    // Delegation also covers cards inserted after the image manifest resolves.
    grid.addEventListener('pointermove', function (event) {
      if (!allowed.matches || event.pointerType !== 'mouse' || document.hidden) return clear();
      var body = event.target.closest('.catalogue-card .card-body');
      if (!body || !grid.contains(body)) return clear();
      if (body !== active) {
        clear();
        active = body;
      }
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = 0;
        if (!active || !allowed.matches || document.hidden) return clear();
        var bounds = active.getBoundingClientRect();
        active.style.setProperty('--shop-light-x', (x - bounds.left).toFixed(1) + 'px');
        active.style.setProperty('--shop-light-y', (y - bounds.top).toFixed(1) + 'px');
        active.classList.add('is-pointer-lit');
      });
    }, { passive: true });
    grid.addEventListener('pointerleave', clear);
    grid.addEventListener('pointercancel', clear);
    window.addEventListener('blur', clear);
    window.addEventListener('scroll', clear, { passive: true });
    document.addEventListener('visibilitychange', clear);
    allowed.addEventListener('change', clear);
    return clear;
  }

  function mount() {
    var grid = document.getElementById('shopGrid');
    var categorySelect = document.getElementById('shopCategory');
    var searchInput = document.getElementById('shopSearch');
    var count = document.getElementById('shopCount');
    var empty = document.getElementById('shopEmpty');
    if (!grid || !categorySelect || !searchInput || !count || !empty) return;
    var clearCardLight = mountCardLight(grid);

    var categories = (window.PRODUCTS || []).filter(function (category) { return category.key !== 'testing'; });
    var products = [];
    categories.forEach(function (category) {
      categorySelect.insertAdjacentHTML('beforeend', '<option value="' + category.key + '">' + category.label + '</option>');
      category.items.forEach(function (item) {
        if (item.href) products.push({ category: category, item: item });
      });
    });
    categorySelect.insertAdjacentHTML('beforeend', '<option value="mycro-tec">Mycro-Tec range</option>');
    function apply() {
      clearCardLight();
      var selected = categorySelect.value;
      var query = searchInput.value.trim().toLowerCase();
      var shown = 0;
      var drafts = 0;
      grid.querySelectorAll('.catalogue-card').forEach(function (product) {
        var categoryMatch = selected === 'all' || product.getAttribute('data-category') === selected || product.getAttribute('data-range') === selected;
        var searchMatch = !query || product.getAttribute('data-search').indexOf(query) !== -1;
        product.hidden = !(categoryMatch && searchMatch);
        if (!product.hidden) {
          if (product.hasAttribute('data-review-concept')) drafts += 1;
          else shown += 1;
        }
      });
      count.textContent = shown + ' product' + (shown === 1 ? '' : 's') + (drafts ? ' + 1 review concept' : '');
      empty.hidden = shown + drafts !== 0;
    }

    function applyHash() {
      var key = location.hash.slice(1);
      var valid = key === 'mycro-tec' || categories.some(function (category) { return category.key === key; });
      categorySelect.value = valid ? key : 'all';
      apply();
    }

    categorySelect.addEventListener('change', function () {
      if (categorySelect.value === 'all') history.replaceState(null, '', location.pathname + location.search);
      else history.replaceState(null, '', '#' + categorySelect.value);
      apply();
    });
    searchInput.addEventListener('input', apply);
    window.addEventListener('hashchange', applyHash);
    fetch('assets/products/variant-images.json', { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Product image manifest unavailable.');
        return response.json();
      })
      .then(function (manifest) { productImages = manifest.products || {}; })
      .catch(function () { productImages = {}; })
      .then(function () {
        grid.innerHTML = products.map(function (product) { return card(product.category, product.item); }).join('');
        if (conceptsReview || localReview) {
          var digesterHref = conceptsReview ? 'mycro-tec-digester-review.html' : 'mycro-tec-digester.html';
          var digesterImage = conceptsReview ? 'assets/review/digester-residue-led-2026-10-29/crop-residue.jpg' : 'assets/review/digester-2026-10-15/pack-concept.png';
          var digesterAlt = conceptsReview ? 'Crop residue on the soil surface' : 'Digester packaging concept, not confirmed pack availability';
          var digester = '<a class="card catalogue-card" href="' + digesterHref + '" data-category="biological" data-range="mycro-tec" data-search="mycro-tec digester residue biological brochure review" data-review-concept>' +
            '<div class="card-img"><img src="' + digesterImage + '" alt="' + digesterAlt + '" width="1200" height="1200" loading="lazy" decoding="async"></div>' +
            '<div class="card-body"><span class="meta">Mycro-Tec · Review concept</span><h3>Mycro-Tec Digester</h3><span class="price">Product &amp; brochure review</span><span class="card-link">View product and brochure</span></div></a>';
          var firstMycro = grid.querySelector('[data-range="mycro-tec"]');
          if (firstMycro) firstMycro.insertAdjacentHTML('beforebegin', digester);
          else grid.insertAdjacentHTML('beforeend', digester);
        }
        applyHash();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
