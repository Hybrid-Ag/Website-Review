(function () {
  'use strict';

  var root = document.querySelector('[data-system-reader]');
  if (!root) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-reader-tab]'));
  var panel = root.querySelector('[data-reader-panel]');
  var number = panel.querySelector('.system-reader__number');
  var label = panel.querySelector('[data-reader-label]');
  var title = panel.querySelector('[data-reader-title]');
  var copy = panel.querySelector('[data-reader-copy]');
  var question = panel.querySelector('[data-reader-question]');
  var decision = panel.querySelector('[data-reader-decision]');
  var link = panel.querySelector('[data-reader-link]');

  tabs.forEach(function (tab) {
    if (!tab.id) tab.id = (panel.id || 'reader-panel') + '-tab-' + tab.dataset.readerTab;
  });
  var selectedTab = root.querySelector('[data-reader-tab][aria-selected="true"]');
  if (selectedTab) panel.setAttribute('aria-labelledby', selectedTab.id);

  var layers = {
    soil: {
      number: '01',
      label: 'Soil conditions',
      title: 'What does your soil test tell you?',
      copy: 'A soil test measures conditions in the sampled area. Depending on the test selected, results include pH, Carbon, holding capacity and Nutrient levels. We consider the sampling depth and test method when interpreting the results for your paddock or block.',
      question: 'What do the results show about the soil in this area?',
      decision: 'Which Nutrient requirements to consider for a prescription blend, and whether further testing is needed.',
      linkText: 'Explore soil testing',
      href: 'services-soil-testing.html'
    },
    plant: {
      number: '02',
      label: 'Plant nutrition',
      title: 'What do the plant samples show?',
      copy: 'Leaf, tissue and sap tests measure the sampled plant material in different ways. Differential Sap Analysis compares samples from young and old plant tissue. Results need to be considered alongside crop stage, recent weather and applications; a test result alone does not explain the cause.',
      question: 'What Nutrient levels were measured in the sampled leaves or sap?',
      decision: 'Whether to investigate further or review the crop nutrition recommendations.',
      linkText: 'Explore plant testing',
      href: 'services-leaf-tissue-testing.html'
    },
    water: {
      number: '03',
      label: 'Water quality',
      title: 'Is the water suitable for the job?',
      copy: 'Water testing measures characteristics such as pH, hardness and dissolved salts. Tell us where the water comes from and whether it is used for irrigation, fertigation or foliar applications. This helps the team assess the results for the intended use.',
      question: 'What needs checking before this water is used?',
      decision: 'Whether the water source or proposed application needs further assessment.',
      linkText: 'Explore water testing',
      href: 'services-water-testing.html'
    },
    produce: {
      number: '04',
      label: 'Harvest information',
      title: 'What can you learn from the harvested crop?',
      copy: 'Produce testing provides Nutrient results for the harvested crop sample. Combined with yield records, these results can help estimate what was removed at harvest. Grade, pack-out and other quality records provide further information when reviewing the season.',
      question: 'What does the produce analysis show alongside the harvest records?',
      decision: 'What to consider when planning nutrition for the next crop or season.',
      linkText: 'Explore produce testing',
      href: 'services-produce-testing.html'
    }
  };

  function animatePanel() {
    if (reduceMotion) return;
    panel.classList.remove('is-updating');
    void panel.offsetWidth;
    panel.classList.add('is-updating');
  }

  function selectLayer(key, focusTab) {
    var data = layers[key];
    if (!data) return;

    tabs.forEach(function (tab) {
      var selected = tab.dataset.readerTab === key;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (selected) {
        panel.setAttribute('aria-labelledby', tab.id);
        if (focusTab) tab.focus();
      }
    });

    panel.dataset.tone = key;
    number.textContent = data.number;
    label.textContent = data.label;
    title.textContent = data.title;
    copy.textContent = data.copy;
    question.textContent = data.question;
    decision.textContent = data.decision;
    link.textContent = data.linkText;
    link.href = data.href;
    animatePanel();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      selectLayer(tab.dataset.readerTab, false);
    });
    tab.addEventListener('keydown', function (event) {
      var nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      selectLayer(tabs[nextIndex].dataset.readerTab, true);
    });
  });
})();
