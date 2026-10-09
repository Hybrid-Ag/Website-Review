/* Hybrid-Ag Finder - grouped, privacy-safe public website search. */
(function () {
  'use strict';

  var INDEX = Array.isArray(window.HYBRIDAG_SEARCH_INDEX) ? window.HYBRIDAG_SEARCH_INDEX : [];
  var GROUP_ORDER = [
    'Testing & Services', 'Programs', 'Crops & Sectors', 'Products', 'Resources', 'People', 'Hybrid-Ag'
  ];
  var ALIASES = {
    dsa: ['differential', 'sap', 'analysis'],
    differential: ['dsa', 'sap'],
    sap: ['dsa', 'differential'],
    test: ['testing', 'analysis', 'results'],
    testing: ['test', 'analysis', 'results'],
    result: ['results', 'report', 'testing'],
    results: ['result', 'report', 'testing'],
    report: ['results', 'testing'],
    leaf: ['tissue', 'foliar'],
    tissue: ['leaf', 'foliar'],
    foliar: ['leaf', 'spray'],
    spray: ['foliar', 'water'],
    blend: ['blends', 'prescription'],
    blends: ['blend', 'prescription'],
    prescription: ['blend', 'blends', 'custom'],
    kg: ['kilograms', 'requirements'],
    kilograms: ['kg', 'requirements'],
    ha: ['hectare', 'paddock', 'block'],
    hectare: ['ha', 'paddock', 'block'],
    cherry: ['cherries'],
    cherries: ['cherry'],
    grape: ['grapes', 'vineyard', 'viticulture'],
    grapes: ['grape', 'vineyard', 'viticulture'],
    vineyard: ['grape', 'grapes', 'viticulture'],
    viticulture: ['vineyard', 'grape', 'grapes'],
    orchard: ['horticulture', 'block'],
    horticulture: ['orchard', 'block'],
    grain: ['broadacre', 'cereal', 'paddock'],
    cereal: ['grain', 'broadacre', 'paddock'],
    broadacre: ['grain', 'cereal', 'paddock'],
    vegetable: ['vegetables', 'potato', 'smallcrop'],
    vegetables: ['vegetable', 'potato', 'smallcrop'],
    potato: ['vegetable', 'vegetables', 'smallcrop'],
    paddock: ['broadacre', 'hectare'],
    block: ['horticulture', 'viticulture', 'hectare'],
    organic: ['certified', 'certification'],
    adviser: ['agronomist', 'team'],
    advisor: ['adviser', 'agronomist', 'team'],
    agronomist: ['adviser', 'team']
  };
  var STARTERS = [
    'services-testing', 'nutrient-audit', 'horticulture', 'broadacre', 'shop'
  ];
  var searchTimer = null;
  var closeTimer = null;
  var trackedQueries = {};
  var lastTrigger = null;

  function normalise(value) {
    return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function word(text, token) {
    return (' ' + text + ' ').indexOf(' ' + token + ' ') !== -1;
  }

  INDEX.forEach(function (record) {
    record._title = normalise(record.title);
    record._h1 = normalise(record.h1);
    record._description = normalise(record.description);
    record._headings = normalise(record.headings);
    record._terms = normalise(record.terms);
    record._prominent = [record._title, record._h1, record._description, record._headings].join(' ');
    record._all = [record._prominent, record._terms].join(' ');
    record._compact = record._all.replace(/\s+/g, '');
  });

  function fieldScore(record, token) {
    if (word(record._title, token)) return 44;
    if (word(record._h1, token)) return 36;
    if (word(record._headings, token)) return 22;
    if (word(record._description, token)) return 16;
    if (word(record._terms, token)) return 6;
    if (token.length >= 5 && record._compact.indexOf(token) !== -1) return 5;
    return 0;
  }

  function tokenScore(record, token) {
    if (token === 'dsa') {
      var direct = fieldScore(record, token);
      if (direct) return direct + 30;
      if (word(record._prominent, 'differential') && word(record._prominent, 'sap') && word(record._prominent, 'analysis')) {
        return 30;
      }
      return 0;
    }
    var forms = [token];
    if (token.length > 4 && token.slice(-3) === 'ies') forms.push(token.slice(0, -3) + 'y');
    else if (token.length > 3 && token.slice(-1) === 's') forms.push(token.slice(0, -1));
    else if (token.length > 3) forms.push(token + 's');
    var best = 0;
    forms.forEach(function (option) {
      var found = fieldScore(record, option);
      if (found > best) best = found;
    });
    (ALIASES[token] || []).forEach(function (option) {
      var found = fieldScore(record, option) * 0.62;
      if (found > best) best = found;
    });
    return best;
  }

  function score(record, query) {
    var phrase = normalise(query);
    var tokens = phrase.split(' ').filter(function (token) { return token.length > 1; });
    if (!tokens.length) return 0;
    var total = 0;

    if (record._title === phrase) total += 220;
    else if (record._title.indexOf(phrase) === 0) total += 150;
    else if (record._title.indexOf(phrase) !== -1) total += 110;
    if (record._h1.indexOf(phrase) !== -1) total += 80;
    if (phrase.length >= 5 && record._description.indexOf(phrase) !== -1) total += 35;

    for (var index = 0; index < tokens.length; index += 1) {
      var best = tokenScore(record, tokens[index]);
      if (!best) return 0;
      total += best;
    }

    if (record.type === 'service') total += 5;
    if (record.type === 'sector') total += 3;
    return total;
  }

  function search(query) {
    var clean = normalise(query);
    if (clean.length < 2) return [];
    var ranked = INDEX.map(function (record) {
      return { record: record, score: score(record, clean) };
    }).filter(function (entry) {
      return entry.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || a.record.title.localeCompare(b.record.title);
    });
    if (!ranked.length) return ranked;
    var threshold = Math.max(8, ranked[0].score * 0.15);
    return ranked.filter(function (entry) { return entry.score >= threshold; }).slice(0, 80);
  }

  function track(eventName, properties) {
    if (window.HybridAgAnalytics) window.HybridAgAnalytics.track(eventName, properties || {});
  }

  function trackSearch(query, count, context) {
    var clean = normalise(query);
    if (clean.length < 2) return;
    var key = context + ':' + clean;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(function () {
      if (trackedQueries[key]) return;
      trackedQueries[key] = true;
      track('site_search', {
        search_context: context,
        search_query_length: clean.length,
        search_result_count: count
      });
    }, 500);
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function resultLink(entry, position, context) {
    var record = entry.record || entry;
    var link = element('a', 'site-search-result site-search-result--' + record.type);
    link.href = record.url;
    link.setAttribute('data-search-result', record.slug);
    var body = element('span', 'site-search-result__body');
    body.appendChild(element('span', 'site-search-result__type', record.group));
    body.appendChild(element('strong', 'site-search-result__title', record.title));
    var description = record.description || record.h1;
    if (description && normalise(description) !== normalise(record.title)) {
      body.appendChild(element('span', 'site-search-result__description', description));
    }
    link.appendChild(body);
    link.appendChild(element('span', 'site-search-result__arrow', '\u2192'));
    link.addEventListener('click', function () {
      track('site_search_result_click', {
        search_context: context,
        search_result_position: position,
        search_result_type: record.type,
        search_result_slug: record.slug
      });
    });
    return link;
  }

  function starterEntries() {
    return STARTERS.map(function (slug) {
      return INDEX.find(function (record) { return record.slug === slug; });
    }).filter(Boolean);
  }

  function injectDialog() {
    if (document.getElementById('siteSearchDialog')) return;
    var wrapper = document.createElement('div');
    wrapper.id = 'siteSearchDialog';
    wrapper.className = 'site-search-backdrop';
    wrapper.hidden = true;
    wrapper.innerHTML = '' +
      '<section class="site-search-panel" role="dialog" aria-modal="true" aria-labelledby="siteSearchTitle">' +
        '<div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
        '<header class="site-search-head"><div><span class="eyebrow">Hybrid-Ag Finder</span><h2 id="siteSearchTitle">What are you looking for?</h2></div>' +
          '<button class="site-search-close" type="button" aria-label="Close search">&times;</button></header>' +
        '<form class="site-search-form" id="siteSearchForm" role="search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>' +
          '<label class="site-search-label" for="siteSearchInput">Search Hybrid-Ag</label>' +
          '<input id="siteSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try soil testing, DSA, cherries or a product name">' +
          '<button class="site-search-submit" type="submit">Search</button>' +
        '</form>' +
        '<div class="site-search-summary" id="siteSearchSummary" aria-live="polite"></div>' +
        '<div class="site-search-results" id="siteSearchResults"></div>' +
        '<footer class="site-search-foot"><span>Press Esc to close</span><a href="search.html">Open the search page <span aria-hidden="true">\u2192</span></a></footer>' +
      '</section>';
    document.body.appendChild(wrapper);

    wrapper.querySelector('.site-search-close').addEventListener('click', close);
    wrapper.addEventListener('mousedown', function (event) {
      if (event.target === wrapper) close();
    });
    wrapper.querySelector('#siteSearchForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var query = wrapper.querySelector('#siteSearchInput').value.trim();
      if (normalise(query).length >= 2) window.location.href = 'search.html?q=' + encodeURIComponent(query);
    });
    wrapper.querySelector('#siteSearchInput').addEventListener('input', renderDialog);
    wrapper.querySelector('#siteSearchInput').addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown') return;
      var first = wrapper.querySelector('.site-search-result');
      if (first) {
        event.preventDefault();
        first.focus();
      }
    });
    wrapper.addEventListener('keydown', trapDialogFocus);
  }

  function renderDialog() {
    var dialog = document.getElementById('siteSearchDialog');
    if (!dialog) return;
    var query = dialog.querySelector('#siteSearchInput').value.trim();
    var summary = dialog.querySelector('#siteSearchSummary');
    var container = dialog.querySelector('#siteSearchResults');
    container.replaceChildren();

    if (normalise(query).length < 2) {
      summary.textContent = query ? 'Keep typing to search the full site.' : 'Useful starting points';
      var starters = element('div', 'site-search-starters');
      starterEntries().forEach(function (record, index) {
        starters.appendChild(resultLink(record, index + 1, 'overlay_starter'));
      });
      container.appendChild(starters);
      return;
    }

    var results = search(query);
    summary.textContent = results.length ? results.length + (results.length === 1 ? ' result' : ' results') : 'No matching pages found';
    trackSearch(query, results.length, 'overlay');
    if (!results.length) {
      var empty = element('div', 'site-search-empty');
      empty.appendChild(element('strong', '', 'Try a crop, test type or product name.'));
      var copy = element('p', '', 'Still cannot find what you need? Send your question to the team.');
      empty.appendChild(copy);
      var contact = element('a', 'btn btn--teal', 'Ask the team');
      contact.href = 'contact.html';
      empty.appendChild(contact);
      container.appendChild(empty);
      return;
    }

    var groups = {};
    results.forEach(function (entry) {
      (groups[entry.record.group] = groups[entry.record.group] || []).push(entry);
    });
    var orderedGroups = Object.keys(groups).sort(function (a, b) {
      return results.indexOf(groups[a][0]) - results.indexOf(groups[b][0]);
    });
    var shown = 0;
    orderedGroups.forEach(function (group) {
      if (shown >= 10) return;
      var section = element('section', 'site-search-group');
      section.appendChild(element('h3', '', group));
      var list = element('div', 'site-search-group__list');
      groups[group].slice(0, Math.min(3, 10 - shown)).forEach(function (entry) {
        shown += 1;
        list.appendChild(resultLink(entry, results.indexOf(entry) + 1, 'overlay'));
      });
      section.appendChild(list);
      container.appendChild(section);
    });
    var all = element('a', 'site-search-all', 'View all ' + results.length + (results.length === 1 ? ' result' : ' results') + ' \u2192');
    all.href = 'search.html?q=' + encodeURIComponent(query);
    container.appendChild(all);
  }

  function open(trigger) {
    injectDialog();
    var dialog = document.getElementById('siteSearchDialog');
    window.clearTimeout(closeTimer);
    if (!dialog.hidden) {
      dialog.querySelector('#siteSearchInput').focus();
      return;
    }
    lastTrigger = trigger || document.activeElement;
    dialog.hidden = false;
    document.body.classList.add('site-search-lock');
    var input = dialog.querySelector('#siteSearchInput');
    input.focus();
    input.select();
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child === dialog) return;
      child.setAttribute('inert', '');
      if (!child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('data-site-search-hidden', '');
      }
    });
    window.requestAnimationFrame(function () { dialog.classList.add('is-open'); });
    renderDialog();
    track('site_search_open', { search_context: 'overlay' });
  }

  function close() {
    var dialog = document.getElementById('siteSearchDialog');
    if (!dialog || dialog.hidden) return;
    dialog.classList.remove('is-open');
    document.body.classList.remove('site-search-lock');
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child === dialog) return;
      child.removeAttribute('inert');
      if (child.hasAttribute('data-site-search-hidden')) {
        child.removeAttribute('aria-hidden');
        child.removeAttribute('data-site-search-hidden');
      }
    });
    closeTimer = window.setTimeout(function () { dialog.hidden = true; }, 180);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  function trapDialogFocus(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    var dialog = document.getElementById('siteSearchDialog');
    var focusable = Array.prototype.slice.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderSearchPage(query) {
    var container = document.getElementById('searchPageResults');
    var summary = document.getElementById('searchPageSummary');
    if (!container || !summary) return;
    container.replaceChildren();
    var clean = normalise(query);

    if (clean.length < 2) {
      summary.textContent = 'Search the Hybrid-Ag website, or try one of these pages.';
      var starters = element('section', 'search-page-group');
      var head = element('div', 'search-page-group__head');
      head.appendChild(element('h2', '', 'Useful starting points'));
      starters.appendChild(head);
      var starterList = element('div', 'search-page-list');
      starterEntries().forEach(function (record, index) {
        starterList.appendChild(resultLink(record, index + 1, 'page_starter'));
      });
      starters.appendChild(starterList);
      container.appendChild(starters);
      return;
    }

    var results = search(query);
    summary.textContent = results.length ? results.length + (results.length === 1 ? ' result' : ' results') + ' across Hybrid-Ag' : 'No matching pages found';
    trackSearch(query, results.length, 'page');
    if (!results.length) {
      var empty = element('section', 'search-page-empty');
      empty.appendChild(element('h2', '', 'Try a broader crop, test or product name.'));
      empty.appendChild(element('p', '', 'Still cannot find what you need? Send your question to the Hybrid-Ag team.'));
      var actions = element('div', 'cta-row');
      var testing = element('a', 'btn btn--teal', 'Compare testing');
      testing.href = 'services-testing.html';
      var contact = element('a', 'btn', 'Ask the team');
      contact.href = 'contact.html';
      actions.appendChild(testing);
      actions.appendChild(contact);
      empty.appendChild(actions);
      container.appendChild(empty);
      return;
    }

    GROUP_ORDER.forEach(function (group) {
      var entries = results.filter(function (entry) { return entry.record.group === group; });
      if (!entries.length) return;
      var section = element('section', 'search-page-group');
      var head = element('div', 'search-page-group__head');
      head.appendChild(element('h2', '', group));
      head.appendChild(element('span', '', String(entries.length)));
      section.appendChild(head);
      var list = element('div', 'search-page-list');
      entries.forEach(function (entry) {
        list.appendChild(resultLink(entry, results.indexOf(entry) + 1, 'page'));
      });
      section.appendChild(list);
      container.appendChild(section);
    });
  }

  function mountSearchPage() {
    var page = document.querySelector('[data-site-search-page]');
    if (!page) return;
    var form = document.getElementById('searchPageForm');
    var input = document.getElementById('searchPageInput');
    var params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || '';
    renderSearchPage(input.value);
    input.addEventListener('input', function () { renderSearchPage(input.value); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = input.value.trim();
      var next = query ? 'search.html?q=' + encodeURIComponent(query) : 'search.html';
      window.history.pushState({ query: query }, '', next);
      renderSearchPage(query);
    });
    window.addEventListener('popstate', function () {
      input.value = new URLSearchParams(window.location.search).get('q') || '';
      renderSearchPage(input.value);
    });
  }

  function mount() {
    injectDialog();
    mountSearchPage();
  }

  window.HybridAgSearch = { open: open, close: close, search: search };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
