(function () {
  'use strict';

  var form = document.querySelector('[data-testing-request]');
  if (!form) return;

  var panels = Array.prototype.slice.call(form.querySelectorAll('[data-form-step]'));
  var currentStep = 0;
  var currentEl = form.querySelector('[data-step-current]');
  var totalEl = form.querySelector('[data-step-total]');
  var progressEl = form.querySelector('[data-step-progress]');
  var explainerEl = form.querySelector('[data-test-explainer]');
  var reviewEl = form.querySelector('[data-request-review]');
  var statusEl = form.querySelector('[data-form-status]');
  var submitEl = form.querySelector('[data-submit-request]');
  var deliveryEl = form.querySelector('[data-delivery-note]');
  var sectorEl = form.querySelector('#test-sector');
  var cropEl = form.querySelector('#test-crop');
  var siteLabelEl = form.querySelector('[data-site-label]');
  var siteInputEl = form.querySelector('#test-site');
  var endpoint = resolveEndpoint();
  var requestId = submissionId();
  var requestBody = null;
  var uncertain = false;
  var sending = false;
  var completed = false;
  var lockedFields = [];
  var fallback = form.querySelector('[data-form-unavailable]');

  function resolveEndpoint() {
    if (typeof window.HYBRIDAG_LEAD_ENDPOINT === 'string') return window.HYBRIDAG_LEAD_ENDPOINT;
    if (typeof window.HYBRIDAG_FORM_ENDPOINT === 'string') return window.HYBRIDAG_FORM_ENDPOINT;
    return /^https?:$/.test(window.location.protocol) ? '/api/leads' : '';
  }

  function submissionId() {
    if (window.crypto && window.crypto.randomUUID) return 'lead-' + window.crypto.randomUUID();
    return 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function track(event, data) {
    try {
      if (window.HybridAgAnalytics) window.HybridAgAnalytics.track(event, data);
    } catch (error) { /* Analytics must not interrupt an enquiry. */ }
  }

  function sourceData() {
    if (typeof window.HybridAgLeadSource === 'function') return window.HybridAgLeadSource();
    var params = new URLSearchParams(window.location.search);
    var source = {
      page_path: window.location.pathname,
      referrer: document.referrer || ''
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (key) {
      source[key] = params.get(key) || '';
    });
    return source;
  }

  var testLabels = {
    soil: 'Soil',
    leaf: 'Leaf and tissue',
    sap: 'Differential sap',
    water: 'Water',
    produce: 'Produce',
    existing: 'Existing results',
    'not-sure': 'Not sure'
  };

  var testExplainers = {
    soil: 'Tell us which paddock or block you want to test and what you need to find out.',
    leaf: 'For leaf and tissue, crop stage and the recent seasonal conditions are especially useful.',
    sap: 'For Differential Sap Analysis, tell us the crop stage and what you want to find out.',
    water: 'Tell us where the water comes from and how you use it, such as for irrigation, fertigation or foliar sprays.',
    produce: 'Tell us which crop you want to test, where it was grown and what you need to find out. Include harvest timing and yield if available.',
    existing: 'Tell us what reports you already have. The file-sharing instructions are in the next step; this form does not upload files.',
    'not-sure': 'Tell us what you would like help with. The team can discuss whether testing is needed and which test to use.'
  };

  var sectorLabels = {
    horticulture: 'Horticulture',
    broadacre: 'Broadacre',
    viticulture: 'Viticulture',
    'small-crop': 'Small Crop',
    other: 'Other'
  };

  var siteLanguage = {
    horticulture: { noun: 'Block', placeholder: 'For example, North block or Block 4' },
    broadacre: { noun: 'Paddock', placeholder: 'For example, North paddock or Paddock 4' },
    viticulture: { noun: 'Block', placeholder: 'For example, North block or Block 4' },
    'small-crop': { noun: 'Paddock or block', placeholder: 'Paddock or block name or number' },
    other: { noun: 'Paddock or block', placeholder: 'Paddock or block name or number' }
  };

  function siteTerms(sector) {
    return siteLanguage[sector] || siteLanguage.other;
  }

  function updateSiteLanguage(sector) {
    var terms = siteTerms(sector);
    siteLabelEl.firstChild.nodeValue = terms.noun + ' name or number ';
    siteInputEl.placeholder = terms.placeholder;
  }

  function selectedTest() {
    var selected = form.querySelector('input[name="test_type"]:checked');
    return selected ? selected.value : '';
  }

  function fieldsIn(panel) {
    return Array.prototype.slice.call(panel.querySelectorAll('input, select, textarea'));
  }

  function setPanelState(panel, active) {
    panel.hidden = !active;
  }

  function showStep(nextStep, moveFocus) {
    currentStep = Math.max(0, Math.min(nextStep, panels.length - 1));
    panels.forEach(function (panel, index) {
      setPanelState(panel, index === currentStep);
    });
    currentEl.textContent = String(currentStep + 1);
    totalEl.textContent = String(panels.length);
    progressEl.style.width = (((currentStep + 1) / panels.length) * 100) + '%';
    if (currentStep === panels.length - 1) renderReview();
    if (moveFocus) {
      var legend = panels[currentStep].querySelector('legend');
      legend.setAttribute('tabindex', '-1');
      legend.focus();
    }
  }

  function validatePanel(panel, focusInvalid) {
    var error = panel.querySelector('[data-step-error]');
    var fields = fieldsIn(panel).filter(function (field) {
      return field.required;
    });
    var invalid = null;

    if (panel.dataset.formStep === '0' && !selectedTest()) {
      invalid = form.querySelector('input[name="test_type"]');
      error.textContent = 'Choose a test type, existing results, or Not sure to continue.';
    } else {
      fields.some(function (field) {
        field.removeAttribute('aria-invalid');
        if (!field.checkValidity()) {
          invalid = field;
          return true;
        }
        return false;
      });
      error.textContent = invalid ? 'Complete the highlighted field before continuing.' : '';
    }

    if (invalid) {
      invalid.setAttribute('aria-invalid', 'true');
      if (focusInvalid !== false) invalid.focus();
      return false;
    }
    return true;
  }

  function addReviewRow(label, value) {
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = displayValue(value);
    reviewEl.appendChild(dt);
    reviewEl.appendChild(dd);
  }

  function displayValue(value) {
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not provided';
    return value || 'Not provided';
  }

  function requestData() {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = Array.isArray(data[key]) ? data[key].concat(value) : [data[key], value];
      } else {
        data[key] = value;
      }
    });
    return data;
  }

  function renderReview() {
    var data = requestData();
    var terms = siteTerms(data.sector);
    reviewEl.textContent = '';
    addReviewRow('Request type', testLabels[data.test_type] || data.test_type);
    addReviewRow('Sector and crop', [sectorLabels[data.sector] || data.sector, data.crop].filter(Boolean).join(', '));
    addReviewRow('Region and ' + terms.noun.toLowerCase(), [data.region, data.site_name].filter(Boolean).join(', '));
    addReviewRow('Crop stage', data.crop_stage);
    addReviewRow('Question', data.question);
    addReviewRow('History', data.history);
    addReviewRow('Information available', data.available_data);
    addReviewRow('Contact', [data.name, data.business].filter(Boolean).join(', '));
    addReviewRow('Email', data.email);
    addReviewRow('Phone', data.phone);
    addReviewRow('Preference', data.contact_preference);
  }

  function mailtoFor(data) {
    var subject = 'Testing request - ' + (testLabels[data.test_type] || 'Hybrid-Ag');
    var terms = siteTerms(data.sector);
    var lines = [
      'Testing request',
      '',
      'Request type: ' + (testLabels[data.test_type] || data.test_type),
      'Sector: ' + (sectorLabels[data.sector] || data.sector),
      'Crop: ' + data.crop,
      'Region: ' + data.region,
      terms.noun + ': ' + (data.site_name || 'Not provided'),
      'Crop stage or timing: ' + (data.crop_stage || 'Not provided'),
      '',
      'Question:',
      data.question,
      '',
      'History or recent context:',
      data.history || 'Not provided',
      '',
      'Information already available: ' + displayValue(data.available_data),
      '',
      'Name: ' + data.name,
      'Farm or business: ' + (data.business || 'Not provided'),
      'Email: ' + data.email,
      'Phone: ' + data.phone,
      'Preferred first contact: ' + data.contact_preference
    ];
    return 'mailto:support@hybridag.com.au?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function lockFields(locked) {
    if (locked && !lockedFields.length) {
      lockedFields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea, button:not([type="submit"])')).filter(function (field) {
        return !field.disabled;
      });
    }
    lockedFields.forEach(function (field) { field.disabled = locked; });
    if (!locked) lockedFields = [];
  }

  function setStatus(state, message, moveFocus) {
    statusEl.dataset.state = state;
    statusEl.textContent = message;
    if (moveFocus) statusEl.focus({ preventScroll: true });
  }

  form.addEventListener('change', function (event) {
    if (event.target.name === 'test_type') {
      explainerEl.textContent = testExplainers[event.target.value] || '';
      panels[0].querySelector('[data-step-error]').textContent = '';
    }
    if (event.target.name === 'sector') updateSiteLanguage(event.target.value);
  });

  form.addEventListener('click', function (event) {
    if (sending || completed || requestBody) return;
    var next = event.target.closest('[data-next]');
    var back = event.target.closest('[data-back]');
    if (next) {
      if (validatePanel(panels[currentStep])) {
        track('form_step_completed', {
          form_type: 'testing_request',
          step_number: currentStep + 1,
          test_type: selectedTest()
        });
        showStep(currentStep + 1, true);
      }
    }
    if (back) showStep(currentStep - 1, true);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sending || completed) return;
    if (currentStep < panels.length - 1) {
      if (validatePanel(panels[currentStep])) showStep(currentStep + 1, true);
      return;
    }
    if (!requestBody) {
      for (var index = 0; index < panels.length - 1; index++) {
        if (!validatePanel(panels[index], false)) {
          showStep(index, false);
          validatePanel(panels[index]);
          return;
        }
      }
      var draft = requestData();
      draft.schema_version = 1;
      draft.form_type = 'testing_request';
      draft.submission_id = requestId;
      draft.submitted_at = new Date().toISOString();
      draft.source = sourceData();
      requestBody = JSON.stringify(draft);
    }
    var data = JSON.parse(requestBody);

    if (!endpoint) {
      setStatus('info', 'Your email app is opening. Check the details and send the message. Attach any existing results if useful.', true);
      window.location.href = mailtoFor(data);
      requestBody = null;
      return;
    }

    sending = true;
    lockFields(true);
    submitEl.disabled = true;
    submitEl.textContent = 'Sending...';
    form.setAttribute('aria-busy', 'true');
    setStatus('info', 'Sending your request...');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 20000);
    fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: requestBody,
      signal: controller.signal
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) {
        return { response: response, payload: payload };
      });
    }).then(function (result) {
      if (!result.response.ok) {
        var error = new Error(result.payload.message || 'The request could not be sent.');
        error.status = result.response.status;
        throw error;
      }
      var payload = result.payload;
      if (payload.status !== 'received' || !/^HAL-\d{8}-[A-F0-9]{8}$/.test(payload.ref || '') ||
          ['review', 'pending', 'delivered'].indexOf(payload.delivery_state) < 0) {
        throw new Error('The server did not confirm receipt.');
      }
      completed = true;
      var reference = ' Reference ' + payload.ref + '.';
      var message = payload.delivery_state === 'review' ? 'Preview only. Your request was saved locally, not sent to the Hybrid-Ag team.' :
        payload.delivery_state === 'pending' ? 'Your request is saved and awaiting delivery confirmation. Please do not send it again.' :
        'Thanks. Your request has been received by the Hybrid-Ag team.';
      setStatus(payload.delivery_state === 'delivered' ? 'success' : 'info', message + reference, true);
      submitEl.textContent = payload.delivery_state === 'delivered' ? 'Request sent' : 'Request saved';
      deliveryEl.querySelector('strong').textContent = payload.delivery_state === 'delivered' ? 'Your request has been received.' : 'Your request has been saved.';
      deliveryEl.querySelector('p').textContent = payload.delivery_state === 'review' ? 'This is a local preview. No enquiry has been sent to the team.' :
        payload.delivery_state === 'pending' ? 'Delivery is awaiting confirmation. Keep the reference below if you need to contact us.' :
        'The team can use the details you supplied when following up your request.';
      if (payload.delivery_state === 'delivered') track('lead_submitted', {
        form_type: 'testing_request',
        lead_route: payload.route || 'marketing',
        test_type: data.test_type,
        sector: data.sector
      });
      if (payload.delivery_state === 'pending') track('lead_pending', {
        form_type: 'testing_request', lead_route: payload.route || 'marketing'
      });
    }).catch(function (error) {
      if (completed) return; // Analytics must never undo an acknowledged request.
      submitEl.disabled = false;
      if (!uncertain && (error.status === 400 || error.status === 422 || error.status === 429)) {
        requestBody = null;
        lockFields(false);
        submitEl.textContent = 'Send request';
        setStatus('error', error.message, true);
      } else {
        uncertain = true;
        submitEl.textContent = 'Try again';
        if (fallback) fallback.hidden = false;
        setStatus('error', 'We could not confirm receipt. Your details are kept here unchanged. Try again to check the same request, or contact us by email or phone.', true);
      }
      track('lead_submit_error', {
        form_type: 'testing_request', test_type: data.test_type, response_status: error.status || 0
      });
    }).finally(function () {
      clearTimeout(timeout);
      sending = false;
      form.removeAttribute('aria-busy');
    });
  });

  var queryParams = new URLSearchParams(window.location.search);
  var requested = queryParams.get('test');
  if (testLabels[requested]) {
    var requestedOption = form.querySelector('input[name="test_type"][value="' + requested + '"]');
    requestedOption.checked = true;
    explainerEl.textContent = testExplainers[requested];
  }

  var requestedSector = queryParams.get('sector');
  if (sectorLabels[requestedSector]) sectorEl.value = requestedSector;

  var requestedCrop = queryParams.get('crop');
  if (requestedCrop && cropEl) cropEl.value = requestedCrop.slice(0, 80);

  if (endpoint && (!window.fetch || !window.AbortController)) endpoint = '';
  if (endpoint) {
    submitEl.textContent = 'Send request';
    deliveryEl.querySelector('strong').textContent = 'Send your testing request.';
    deliveryEl.querySelector('p').textContent = 'Check your details before sending. Keep the reference shown once your request is saved.';
  }

  updateSiteLanguage(sectorEl.value);
  showStep(0, false);
  form.querySelectorAll('button').forEach(function (button) { button.disabled = false; });
  if (fallback) fallback.hidden = true;
})();
