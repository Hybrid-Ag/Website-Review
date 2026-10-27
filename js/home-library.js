/* Compact resource tabs enhance static groups without hiding content on script failure. */
(function () {
  'use strict';

  var root = document.querySelector('[data-content-library]');
  if (!root || root.hasAttribute('data-library-ready')) return;
  var tablist = root.querySelector('[data-library-tabs]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-library-tab]'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-library-panel]'));
  var status = root.querySelector('[data-library-status]');
  if (!tablist || tabs.length !== 4 || panels.length !== tabs.length) return;
  if (tabs.some(function (tab, index) {
    return tab.dataset.libraryTab !== panels[index].dataset.libraryPanel;
  })) return;

  function choose(index, focus) {
    tabs.forEach(function (tab, tabIndex) {
      var selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
    });
    if (focus) tabs[index].focus();
    if (status) {
      var count = panels[index].querySelectorAll('.rd3-resource').length;
      var label = tabs[index].dataset.libraryTab === 'playbooks' ? 'crop playbooks' : tabs[index].dataset.libraryTab;
      status.textContent = count + ' ' + label;
    }
  }

  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Choose resource type');
  tablist.setAttribute('aria-orientation', 'horizontal');
  tabs.forEach(function (tab, index) {
    tab.setAttribute('role', 'tab');
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    var heading = panels[index].querySelector('.rd3-group-heading');
    if (heading) heading.hidden = true;
    tab.addEventListener('click', function () { choose(index, false); });
    tab.addEventListener('keydown', function (event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      choose(next, true);
    });
  });
  root.setAttribute('data-library-ready', '');
  choose(0, false);
  tablist.hidden = false;
}());
