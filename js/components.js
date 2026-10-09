/* Campaign context lasts at most 30 minutes in this tab; no visitor identifier or cookies. */
(function () {
  'use strict';
  var STORAGE_KEY = 'hybridag.lead-source.v1';
  var MAX_AGE = 30 * 60 * 1000;
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var campaign = {};
  var capturedAt = 0;

  function cleanCampaign(value, key) {
    // Campaign labels, not arbitrary URLs, email addresses or contact details.
    if (typeof value !== 'string' || value.length > 120 || /[@:/?#\u0000-\u001f]/.test(value)) return '';
    if (/\d[\d\s()+.-]{6,}\d/.test(value)) {
      // Only a labelled, real YYYYMMDD campaign date can bypass the phone filter.
      var dated = key === 'utm_campaign' && /^[a-z]+(?:[-_][a-z]+)*[-_](20\d{2})(\d{2})(\d{2})$/i.exec(value.trim());
      if (!dated) return '';
      var year = Number(dated[1]), month = Number(dated[2]), day = Number(dated[3]);
      var date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '';
    }
    return value.trim();
  }

  function publicReferrer(value) {
    try {
      var url = new URL(value);
      var clean = url.origin + url.pathname;
      return /^https?:$/.test(url.protocol) && clean.length <= 500 ? clean : '';
    } catch (_error) { return ''; }
  }

  var referrer = publicReferrer(document.referrer || '');
  try {
    var saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved.at === 'number' && Date.now() >= saved.at && Date.now() - saved.at < MAX_AGE) {
      capturedAt = saved.at;
      referrer = publicReferrer(saved.referrer || '');
      KEYS.forEach(function (key) { campaign[key] = cleanCampaign((saved.campaign || {})[key], key); });
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (_error) { /* Blocked or corrupt storage must never prevent an enquiry. */ }

  var params = new URLSearchParams(window.location.search);
  if (!capturedAt || KEYS.some(function (key) { return params.has(key); })) {
    campaign = {};
    capturedAt = Date.now();
    referrer = publicReferrer(document.referrer || '');
    KEYS.forEach(function (key) { campaign[key] = cleanCampaign(params.get(key), key); });
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ at: capturedAt, campaign: campaign, referrer: referrer }));
    } catch (_error) { /* Current-page attribution still works without storage. */ }
  }

  window.HybridAgLeadSource = function () {
    var source = { page_path: window.location.pathname, referrer: referrer };
    if (capturedAt && Date.now() - capturedAt >= MAX_AGE) {
      campaign = {};
      source.referrer = publicReferrer(document.referrer || '');
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (_error) { /* Optional storage. */ }
    }
    KEYS.forEach(function (key) { source[key] = campaign[key] || ''; });
    return source;
  };
})();

