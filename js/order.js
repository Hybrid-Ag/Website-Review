/* Hybrid-Ag - signed-in cart review and order intake. */
(function () {
  var Cart = window.HybridCart;
  var Auth = window.HybridCustomerAuth;
  if (!Cart || !Auth) return;

  var ENDPOINT = window.HYBRIDAG_ORDER_ENDPOINT || '/api/orders';
  var DRAFT_KEY = 'hybridag_order_draft_v3';
  var REFERENCE_KEY = 'hybridag_pending_order_ref_v1';
  var currentStep = 1;
  var sessionUser = null;
  var savedAccounts = [];
  var pendingReference = '';

  function money(number) {
    return '$' + Number(number).toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function ref() {
    if (pendingReference) return pendingReference;
    try {
      var stored = sessionStorage.getItem(REFERENCE_KEY) || '';
      if (/^HA-[A-Z0-9]{4,16}$/.test(stored)) {
        pendingReference = stored;
        return pendingReference;
      }
    } catch (error) { /* Use an in-memory reference when storage is unavailable. */ }
    var bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      pendingReference = 'HA-' + Array.from(bytes, function (byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('').toUpperCase();
    } else {
      pendingReference = 'HA-' + (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase().slice(-16);
    }
    try { sessionStorage.setItem(REFERENCE_KEY, pendingReference); } catch (error) { /* Keep memory fallback. */ }
    return pendingReference;
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function loadDraft() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {}; } catch (error) { return {}; }
  }

  function saveDraft(form) {
    if (!form) return;
    var draft = {};
    new FormData(form).forEach(function (value, key) {
      if (key !== 'website') draft[key] = value;
    });
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function restoreDraft(form, draft) {
    Object.keys(draft || {}).forEach(function (name) {
      var controls = form.elements[name];
      if (!controls) return;
      if (controls.length && !controls.tagName) {
        Array.prototype.forEach.call(controls, function (control) {
          control.checked = control.value === draft[name];
        });
      } else if (controls.type === 'checkbox' || controls.type === 'radio') {
        controls.checked = controls.value === draft[name];
      } else {
        controls.value = draft[name];
      }
    });
  }

  function renderSummary() {
    var element = document.getElementById('order-summary');
    if (!element) return;
    var lines = Cart.lines();
    var formWrap = document.getElementById('order-form-wrap');

    if (!lines.length) {
      element.innerHTML = '<div class="order-empty"><span class="eyebrow eyebrow--orange">Your order</span>' +
        '<h2 class="h2">Your order is empty.</h2>' +
        '<p class="sub mt-14">Add products from the shop. If you need help choosing, talk to an agronomist.</p>' +
        '<div class="cta-row mt-28"><a class="pill pill--teal" href="shop.html">Browse the range &rarr;</a>' +
        '<a class="pill pill--ghost" href="soil-test.html">Request testing</a></div></div>';
      if (formWrap) formWrap.style.display = 'none';
      return;
    }

    if (formWrap) formWrap.style.display = '';
    var rows = lines.map(function (line) {
      return '<tr data-line-id="' + encodeURIComponent(line.id) + '"><td class="ol-main"><b>' + escapeHTML(line.name) + '</b><span>' +
        escapeHTML(line.size) + (line.sku ? ' &middot; ' + escapeHTML(line.sku) : '') + '</span></td>' +
        '<td class="ol-qty"><button class="cq" type="button" data-d="-1" aria-label="Decrease ' + escapeHTML(line.name) + '">&minus;</button>' +
        '<input class="cqi" value="' + line.qty + '" inputmode="numeric" aria-label="Quantity for ' + escapeHTML(line.name) + '">' +
        '<button class="cq" type="button" data-d="1" aria-label="Increase ' + escapeHTML(line.name) + '">+</button></td>' +
        '<td class="ol-price">' + money(line.price * line.qty) + '</td>' +
        '<td><button class="cart-rm" type="button" aria-label="Remove ' + escapeHTML(line.name) + '">Remove</button></td></tr>';
    }).join('');

    element.innerHTML = '<span class="eyebrow eyebrow--orange">Your items</span>' +
      '<h2 class="h2 order-count">' + Cart.count() + ' item' + (Cart.count() === 1 ? '' : 's') + ' in your order</h2>' +
      '<div class="order-table-wrap"><table class="order-table"><tbody>' + rows + '</tbody></table></div>' +
      '<div class="cart-sub order-subtotal"><span>Indicative subtotal <em>(ex GST)</em></span><b>' + money(Cart.subtotal()) + '</b></div>' +
      '<p class="cart-note">The website does not set your final price. Products are checked against our current system, then the team confirms stock, account pricing and delivery.</p>';

    element.querySelectorAll('tr[data-line-id]').forEach(function (row) {
      var id = decodeURIComponent(row.getAttribute('data-line-id'));
      row.querySelectorAll('.cq').forEach(function (button) {
        button.addEventListener('click', function () {
          var line = Cart.lines().find(function (item) { return item.id === id; });
          if (line) Cart.setQty(id, line.qty + Number(button.getAttribute('data-d')));
        });
      });
      row.querySelector('.cqi').addEventListener('change', function (event) {
        var value = parseInt(event.target.value, 10);
        Cart.setQty(id, isNaN(value) ? 1 : value);
      });
      row.querySelector('.cart-rm').addEventListener('click', function () { Cart.remove(id); });
    });
  }

  function field(label, name, options) {
    var opts = options || {};
    var id = 'order-' + name;
    var attributes = ' class="field" id="' + id + '" name="' + name + '"';
    if (opts.type) attributes += ' type="' + opts.type + '"';
    if (opts.autocomplete) attributes += ' autocomplete="' + opts.autocomplete + '"';
    if (opts.inputmode) attributes += ' inputmode="' + opts.inputmode + '"';
    if (opts.maxlength) attributes += ' maxlength="' + opts.maxlength + '"';
    if (opts.readonly) attributes += ' readonly';
    var control = opts.textarea
      ? '<textarea' + attributes + ' rows="3"></textarea>'
      : '<input' + attributes + '>';
    return '<div class="field-group"><label for="' + id + '">' + label +
      (opts.optional ? ' <span class="opt">Optional</span>' : '') + '</label>' + control +
      (opts.help ? '<span class="field-help">' + opts.help + '</span>' : '') + '</div>';
  }

  function choice(value, title, copy, accent) {
    return '<label class="account-choice account-choice--' + accent + '">' +
      '<input type="radio" name="account_relationship" value="' + value + '">' +
      '<span><strong>' + title + '</strong><small>' + copy + '</small></span></label>';
  }

  function formHTML() {
    return '<div class="order-user"><span>Signed in as</span><strong>' + escapeHTML(sessionUser.name || 'Customer') + '</strong>' +
      '<small>' + escapeHTML(sessionUser.email || '') + '</small><button class="btn btn--quiet" type="button" data-order-sign-out>Sign out</button></div>' +
      '<span class="eyebrow eyebrow--berry">Order details</span>' +
      '<h2 class="h2 order-form-title">Send it to the right account.</h2>' +
      '<p class="order-form-intro">Choose a saved business, confirm delivery, then send the order through. Nothing is charged online.</p>' +
      '<ol class="order-progress" aria-label="Order progress">' +
        '<li class="is-current" data-step-indicator="1"><span>1</span>Account</li>' +
        '<li data-step-indicator="2"><span>2</span>Delivery</li>' +
        '<li data-step-indicator="3"><span>3</span>Review</li>' +
      '</ol>' +
      '<form class="form order-form" id="orderForm" novalidate>' +
        '<div class="order-step" data-order-step="1">' +
          '<fieldset class="order-fieldset"><legend>Are you an existing or new customer?</legend>' +
            '<div class="account-choices account-choices--two">' +
              choice('existing', 'Existing customer', 'Use a Hybrid-Ag account already connected to this sign-in.', 'teal') +
              choice('new_customer', 'New customer', 'Use the Cash Only or Credit account application saved to this sign-in.', 'orange') +
            '</div>' +
          '</fieldset>' +
          '<div class="saved-account-picker" data-saved-account-picker></div>' +
          '<p class="form-err" data-step-error="1" role="alert" hidden></p>' +
          '<div class="order-actions order-actions--end"><button class="btn btn--teal" type="button" data-order-next>Continue to delivery</button></div>' +
        '</div>' +
        '<div class="order-step" data-order-step="2" hidden>' +
          '<fieldset class="order-fieldset"><legend>Who should we confirm the order with?</legend>' +
            '<div class="form-row">' +
              field('Contact name', 'contact_name', { autocomplete: 'name', maxlength: 100 }) +
              field('Phone', 'phone', { type: 'tel', autocomplete: 'tel', maxlength: 30 }) +
            '</div>' +
            field('Email', 'email', { type: 'email', autocomplete: 'email', maxlength: 160, help: 'Prefilled from the saved business; update it if another contact should receive the confirmation.' }) +
          '</fieldset>' +
          '<fieldset class="order-fieldset"><legend>Fulfilment</legend>' +
            '<div class="fulfilment-choices">' +
              '<label><input type="radio" name="fulfilment_method" value="delivery"><span>Deliver this order</span></label>' +
              '<label><input type="radio" name="fulfilment_method" value="pickup"><span>Collect from Hybrid-Ag</span></label>' +
            '</div>' +
          '</fieldset>' +
          '<div class="delivery-fields" data-delivery-fields>' +
            '<div class="field-group" data-address-picker-wrap><label for="order-saved-address">Saved delivery address</label><select class="field" id="order-saved-address" name="saved_address"></select></div>' +
            field('Address line 1', 'address_line_1', { autocomplete: 'address-line1', maxlength: 140 }) +
            field('Address line 2', 'address_line_2', { optional: true, autocomplete: 'address-line2', maxlength: 140 }) +
            '<div class="form-row form-row--location">' +
              field('Suburb / town', 'suburb', { autocomplete: 'address-level2', maxlength: 80 }) +
              '<div class="field-group"><label for="order-state">State</label><select class="field" id="order-state" name="state"><option value="">Select</option><option>ACT</option><option>NSW</option><option>NT</option><option>QLD</option><option>SA</option><option>TAS</option><option>VIC</option><option>WA</option></select></div>' +
              field('Postcode', 'postcode', { autocomplete: 'postal-code', inputmode: 'numeric', maxlength: 4 }) +
            '</div>' +
            field('Delivery instructions', 'delivery_instructions', { optional: true, textarea: true, maxlength: 500 }) +
          '</div>' +
          '<p class="form-err" data-step-error="2" role="alert" hidden></p>' +
          '<div class="order-actions"><button class="btn btn--quiet" type="button" data-order-back>Back</button><button class="btn btn--teal" type="button" data-order-next>Review order</button></div>' +
        '</div>' +
        '<div class="order-step" data-order-step="3" hidden>' +
          '<div class="order-review" id="orderReview"></div>' +
          '<div class="form-row">' +
            field('PO / reference', 'po_reference', { optional: true, maxlength: 80 }) +
            field('Usual agronomist', 'agronomist', { optional: true, maxlength: 100 }) +
          '</div>' +
          field('Notes for our team', 'notes', { optional: true, textarea: true, maxlength: 1000 }) +
          '<label class="order-consent"><input type="checkbox" name="terms_accepted" value="yes"><span>I confirm these details are correct and accept the <a href="terms.html" target="_blank" rel="noopener">trading terms</a>. I understand this is an order request and Hybrid-Ag will confirm pricing, stock and delivery.</span></label>' +
          '<div class="order-honeypot" aria-hidden="true"><label for="order-website">Website</label><input id="order-website" name="website" tabindex="-1" autocomplete="off"></div>' +
          '<p class="form-err" id="orderErr" role="alert" hidden></p>' +
          '<div class="order-actions"><button class="btn btn--quiet" type="button" data-order-back>Back</button><button class="btn btn--teal" type="submit" id="orderSubmit">Submit order</button></div>' +
        '</div>' +
      '</form>';
  }

  function formValue(form, name) {
    var control = form.elements[name];
    if (!control) return '';
    if (control.length && !control.tagName) {
      var checked = Array.prototype.find.call(control, function (item) { return item.checked; });
      return checked ? checked.value : '';
    }
    if ((control.type === 'radio' || control.type === 'checkbox') && !control.checked) return '';
    return String(control.value || '').trim();
  }

  function accountPath(account) {
    return account.source === 'account_application' || account.account_type === 'cash' || account.account_type === 'credit'
      ? 'new_customer'
      : 'existing';
  }

  function accountsFor(relationship) {
    return savedAccounts.filter(function (account) { return accountPath(account) === relationship; });
  }

  function selectedAccount(form) {
    var id = formValue(form, 'profile_account_id');
    return savedAccounts.find(function (account) { return account.id === id; }) || null;
  }

  function statusLabel(status) {
    var labels = {
      linked: 'Connected',
      link_pending: 'Connection pending',
      cash_account_review: 'Cash account review',
      credit_application_review: 'Credit review'
    };
    return labels[status] || String(status || 'Saved').replace(/_/g, ' ');
  }

  function accountArrangement(account) {
    var arrangement = account && (account.account_class || account.account_type);
    if (arrangement === 'cash') return 'Cash Only';
    if (arrangement === 'credit') return 'Credit account';
    return 'Existing account';
  }

  function accountPaymentTerms(account) {
    if (account && account.payment_terms) return account.payment_terms;
    if (account && account.account_type === 'cash') return 'Payment before delivery';
    if (account && account.account_type === 'credit') return 'Subject to credit approval';
    return 'Confirm with accounts';
  }

  function renderAccountPicker(form, preferredId) {
    var relationship = formValue(form, 'account_relationship') || 'existing';
    var accounts = accountsFor(relationship);
    var picker = form.querySelector('[data-saved-account-picker]');
    if (!accounts.length) {
      picker.innerHTML = '<div class="account-setup"><span>' + (relationship === 'existing' ? 'No existing account connected' : 'No new account application saved') + '</span>' +
        '<strong>' + (relationship === 'existing' ? 'Connect the account you already use.' : 'Create your customer account first.') + '</strong>' +
        '<p>' + (relationship === 'existing'
          ? 'We can match a verified email automatically or send a short connection request to accounts.'
          : 'Choose Cash Only for the quickest path, or complete the extra details required for Credit.') + '</p>' +
        '<a class="btn btn--teal" href="account-application.html?return=order.html">Set up customer account</a></div>';
      updateAddressOptions(form, null);
      return;
    }
    var selectedId = accounts.some(function (account) { return account.id === preferredId; }) ? preferredId : accounts[0].id;
    picker.innerHTML = '<div class="field-group"><label for="order-profile-account">Saved business</label>' +
      '<select class="field" id="order-profile-account" name="profile_account_id">' + accounts.map(function (account) {
        return '<option value="' + escapeHTML(account.id) + '"' + (account.id === selectedId ? ' selected' : '') + '>' + escapeHTML(account.name) + '</option>';
      }).join('') + '</select></div><div class="selected-account" data-selected-account></div>';
    picker.querySelector('[name="profile_account_id"]').addEventListener('change', function () {
      fillFromAccount(form, selectedAccount(form));
      saveDraft(form);
    });
    fillFromAccount(form, selectedAccount(form));
  }

  function accountAddresses(account) {
    if (!account) return [];
    var addresses = (account.delivery_addresses || []).filter(function (address) { return address && address.line1; });
    if (!addresses.length && account.trading_address && account.trading_address.line1) addresses.push(account.trading_address);
    return addresses;
  }

  function applyAddress(form, address) {
    var fields = {
      address_line_1: 'line1',
      address_line_2: 'line2',
      suburb: 'suburb',
      state: 'state',
      postcode: 'postcode'
    };
    Object.keys(fields).forEach(function (name) {
      form.elements[name].value = address ? address[fields[name]] || '' : '';
    });
  }

  function updateAddressOptions(form, account) {
    var select = form.elements.saved_address;
    if (!select) return;
    var addresses = accountAddresses(account);
    var wrap = form.querySelector('[data-address-picker-wrap]');
    wrap.hidden = !addresses.length;
    select.innerHTML = addresses.map(function (address, index) {
      var label = address.label || [address.line1, address.suburb].filter(Boolean).join(', ');
      return '<option value="' + index + '">' + escapeHTML(label) + '</option>';
    }).join('') + (addresses.length ? '<option value="other">Enter a different address</option>' : '');
    select.onchange = function () {
      applyAddress(form, select.value === 'other' ? null : addresses[Number(select.value)]);
      saveDraft(form);
    };
    applyAddress(form, addresses[0] || null);
  }

  function fillFromAccount(form, account) {
    var summary = form.querySelector('[data-selected-account]');
    if (!account) {
      if (summary) summary.innerHTML = '';
      updateAddressOptions(form, null);
      return;
    }
    var contact = account.contact || {};
    form.elements.contact_name.value = contact.name || sessionUser.name || '';
    form.elements.email.value = contact.email || sessionUser.email || '';
    form.elements.phone.value = contact.phone || '';
    updateAddressOptions(form, account);
    if (summary) {
      var meta = [];
      if (account.account_number) meta.push('Account ' + account.account_number);
      meta.push(accountArrangement(account));
      meta.push(accountPaymentTerms(account));
      if (account.abn) meta.push('ABN ' + account.abn);
      summary.innerHTML = '<div><span>' + escapeHTML(meta.join(' / ') || 'Saved customer account') + '</span>' +
        '<strong>' + escapeHTML(account.name) + '</strong></div><em>' + escapeHTML(statusLabel(account.status)) + '</em>';
    }
  }

  function validateStep(form, step) {
    var missing = [];
    if (step === 1) {
      if (!formValue(form, 'account_relationship')) missing.push('customer type');
      if (!selectedAccount(form)) missing.push('saved customer account');
    }
    if (step === 2) {
      ['contact_name', 'phone', 'email', 'fulfilment_method'].forEach(function (name) {
        if (!formValue(form, name)) missing.push(name.replace(/_/g, ' '));
      });
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formValue(form, 'email'))) missing.push('valid email');
      if (formValue(form, 'fulfilment_method') === 'delivery') {
        ['address_line_1', 'suburb', 'state', 'postcode'].forEach(function (name) {
          if (!formValue(form, name)) missing.push(name.replace(/_/g, ' '));
        });
        if (!/^\d{4}$/.test(formValue(form, 'postcode'))) missing.push('valid postcode');
      }
    }
    if (step === 3 && formValue(form, 'terms_accepted') !== 'yes') missing.push('confirmation of the details and terms');
    return missing.filter(function (item, index, list) { return list.indexOf(item) === index; });
  }

  function showStep(form, step) {
    currentStep = Math.max(1, Math.min(3, step));
    form.querySelectorAll('[data-order-step]').forEach(function (panel) {
      panel.hidden = Number(panel.getAttribute('data-order-step')) !== currentStep;
    });
    document.querySelectorAll('[data-step-indicator]').forEach(function (indicator) {
      var number = Number(indicator.getAttribute('data-step-indicator'));
      indicator.classList.toggle('is-current', number === currentStep);
      indicator.classList.toggle('is-complete', number < currentStep);
    });
    if (currentStep === 3) renderReview(form);
    document.getElementById('order-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showInlineError(form, message) {
    var error = form.querySelector('[data-step-error="' + currentStep + '"]') || document.getElementById('orderErr');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  function clearErrors(form) {
    form.querySelectorAll('.form-err').forEach(function (error) { error.hidden = true; });
  }

  function updateConditionalFields(form) {
    var delivery = formValue(form, 'fulfilment_method') !== 'pickup';
    var deliveryFields = form.querySelector('[data-delivery-fields]');
    if (deliveryFields) deliveryFields.hidden = !delivery;
  }

  function renderReview(form) {
    var account = selectedAccount(form);
    var relationship = formValue(form, 'account_relationship');
    var fulfilment = formValue(form, 'fulfilment_method');
    var address = fulfilment === 'pickup'
      ? 'Collection from Hybrid-Ag, Wangaratta'
      : [formValue(form, 'address_line_1'), formValue(form, 'address_line_2'), formValue(form, 'suburb'), formValue(form, 'state'), formValue(form, 'postcode')].filter(Boolean).join(', ');
    document.getElementById('orderReview').innerHTML = '<span class="review-kicker">' + (relationship === 'existing' ? 'Existing customer' : 'New customer') + '</span>' +
      '<h3>' + escapeHTML(account ? account.name : '') + '</h3>' +
      '<p>' + escapeHTML(account ? statusLabel(account.status) : '') + '</p>' +
      '<dl><div><dt>Contact</dt><dd>' + escapeHTML(formValue(form, 'contact_name')) + '</dd></div>' +
      '<div><dt>Email</dt><dd>' + escapeHTML(formValue(form, 'email')) + '</dd></div>' +
      '<div><dt>Phone</dt><dd>' + escapeHTML(formValue(form, 'phone')) + '</dd></div>' +
      '<div><dt>Fulfilment</dt><dd>' + escapeHTML(address) + '</dd></div></dl>';
  }

  function buildPayload(form) {
    var relationship = formValue(form, 'account_relationship');
    var account = selectedAccount(form) || {};
    return {
      ref: ref(),
      source: 'website',
      currency: 'AUD',
      submitted_at: new Date().toISOString(),
      account: {
        relationship: relationship,
        profile_account_id: account.id || '',
        account_number: account.account_number || '',
        account_business_name: account.legal_name || account.name || '',
        trading_name: account.name || '',
        legal_name: account.legal_name || '',
        abn: account.abn || ''
      },
      customer: {
        contact_name: formValue(form, 'contact_name'),
        email: formValue(form, 'email'),
        phone: formValue(form, 'phone')
      },
      fulfilment: {
        method: formValue(form, 'fulfilment_method'),
        address: {
          line1: formValue(form, 'address_line_1'),
          line2: formValue(form, 'address_line_2'),
          suburb: formValue(form, 'suburb'),
          state: formValue(form, 'state'),
          postcode: formValue(form, 'postcode'),
          country: 'Australia'
        },
        delivery_instructions: formValue(form, 'delivery_instructions')
      },
      commercial: {
        po_reference: formValue(form, 'po_reference'),
        agronomist: formValue(form, 'agronomist'),
        notes: formValue(form, 'notes')
      },
      terms_accepted: formValue(form, 'terms_accepted') === 'yes',
      website: formValue(form, 'website'),
      order_lines: Cart.lines().map(function (line) {
        return {
          product_id: line.product_id,
          sku: line.sku,
          slug: line.slug,
          name: line.name,
          size: line.size,
          qty: line.qty
        };
      })
    };
  }

  function showConfirm(payload, response) {
    var review = response.status === 'manual_review' || response.status === 'received_for_review';
    var heading = response.order_number ? 'Your draft order is in our system.' : 'Your order request has been saved for review.';
    var copy = review
      ? 'Account, stock, pricing and delivery must be confirmed before the order can proceed.'
      : 'The team will now check stock, account pricing and delivery before the order is progressed.';
    document.getElementById('order-grid').innerHTML =
      '<div class="order-confirm"><div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<span class="eyebrow">Order request</span><h2 class="h2">' + heading + '</h2>' +
      '<p class="sub mt-14">Email address supplied: <b>' + escapeHTML(payload.customer.email) + '</b>. ' + copy + ' No payment has been taken online.</p>' +
      '<p class="order-ref">Website reference: <b>' + escapeHTML(response.ref || payload.ref) + '</b>' +
      (response.order_number ? '<br>Order number: <b>' + escapeHTML(response.order_number) + '</b>' : '') + '</p>' +
      '<div class="cta-row mt-28"><a class="pill pill--teal" href="shop.html">Keep browsing</a><a class="pill pill--ghost" href="index.html">Back to home</a></div></div>';
    window.scrollTo(0, 0);
  }

  function submitOrder(form) {
    var error = document.getElementById('orderErr');
    var button = document.getElementById('orderSubmit');
    var payload = buildPayload(form);
    error.hidden = true;
    button.disabled = true;
    button.textContent = 'Sending order...';

    fetch(ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Order-Reference': payload.ref },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var requestError = new Error(body.message || 'The order could not be sent.');
          requestError.status = response.status;
          throw requestError;
        }
        return body;
      });
    }).then(function (response) {
      Cart.clear();
      try {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(REFERENCE_KEY);
      } catch (error) { /* The order is complete even when storage is unavailable. */ }
      pendingReference = '';
      if (window.HybridAgAnalytics) {
        window.HybridAgAnalytics.track('order_request_submitted', {
          order_status: response.status || 'received_for_review',
          account_relationship: payload.account.relationship,
          fulfilment_method: payload.fulfilment.method,
          product_line_count: payload.order_lines.length,
          item_count: payload.order_lines.reduce(function (total, line) { return total + line.qty; }, 0)
        });
      }
      showConfirm(payload, response);
    }).catch(function (submissionError) {
      if (submissionError.status === 409) {
        try { sessionStorage.removeItem(REFERENCE_KEY); } catch (error) { /* Use memory fallback. */ }
        pendingReference = '';
      }
      if (window.HybridAgAnalytics) {
        window.HybridAgAnalytics.track('order_request_error', { stage: 'submit' });
      }
      button.disabled = false;
      button.textContent = 'Submit order';
      error.textContent = submissionError.message || 'Something went wrong sending the order. Please call (03) 5722 8000.';
      error.hidden = false;
    });
  }

  function wireForm() {
    var form = document.getElementById('orderForm');
    if (!form) return;
    var draft = loadDraft();
    var defaultRelationship = accountsFor('existing').length ? 'existing' : accountsFor('new_customer').length ? 'new_customer' : 'existing';
    var relationship = draft.account_relationship || defaultRelationship;
    var relationshipControl = Array.prototype.find.call(form.elements.account_relationship, function (control) {
      return control.value === relationship;
    });
    (relationshipControl || form.elements.account_relationship[0]).checked = true;
    renderAccountPicker(form, draft.profile_account_id || '');
    if (!formValue(form, 'fulfilment_method')) form.elements.fulfilment_method[0].checked = true;
    restoreDraft(form, draft);
    renderAccountPicker(form, draft.profile_account_id || '');
    restoreDraft(form, draft);
    updateConditionalFields(form);
    if (formValue(form, 'saved_address') !== 'other' && form.elements.saved_address) {
      form.elements.saved_address.dispatchEvent(new Event('change'));
      restoreDraft(form, draft);
    }

    form.addEventListener('change', function (event) {
      if (event.target.name === 'account_relationship') renderAccountPicker(form, '');
      updateConditionalFields(form);
      saveDraft(form);
    });
    form.addEventListener('input', function () { saveDraft(form); });
    document.querySelector('[data-order-sign-out]').addEventListener('click', Auth.logout);
    form.querySelectorAll('[data-order-next]').forEach(function (button) {
      button.addEventListener('click', function () {
        clearErrors(form);
        var missing = validateStep(form, currentStep);
        if (missing.length) {
          showInlineError(form, 'Please complete: ' + missing.join(', ') + '.');
          return;
        }
        showStep(form, currentStep + 1);
      });
    });
    form.querySelectorAll('[data-order-back]').forEach(function (button) {
      button.addEventListener('click', function () { clearErrors(form); showStep(form, currentStep - 1); });
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors(form);
      var missing = validateStep(form, 3);
      if (missing.length) {
        showInlineError(form, 'Please complete: ' + missing.join(', ') + '.');
        return;
      }
      submitOrder(form);
    });
  }

  function showAuthGate(formWrap) {
    Auth.renderGate(formWrap, {
      returnTo: 'order.html',
      title: 'Sign in to submit this order.',
      copy: 'Use your saved customer account and delivery details to place this order request.'
    });
  }

  function mountCheckout() {
    var formWrap = document.getElementById('order-form-wrap');
    formWrap.innerHTML = '<div class="order-loading">Checking your customer account...</div>';
    Auth.session().then(function (session) {
      if (!session.authenticated) {
        showAuthGate(formWrap);
        return null;
      }
      sessionUser = session.user;
      return Auth.accounts().then(function (response) {
        savedAccounts = response.accounts || [];
        formWrap.innerHTML = formHTML();
        wireForm();
      });
    }).catch(function (error) {
      formWrap.innerHTML = '<div class="order-account-error"><strong>We could not load your customer account.</strong><p>' + escapeHTML(error.message) + '</p><a class="btn btn--teal" href="account-application.html?return=order.html">Open customer account</a></div>';
    });
  }

  function mount() {
    if (!document.getElementById('order-summary')) return;
    renderSummary();
    if (Cart.lines().length) mountCheckout();
    document.addEventListener('cart:change', function () {
      renderSummary();
      var currentWrap = document.getElementById('order-form-wrap');
      if (currentWrap && Cart.lines().length && !document.getElementById('orderForm') && !currentWrap.querySelector('.auth-gate')) mountCheckout();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
