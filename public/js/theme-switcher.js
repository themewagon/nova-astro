// Theme switcher (live palette preview)
// Why: client can quickly preview ready palettes (data-theme from themes.css)
// without code change. We persist the choice in localStorage to survive refresh.
// Pattern: keep theme switching dependency-free in the public template.
// like the other scripts in public/js.
(function () {
  'use strict';

  var storageKey = 'starter-theme-preview';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      // localStorage may be unavailable (private mode), skip persisting
    }
  }

  function initTheme() {
    var existingTheme = document.documentElement.getAttribute('data-theme');
    if (existingTheme && existingTheme !== 'default') return;

    var savedTheme = null;
    try {
      savedTheme = localStorage.getItem(storageKey);
    } catch (e) {
      // no access to localStorage, use default theme
    }
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  }

  function setupSwitcher() {
    var toggle = document.getElementById('theme-switcher-toggle');
    var panel = document.getElementById('theme-switcher-panel');
    if (!toggle || !panel) return;
    if (toggle.dataset.bound === 'true') return;

    toggle.dataset.bound = 'true';
    var options = panel.querySelectorAll('[data-theme-option]');

    function updateActive() {
      var current = document.documentElement.getAttribute('data-theme');
      options.forEach(function (option) {
        var isActive = option.getAttribute('data-theme-option') === current;
        if (isActive) {
          option.setAttribute('aria-pressed', 'true');
          option.classList.add('theme-switcher-option-active');
        } else {
          option.setAttribute('aria-pressed', 'false');
          option.classList.remove('theme-switcher-option-active');
        }
      });
    }

    function closePanel() {
      panel.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var isHidden = panel.classList.contains('hidden');
      if (isHidden) {
        panel.classList.remove('hidden');
        toggle.setAttribute('aria-expanded', 'true');
        updateActive();
      } else {
        closePanel();
      }
    });

    options.forEach(function (option) {
      option.addEventListener('click', function () {
        var selected = option.getAttribute('data-theme-option');
        if (!selected) return;
        applyTheme(selected);
        updateActive();
      });
    });

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Node)) return;
      if (!panel.contains(target) && !toggle.contains(target)) {
        closePanel();
      }
    });
  }

  function init() {
    initTheme();
    setupSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