/* Hybrid-Ag - privacy-safe analytics contract shared by every public page. */
(function () {
  'use strict';

  var BLOCKED_KEYS = {
    email: true,
    phone: true,
    name: true,
    first_name: true,
    last_name: true,
    address: true,
    message: true,
    question: true,
    notes: true,
    reference: true,
    order_reference: true
  };

  function cleanValue(value) {
    if (typeof value === 'string') return value.slice(0, 160);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return undefined;
  }

  function track(eventName, properties) {
    if (!eventName || typeof eventName !== 'string') return;
    var payload = {
      event: eventName,
      page_path: window.location.pathname,
      page_type: document.body ? document.body.getAttribute('data-page') || 'general' : 'general'
    };
    Object.keys(properties || {}).forEach(function (key) {
      if (BLOCKED_KEYS[key]) return;
      var value = cleanValue(properties[key]);
      if (value !== undefined && value !== '') payload[key] = value;
    });
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }

  function linkDestination(link) {
    var href = link.getAttribute('href') || '';
    if (/^tel:/i.test(href)) return 'telephone';
    if (/^mailto:/i.test(href)) return 'email';
    try {
      var url = new URL(href, window.location.href);
      // Query strings can contain search text or form data. Never send them to analytics.
      return url.origin === window.location.origin ? url.pathname : url.hostname;
    } catch (_error) {
      return 'unknown';
    }
  }

  function linkPosition(link) {
    var container = link.closest('header, main > section, footer, nav');
    if (!container) return 'page';
    if (container.id) return container.id;
    return (container.className || container.tagName || 'page').toString().split(/\s+/)[0];
  }

  function linkText(link) {
    return (link.textContent || link.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  function formType(form) {
    return form.getAttribute('data-lead-form') ||
      (form.hasAttribute('data-testing-request') ? 'testing_request' : '') ||
      form.id || 'website_form';
  }

  function mount() {
    var startedForms = new WeakSet();
    document.addEventListener('focusin', function (event) {
      var form = event.target.closest && event.target.closest('form');
      if (!form || startedForms.has(form)) return;
      startedForms.add(form);
      track('form_start', { form_type: formType(form) });
    });

    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      var common = {
        link_text: linkText(link),
        link_destination: linkDestination(link),
        link_position: linkPosition(link)
      };
      if (/^tel:/i.test(href)) {
        track('contact_click', Object.assign({ contact_method: 'phone' }, common));
        return;
      }
      if (/^mailto:/i.test(href)) {
        track('contact_click', Object.assign({ contact_method: 'email' }, common));
        return;
      }
      if (/\.(pdf|docx?|xlsx?|csv|zip)(?:$|[?#])/i.test(href)) {
        track('file_download', Object.assign({ file_type: RegExp.$1.toLowerCase() }, common));
        return;
      }
      if (/^https?:/i.test(href) && linkDestination(link) !== new URL(window.location.href).hostname && !href.startsWith(window.location.origin)) {
        track('outbound_click', common);
        return;
      }
      if (link.closest('.product-grid, .shop-grid, .mega-list')) {
        track('select_item', {
          item_id: (href.split('/').pop() || '').replace(/\.html(?:[?#].*)?$/, ''),
          item_list_name: link.closest('.mega-list') ? 'navigation_products' : 'product_listing'
        });
      }
      if (link.matches('.btn, .pill, .foot-call, .nav-phone') || link.closest('.cta-row, .home-cta, .testing-band')) {
        track('cta_click', common);
      }
    }, true);

    var picker = document.getElementById('buy-picker');
    if (picker) {
      track('view_item', {
        item_id: picker.getAttribute('data-slug') || window.location.pathname.replace(/^\//, '').replace(/\.html$/, ''),
        item_name: (document.querySelector('h1') || {}).textContent || ''
      });
    }
  }

  window.HybridAgAnalytics = { track: track };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

/* Hybrid-Ag — shared header + footer for the static multi-page build. */
(function () {
  var NAV = [
    { key: 'about',     label: 'About Us',  href: 'about.html' },
    { key: 'sectors',   label: 'Sectors',   href: 'sectors.html' },
    { key: 'resources', label: 'Resources', href: 'knowledge-center.html' },
    { key: 'services',  label: 'Services',  href: 'services-testing.html' },
    { key: 'team',      label: 'Team',      href: 'team.html' },
    { key: 'shop',      label: 'Shop',      href: 'shop.html' }
  ];
  // Sector navigation stays at production-system level. Crop chapters live under their parent sector.
  var SECTORS = [
    { label: 'Horticulture',        href: 'horticulture.html', note: 'Tree crops, berries & cherries' },
    { label: 'Small Crop',          href: 'small-crop.html',   note: 'Vegetables & other short-cycle crops' },
    { label: 'Broadacre & Pasture', href: 'broadacre.html',    note: 'Grain, oilseed & pasture' },
    { label: 'Viticulture',         href: 'viticulture.html',  note: 'Wine & table grapes' }
  ];
  var SERVICES = [
    { label: 'Testing and Interpretation', href: 'services-testing.html', note: 'Compare the testing options' },
    { label: 'Soil Testing', href: 'services-soil-testing.html' },
    { label: 'Dry and Granular Prescription Blends', href: 'services-prescription-blends.html' },
    { label: 'Leaf and Tissue Testing', href: 'services-leaf-tissue-testing.html' },
    { label: 'Differential Sap Analysis', href: 'services-differential-sap-analysis.html' },
    { label: 'Liquid Prescription Blends', href: 'services-liquid-prescription-blends.html' },
    { label: 'Water Testing', href: 'services-water-testing.html' },
    { label: 'Produce Testing', href: 'services-produce-testing.html' },
    { label: 'Nutrient Audit', href: 'nutrient-audit.html', note: 'Review results you already have' }
  ];
  var PHONE = '(03) 5722 8000', TEL = 'tel:+61357228000';
  // Update this cache key when either lazy-loaded Finder asset changes.
  var SEARCH_ASSET_VERSION = '20261008-programme-copy-a43df82534';
  var ASSISTANT_ASSET_VERSION = '20261009-method-guide';
  var searchLoadPromise = null;

  function loadSearchAsset(path, ready) {
    if (ready()) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = path + '?v=' + SEARCH_ASSET_VERSION;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureSearch() {
    if (window.HybridAgSearch) return Promise.resolve(window.HybridAgSearch);
    if (searchLoadPromise) return searchLoadPromise;
    searchLoadPromise = loadSearchAsset('js/data/search-index.js', function () {
      return Array.isArray(window.HYBRIDAG_SEARCH_INDEX);
    }).then(function () {
      return loadSearchAsset('js/search.js', function () { return Boolean(window.HybridAgSearch); });
    }).then(function () {
      return window.HybridAgSearch;
    }).catch(function (error) {
      searchLoadPromise = null;
      throw error;
    });
    return searchLoadPromise;
  }

  function loadSiteAssistant() {
    if (window.HybridAgSiteAssistant || document.querySelector('script[data-site-assistant]')) return;
    var script = document.createElement('script');
    script.src = 'js/site-assistant.js?v=' + ASSISTANT_ASSET_VERSION;
    script.dataset.siteAssistant = '';
    document.head.appendChild(script);
  }

  function escapeAccountHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function accountArrangement(account) {
    var arrangement = account && (account.account_class || account.account_type);
    if (arrangement === 'cash') return 'Cash Only';
    if (arrangement === 'credit') return 'Credit account';
    return 'Existing account';
  }

  function accountTerms(account) {
    if (account && account.payment_terms) return account.payment_terms;
    if (account && account.account_type === 'cash') return 'Payment before delivery';
    if (account && account.account_type === 'credit') return 'Subject to credit approval';
    return 'Confirm with accounts';
  }

  function accountStatus(status) {
    var labels = {
      linked: 'Connected',
      link_pending: 'Connection pending',
      cash_account_review: 'Cash account review',
      credit_application_review: 'Credit review'
    };
    return labels[status] || String(status || 'Saved').replace(/_/g, ' ');
  }

  function accountSummaryHTML(user, account) {
    var identity = '<span class="nav-account__eyebrow">Signed in as</span>' +
      '<strong class="nav-account__name">' + escapeAccountHTML(user.name || 'Customer') + '</strong>' +
      '<small class="nav-account__email">' + escapeAccountHTML(user.email || '') + '</small>';
    var facts = account
      ? '<div class="nav-account__facts">' +
          '<div><span>Account</span><strong>' + escapeAccountHTML(account.name || 'Hybrid-Ag customer') + '</strong></div>' +
          '<div><span>Arrangement</span><strong>' + escapeAccountHTML(accountArrangement(account)) + '</strong></div>' +
          '<div><span>Payment terms</span><strong>' + escapeAccountHTML(accountTerms(account)) + '</strong></div>' +
          '<div><span>Status</span><strong>' + escapeAccountHTML(accountStatus(account.status)) + '</strong></div>' +
        '</div>' + (account.demo ? '<span class="nav-account__preview">Local preview</span>' : '')
      : '<p class="nav-account__empty">No customer account is connected to this sign-in yet.</p>';
    return identity + facts + '<div class="nav-account__links">' +
      '<a href="account-application.html">Account settings</a>' +
      '<a href="order.html">Your order</a></div>';
  }

  function accountControl(icon) {
    return '<div class="nav-account" data-nav-account>' +
      '<a class="nav-account__trigger" href="account-application.html" aria-label="Customer account" aria-haspopup="true" title="Customer account">' + icon +
        '<span class="nav-account__initial" data-nav-account-initial hidden></span></a>' +
      '<div class="nav-account__menu" role="region" aria-label="Customer account summary">' +
        '<div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
        '<div class="nav-account__content" data-nav-account-content>' +
          '<span class="nav-account__eyebrow">Customer account</span>' +
          '<strong class="nav-account__name">Sign in or create an account.</strong>' +
          '<p class="nav-account__empty">Keep business details, delivery locations and orders together.</p>' +
          '<div class="nav-account__links"><a href="account-application.html">Manage account</a></div>' +
        '</div></div></div>';
  }

  function mobileAccount() {
    return '<div class="nav-mobile-account" data-nav-account-mobile>' +
      '<span class="nav-account__eyebrow">Customer account</span>' +
      '<strong class="nav-account__name">Sign in or create an account.</strong>' +
      '<a href="account-application.html">Manage account &rarr;</a></div>';
  }

  function mountCustomerAccount() {
    var desktop = document.querySelector('[data-nav-account-content]');
    var mobile = document.querySelector('[data-nav-account-mobile]');
    if (!desktop && !mobile) return;
    fetch('/api/auth/session', { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Account service unavailable');
      return response.json();
    }).then(function (session) {
      if (!session.authenticated || !session.user) return null;
      return fetch('/api/customer/accounts', { credentials: 'same-origin' }).then(function (response) {
        if (!response.ok) throw new Error('Account details unavailable');
        return response.json();
      }).then(function (result) {
        var accounts = result.accounts || [];
        var account = accounts.find(function (item) { return item.status === 'linked'; }) || accounts[0] || null;
        var summary = accountSummaryHTML(session.user, account);
        if (desktop) desktop.innerHTML = summary;
        if (mobile) mobile.innerHTML = summary;
        var initial = document.querySelector('[data-nav-account-initial]');
        if (initial) {
          initial.textContent = String(session.user.given_name || session.user.name || 'C').charAt(0).toUpperCase();
          initial.hidden = false;
        }
        var trigger = document.querySelector('.nav-account__trigger');
        if (trigger) trigger.setAttribute('aria-label', 'Account settings for ' + (session.user.name || 'customer'));
        return result;
      });
    }).catch(function () {
      // Static previews can render the public navigation without the customer API.
    });
  }

  function subnavPanel() {
    var rows = SECTORS.map(function (s) {
      return '<a class="subnav-item" href="' + s.href + '"><b>' + s.label + '</b>' +
        (s.note ? '<span class="subnav-note">' + s.note + '</span>' : '') + '</a>';
    }).join('');
    return '<div class="subnav" id="subnav" role="region" aria-label="Sectors">' + rows +
      '<a class="subnav-all" href="program.html">Explore crop programs &rarr;</a></div>';
  }

  function mobileSectors() {
    var rows = SECTORS.map(function (s) {
      return '<a class="nav-msub" href="' + s.href + '">' + s.label + '</a>';
    }).join('');
    return '<div class="nav-sacc" id="navSacc"><a class="nav-msub" href="sectors.html">All sectors</a>' + rows +
      '<a class="nav-msub" href="program.html">Crop nutrition programs</a></div>';
  }

  function servicesPanel() {
    var rows = SERVICES.map(function (s) {
      return '<a class="subnav-item" href="' + s.href + '"><b>' + s.label + '</b>' +
        (s.note ? '<span class="subnav-note">' + s.note + '</span>' : '') + '</a>';
    }).join('');
    return '<div class="subnav subnav--services" id="servicesSubnav" role="region" aria-label="Services">' + rows +
      '<a class="subnav-all" href="soil-test.html?test=not-sure">Request testing &rarr;</a></div>';
  }

  function mobileServices() {
    var rows = SERVICES.map(function (s) {
      return '<a class="nav-msub" href="' + s.href + '">' + s.label + '</a>';
    }).join('');
    return '<div class="nav-vacc" id="navVacc">' + rows +
      '<a class="nav-msub nav-msub--action" href="soil-test.html?test=not-sure">Request testing</a></div>';
  }

  // Products mega menu (data: js/data/products.js -> window.PRODUCTS).
  function catHref(c) { return c.href || ('shop.html#' + c.key); }

  function megaPanel() {
    var cats = window.PRODUCTS || [];
    if (!cats.length) return '';
    var cols = cats.map(function (c) {
      var items = c.items.map(function (it) {
        return it.href ? '<li><a href="' + it.href + '">' + it.name + '</a></li>' : '';
      }).join('');
      return '<div class="mega-col mega-col--' + (c.accent || 'teal') + '">' +
        '<a class="mega-head" href="' + catHref(c) + '">' + c.label + '</a>' +
        '<ul class="mega-list">' + items + '</ul></div>';
    }).join('');
    return '<div class="mega" id="mega" role="region" aria-label="Products">' +
      '<div class="wrap mega-inner">' + cols + '</div>' +
      '<div class="mega-foot"><div class="wrap"><span>Ask about a prescription blend for your crop and soil.</span>' +
        '<a class="pill pill--teal" href="shop.html">View the full range &rarr;</a></div></div>' +
      '</div>';
  }

  function mobileMega() {
    var cats = window.PRODUCTS || [];
    if (!cats.length) return '';
    var rows = cats.map(function (c) {
      return '<a class="nav-msub" href="' + catHref(c) + '">' + c.label + '</a>';
    }).join('');
    return '<div class="nav-macc" id="navMacc">' + rows + '</div>';
  }

  function header(active) {
    function link(n) {
      var cur = n.key === active ? ' aria-current="page"' : '';
      if (n.key === 'shop') { // Shop opens the products mega menu
        return '<button type="button" class="nav-link nav-shop" id="navShop" aria-controls="mega" aria-expanded="false"' +
          (n.key === active ? ' aria-current="page"' : '') + '>' + n.label + '</button>';
      }
      if (n.key === 'sectors') { // Sectors: link to landing + hover dropdown of segments
        return '<span class="nav-hasdrop" id="navSecWrap">' +
          '<a class="nav-link nav-drop" id="navSectors" href="' + n.href + '" aria-controls="subnav" aria-expanded="false"' + cur + '>' + n.label + '</a>' +
          subnavPanel() + '</span>';
      }
      if (n.key === 'services') {
        return '<span class="nav-hasdrop" id="navSvcWrap">' +
          '<a class="nav-link nav-drop" id="navServices" href="' + n.href + '" aria-controls="servicesSubnav" aria-expanded="false"' + cur + '>' + n.label + '</a>' +
          servicesPanel() + '</span>';
      }
      return '<a class="nav-link" href="' + n.href + '"' + cur + '>' + n.label + '</a>';
    }
    function mlink(n) {
      var cur = n.key === active ? ' aria-current="page"' : '';
      if (n.key === 'shop') {
        return '<button type="button" class="nav-link nav-mshop" id="navMshop" aria-controls="navMacc" aria-expanded="false"' + cur + '>' + n.label +
          '<span class="nav-mshop-x" aria-hidden="true">+</span></button>' + mobileMega();
      }
      if (n.key === 'sectors') {
        return '<button type="button" class="nav-link nav-msec" id="navMsec" aria-controls="navSacc" aria-expanded="false"' + cur + '>' + n.label +
          '<span class="nav-mshop-x" aria-hidden="true">+</span></button>' + mobileSectors();
      }
      if (n.key === 'services') {
        return '<button type="button" class="nav-link nav-msvc" id="navMsvc" aria-controls="navVacc" aria-expanded="false"' + cur + '>' + n.label +
          '<span class="nav-mshop-x" aria-hidden="true">+</span></button>' + mobileServices();
      }
      return '<a class="nav-link" href="' + n.href + '"' + cur + '>' + n.label + '</a>';
    }
    var left = NAV.slice(0, 3).map(link).join('');
    var right = NAV.slice(3).map(link).join('');
    var mob = NAV.map(mlink).join('');
    var phone = '<a class="nav-phone" href="' + TEL + '">' + PHONE + '</a>';
    var contact = '<a class="btn btn--teal" href="contact.html">Contact Us</a>';
    var searchIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>';
    var cartIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.6 9H7.5z"/><path d="M6 6 5 3H2"/><circle cx="9.5" cy="20" r="1"/><circle cx="17.5" cy="20" r="1"/></svg>';
    var userIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.7-4 3.1-6 7-6s6.3 2 7 6"></path></svg>';
    var contactIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"></rect><path d="m4 7 8 6 8-6"></path></svg>';
    var contactIcon = '<a class="nav-contact-icon" href="contact.html" aria-label="Contact Hybrid-Ag" title="Contact Us">' + contactIco + '</a>';
    function searchBtn(cls, label) {
      return '<button class="nav-search ' + cls + '" type="button" data-site-search-open aria-label="Search Hybrid-Ag" title="Search" aria-haspopup="dialog">' +
        searchIco + (label ? '<span>' + label + '</span>' : '') + '</button>';
    }
    function cartBtn(cls) { return '<button class="nav-cart ' + cls + '" data-cart-open aria-label="Your order">' + cartIco + '<span class="cart-count" aria-hidden="true">0</span></button>'; }
    return '' +
      '<div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<nav class="nav" id="nav" aria-label="Main">' +
        '<div class="wrap nav-inner">' +
          '<a class="nav-logo" href="index.html" aria-label="Hybrid-Ag — Precision Nutrition"><img class="nav-logo-img" src="assets/hybrid-ag-lockup.png" width="1178" height="356" alt="Hybrid-Ag — Precision Nutrition"></a>' +
          '<div class="nav-links nav-desktop">' +
            '<div class="nav-left">' + left + '</div>' +
            '<div class="nav-right">' + right + '</div>' +
          '</div>' +
          '<div class="nav-tools nav-desktop">' +
            '<div class="nav-utilities">' + searchBtn('nav-search--button') + accountControl(userIco) + '</div>' +
            '<div class="nav-actions">' + cartBtn('') + contactIcon + '</div>' +
          '</div>' +
          searchBtn('nav-search--mob') +
          cartBtn('nav-cart--mob') +
          '<button type="button" class="nav-toggle" id="navToggle" aria-controls="navMobile" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
          '<div class="nav-mobile" id="navMobile">' + mob + mobileAccount() + phone + contact + '</div>' +
        '</div>' +
        megaPanel() +
      '</nav>';
  }

  function footer() {
    return '' +
      '<div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<footer class="foot"><div class="wrap">' +
        '<div class="foot-top">' +
          '<div class="foot-news">' +
            '<span class="eyebrow">Talk to Hybrid-Ag</span>' +
            '<h2>Help with testing and prescription blends.</h2>' +
            '<p>Bring your existing results or ask about new testing. Our team can discuss the options for your crop and soil.</p>' +
            '<div class="cta-row"><a class="btn btn--teal" href="soil-test.html">Request testing</a><a class="foot-call" href="' + TEL + '">' + PHONE + '</a></div>' +
          '</div>' +
          '<div class="foot-cols">' +
            '<div class="foot-col"><h3>Customer Service</h3><a href="soil-test.html">Request testing</a><a href="contact.html">Contact Us</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a></div>' +
            '<div class="foot-col"><h3>Our Address</h3><p>52 Buckler Rd,<br>Wangaratta VIC 3677,<br>Australia</p></div>' +
            '<div class="foot-col"><h3>Stay Connected</h3><a href="https://www.facebook.com/HybridAgPtyLtd" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/hybridag" target="_blank" rel="noopener">Instagram</a><a href="https://www.linkedin.com/company/hybrid-ag" target="_blank" rel="noopener">LinkedIn</a><a href="https://x.com/HybridAg1" target="_blank" rel="noopener">X</a></div>' +
          '</div>' +
        '</div>' +
        '<hr class="foot-rule">' +
        '<div class="foot-meta"><div class="foot-brand"><img class="foot-logo-img" src="assets/hybrid-ag-logo.png" alt="Hybrid-Ag"><span class="copy">&copy; 2026 Hybrid Ag Pty Ltd</span></div><a class="nav-phone" href="' + TEL + '">' + PHONE + '</a></div>' +
      '</div>' +
      '<div class="stamp"><span>Precision Nutrition</span><span>Optimising Inputs</span><span>Maximising Outcomes</span></div>' +
      '</footer>';
  }

  function mount() {
    var active = document.body.getAttribute('data-page') || '';
    var h = document.getElementById('site-header');
    var f = document.getElementById('site-footer');
    if (h) {
      document.body.classList.add('nav-grouped');
      h.innerHTML = header(active);
    }
    if (f) f.innerHTML = footer();
    var main = document.querySelector('main');
    if (h && main) {
      if (!main.id) main.id = 'main-content';
      main.setAttribute('tabindex', '-1');
      var skip = document.querySelector('a.skip-link');
      if (!skip) {
        skip = document.createElement('a');
        skip.className = 'skip-link';
        h.insertBefore(skip, h.firstChild);
      }
      skip.href = '#' + main.id;
      skip.textContent = 'Skip to content';
      skip.addEventListener('click', function () { main.focus({ preventScroll: true }); });
    }
    mountCustomerAccount();
    loadSiteAssistant();
    var nav = document.getElementById('nav'), tog = document.getElementById('navToggle');
    function closeMobile(restoreFocus) {
      if (!nav || !tog || !nav.classList.contains('open')) return;
      if (restoreFocus) tog.focus({ preventScroll: true });
      nav.classList.remove('open');
      tog.setAttribute('aria-expanded', 'false');
    }
    if (tog) tog.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    function openSearch(trigger) {
      closeMobile(false);
      ensureSearch().then(function (finder) {
        if (finder) finder.open(trigger);
      }).catch(function () {
        window.location.href = 'search.html';
      });
    }

    document.querySelectorAll('[data-site-search-open]').forEach(function (button) {
      button.addEventListener('click', function () { openSearch(button); });
    });
    document.addEventListener('keydown', function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch(document.querySelector('[data-site-search-open]'));
      }
    });

    // Disclosures use ordinary links and buttons, not application-menu roles.
    var disclosures = [];
    function addDisclosure(triggerId, panelId, hostId, openClass) {
      var trigger = document.getElementById(triggerId);
      var panel = document.getElementById(panelId);
      var host = document.getElementById(hostId);
      if (!trigger || !panel || !host) return;
      var item = { trigger: trigger, panel: panel, host: host, openClass: openClass };
      function setOpen(open) {
        if (open) disclosures.forEach(function (other) { if (other !== item) other.close(); });
        host.classList.toggle(openClass, open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      item.close = function () { setOpen(false); };
      disclosures.push(item);
      trigger.addEventListener('mouseenter', function () { setOpen(true); });
      panel.addEventListener('mouseenter', function () { setOpen(true); });
      host.addEventListener('mouseleave', function () {
        if (!panel.contains(document.activeElement)) setOpen(false);
      });
      if (trigger.tagName === 'BUTTON') {
        trigger.addEventListener('click', function () { setOpen(trigger.getAttribute('aria-expanded') !== 'true'); });
      } else {
        trigger.addEventListener('focus', function () { setOpen(true); });
      }
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown' || (event.key === ' ' && trigger.tagName === 'A')) {
          event.preventDefault();
          setOpen(true);
          var first = panel.querySelector('a,button');
          if (first) first.focus();
        }
      });
    }
    addDisclosure('navSectors', 'subnav', 'navSecWrap', 'is-open');
    addDisclosure('navServices', 'servicesSubnav', 'navSvcWrap', 'is-open');
    addDisclosure('navShop', 'mega', 'nav', 'mega-open');
    document.addEventListener('focusin', function (event) {
      disclosures.forEach(function (item) {
        if (event.target !== item.trigger && !item.panel.contains(event.target)) item.close();
      });
      if (nav && !nav.contains(event.target)) closeMobile(false);
    });
    document.addEventListener('click', function (event) {
      disclosures.forEach(function (item) {
        if (!item.trigger.contains(event.target) && !item.panel.contains(event.target)) item.close();
      });
      if (nav && !nav.contains(event.target)) closeMobile(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      disclosures.forEach(function (item) {
        if (item.trigger.getAttribute('aria-expanded') !== 'true') return;
        if (item.panel.contains(document.activeElement)) item.trigger.focus({ preventScroll: true });
        item.close();
      });
      if (nav && nav.contains(event.target)) closeMobile(true);
    });
    var desktopNav = window.matchMedia('(min-width: 1101px)');
    desktopNav.addEventListener('change', function () {
      closeMobile(false);
      disclosures.forEach(function (item) { item.close(); });
    });

    // ----- Mobile: Shop expands product categories -----
    var mshop = document.getElementById('navMshop'), macc = document.getElementById('navMacc');
    if (mshop && macc) {
      mshop.addEventListener('click', function () {
        var open = macc.classList.toggle('open');
        mshop.setAttribute('aria-expanded', open ? 'true' : 'false');
        mshop.classList.toggle('is-open', open);
      });
    }

    // ----- Mobile: Sectors expands segment list -----
    var msec = document.getElementById('navMsec'), sacc = document.getElementById('navSacc');
    if (msec && sacc) {
      msec.addEventListener('click', function () {
        var open = sacc.classList.toggle('open');
        msec.setAttribute('aria-expanded', open ? 'true' : 'false');
        msec.classList.toggle('is-open', open);
      });
    }

    // ----- Mobile: Services expands testing and audit pathways -----
    var msvc = document.getElementById('navMsvc'), vacc = document.getElementById('navVacc');
    if (msvc && vacc) {
      msvc.addEventListener('click', function () {
        var open = vacc.classList.toggle('open');
        msvc.setAttribute('aria-expanded', open ? 'true' : 'false');
        msvc.classList.toggle('is-open', open);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
