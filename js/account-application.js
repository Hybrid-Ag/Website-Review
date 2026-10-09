/* Hybrid-Ag signed-in customer account portal. */
(function () {
  var Auth = window.HybridCustomerAuth;
  var root = document.getElementById('account-root');
  if (!Auth || !root) return;

  var portal = root.querySelector('[data-account-portal]');
  var loading = root.querySelector('[data-account-loading]');
  var start = root.querySelector('[data-account-start]');
  var linkPanel = root.querySelector('[data-link-panel]');
  var applicationPanel = root.querySelector('[data-application-panel]');
  var complete = root.querySelector('[data-account-complete]');
  var applicationForm = root.querySelector('[data-customer-application]');
  var progress = root.querySelector('[data-application-progress]');
  var profile;
  var accountType = 'cash';
  var stepIndex = 0;

  var labels = {
    account: 'Account',
    business: 'Business',
    contact: 'Contact',
    credit: 'Credit',
    review: 'Review'
  };

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function value(name) {
    var control = applicationForm.elements[name];
    if (!control) return '';
    if (control.length && !control.tagName) {
      var checked = Array.prototype.find.call(control, function (item) { return item.checked; });
      return checked ? String(checked.value || '').trim() : '';
    }
    if ((control.type === 'checkbox' || control.type === 'radio') && !control.checked) return '';
    return String(control.value || '').trim();
  }

  function activeSteps() {
    return accountType === 'credit'
      ? ['account', 'business', 'contact', 'credit', 'review']
      : ['account', 'business', 'contact', 'review'];
  }

  function statusLabel(status) {
    var labelsByStatus = {
      linked: 'Connected',
      link_pending: 'Connection pending',
      cash_account_review: 'Cash account review',
      credit_application_review: 'Credit review'
    };
    return labelsByStatus[status] || String(status || 'Saved').replace(/_/g, ' ');
  }

  function accountMeta(account) {
    var bits = [];
    if (account.account_number) bits.push('Account ' + account.account_number);
    if (account.abn) bits.push('ABN ' + account.abn);
    return bits.join(' · ') || 'Hybrid-Ag customer account';
  }

  function relationshipLabel(account) {
    return account.account_type === 'existing' ? 'Existing customer' : 'New customer application';
  }

  function arrangementLabel(account) {
    var arrangement = account.account_class || account.account_type;
    if (arrangement === 'cash') return 'Cash Only';
    if (arrangement === 'credit') return 'Credit account';
    return 'Existing account';
  }

  function paymentTerms(account) {
    if (account.payment_terms) return account.payment_terms;
    if (account.account_type === 'cash') return 'Payment before delivery';
    if (account.account_type === 'credit') return 'Subject to credit approval';
    return 'Confirm with accounts';
  }

  function addressLabel(address) {
    if (!address || !address.line1) return 'Not saved';
    return [address.line1, address.line2, address.suburb, address.state, address.postcode]
      .filter(Boolean).join(', ');
  }

  function renderAccounts(accounts) {
    var list = root.querySelector('[data-account-list]');
    if (!accounts.length) {
      list.innerHTML = '<p class="account-empty">No business is connected to this sign-in yet. Choose Existing customer or New customer below.</p>';
      return;
    }
    list.innerHTML = accounts.map(function (account) {
      var contact = account.contact || {};
      var contactLabel = [contact.name, contact.email].filter(Boolean).join(' · ') || 'Not saved';
      var deliveries = (account.delivery_addresses || []).filter(function (address) {
        return address && address.line1;
      });
      var deliveryLabel = deliveries.length
        ? deliveries.length + (deliveries.length === 1 ? ' saved location' : ' saved locations')
        : 'No saved delivery location';
      var preview = account.demo
        ? '<span class="saved-account__demo">Local preview</span>'
        : '';
      return '<article class="saved-account" data-status="' + escapeHTML(account.status) + '">' +
        '<span class="saved-account__accent" aria-hidden="true"></span>' +
        '<div class="saved-account__body"><header class="saved-account__header"><div class="saved-account__main">' +
        '<span>' + escapeHTML(accountMeta(account)) + '</span><h3>' + escapeHTML(account.name) + '</h3>' + preview +
        '</div><strong class="saved-account__status">' + escapeHTML(statusLabel(account.status)) + '</strong></header>' +
        '<dl class="saved-account__details">' +
        '<div><dt>Customer relationship</dt><dd>' + escapeHTML(relationshipLabel(account)) + '</dd></div>' +
        '<div><dt>Account arrangement</dt><dd>' + escapeHTML(arrangementLabel(account)) + '</dd></div>' +
        '<div><dt>Payment terms</dt><dd>' + escapeHTML(paymentTerms(account)) + '</dd></div>' +
        '<div><dt>Pricing</dt><dd>' + escapeHTML(account.price_list || 'Confirm with accounts') + '</dd></div>' +
        '<div><dt>Primary contact</dt><dd>' + escapeHTML(contactLabel) + '</dd></div>' +
        '<div><dt>Trading address</dt><dd>' + escapeHTML(addressLabel(account.trading_address)) + '</dd></div>' +
        '<div><dt>Delivery locations</dt><dd>' + escapeHTML(deliveryLabel) + '</dd></div>' +
        '</dl><div class="saved-account__actions"><a class="btn btn--teal" href="order.html">Start an order</a>' +
        '<a class="btn btn--quiet" href="contact.html?topic=accounts">Account support</a></div></div></article>';
    }).join('');
  }

  function refreshAccounts() {
    return Auth.accounts().then(function (response) {
      renderAccounts(response.accounts || []);
      return response.accounts || [];
    }).catch(function (error) {
      root.querySelector('[data-account-list]').innerHTML = '<p class="account-empty">' + escapeHTML(error.message) + '</p>';
      return [];
    });
  }

  function openPanel(panel) {
    start.hidden = true;
    linkPanel.hidden = panel !== linkPanel;
    applicationPanel.hidden = panel !== applicationPanel;
    complete.hidden = true;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closePanels() {
    linkPanel.hidden = true;
    applicationPanel.hidden = true;
    complete.hidden = true;
    start.hidden = false;
    start.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function configureBusinessStructure() {
    var proprietary = value('business_structure') === 'proprietary';
    var field = root.querySelector('[data-acn-field]');
    var input = applicationForm.elements.acn;
    field.hidden = !proprietary;
    input.required = proprietary;
    input.disabled = !proprietary;
    if (!proprietary) input.value = '';
  }

  function configureDelivery() {
    var same = applicationForm.elements.delivery_same.checked;
    var fieldset = root.querySelector('[data-delivery-address]');
    fieldset.hidden = same;
    fieldset.querySelectorAll('input,select').forEach(function (control) {
      control.disabled = same;
      control.required = !same && control.name !== 'delivery_line2';
    });
  }

  function configureCredit() {
    accountType = value('account_type') || 'cash';
    applicationForm.querySelectorAll('[data-credit-required]').forEach(function (control) {
      control.required = accountType === 'credit';
      control.disabled = accountType !== 'credit';
    });
    var steps = activeSteps();
    if (stepIndex >= steps.length) stepIndex = steps.length - 1;
    renderStep();
  }

  function renderProgress() {
    var steps = activeSteps();
    progress.style.gridTemplateColumns = 'repeat(' + steps.length + ',1fr)';
    progress.innerHTML = steps.map(function (step, index) {
      return '<li class="' + (index === stepIndex ? 'is-current' : index < stepIndex ? 'is-complete' : '') + '">' +
        '<span>' + (index + 1) + '</span>' + labels[step] + '</li>';
    }).join('');
  }

  function renderStep() {
    var steps = activeSteps();
    var current = steps[stepIndex];
    applicationForm.querySelectorAll('[data-app-step]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-app-step') !== current;
    });
    renderProgress();
    if (current === 'review') renderReview();
  }

  function validABN(input) {
    var abn = String(input || '').replace(/\D/g, '');
    if (abn.length !== 11) return false;
    var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    var total = abn.split('').reduce(function (sum, digit, index) {
      return sum + (Number(digit) - (index === 0 ? 1 : 0)) * weights[index];
    }, 0);
    return total % 89 === 0;
  }

  function setError(message) {
    var error = root.querySelector('[data-application-error]');
    error.textContent = message || '';
    error.hidden = !message;
  }

  function validateStep(step, report) {
    var panel = applicationForm.querySelector('[data-app-step="' + step + '"]');
    var invalid = Array.prototype.find.call(panel.querySelectorAll('input,select,textarea'), function (control) {
      return !control.disabled && !control.checkValidity();
    });
    if (invalid) {
      if (report) invalid.reportValidity();
      return false;
    }
    if (step === 'business') {
      var abn = applicationForm.elements.abn;
      if (!validABN(abn.value)) {
        abn.setCustomValidity('Enter a valid 11 digit ABN.');
        if (report) abn.reportValidity();
        return false;
      }
      abn.setCustomValidity('');
      if (value('business_structure') === 'proprietary' && String(value('acn')).replace(/\D/g, '').length !== 9) {
        applicationForm.elements.acn.setCustomValidity('Enter the 9 digit ACN.');
        if (report) applicationForm.elements.acn.reportValidity();
        return false;
      }
      applicationForm.elements.acn.setCustomValidity('');
    }
    return true;
  }

  function address(prefix) {
    return {
      line1: value(prefix + '_line1'),
      line2: value(prefix + '_line2'),
      suburb: value(prefix + '_suburb'),
      state: value(prefix + '_state'),
      postcode: value(prefix + '_postcode')
    };
  }

  function applicationPayload() {
    var deliverySame = applicationForm.elements.delivery_same.checked;
    var payload = {
      account_type: accountType,
      legal_name: value('legal_name'),
      trading_name: value('trading_name'),
      business_structure: value('business_structure'),
      abn: value('abn'),
      acn: value('acn'),
      contact: {
        name: value('contact_name'),
        phone: value('contact_phone'),
        email: value('contact_email')
      },
      trading_address: address('trading'),
      delivery_same: deliverySame,
      delivery_address: deliverySame ? address('trading') : address('delivery'),
      authorised_signatory: value('authorised_signatory'),
      terms_accepted: applicationForm.elements.terms_accepted.checked,
      website: value('website')
    };
    if (accountType === 'credit') {
      payload.credit = {
        estimated_monthly_purchases: value('estimated_monthly_purchases'),
        credit_limit_required: value('credit_limit_required'),
        accounts_payable: { name: value('ap_name'), phone: value('ap_phone'), email: value('ap_email') },
        bank: { name: value('bank_name'), bsb: value('bank_bsb'), account_number: value('bank_account_number') },
        director: {
          name: value('director_name'),
          date_of_birth: value('director_dob'),
          residential_address: value('director_address'),
          licence_number: value('director_licence')
        },
        trade_references: [1, 2, 3].map(function (number) {
          return {
            company: value('ref_' + number + '_company'),
            contact_name: value('ref_' + number + '_name'),
            email: value('ref_' + number + '_email'),
            phone: value('ref_' + number + '_phone')
          };
        }),
        guarantor: {
          name: value('guarantor_name'),
          signature: value('guarantor_signature'),
          witness_name: value('witness_name'),
          witness_signature: value('witness_signature'),
          witness_address: value('witness_address')
        }
      };
    }
    return payload;
  }

  function renderReview() {
    var destination = applicationForm.elements.delivery_same.checked ? address('trading') : address('delivery');
    var review = root.querySelector('[data-application-review]');
    review.innerHTML = '<span>' + (accountType === 'credit' ? 'Credit application' : 'Cash Only account') + '</span>' +
      '<h3>' + escapeHTML(value('trading_name') || value('legal_name')) + '</h3>' +
      '<p>' + (accountType === 'credit'
        ? 'The credit details will be assessed before invoice terms are activated.'
        : 'Payment will be required before delivery. No credit assessment is needed.') + '</p>' +
      '<dl><div><dt>Legal name</dt><dd>' + escapeHTML(value('legal_name')) + '</dd></div>' +
      '<div><dt>ABN</dt><dd>' + escapeHTML(value('abn')) + '</dd></div>' +
      '<div><dt>Contact</dt><dd>' + escapeHTML(value('contact_name') + ' · ' + value('contact_email') + ' · ' + value('contact_phone')) + '</dd></div>' +
      '<div><dt>Delivery</dt><dd>' + escapeHTML([destination.line1, destination.line2, destination.suburb, destination.state, destination.postcode].filter(Boolean).join(', ')) + '</dd></div></dl>';
    if (!value('authorised_signatory') && profile) applicationForm.elements.authorised_signatory.value = profile.name || '';
  }

  function showComplete(title, copy, actions) {
    start.hidden = true;
    linkPanel.hidden = true;
    applicationPanel.hidden = true;
    complete.innerHTML = '<span class="eyebrow">Account request</span><h2>' + escapeHTML(title) + '</h2><p>' + escapeHTML(copy) + '</p>' + actions;
    complete.hidden = false;
    complete.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function wireLinkForm() {
    var form = root.querySelector('[data-link-form]');
    var error = root.querySelector('[data-link-error]');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.hidden = true;
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Sending request...';
      Auth.requestAccountLink({
        account_number: String(form.elements.account_number.value || '').trim(),
        business_name: String(form.elements.business_name.value || '').trim(),
        website: String(form.elements.website.value || '').trim()
      }).then(function () {
        return refreshAccounts();
      }).then(function () {
        showComplete(
          'We will confirm the connection.',
          'The accounts team will check this request against your verified email before customer details become available.',
          '<div class="cta-row"><a class="pill pill--teal" href="order.html">Return to checkout</a><button class="pill pill--ghost" type="button" data-finish-account>View my accounts</button></div>'
        );
        root.querySelector('[data-finish-account]').addEventListener('click', closePanels);
      }).catch(function (requestError) {
        error.textContent = requestError.message;
        error.hidden = false;
      }).finally(function () {
        button.disabled = false;
        button.textContent = 'Request account connection';
      });
    });
  }

  function wireApplication() {
    applicationForm.querySelectorAll('[data-app-next]').forEach(function (button) {
      button.addEventListener('click', function () {
        var steps = activeSteps();
        if (!validateStep(steps[stepIndex], true)) return;
        stepIndex = Math.min(stepIndex + 1, steps.length - 1);
        renderStep();
      });
    });
    applicationForm.querySelectorAll('[data-app-back]').forEach(function (button) {
      button.addEventListener('click', function () {
        stepIndex = Math.max(stepIndex - 1, 0);
        renderStep();
      });
    });
    Array.prototype.forEach.call(applicationForm.elements.account_type, function (control) {
      control.addEventListener('change', configureCredit);
    });
    applicationForm.elements.business_structure.addEventListener('change', configureBusinessStructure);
    applicationForm.elements.delivery_same.addEventListener('change', configureDelivery);
    applicationForm.elements.abn.addEventListener('input', function () { this.setCustomValidity(''); });
    applicationForm.elements.acn.addEventListener('input', function () { this.setCustomValidity(''); });

    applicationForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setError('');
      var steps = activeSteps();
      var invalidIndex = steps.findIndex(function (step) { return !validateStep(step, false); });
      if (invalidIndex !== -1) {
        stepIndex = invalidIndex;
        renderStep();
        validateStep(steps[invalidIndex], true);
        return;
      }
      var submit = root.querySelector('[data-application-submit]');
      submit.disabled = true;
      submit.textContent = 'Submitting application...';
      Auth.submitApplication(applicationPayload()).then(function (response) {
        return refreshAccounts().then(function () { return response; });
      }).then(function (response) {
        if (window.HybridAgAnalytics) {
          window.HybridAgAnalytics.track('customer_account_application_submitted', {
            account_type: accountType,
            application_status: response.status
          });
        }
        var followUp = (response.documents_required || []).length
          ? ' Our accounts team will request the supporting identity documents required for this business structure.'
          : '';
        showComplete(
          accountType === 'credit' ? 'Your credit application is in review.' : 'Your Cash Only account is being set up.',
          'Reference ' + response.ref + '.' + followUp + ' You can now return to checkout and use these saved details.',
          '<div class="cta-row"><a class="pill pill--teal" href="order.html">Return to checkout</a><button class="pill pill--ghost" type="button" data-finish-account>View my accounts</button></div>'
        );
        root.querySelector('[data-finish-account]').addEventListener('click', closePanels);
      }).catch(function (submissionError) {
        setError(submissionError.message);
      }).finally(function () {
        submit.disabled = false;
        submit.textContent = 'Submit account application';
      });
    });
  }

  function mountPortal(session) {
    profile = session.user;
    loading.hidden = true;
    portal.hidden = false;
    root.querySelector('[data-user-name]').textContent = profile.name || 'Customer';
    root.querySelector('[data-user-email]').textContent = profile.email || '';
    root.querySelector('[data-sign-out]').addEventListener('click', Auth.logout);
    var returnLink = root.querySelector('[data-return-checkout]');
    returnLink.hidden = new URLSearchParams(location.search).get('return') !== 'order.html';
    root.querySelector('[data-open-link]').addEventListener('click', function () { openPanel(linkPanel); });
    root.querySelector('[data-open-application]').addEventListener('click', function () {
      stepIndex = 0;
      renderStep();
      openPanel(applicationPanel);
    });
    root.querySelectorAll('[data-close-panel]').forEach(function (button) { button.addEventListener('click', closePanels); });
    applicationForm.elements.contact_name.value = profile.name || '';
    applicationForm.elements.contact_email.value = profile.email || '';
    configureBusinessStructure();
    configureDelivery();
    configureCredit();
    wireLinkForm();
    wireApplication();
    refreshAccounts();
  }

  Auth.session().then(function (session) {
    if (!session.authenticated) {
      loading.hidden = true;
      Auth.renderGate(root, {
        returnTo: 'account-application.html' + location.search,
        title: 'Sign in to manage your customer account.',
        copy: 'Sign in to access your saved business and delivery details.'
      });
      return;
    }
    mountPortal(session);
  }).catch(function (error) {
    loading.textContent = error.message;
  });
})();
