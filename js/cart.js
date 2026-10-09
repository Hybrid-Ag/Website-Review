/* Hybrid Ag — cart + order. Client-side cart (localStorage), slide-in drawer, nav badge,
   and Add-to-cart wiring. The order itself is submitted from order.html.
   Cart line contract: { id, product_id, slug, name, sku, size, price, qty }.
   `product_id` is the authoritative Odoo variant identity when available. `id` falls back to a
   slug + SKU + size key so legacy data with duplicate SKUs still remains separate. */
(function () {
  var preview = window.HybridAgCartPreview || null;
  var KEY = preview && preview.storageKey || 'hybridag_cart_v1';
  var drawerOpener = null;
  function siteLink(path) { return (preview && preview.root || '') + path; }
  function validQuantity(qty) { return Number.isSafeInteger(qty) && qty >= 1 && qty <= 999999; }
  function money(n) { return '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function track(eventName, properties) {
    if (window.HybridAgAnalytics) window.HybridAgAnalytics.track(eventName, properties || {});
  }
  function itemId(item) {
    if (item.id) return String(item.id);
    if (item.product_id != null && item.product_id !== '') return 'odoo:' + item.product_id;
    return ['variant', item.slug || '', item.sku || '', item.size || ''].join('|');
  }
  function normalise(item) {
    var line = Object.assign({}, item);
    line.id = itemId(line);
    line.product_id = line.product_id != null && line.product_id !== '' ? Number(line.product_id) : null;
    line.price = Math.max(0, Number(line.price) || 0);
    line.qty = Math.max(1, parseInt(line.qty, 10) || 1);
    return line;
  }

  var Cart = {
    lines: function () {
      try {
        var stored = JSON.parse(localStorage.getItem(KEY)) || [];
        return Array.isArray(stored) ? stored.map(normalise) : [];
      } catch (e) { return []; }
    },
    save: function (l) { localStorage.setItem(KEY, JSON.stringify(l.map(normalise))); document.dispatchEvent(new CustomEvent('cart:change')); },
    count: function () { return this.lines().reduce(function (n, l) { return n + l.qty; }, 0); },
    subtotal: function () { return this.lines().reduce(function (s, l) { return s + l.price * l.qty; }, 0); },
    add: function (item) {
      if (preview && !validQuantity(Number(item.qty))) return false;
      if (preview) item = Object.assign({}, item, { qty: Number(item.qty) });
      var l = this.lines(), next = normalise(item);
      var ex = l.find(function (x) { return x.id === next.id; });
      if (preview && ex && !validQuantity(ex.qty + next.qty)) return false;
      if (ex) ex.qty += next.qty; else l.push(next);
      this.save(l);
      track('add_to_cart', {
        item_id: next.slug || next.sku || next.id,
        item_name: next.name,
        item_variant: next.size,
        quantity: next.qty,
        value: next.price * next.qty,
        currency: 'AUD'
      });
    },
    setQty: function (id, qty) {
      var previous = this.lines().find(function (x) { return x.id === id; });
      if (preview && !previous) return false;
      var nextQty = preview ? Math.min(999999, Math.max(1, qty)) : Math.max(1, qty);
      var l = this.lines().map(function (x) { return x.id === id ? Object.assign({}, x, { qty: nextQty }) : x; });
      this.save(l);
      if (previous && previous.qty !== nextQty) {
        track('cart_quantity_changed', {
          item_id: previous.slug || previous.sku || previous.id,
          previous_quantity: previous.qty,
          quantity: nextQty
        });
      }
    },
    remove: function (id) {
      var previous = this.lines().find(function (x) { return x.id === id; });
      this.save(this.lines().filter(function (x) { return x.id !== id; }));
      if (previous) {
        track('remove_from_cart', {
          item_id: previous.slug || previous.sku || previous.id,
          item_name: previous.name,
          item_variant: previous.size,
          quantity: previous.qty,
          value: previous.price * previous.qty,
          currency: 'AUD'
        });
      }
    },
    clear: function () { this.save([]); }
  };
  window.HybridCart = Cart;

  function drawerHTML() {
    return '<div class="cart-backdrop" id="cartBackdrop"></div>' +
      '<aside class="cart-drawer" id="cartDrawer" aria-label="' + (preview ? 'Preview order' : 'Your order') + '" aria-hidden="true"' + (preview ? ' role="dialog" aria-modal="true" tabindex="-1" inert' : '') + '>' +
        '<div class="cart-head"><b>' + (preview ? 'Preview order' : 'Your order') + '</b><button class="cart-x" id="cartClose" aria-label="Close">&times;</button></div>' +
        '<div class="cart-body" id="cartBody"></div>' +
        '<div class="cart-foot" id="cartFoot"></div>' +
      '</aside>';
  }

  function renderBadge() {
    var n = Cart.count();
    document.querySelectorAll('.cart-count').forEach(function (b) {
      b.textContent = n; b.classList.toggle('has', n > 0);
    });
  }

  function renderDrawer() {
    var body = document.getElementById('cartBody'), foot = document.getElementById('cartFoot');
    if (!body) return;
    var focus = null;
    if (preview && document.getElementById('cartDrawer').classList.contains('open')) {
      var active = document.activeElement;
      var focusedRow = active.closest('.cart-line');
      if (focusedRow && body.contains(focusedRow)) {
        focus = {
          id: focusedRow.getAttribute('data-line-id'),
          index: Array.from(body.querySelectorAll('.cart-line')).indexOf(focusedRow),
          selector: active.matches('.cqi') ? '.cqi' : active.matches('.cq') ? '.cq[data-d="' + active.getAttribute('data-d') + '"]' : '.cart-rm',
          start: active.selectionStart,
          end: active.selectionEnd
        };
      } else if (foot.contains(active)) focus = { footer: true };
    }
    function restoreFocus() {
      if (!focus) return;
      var rows = Array.from(body.querySelectorAll('.cart-line'));
      var row = rows.find(function (node) { return node.getAttribute('data-line-id') === focus.id; }) || rows[focus.index];
      var target = focus.footer ? foot.querySelector('a') : row && row.querySelector(focus.selector);
      if (!target) target = document.getElementById('cartClose');
      target.focus({ preventScroll: true });
      if (target.matches('.cqi') && focus.start != null) target.setSelectionRange(focus.start, focus.end);
    }
    var lines = Cart.lines();
    if (!lines.length) {
      body.innerHTML = '<p class="cart-empty">Your order is empty.<br><span>Add products from the shop. If you need help choosing, talk to an agronomist.</span></p>';
      foot.innerHTML = (preview ? '<p class="cart-note">Cached preview pricing only. Nothing has been ordered. Confirm current prices and supply with the team.</p>' : '') +
        '<a class="pill pill--ghost" href="' + siteLink('shop.html') + '" style="width:100%;justify-content:center">Browse the range</a>';
      restoreFocus();
      return;
    }
    body.innerHTML = lines.map(function (l) {
      return '<div class="cart-line" data-line-id="' + encodeURIComponent(l.id) + '">' +
        '<div class="cart-line-main"><b>' + l.name + '</b><span>' + l.size + ' &middot; ' + l.sku + '</span></div>' +
        '<div class="cart-line-qty"><button class="cq" data-d="-1" aria-label="Decrease">&minus;</button>' +
          '<input class="cqi" type="text" inputmode="numeric" value="' + l.qty + '" aria-label="Quantity">' +
          '<button class="cq" data-d="1" aria-label="Increase">+</button></div>' +
        '<div class="cart-line-price">' + money(l.price * l.qty) + '</div>' +
        '<button class="cart-rm" aria-label="Remove">Remove</button></div>';
    }).join('');
    foot.innerHTML =
      '<div class="cart-sub"><span>Subtotal <em>(ex GST)</em></span><b>' + money(Cart.subtotal()) + '</b></div>' +
      '<p class="cart-note">' + (preview ? 'Cached preview pricing only. Nothing has been ordered. Confirm current prices and supply with the team.' : 'Indicative list pricing. Confirm your price with your agronomist.') + '</p>' +
      (preview && preview.holdCheckout
        ? '<a class="pill pill--teal" href="' + siteLink('contact.html') + '" style="width:100%;justify-content:center">Talk to an agronomist &rarr;</a>'
        : '<a class="pill pill--teal" href="' + siteLink('order.html') + '" data-cart-checkout style="width:100%;justify-content:center">Review &amp; submit order &rarr;</a>');

    var checkout = foot.querySelector('[data-cart-checkout]');
    if (checkout) checkout.addEventListener('click', function () {
      track('begin_checkout', {
        product_line_count: lines.length,
        item_count: Cart.count(),
        value: Cart.subtotal(),
        currency: 'AUD'
      });
    });

    body.querySelectorAll('.cart-line').forEach(function (row) {
      var id = decodeURIComponent(row.getAttribute('data-line-id'));
      var line = Cart.lines().find(function (x) { return x.id === id; });
      row.querySelectorAll('.cq').forEach(function (b) {
        b.addEventListener('click', function () { Cart.setQty(id, line.qty + (+b.getAttribute('data-d'))); });
      });
      row.querySelector('.cqi').addEventListener('change', function (e) {
        if (preview && !validQuantity(Number(e.target.value))) {
          e.target.setCustomValidity('Enter a whole number from 1 to 999,999.');
          e.target.reportValidity();
          return;
        }
        e.target.setCustomValidity('');
        var v = preview ? Number(e.target.value) : parseInt(e.target.value, 10);
        if (preview && Cart.lines().some(function (x) { return x.id === id && x.qty === v; })) return;
        Cart.setQty(id, isNaN(v) ? 1 : v);
      });
      row.querySelector('.cart-rm').addEventListener('click', function () { Cart.remove(id); });
    });
    restoreFocus();
  }

  function openDrawer() {
    var d = document.getElementById('cartDrawer'), b = document.getElementById('cartBackdrop');
    if (!d) return;
    if (preview && !d.classList.contains('open')) drawerOpener = document.activeElement;
    renderDrawer(); d.classList.add('open'); b.classList.add('open'); d.setAttribute('aria-hidden', 'false');
    if (preview) { d.inert = false; document.getElementById('cartClose').focus(); }
    track('view_cart', { product_line_count: Cart.lines().length, item_count: Cart.count(), value: Cart.subtotal(), currency: 'AUD' });
  }
  function closeDrawer() {
    var d = document.getElementById('cartDrawer'), b = document.getElementById('cartBackdrop');
    if (!d) return;
    var wasOpen = d.classList.contains('open');
    d.classList.remove('open'); b.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
    if (preview) d.inert = true;
    if (preview && wasOpen && drawerOpener && drawerOpener.isConnected) drawerOpener.focus();
  }
  Cart.open = openDrawer;

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'cart-toast'; t.textContent = msg;
    document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, 1900);
  }

  function wireAddToCart() {
    document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (btn.disabled) return;
        var picker = document.getElementById('buy-picker');
        var sku = picker && picker.getAttribute('data-active-sku');
        var productId = picker && picker.getAttribute('data-active-product-id');
        if (!sku && !productId) { track('product_enquiry_started', { item_id: picker ? picker.getAttribute('data-slug') || 'unknown' : 'unknown' }); location.href = siteLink('contact.html'); return; } // unpriced product -> enquire
        var qtyEl = document.querySelector('.qty input');
        if (preview && qtyEl) {
          qtyEl.setCustomValidity('');
          if (!validQuantity(Number(qtyEl.value))) qtyEl.setCustomValidity('Enter a whole number from 1 to 999,999.');
          if (!qtyEl.checkValidity()) { qtyEl.reportValidity(); qtyEl.focus(); return; }
        }
        var qty = qtyEl ? (preview ? Number(qtyEl.value) : Math.max(1, parseInt(qtyEl.value, 10) || 1)) : 1;
        var added = Cart.add({
          slug: picker.getAttribute('data-slug') || '',
          name: (document.querySelector('h1') || {}).textContent.trim(),
          product_id: productId || null,
          sku: sku,
          size: picker.getAttribute('data-active-size') || '',
          price: parseFloat(picker.getAttribute('data-active-price')) || 0,
          qty: qty
        });
        if (added === false) {
          if (qtyEl) {
            qtyEl.setCustomValidity('This pack is already in your preview order. Keep its total quantity at 999,999 or less.');
            qtyEl.reportValidity(); qtyEl.focus();
          } else toast('The preview order cannot contain more than 999,999 of this pack.');
          return;
        }
        toast('Added to your order');
        openDrawer();
      });
    });
  }

  function wireQuantityPicker() {
    document.querySelectorAll('.qty').forEach(function (picker) {
      var input = picker.querySelector('input');
      var buttons = picker.querySelectorAll('button');
      if (!input || buttons.length < 2) return;
      function value() { return Math.max(1, parseInt(input.value, 10) || 1); }
      buttons.forEach(function (button, index) {
        button.addEventListener('click', function () {
          if (preview && !validQuantity(Number(input.value))) { input.setCustomValidity('Enter a whole number from 1 to 999,999.'); input.reportValidity(); input.focus(); return; }
          input.value = preview ? Math.min(999999, Math.max(1, Number(input.value) + (index === 0 ? -1 : 1))) : Math.max(1, value() + (index === 0 ? -1 : 1));
          if (preview) { input.setCustomValidity(''); input.dispatchEvent(new Event('input', { bubbles: true })); }
        });
      });
      input.addEventListener('change', function () { if (!preview) input.value = value(); });
      if (preview) input.addEventListener('input', function () { input.setCustomValidity(''); });
    });
  }

  function mount() {
    if (!document.getElementById('cartDrawer')) {
      var wrap = document.createElement('div'); wrap.innerHTML = drawerHTML();
      document.body.appendChild(wrap);
      document.getElementById('cartClose').addEventListener('click', closeDrawer);
      document.getElementById('cartBackdrop').addEventListener('click', closeDrawer);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDrawer();
        if (!preview || e.key !== 'Tab') return;
        var drawer = document.getElementById('cartDrawer');
        if (!drawer.classList.contains('open')) return;
        var controls = Array.from(drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (node) { return node.getClientRects().length; });
        var first = controls[0], last = controls[controls.length - 1];
        if (!first) { e.preventDefault(); drawer.focus(); }
        else if (!drawer.contains(document.activeElement) || e.shiftKey && document.activeElement === first || !e.shiftKey && document.activeElement === last) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      });
    }
    document.querySelectorAll('[data-cart-open]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
    });
    document.addEventListener('cart:change', function () { renderBadge(); renderDrawer(); });
    renderBadge();
    wireQuantityPicker();
    wireAddToCart();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
