/* Hybrid Ag site assistant mock-up: account gate plus local site guidance. */
(function () {
  'use strict';

  if (window.HybridAgSiteAssistant) return;

  var root;
  var launcher;
  var panel;
  var view;
  var headLabel;
  var headTitle;
  var pageContext;
  var lastFocus;
  var indexPromise;
  // Keep aligned with the lazy-loaded Finder index in components.js.
  var SEARCH_ASSET_VERSION = '20261008-programme-copy-a43df82534';
  var stateLoaded = false;
  var closeTimer;
  var isOpen = false;
  var methodTabs;
  var methodCopy;
  var methodText = [
    'Start with the results you have and the crop or soil issue you want to address.',
    'Look at previous tests and applications alongside changes in the crop and growing conditions.',
    'Discuss the Nutrient requirements, a suitable prescription blend and when to review progress.'
  ];

  var sealAsset = 'assets/hybrid-ag-system-seal-science-white.svg?v=a277c0e4cb';
  var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"></path></svg>';
  var lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>';
  var sendIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z"></path><path d="M22 2 11 13"></path></svg>';

  var curated = {
    testing: {
      text: 'Not sure which test to request? Compare the options below, or tell the team about your crop and what you need to find out.',
      links: [
        ['services-testing.html', 'Testing and interpretation', 'Compare soil, leaf, sap, water and produce testing.', 'Service'],
        ['soil-test.html', 'Request testing', 'Tell us the crop and what you need to understand.', 'Start here'],
        ['nutrient-audit.html', 'Nutrient audit', 'Review existing reports with the team.', 'Service']
      ]
    },
    existing: {
      text: 'If you already have test results, share them with the Hybrid-Ag team before arranging more testing. Include the crop and the block or paddock they came from.',
      links: [
        ['nutrient-audit.html', 'Bring existing results', 'Discuss what your reports mean for your crop.', 'Nutrient audit'],
        ['services-testing.html', 'Compare testing options', 'Find out what each type of test measures.', 'Service'],
        ['contact.html', 'Talk it through', 'Send the team what you have and what you are trying to decide.', 'Contact']
      ]
    },
    product: {
      text: 'The crop and soil requirements come first. The team can then discuss a prescription blend and other Hybrid-Ag products with you. You can also browse the range below.',
      links: [
        ['shop.html', 'Browse the product range', 'Foliar, fertigation, soil and biological inputs.', 'Products'],
        ['program.html', 'Planning crop nutrition', 'How test results inform crop nutrition decisions.', 'Programs'],
        ['services-testing.html', 'Compare testing options', 'Find out what each type of test measures.', 'Testing']
      ]
    },
    program: {
      text: 'Explore how a nutrition program is developed for a crop. The Apple and Cherry examples are review drafts, not approved application guidance. Speak with the Hybrid-Ag team about your own block or paddock.',
      links: [
        ['program.html', 'Crop nutrition programs', 'See how testing informs a nutrition program.', 'Programs'],
        ['sectors.html', 'Choose your production system', 'Horticulture, broadacre, viticulture and small crop.', 'Sectors'],
        ['program-cherries.html', 'Cherry nutrition program', 'Review the draft seasonal example.', 'Crop program'],
        ['program-apples.html', 'Apple nutrition program', 'Review the draft Pink Lady example.', 'Crop program']
      ]
    },
    people: {
      text: 'Meet the agronomy team or send an enquiry. Let them know your crop, location and what you would like help with.',
      links: [
        ['team.html', 'Meet the agronomy team', 'Find the right person for your crop and region.', 'People'],
        ['contact.html', 'Contact Hybrid-Ag', 'Tell us what you would like help with.', 'Contact'],
        ['soil-test.html', 'Request testing', 'Begin with a new sample or an existing result.', 'Testing']
      ]
    }
  };

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function currentPageContext() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    var heading = document.querySelector('main h1, h1');
    var headingText = heading ? heading.textContent.replace(/\s+/g, ' ').trim().replace(/\.$/, '') : 'Hybrid-Ag';
    var contexts = {
      'index.html': ['Hybrid-Ag', 'What would you like help with?', 'Hybrid-Ag website guide'],
      'services-testing.html': ['Testing', 'Not sure which test fits?', 'Testing and interpretation'],
      'services-soil-testing.html': ['Soil testing', 'Need help reading a result?', 'Soil testing and prescription blends'],
      'services-leaf-tissue-testing.html': ['Leaf and tissue', 'Need help reading plant data?', 'Leaf and tissue testing'],
      'services-differential-sap-analysis.html': ['Differential sap', 'Need help comparing tissue?', 'Differential Sap Analysis'],
      'services-prescription-blends.html': ['Dry and granular blends', 'Need help with a soil prescription?', 'Dry and granular prescription blends'],
      'services-liquid-prescription-blends.html': ['Liquid prescription blends', 'Need help with a liquid prescription?', 'Liquid prescription blends'],
      'services-water-testing.html': ['Water testing', 'Need help with water quality?', 'Water testing and application quality'],
      'services-produce-testing.html': ['Produce data', 'Looking for produce testing?', 'Produce testing and Nutrient removal'],
      'soil-test.html': ['Testing request', 'Need help choosing a test?', 'New testing request'],
      'nutrient-audit.html': ['Nutrient audit', 'Have existing test results?', 'Existing results and Nutrient audit'],
      'shop.html': ['Product range', 'Need help finding a product?', 'Hybrid-Ag product range'],
      'program.html': ['Crop programs', 'Have a crop nutrition question?', 'Crop nutrition programs'],
      'program-cherries.html': ['Cherry program', 'Need help using this program?', 'Interactive cherry nutrition program'],
      'contact.html': ['Contact', 'Not sure who to contact?', 'Contact and crop support'],
      'team.html': ['Team', 'Looking for an agronomist?', 'Hybrid-Ag agronomy team']
    };
    var exact = contexts[file];

    if (exact) return { label: exact[0], prompt: exact[1], title: exact[2] };
    if (/^(horticulture|broadacre|viticulture|small-crop|sectors|sectors-)/.test(file)) {
      return { label: headingText, prompt: 'Need a starting point for this crop?', title: headingText };
    }
    if (/^(services-|service-)/.test(file)) {
      return { label: headingText, prompt: 'Need help using this service?', title: headingText };
    }
    if (document.body.dataset.page === 'shop') {
      return { label: headingText, prompt: 'Have a question about this product?', title: headingText };
    }
    return { label: headingText, prompt: 'Need help finding the next step?', title: headingText };
  }

  function request(url, options) {
    return fetch(url, Object.assign({ credentials: 'same-origin' }, options || {})).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) throw new Error(body.message || 'The request could not be completed.');
        return body;
      });
    });
  }

  function track(eventName, properties) {
    if (window.HybridAgAnalytics) window.HybridAgAnalytics.track(eventName, properties || {});
  }

  function mount() {
    pageContext = currentPageContext();
    root = document.createElement('div');
    root.className = 'site-assistant';
    root.innerHTML =
      '<button class="site-assistant-launcher" type="button" aria-expanded="false" aria-controls="site-assistant-panel" aria-label="Open crop support for ' + escapeHTML(pageContext.label) + '">' +
        '<span class="site-assistant-launcher__icon"><img src="' + sealAsset + '" width="40" height="40" alt=""></span>' +
        '<span class="site-assistant-launcher__copy"><small>This page: ' + escapeHTML(pageContext.label) + '</small><strong>' + escapeHTML(pageContext.prompt) + '</strong></span>' +
        '<span class="site-assistant-launcher__arrow" aria-hidden="true">&rarr;</span>' +
      '</button>' +
      '<section class="site-assistant-panel" id="site-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="site-assistant-title" hidden>' +
        '<header class="site-assistant-head" data-signals-overlay>' +
          '<img class="site-assistant-seal" src="' + sealAsset + '" width="400" height="400" alt="" aria-hidden="true">' +
          '<div class="site-assistant-heading"><span data-assistant-head-label>Website guide</span><h2 id="site-assistant-title" data-assistant-head-title>Position. Pattern. Plan.</h2>' +
            '<div class="site-assistant-methods" data-assistant-methods>' +
              '<div class="site-assistant-method-tabs" role="tablist" aria-label="The Hybrid-Ag approach">' +
                '<button type="button" role="tab" id="site-assistant-method-0" data-assistant-method="0" aria-controls="site-assistant-method-copy" aria-selected="true" tabindex="0"><span>01</span> Position</button>' +
                '<button type="button" role="tab" id="site-assistant-method-1" data-assistant-method="1" aria-controls="site-assistant-method-copy" aria-selected="false" tabindex="-1"><span>02</span> Pattern</button>' +
                '<button type="button" role="tab" id="site-assistant-method-2" data-assistant-method="2" aria-controls="site-assistant-method-copy" aria-selected="false" tabindex="-1"><span>03</span> Plan</button>' +
              '</div>' +
              '<p id="site-assistant-method-copy" data-assistant-method-copy role="tabpanel" aria-labelledby="site-assistant-method-0" tabindex="0">' + methodText[0] + '</p>' +
            '</div>' +
          '</div>' +
          '<button class="site-assistant-close" type="button" aria-label="Close assistant">' + closeIcon + '</button>' +
        '</header>' +
        '<div class="site-assistant-body" data-signals-overlay><div class="site-assistant-view" data-assistant-view></div></div>' +
      '</section>';
    document.body.appendChild(root);

    launcher = root.querySelector('.site-assistant-launcher');
    panel = root.querySelector('.site-assistant-panel');
    view = root.querySelector('[data-assistant-view]');
    headLabel = root.querySelector('[data-assistant-head-label]');
    headTitle = root.querySelector('[data-assistant-head-title]');
    methodTabs = Array.from(root.querySelectorAll('[data-assistant-method]'));
    methodCopy = root.querySelector('[data-assistant-method-copy]');
    methodTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { chooseMethod(index); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % 3;
        else if (event.key === 'ArrowLeft') next = (index + 2) % 3;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = 2;
        else return;
        event.preventDefault();
        chooseMethod(next);
        methodTabs[next].focus();
      });
    });
    prepareMotion();
    window.addEventListener('hybridag:signals-ready', prepareMotion);
    launcher.addEventListener('click', open);
    root.querySelector('.site-assistant-close').addEventListener('click', close);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) close();
    });
  }

  function chooseMethod(index) {
    methodTabs.forEach(function (tab, i) {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    methodCopy.textContent = methodText[index];
    methodCopy.setAttribute('aria-labelledby', 'site-assistant-method-' + index);
    methodCopy.classList.remove('is-changing');
    void methodCopy.offsetWidth;
    methodCopy.classList.add('is-changing');
    panel.style.setProperty('--seal-turn', (index * 3) + 'deg');
  }

  function prepareMotion() {
    if (!window.HybridAgSignals) return;
    root.querySelectorAll('[data-signals-overlay]').forEach(function (surface) {
      window.HybridAgSignals.prepareSurface(surface);
    });
  }

  function open() {
    clearTimeout(closeTimer);
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
    requestAnimationFrame(function () {
      if (!isOpen) return;
      panel.classList.add('is-open');
      prepareMotion();
      if (!stateLoaded) loadState();
      else focusPanel();
    });
    track('assistant_open', { state: stateLoaded ? 'returning' : 'initial' });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
    closeTimer = setTimeout(function () { if (!isOpen) panel.hidden = true; }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function focusPanel() {
    if (!isOpen || panel.hidden) return;
    var target = panel.querySelector('[data-assistant-input], .site-assistant-primary, .site-assistant-close');
    if (target) target.focus({ preventScroll: true });
  }

  function loadState(force) {
    if (force) stateLoaded = false;
    root.classList.remove('is-chat', 'is-gate');
    view.innerHTML = '<div class="site-assistant-loading" role="status"><span></span><span></span><span></span><b>Opening the website guide</b></div>';
    request('/api/auth/session').then(function (session) {
      stateLoaded = true;
      if (session.authenticated && session.user) renderChat(session.user);
      else renderGate();
    }).catch(function () {
      stateLoaded = true;
      renderGate();
    });
  }

  function renderGate() {
    root.classList.remove('is-chat');
    root.classList.add('is-gate');
    headLabel.textContent = 'Website guide';
    headTitle.textContent = 'Position. Pattern. Plan.';
    root.querySelector('[data-assistant-methods]').hidden = false;
    view.innerHTML =
      '<div class="site-assistant-gate">' +
        '<div class="site-assistant-page-context"><span>This page</span><strong>' + escapeHTML(pageContext.title) + '</strong></div>' +
        '<div class="site-assistant-paths" aria-label="Crop support starting points">' +
          '<button type="button" data-assistant-path="I need new testing" aria-pressed="false"><b>01</b><span><strong>I need new testing</strong><small>Start a new testing request.</small></span><span aria-hidden="true">&rarr;</span></button>' +
          '<button type="button" data-assistant-path="I have existing results" aria-pressed="false"><b>02</b><span><strong>I already have results</strong><small>Find out how to discuss your reports with the team.</small></span><span aria-hidden="true">&rarr;</span></button>' +
          '<button type="button" data-assistant-path="Explain this page: ' + escapeHTML(pageContext.title) + '" aria-pressed="false"><b>03</b><span><strong>Find related information</strong><small>See other pages about this topic.</small></span><span aria-hidden="true">&rarr;</span></button>' +
        '</div>' +
        '<div class="site-assistant-gate__action">' +
          '<p>' + lockIcon + '<span data-assistant-gate-note>Sign in to use the website guide.</span></p>' +
          '<a class="site-assistant-primary" href="account-application.html">Sign in <span aria-hidden="true">&rarr;</span></a>' +
        '</div>' +
        '<button class="site-assistant-preview" type="button" data-assistant-preview hidden></button>' +
        '<p class="site-assistant-status" data-assistant-status role="status"></p>' +
      '</div>';
    track('assistant_login_gate', {});

    view.querySelectorAll('[data-assistant-path]').forEach(function (button) {
      button.addEventListener('click', function () {
        view.querySelectorAll('[data-assistant-path]').forEach(function (choice) {
          choice.setAttribute('aria-pressed', choice === button ? 'true' : 'false');
        });
        try { window.sessionStorage.setItem('hybridag_assistant_prompt', button.getAttribute('data-assistant-path')); } catch (error) {}
        view.querySelector('[data-assistant-gate-note]').textContent = 'Sign in to continue with this option.';
        track('assistant_path_selected', { page: pageContext.label });
      });
    });

    request('/api/auth/config').then(function (config) {
      if (!config.dev_login_available) return;
      var preview = view.querySelector('[data-assistant-preview]');
      if (!preview) return;
      preview.textContent = config.dev_login_label || 'Preview sign-in';
      preview.hidden = false;
      preview.addEventListener('click', function () {
        var status = view.querySelector('[data-assistant-status]');
        preview.disabled = true;
        status.textContent = 'Signing you in...';
        request('/api/auth/dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        }).then(function () {
          track('login', { method: 'preview', source: 'assistant' });
          loadState(true);
        }).catch(function (error) {
          preview.disabled = false;
          status.textContent = error.message;
        });
      });
    }).catch(function () {
      // The production sign-in route remains available when preview login is disabled.
    });
    focusPanel();
  }

  function renderChat(user) {
    root.classList.remove('is-gate');
    root.classList.add('is-chat');
    headLabel.textContent = 'Website guide';
    headTitle.textContent = 'Find your next step.';
    root.querySelector('[data-assistant-methods]').hidden = true;
    var name = user.given_name || String(user.name || 'there').split(/\s+/)[0];
    var initial = String(name || 'H').charAt(0).toUpperCase();
    view.innerHTML =
      '<div class="site-assistant-context">' +
        '<span class="site-assistant-avatar" aria-hidden="true">' + escapeHTML(initial) + '</span>' +
        '<div><span>Signed in</span><strong>' + escapeHTML(user.name || name) + '</strong></div>' +
        '<a href="account-application.html">Account</a>' +
      '</div>' +
      '<div class="site-assistant-transcript" data-assistant-transcript role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="site-assistant-suggestions" data-assistant-suggestions>' +
        '<button type="button" data-prompt="Explain this page: ' + escapeHTML(pageContext.title) + '">Find related information</button>' +
        '<button type="button" data-prompt="Which testing suits my crop?">Which testing suits my crop?</button>' +
        '<button type="button" data-prompt="I already have test results">I already have test results</button>' +
        '<button type="button" data-prompt="Find a product">Find a product</button>' +
      '</div>' +
      '<form class="site-assistant-form" data-assistant-form>' +
        '<label class="site-assistant-sr" for="site-assistant-input">Search the Hybrid-Ag website guide</label>' +
        '<input id="site-assistant-input" data-assistant-input type="text" autocomplete="off" maxlength="180" placeholder="Ask about a crop, test or product">' +
        '<button type="submit" aria-label="Send message">' + sendIcon + '</button>' +
      '</form>' +
      '<p class="site-assistant-disclaimer">This guide helps you find website information. Ask an agronomist about product use and rates.</p>';

    appendMessage('assistant', 'Hello, ' + name + '. Enter a crop, test or product name to find relevant pages. For advice about your own crop, contact the agronomy team.');

    try {
      var pendingPrompt = window.sessionStorage.getItem('hybridag_assistant_prompt');
      if (pendingPrompt) {
        window.sessionStorage.removeItem('hybridag_assistant_prompt');
        window.setTimeout(function () { ask(pendingPrompt); }, 0);
      }
    } catch (error) {}

    view.querySelectorAll('[data-prompt]').forEach(function (button) {
      button.addEventListener('click', function () { ask(button.getAttribute('data-prompt')); });
    });
    view.querySelector('[data-assistant-form]').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = view.querySelector('[data-assistant-input]');
      ask(input.value);
    });
    focusPanel();
  }

  function appendMessage(role, text, links) {
    var transcript = view.querySelector('[data-assistant-transcript]');
    if (!transcript) return;
    var message = document.createElement('div');
    message.className = 'site-assistant-message site-assistant-message--' + role;
    if (role === 'assistant') message.innerHTML = '<span class="site-assistant-message__mark" aria-hidden="true">HA</span>';
    var content = document.createElement('div');
    content.className = 'site-assistant-message__content';
    var bubble = document.createElement('p');
    bubble.className = 'site-assistant-bubble';
    bubble.textContent = text;
    content.appendChild(bubble);
    if (links && links.length) {
      var results = document.createElement('div');
      results.className = 'site-assistant-results';
      results.innerHTML = links.map(resultHTML).join('');
      content.appendChild(results);
    }
    message.appendChild(content);
    transcript.appendChild(message);
    transcript.scrollTop = transcript.scrollHeight;
  }

  function appendTyping() {
    var transcript = view.querySelector('[data-assistant-transcript]');
    var typing = document.createElement('div');
    typing.className = 'site-assistant-message site-assistant-message--assistant site-assistant-typing';
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'Finding relevant Hybrid-Ag pages');
    typing.innerHTML = '<span class="site-assistant-message__mark" aria-hidden="true">HA</span><span class="site-assistant-bubble"><i></i><i></i><i></i></span>';
    transcript.appendChild(typing);
    transcript.scrollTop = transcript.scrollHeight;
    return typing;
  }

  function ask(value) {
    var prompt = String(value || '').replace(/\s+/g, ' ').trim();
    if (!prompt) return;
    var input = view.querySelector('[data-assistant-input]');
    if (input) input.value = '';
    var suggestions = view.querySelector('[data-assistant-suggestions]');
    if (suggestions) suggestions.hidden = true;
    appendMessage('user', prompt);
    var intent = classify(prompt);
    track('assistant_prompt', { prompt_category: intent });
    var typing = appendTyping();
    window.setTimeout(function () {
      if (typing.parentNode) typing.parentNode.removeChild(typing);
      if (curated[intent]) {
        appendMessage('assistant', curated[intent].text, curated[intent].links);
        return;
      }
      loadIndex().then(function (items) {
        var results = search(items, prompt).slice(0, 3).map(function (item) {
          return [item.url, item.title || item.h1, item.description || 'Open this page for more detail.', typeLabel(item.type)];
        });
        appendMessage(
          'assistant',
          results.length ? 'These are the closest matches on the Hybrid-Ag website.' : 'I could not find a matching page. You can send your question to the team using the links below.',
          results.length ? results : curated.people.links
        );
      }).catch(function () {
        appendMessage('assistant', 'I could not search the site just now. Please try again later or contact the team using the links below.', curated.people.links);
      });
    }, 420);
  }

  function classify(prompt) {
    var text = prompt.toLowerCase();
    if (/already|existing|old result|have (a |my )?(test|report|result)/.test(text)) return 'existing';
    if (/product|fertili[sz]er|foliar|blend|buy|shop/.test(text)) return 'product';
    if (/program|season plan|crop plan/.test(text)) return 'program';
    if (/person|people|team|agronomist|contact|call|talk/.test(text)) return 'people';
    if (/test|testing|sample|soil|leaf|sap|water|produce/.test(text)) return 'testing';
    return 'site_search';
  }

  function loadIndex() {
    if (Array.isArray(window.HYBRIDAG_SEARCH_INDEX)) return Promise.resolve(window.HYBRIDAG_SEARCH_INDEX);
    if (indexPromise) return indexPromise;
    indexPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'js/data/search-index.js?v=' + SEARCH_ASSET_VERSION;
      script.dataset.siteAssistantIndex = '';
      script.onload = function () { resolve(window.HYBRIDAG_SEARCH_INDEX || []); };
      script.onerror = function (error) {
        script.remove();
        reject(error);
      };
      document.head.appendChild(script);
    }).catch(function (error) {
      indexPromise = null;
      throw error;
    });
    return indexPromise;
  }

  function search(items, query) {
    var words = normalise(query).split(' ').filter(function (word) { return word.length > 1; });
    var phrase = normalise(query);
    return items.map(function (item) {
      var title = normalise((item.title || '') + ' ' + (item.h1 || ''));
      var description = normalise(item.description || '');
      var headings = normalise(item.headings || '');
      var terms = normalise(item.terms || '');
      var score = title.indexOf(phrase) !== -1 ? 18 : 0;
      words.forEach(function (word) {
        if (title.indexOf(word) !== -1) score += 6;
        if (description.indexOf(word) !== -1) score += 3;
        if (headings.indexOf(word) !== -1) score += 2;
        if (terms.indexOf(word) !== -1) score += 1;
      });
      return { item: item, score: score };
    }).filter(function (entry) {
      return entry.score > Math.max(2, words.length);
    }).sort(function (a, b) {
      return b.score - a.score;
    }).map(function (entry) { return entry.item; });
  }

  function normalise(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function typeLabel(type) {
    var labels = { company: 'Hybrid-Ag', product: 'Product', program: 'Program', resource: 'Resource', sector: 'Sector', service: 'Service', team: 'People' };
    return labels[type] || 'Website';
  }

  function resultHTML(result) {
    return '<a class="site-assistant-result" href="' + escapeHTML(result[0]) + '">' +
      '<span><small>' + escapeHTML(result[3]) + '</small><strong>' + escapeHTML(result[1]) + '</strong><em>' + escapeHTML(result[2]) + '</em></span>' +
      '<b aria-hidden="true">&rarr;</b></a>';
  }

  window.HybridAgSiteAssistant = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
