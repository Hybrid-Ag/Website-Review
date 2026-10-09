/* Hybrid-Ag — product volume selector + live pricing.
   Reads window.PRODUCT_VARIANTS (js/data/product-variants.js, generated from Odoo).
   Codex: swap the static data file for a live Odoo product.product query keyed by slug/tmpl_id;
   the render contract (product_id, size, sku, price) stays identical. */
(function () {
  function money(n) {
    return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  function litres(size) { var m = /^(\d+(?:\.\d+)?)\s*L$/i.exec(size); return m ? parseFloat(m[1]) : null; }
  function packLabel(size) {
    if (size === '1000L') return '1,000 L IBC';
    return size.replace(/(\d)(L|kg)$/i, '$1 $2') + ' pack';
  }

  function galleryFor(picker) {
    var split = picker.closest('.split');
    return {
      main: split ? split.querySelector('.media.media--img') : null,
      thumbs: split ? split.querySelector('.thumbs') : null,
      name: split && split.querySelector('h1') ? split.querySelector('h1').textContent.trim() : 'Hybrid-Ag product'
    };
  }

  function setPackImage(gallery, product, variant) {
    if (!gallery.main || !product || !product.default) return;
    var exact = variant && product.variants && product.variants[variant.size];
    var image = exact || product.default;
    gallery.main.classList.add('product-pack-media');
    gallery.main.replaceChildren();

    var img = document.createElement('img');
    img.src = image.path;
    img.alt = gallery.name + (exact ? ' ' + packLabel(variant.size) : ' product pack');
    img.decoding = 'async';
    img.width = image.width || 1200;
    img.height = image.height || 1200;
    gallery.main.appendChild(img);

    var caption = document.createElement('span');
    caption.className = 'product-pack-caption' + (variant && !exact ? ' is-representative' : '');
    caption.textContent = !variant
      ? 'Product pack'
      : exact
        ? packLabel(variant.size)
        : 'Representative pack · ' + variant.size + ' image pending';
    gallery.main.appendChild(caption);
  }

  function renderPackThumbs(gallery, product, variants, onChoose) {
    if (!gallery.thumbs || !product || !product.variants) return;
    gallery.thumbs.replaceChildren();
    gallery.thumbs.classList.add('product-pack-thumbs');
    variants.forEach(function (variant) {
      var image = product.variants[variant.size];
      if (!image) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'product-pack-thumb';
      button.setAttribute('data-size', variant.size);
      button.setAttribute('aria-label', 'Show ' + packLabel(variant.size));

      var img = document.createElement('img');
      img.src = image.path;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = image.width || 1200;
      img.height = image.height || 1200;
      button.appendChild(img);

      var label = document.createElement('span');
      label.textContent = variant.size === '1000L' ? '1,000 L' : variant.size;
      button.appendChild(label);
      button.addEventListener('click', function () { onChoose(variant.size); });
      gallery.thumbs.appendChild(button);
    });
    gallery.thumbs.hidden = !gallery.thumbs.children.length;
  }

  function syncPackThumbs(gallery, size) {
    if (!gallery.thumbs) return;
    gallery.thumbs.querySelectorAll('.product-pack-thumb').forEach(function (button) {
      var active = button.getAttribute('data-size') === size;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function loadImageProduct(slug) {
    return fetch('assets/products/variant-images.json', { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Product image manifest unavailable.');
        return response.json();
      })
      .then(function (manifest) { return manifest.products && manifest.products[slug]; });
  }

  function mount() {
    var el = document.getElementById('buy-picker');
    if (!el) return;
    var slug = el.getAttribute('data-slug');
    var gallery = galleryFor(el);
    var data = (window.PRODUCT_VARIANTS || {})[slug];
    if (!data || !data.variants || !data.variants.length) {
      el.innerHTML = '<p class="price-note">Ask your agronomist to confirm pricing for the quantity you need.</p>';
      el.removeAttribute('data-active-sku'); // no purchasable variant -> Add-to-cart falls back to enquiry
      el.removeAttribute('data-active-product-id');
      loadImageProduct(slug)
        .then(function (product) { if (product) setPackImage(gallery, product, null); })
        .catch(function () { if (gallery.thumbs) gallery.thumbs.hidden = true; });
      return;
    }
    var vs = data.variants, cur = data.currency || 'AUD';
    var idx = vs.findIndex(function (v) { return v.size === '20L'; });
    if (idx < 0) idx = 0;
    var imageProduct = null;

    if (gallery.main) {
      gallery.main.classList.add('product-pack-media');
      gallery.main.replaceChildren();
      var initial = document.createElement('img');
      initial.src = 'assets/products/' + slug + '.webp';
      initial.alt = gallery.name + ' product pack';
      initial.decoding = 'async';
      initial.width = 1200;
      initial.height = 1200;
      gallery.main.appendChild(initial);
    }

    function render() {
      var v = vs[idx];
      // expose the active variant so cart.js can read the selection
      el.setAttribute('data-active-sku', v.sku || '');
      if (v.product_id != null) el.setAttribute('data-active-product-id', v.product_id);
      else el.removeAttribute('data-active-product-id');
      el.setAttribute('data-active-size', v.size || '');
      el.setAttribute('data-active-price', v.price != null ? v.price : '');
      var pills = vs.map(function (x, i) {
        return '<button type="button" class="vol' + (i === idx ? ' is-active' : '') +
          '" data-i="' + i + '" aria-pressed="' + (i === idx ? 'true' : 'false') + '">' + x.size + '</button>';
      }).join('');
      var L = litres(v.size), per = L ? (' &middot; ' + money(v.price / L) + '/L') : '';
      var rows = vs.map(function (x) {
        var l = litres(x.size);
        return '<tr><th>' + x.size + '</th><td>' + money(x.price) + '</td>' +
          '<td class="muted">' + (l ? money(x.price / l) + '/L' : '&mdash;') + '</td></tr>';
      }).join('');
      el.innerHTML =
        '<span class="qty-label">Volume</span>' +
        '<div class="vols">' + pills + '</div>' +
        '<div class="vol-price"><span class="price">' + money(v.price) + '</span>' +
        '<span class="vol-meta">' + cur + ' ex GST' + per + (v.sku ? ' &middot; <span class="muted">' + v.sku + '</span>' : '') + '</span></div>' +
        '<button type="button" class="vol-all-t" aria-expanded="false">See all volumes &rsaquo;</button>' +
        '<div class="vol-all" hidden><table class="volt"><thead><tr><th>Volume</th><th>Price</th><th>Per litre</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="price-note">Indicative list pricing, ex GST. Confirm your price with your agronomist.</p></div>';

      el.querySelectorAll('.vol').forEach(function (b) {
        b.addEventListener('click', function () { idx = +b.getAttribute('data-i'); render(); });
      });
      var t = el.querySelector('.vol-all-t'), box = el.querySelector('.vol-all');
      t.addEventListener('click', function () {
        var open = box.hasAttribute('hidden');
        if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        t.innerHTML = (open ? 'Hide volumes &rsaquo;' : 'See all volumes &rsaquo;');
      });
      if (imageProduct) {
        setPackImage(gallery, imageProduct, v);
        syncPackThumbs(gallery, v.size);
      }
    }
    render();

    loadImageProduct(slug)
      .then(function (product) {
        imageProduct = product;
        if (!imageProduct) return;
        renderPackThumbs(gallery, imageProduct, vs, function (size) {
          var next = vs.findIndex(function (variant) { return variant.size === size; });
          if (next >= 0) { idx = next; render(); }
        });
        setPackImage(gallery, imageProduct, vs[idx]);
        syncPackThumbs(gallery, vs[idx].size);
      })
      .catch(function () {
        if (gallery.thumbs) gallery.thumbs.hidden = true;
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
