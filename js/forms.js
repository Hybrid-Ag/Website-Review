/* Hybrid-Ag - public lead forms with same-origin API delivery and honest email fallback. */
(function () {
  'use strict';

  var FORM_LABELS = {
    contact: 'Website enquiry',
    cherry_audit: 'Cherry audit request',
    post_harvest: 'Post-harvest testing request'
  };

  var CALLBACK_PEOPLE = {
    'andrew-woodford': 'Andrew Woodford',
    'andrew-smith': 'Andrew Smith',
    'joshua-hull': 'Joshua Hull',
    'bruce-armstrong': 'Bruce Armstrong',
    'nathan-strawbridge': 'Nathan Strawbridge',
    'james-white': 'James White',
    'jamie-granger': 'Jamie Granger',
    'chelsea-hall': 'Chelsea Hall',
    team: 'the Hybrid-Ag team'
  };

  function prefillCallback(form, person) {
    if (!Object.prototype.hasOwnProperty.call(CALLBACK_PEOPLE, person)) return;
    var message = form.elements.namedItem('message');
    var test = form.elements.namedItem('test');
    var request = 'I would like to request a call with ' + CALLBACK_PEOPLE[person] + '.';
    if (message && !message.disabled && message.value.indexOf(request) === -1) {
      message.value = request + (message.value.trim() ? '\n\n' + message.value : '');
    }
    if (test && !test.disabled && !test.value) test.value = 'not-sure';
  }

  function prefillProgram(form, program) {
    if (program !== 'apples') return;
    var message = form.elements.namedItem('message');
    var test = form.elements.namedItem('test');
    var request = 'I would like to discuss an apple nutrition program for my orchard.';
    if (message && !message.disabled && !message.readOnly && message.value.indexOf(request) === -1) {
      message.value = request + (message.value.trim() ? '\n\n' + message.value : '');
    }
    if (test && !test.disabled && !test.value) test.value = 'program';
  }

  function prefillLiquidPrescription(form, prescription) {
    if (prescription !== 'liquid') return;
    var message = form.elements.namedItem('message');
    var test = form.elements.namedItem('test');
    var request = 'I would like to discuss a liquid prescription blend for my crop.';
    if (message && !message.disabled && !message.readOnly && message.value.indexOf(request) === -1) {
      message.value = request + (message.value.trim() ? '\n\n' + message.value : '');
    }
    if (test && !test.disabled && !test.value) test.value = 'prescription-liquid';
  }

  function endpointForPage() {
    if (typeof window.HYBRIDAG_LEAD_ENDPOINT === 'string') return window.HYBRIDAG_LEAD_ENDPOINT;
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

  function formData(form) {
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

  function fieldLabel(form, key) {
    var field = form.elements.namedItem(key);
    var id = field && field.id;
    var label = id ? form.querySelector('label[for="' + id + '"]') : null;
    return label ? label.textContent.replace(/\s*\(optional\)\s*/i, '').trim() : key.replace(/_/g, ' ');
  }

  function mailtoFor(form, data, formType) {
    var lines = [FORM_LABELS[formType] || 'Website enquiry', ''];
    Object.keys(data).forEach(function (key) {
      if (key === 'website' || key === 'submission_id' || key === 'submitted_at' || key === 'source') return;
      var value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
      if (formType === 'contact' && key === 'test') {
        var field = form.elements.namedItem(key);
        if (field && field.options) {
          for (var i = 0; i < field.options.length; i++) {
            if (field.options[i].value === value) {
              value = field.options[i].textContent.trim();
              break;
            }
          }
        }
      }
      if (value) lines.push(fieldLabel(form, key) + ': ' + value);
    });
    lines.push('', 'Page: ' + window.location.href);
    return 'mailto:support@hybridag.com.au?subject=' +
      encodeURIComponent(FORM_LABELS[formType] || 'Website enquiry') +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function addFormSupport(form) {
    var trap = document.createElement('div');
    trap.className = 'lead-trap';
    trap.hidden = true;
    trap.setAttribute('aria-hidden', 'true');
    trap.innerHTML = '<label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(trap);

    var privacy = document.createElement('p');
    privacy.className = 'form-privacy';
    privacy.appendChild(document.createTextNode('We use these details to respond to your enquiry and keep its source with the request. See our '));
    var privacyLink = document.createElement('a');
    privacyLink.href = 'privacy.html';
    privacyLink.textContent = 'privacy policy';
    privacy.appendChild(privacyLink);
    privacy.appendChild(document.createTextNode('.'));
    form.appendChild(privacy);

    var status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('data-lead-status', '');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('tabindex', '-1');
    form.appendChild(status);
    return status;
  }

  function setStatus(status, state, message, moveFocus) {
    status.dataset.state = state || '';
    status.textContent = message || '';
    if (moveFocus) status.focus({ preventScroll: true });
  }

  function validate(form, status) {
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid="true"]'), function (field) {
      field.removeAttribute('aria-invalid');
    });
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    var email = form.querySelector('[name="email"]');
    var phone = form.querySelector('[name="phone"]');
    if (email && phone && !email.value.trim() && !phone.value.trim()) {
      email.setAttribute('aria-invalid', 'true');
      phone.setAttribute('aria-invalid', 'true');
      email.focus();
      setStatus(status, 'error', 'Enter an email address or phone number so we can respond.');
      return false;
    }
    return true;
  }

  function mountForm(form) {
    var formType = form.getAttribute('data-lead-form');
    var button = form.querySelector('button[type="submit"]');
    if (!FORM_LABELS[formType] || !button) return;

    var endpoint = endpointForPage();
    var status = addFormSupport(form);
    var defaultLabel = button.textContent;
    var requestId = submissionId();
    var requestBody = null;
    var uncertain = false;
    var sending = false;
    var completed = false;
    var lockedFields = [];
    var fallback = form.querySelector('[data-form-unavailable]');

    if (formType === 'contact') {
      var params = new URLSearchParams(window.location.search);
      prefillProgram(form, params.get('program'));
      prefillLiquidPrescription(form, params.get('prescription'));
      prefillCallback(form, params.get('callback'));
      var callbackLink = document.querySelector('[data-request-callback]');
      if (callbackLink) callbackLink.addEventListener('click', function () {
        prefillCallback(form, 'team');
      });
    }

    function lockFields(locked) {
      if (locked && !lockedFields.length) {
        lockedFields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea')).filter(function (field) {
          return !field.disabled;
        });
      }
      lockedFields.forEach(function (field) { field.disabled = locked; });
      if (!locked) lockedFields = [];
    }

    if (endpoint && (!window.fetch || !window.AbortController)) endpoint = '';
    if (!endpoint) button.textContent = 'Open email to send';

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (sending || completed) return;
      if (!requestBody && !validate(form, status)) return;

      if (!requestBody) {
        var data = formData(form);
        data.schema_version = 1;
        data.form_type = formType;
        data.submission_id = requestId;
        data.submitted_at = new Date().toISOString();
        data.source = sourceData();
        requestBody = JSON.stringify(data);
      }

      if (!endpoint) {
        setStatus(status, 'info', 'Your email app is opening. Check the details, then send the message.', true);
        window.location.href = mailtoFor(form, JSON.parse(requestBody), formType);
        requestBody = null;
        return;
      }

      sending = true;
      lockFields(true);
      form.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = 'Sending...';
      setStatus(status, 'info', 'Sending your request...');
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
        setStatus(status, payload.delivery_state === 'delivered' ? 'success' : 'info', message + reference, true);
        button.textContent = payload.delivery_state === 'delivered' ? 'Request sent' : 'Request saved';
        if (payload.delivery_state === 'delivered') track('lead_submitted', {
          form_type: formType, lead_route: payload.route || 'unknown'
        });
        if (payload.delivery_state === 'pending') track('lead_pending', {
          form_type: formType, lead_route: payload.route || 'unknown'
        });
      }).catch(function (error) {
        if (completed) return; // Analytics must never undo an acknowledged request.
        button.disabled = false;
        if (!uncertain && (error.status === 400 || error.status === 422 || error.status === 429)) {
          requestBody = null;
          lockFields(false);
          button.textContent = defaultLabel;
          setStatus(status, 'error', error.message, true);
        } else {
          uncertain = true;
          button.textContent = 'Try again';
          if (fallback) fallback.hidden = false;
          setStatus(status, 'error', 'We could not confirm receipt. Your details are kept here unchanged. Try again to check the same request, or contact us by email or phone.', true);
        }
        track('lead_submit_error', {
          form_type: formType, response_status: error.status || 0
        });
      }).finally(function () {
        clearTimeout(timeout);
        sending = false;
        form.removeAttribute('aria-busy');
      });
    });

    button.disabled = false;
    if (fallback) fallback.hidden = true;
  }

  function mount() {
    document.querySelectorAll('form[data-lead-form]').forEach(mountForm);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
