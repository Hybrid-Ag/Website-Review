/* Hybrid-Ag product review pages. Cached packs and prices only; no API writes. */
(function () {
  'use strict';

  function mount() {
    if (!document.body.hasAttribute('data-product-detail')) return;
    var picker = document.getElementById('buy-picker');
    var pack = document.getElementById('product-pack');
    var quantity = document.getElementById('product-quantity');
    if (!picker || !pack || !quantity) return;
    var slug = document.body.getAttribute('data-product-slug') || picker.getAttribute('data-slug');
    var data = (window.PRODUCT_VARIANTS || {})[slug];
    var variants = data && Array.isArray(data.variants) ? data.variants : [];
    var unitHold = document.body.hasAttribute('data-product-unit-hold');
    var name = (document.querySelector('h1') || {}).textContent || 'Hybrid-Ag product';
    name = name.trim();
    var price = document.getElementById('product-price');
    var unitPrice = document.getElementById('product-unit-price');
    var code = document.getElementById('product-code');
    var total = document.getElementById('product-selection-total');
    var summary = document.getElementById('product-summary');
    var quantityLabel = document.getElementById('product-quantity-label');
    var add = document.getElementById('product-add-to-cart');
    var photo = document.querySelector('[data-product-photo]');
    var photoLabel = document.getElementById('product-photo-label');
    var photoNote = document.getElementById('product-photo-note');
    var imageProduct = null;
    var choices = null;

    function write(node, value) { if (node) node.textContent = value; }
    function money(value) { return '$' + value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function measurement(size) {
      var match = /^(\d+(?:\.\d+)?)\s*(L|kg|t)$/i.exec(String(size || '').trim());
      if (!match || Number(match[1]) <= 0) return null;
      return { amount: Number(match[1]), unit: match[2].toLowerCase() === 'l' ? 'L' : match[2].toLowerCase() };
    }
    function validQuantity() {
      quantity.setCustomValidity('');
      var value = Number(quantity.value);
      var valid = quantity.validity.valid && Number.isSafeInteger(value) && value >= 1 && value <= 999999;
      if (!valid) quantity.setCustomValidity('Enter a whole number from 1 to 999,999.');
      quantity.setAttribute('aria-invalid', String(!valid));
      return valid;
    }
    function selectedVariant(option) {
      if (!option) return null;
      // A SKU is not an identity: some cached products share it across packs.
      var matches = variants.filter(function (entry) {
        return entry.size === option.value && String(entry.sku || '') === String(option.getAttribute('data-code') || '');
      });
      var id = option.getAttribute('data-product-id');
      if (id) {
        var identified = matches.filter(function (entry) { return entry.product_id != null && String(entry.product_id) === id; });
        if (identified.length === 1) return identified[0];
        matches = matches.filter(function (entry) { return entry.product_id == null || entry.product_id === ''; });
      }
      return matches.length === 1 ? matches[0] : null;
    }
    function clearCartSelection() {
      ['sku', 'product-id', 'size', 'price'].forEach(function (attribute) { picker.removeAttribute('data-active-' + attribute); });
    }
    function setPhoto(option) {
      if (!photo || !option || !imageProduct || !imageProduct.default) return;
      var exact = imageProduct.variants && imageProduct.variants[option.value];
      var id = option.getAttribute('data-product-id');
      if (exact && exact.product_id != null && id && String(exact.product_id) !== id) exact = null;
      var image = exact || imageProduct.default;
      var imageUrl;
      try {
        imageUrl = new URL(image.path, document.baseURI);
        var directory = new URL('assets/products/', document.baseURI);
        if (imageUrl.origin !== directory.origin || imageUrl.pathname.indexOf(directory.pathname) !== 0) return;
      } catch (_error) { return; }
      if (photo.src !== imageUrl.href) photo.src = imageUrl.href;
      photo.width = image.width || 1200;
      photo.height = image.height || 1200;
      photo.alt = name + (unitHold ? ' existing packaging reference; pack unit to confirm' : exact ? ' ' + option.textContent.trim() + ' pack' : ' representative pack; not the selected pack');
      write(photoLabel, unitHold ? 'Packaging reference' : exact ? option.textContent.trim() + ' pack' : 'Representative pack');
      write(photoNote, unitHold
        ? 'Existing packaging reference. The cached pack unit and product description need reconciliation; confirm the pack size, current label and supply with the team.'
        : exact
        ? 'Existing product packaging. Confirm the current label, pack availability and supply with the team.'
        : option.value
          ? 'Representative photograph. An exact ' + option.textContent.trim() + ' pack image is not yet available. Confirm packaging and supply with the team.'
          : 'Representative product photograph. Confirm pack options, current packaging and supply with the team.');
    }
    function update() {
      var option = pack.options[pack.selectedIndex];
      var selected = selectedVariant(option);
      var size = unitHold ? null : measurement(option && option.value);
      var valid = validQuantity();
      var priced = Boolean(size && selected && typeof selected.price === 'number' && Number.isFinite(selected.price) && selected.price > 0);
      var canAdd = Boolean(priced && valid && (selected.sku || option.getAttribute('data-product-id')));
      clearCartSelection();
      if (canAdd) {
        picker.setAttribute('data-active-sku', selected.sku || '');
        var id = option.getAttribute('data-product-id') || selected.product_id;
        if (id != null && id !== '') picker.setAttribute('data-active-product-id', id);
        picker.setAttribute('data-active-size', selected.size);
        picker.setAttribute('data-active-price', selected.price);
      }
      if (add) add.disabled = !canAdd;
      write(quantityLabel, 'Quantity');
      write(price, priced ? money(selected.price) : 'Price on enquiry');
      write(unitPrice, priced ? money(selected.price / size.amount) + ' / ' + size.unit : size ? 'Confirm current pricing with the team' : 'Pack quantity and pricing to confirm');
      write(code, option && option.getAttribute('data-code') || 'Code to confirm');
      var amount = Number(quantity.value);
      var packText = option ? option.textContent.trim() : 'pack to confirm';
      write(summary, valid
        ? unitHold
          ? 'Confirm the pack unit and quantity required with the team.'
          : option && option.value
          ? amount.toLocaleString('en-AU') + ' × ' + packText + (size ? ' · ' + (amount * size.amount).toLocaleString('en-AU', { maximumFractionDigits: 6 }) + ' ' + size.unit + ' total' : ' · pack quantity to confirm')
          : 'Confirm pack options and the quantity required with the team.'
        : 'Enter a whole number from 1 to 999,999.');
      write(total, valid && priced ? money(selected.price * amount) + ' ex GST · cached price' : '');
      if (choices) choices.querySelectorAll('button').forEach(function (button, index) {
        button.setAttribute('aria-pressed', String(index === pack.selectedIndex));
      });
      setPhoto(option);
    }

    if (variants.length && pack.options.length) {
      choices = document.createElement('div');
      choices.className = 'product-pack-choices';
      choices.setAttribute('role', 'group');
      choices.setAttribute('aria-label', 'Pack size');
      Array.from(pack.options).forEach(function (option, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-product-pack-choice', option.value);
        button.setAttribute('data-product-pack-index', index);
        button.textContent = option.textContent;
        button.disabled = option.disabled;
        button.addEventListener('click', function () {
          pack.selectedIndex = index;
          pack.dispatchEvent(new Event('change', { bubbles: true }));
        });
        choices.appendChild(button);
      });
      pack.insertAdjacentElement('afterend', choices);
      pack.hidden = true;
    }
    pack.addEventListener('change', update);
    quantity.addEventListener('input', update);
    quantity.addEventListener('change', function (event) {
      update();
      // Do not let the legacy cart picker turn invalid input into an assumed quantity.
      if (!quantity.validity.valid) event.stopImmediatePropagation();
    }, true);
    var quantityPicker = quantity.closest('.qty');
    if (quantityPicker) {
      quantityPicker.addEventListener('click', function (event) {
        var button = event.target.closest('button');
        if (!button || !quantityPicker.contains(button)) return;
        if (!validQuantity()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          update();
          quantity.reportValidity();
          quantity.focus();
        } else {
          var buttons = Array.from(quantityPicker.querySelectorAll('button'));
          var next = Number(quantity.value) + (buttons.indexOf(button) === 0 ? -1 : 1);
          if (next < 1 || next > 999999) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        }
      }, true);
      quantityPicker.addEventListener('click', update);
    }
    if (add) add.addEventListener('click', update, true);
    update();

    fetch(new URL('assets/products/variant-images.json', document.baseURI), { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('Product image manifest unavailable.');
        return response.json();
      })
      .then(function (manifest) {
        imageProduct = manifest.products && manifest.products[slug];
        update();
      })
      .catch(function () {
        write(photoLabel, unitHold ? 'Packaging reference' : 'Representative pack');
        write(photoNote, unitHold
          ? 'Existing packaging reference. The cached pack unit and product description need reconciliation; confirm the pack size, current label and supply with the team.'
          : 'Representative photograph. Exact pack imagery and current packaging require confirmation with the team.');
      });

    var zoom = document.querySelector('[data-product-zoom]');
    var dialog = document.getElementById('product-zoom');
    if (zoom && dialog && photo) {
      var enlarged = dialog.querySelector('img');
      var close = dialog.querySelector('[data-product-zoom-close]');
      if (typeof dialog.showModal !== 'function' || !enlarged || !close) zoom.disabled = true;
      else {
        zoom.addEventListener('click', function () {
          enlarged.src = photo.src;
          enlarged.alt = photo.alt;
          if (!dialog.open) dialog.showModal();
        });
        close.addEventListener('click', function () { dialog.close(); });
        dialog.addEventListener('close', function () { if (zoom.isConnected) zoom.focus({ preventScroll: true }); });
      }
    }

    var header = document.getElementById('site-header');
    var tabs = document.querySelector('.product-tabs');
    if (!tabs) return;
    var links = Array.from(tabs.querySelectorAll('a[href^="#"]'));
    var sections = links.map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); });
    function headerHeight() {
      return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    }
    function activeSection() {
      var line = headerHeight() + tabs.getBoundingClientRect().height + 35;
      var active = sections.find(function (section) { return Boolean(section); });
      sections.forEach(function (section) { if (section && section.getBoundingClientRect().top <= line) active = section; });
      links.forEach(function (link, index) {
        if (sections[index] && sections[index] === active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    function resize() {
      document.body.style.setProperty('--product-header-height', headerHeight() + 'px');
      activeSection();
    }
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { activeSection(); queued = false; });
    }, { passive: true });
    window.addEventListener('resize', resize);
    if (header && 'ResizeObserver' in window) new ResizeObserver(resize).observe(header);
    resize();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
