/* Hybrid-Ag customer authentication and saved-account API. */
(function () {
  var googleScriptPromise;
  var LOGIN_RELOAD_KEY = 'hybridag_login_reload_attempts';

  function request(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {})).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.message || 'The request could not be completed.');
        return body;
      });
    });
  }

  function post(url, payload) {
    return request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }

  function setLoginReloads(attempts) {
    try {
      window.sessionStorage.setItem(LOGIN_RELOAD_KEY, String(attempts));
    } catch (_error) {
      // A private browser may block session storage; the normal redirect still runs.
    }
  }

  function clearLoginReloads() {
    try {
      window.sessionStorage.removeItem(LOGIN_RELOAD_KEY);
    } catch (_error) {
      // Nothing to clear when session storage is unavailable.
    }
  }

  function session() {
    return request('/api/auth/session').then(function (result) {
      if (result.authenticated) {
        clearLoginReloads();
        return result;
      }
      var attempts = 0;
      try {
        attempts = Number(window.sessionStorage.getItem(LOGIN_RELOAD_KEY) || 0);
      } catch (_error) {
        attempts = 0;
      }
      if (attempts <= 0) return result;
      if (attempts === 1) clearLoginReloads();
      else setLoginReloads(attempts - 1);
      window.setTimeout(function () { window.location.reload(); }, 100);
      return new Promise(function () {});
    });
  }

  function loadGoogle() {
    if (window.google && window.google.accounts) return Promise.resolve();
    if (googleScriptPromise) return googleScriptPromise;
    googleScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Google sign-in could not be loaded.')); };
      document.head.appendChild(script);
    });
    return googleScriptPromise;
  }

  function safeReturn(value) {
    var target = String(value || 'account-application.html');
    return /^[a-z0-9][a-z0-9._\-]*(?:\.html)?(?:[?#].*)?$/i.test(target) ? target : 'account-application.html';
  }

  function gateHTML(title, copy) {
    return '<div class="auth-gate"><div class="auth-gate__mark" aria-hidden="true">HA</div>' +
      '<span class="eyebrow">Customer account</span><h2>' + title + '</h2><p>' + copy + '</p>' +
      '<div class="auth-gate__google" data-google-button></div>' +
      '<button class="btn btn--quiet auth-gate__preview" type="button" data-preview-login hidden>Preview sign-in</button>' +
      '<p class="auth-gate__status" data-auth-status role="status"></p>' +
      '<small>Google confirms your identity. Hybrid-Ag separately confirms which customer account you may access.</small></div>';
  }

  function renderGate(element, options) {
    var opts = options || {};
    var target = safeReturn(opts.returnTo || location.pathname.split('/').pop() || 'account-application.html');
    element.innerHTML = gateHTML(
      opts.title || 'Sign in to continue.',
      opts.copy || 'Use your Google account to access saved business and delivery details for your orders.'
    );
    var status = element.querySelector('[data-auth-status]');
    return request('/api/auth/config').then(function (config) {
      function completeLogin(url, payload) {
        status.textContent = 'Signing you in...';
        return post(url, payload).then(function () {
          if (window.HybridAgAnalytics) {
            window.HybridAgAnalytics.track('login', {
              method: url.indexOf('/google') !== -1 ? 'google' : 'preview'
            });
          }
          setLoginReloads(2);
          location.href = target;
        }).catch(function (error) {
          if (window.HybridAgAnalytics) {
            window.HybridAgAnalytics.track('login_error', {
              method: url.indexOf('/google') !== -1 ? 'google' : 'preview'
            });
          }
          status.textContent = error.message;
        });
      }

      if (config.google_enabled) {
        loadGoogle().then(function () {
          window.google.accounts.id.initialize({
            client_id: config.google_client_id,
            callback: function (response) {
              completeLogin('/api/auth/google', { credential: response.credential, csrf: config.csrf });
            }
          });
          window.google.accounts.id.renderButton(element.querySelector('[data-google-button]'), {
            type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: 310
          });
        }).catch(function (error) { status.textContent = error.message; });
      } else {
        element.querySelector('[data-google-button]').innerHTML = '<p class="auth-gate__pending">Google sign-in is not available on this website yet.</p>';
      }

      if (config.dev_login_available) {
        var preview = element.querySelector('[data-preview-login]');
        preview.textContent = config.dev_login_label || 'Preview sign-in';
        preview.hidden = false;
        preview.addEventListener('click', function () { completeLogin('/api/auth/dev', {}); });
      }
      return config;
    }).catch(function (error) {
      status.textContent = error.message;
    });
  }

  window.HybridCustomerAuth = {
    session: session,
    accounts: function () { return request('/api/customer/accounts'); },
    renderGate: renderGate,
    submitApplication: function (payload) { return post('/api/account-applications', payload); },
    requestAccountLink: function (payload) {
      return post('/api/customer/account-link-requests', payload).then(function (result) {
        if (window.HybridAgAnalytics) {
          window.HybridAgAnalytics.track('customer_account_link_requested', {});
        }
        return result;
      });
    },
    logout: function () { return post('/api/auth/logout', {}).then(function () { location.href = 'index.html'; }); }
  };
})();
