/* Hybrid Ag - complete catalogue rendering, search and category filtering. */
(function () {
  var productImages = {};

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
    return '<a class="card catalogue-card" href="' + item.href + '" data-category="' + category.key + '" data-search="' + search + '">' +
      '<div class="card-img"><img src="' + image + '" alt="' + item.name + '" loading="lazy" decoding="async" width="1200" height="1200"></div>' +
      '<div class="card-body"><span class="meta">' + category.label + '</span><h3>' + item.name + '</h3>' +
      '<span class="price">' + priceFor(slug) + '</span><span class="card-link">View product</span></div></a>';
  }

  function mount() {
    var grid = document.getElementById('shopGrid');
    var categorySelect = document.getElementById('shopCategory');
    var searchInput = document.getElementById('shopSearch');
    var count = document.getElementById('shopCount');
    var empty = document.getElementById('shopEmpty');
    if (!grid || !categorySelect || !searchInput || !count || !empty) return;

    var categories = (window.PRODUCTS || []).filter(function (category) { return category.key !== 'testing'; });
    var products = [];
    categories.forEach(function (category) {
      categorySelect.insertAdjacentHTML('beforeend', '<option value="' + category.key + '">' + category.label + '</option>');
      category.items.forEach(function (item) {
        if (item.href) products.push({ category: category, item: item });
      });
    });
    function apply() {
      var selected = categorySelect.value;
      var query = searchInput.value.trim().toLowerCase();
      var shown = 0;
      grid.querySelectorAll('.catalogue-card').forEach(function (product) {
        var categoryMatch = selected === 'all' || product.getAttribute('data-category') === selected;
        var searchMatch = !query || product.getAttribute('data-search').indexOf(query) !== -1;
        product.hidden = !(categoryMatch && searchMatch);
        if (!product.hidden) shown += 1;
      });
      count.textContent = shown + ' product' + (shown === 1 ? '' : 's');
      empty.hidden = shown !== 0;
    }

    function applyHash() {
      var key = location.hash.slice(1);
      var valid = categories.some(function (category) { return category.key === key; });
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
        applyHash();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
