(function () {
  if (window.__webscaleFadeMotion) return;
  window.__webscaleFadeMotion = true;

  var fadeSelector = '[data-motion="fade"]';
  var viewportSelector = '[data-motion="viewport"]';
  var fadeSequenceSelector = '[data-motion-sequence="fade"]';
  var viewportSequenceSelector = '[data-motion-sequence="viewport"]';
  var autoSectionSelector = '[data-motion-section], footer[id]';
  var mediaSelector = 'img, video, picture, canvas';
  var observer = null;
  var initFrame = null;
  var batchTimer = null;
  var pending = [];

  function isDisabled() {
    return document.documentElement.hasAttribute('data-motion-disabled') ||
      document.documentElement.hasAttribute('data-motion-static');
  }

  function isReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isInViewport(element) {
    var rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0 &&
      rect.left < window.innerWidth && rect.right > 0;
  }

  function reveal(element) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        element.setAttribute('data-motion-visible', '');
      });
    });
  }

  function markMedia(element) {
    if (element.querySelector(mediaSelector)) {
      element.setAttribute('data-motion-media', '');
    }
  }

  function meaningfulChildren(element) {
    return Array.from(element.children).filter(function (child) {
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') return false;
      if (child.hasAttribute('hidden')) return false;
      var style = getComputedStyle(child);
      return style.display !== 'none' && style.position !== 'absolute';
    });
  }

  function isTextLike(element) {
    return /^(P|SPAN|SMALL|LABEL|EM|STRONG)$/.test(element.tagName);
  }

  function isVisualBox(element) {
    var style = getComputedStyle(element);
    return style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      style.borderTopWidth !== '0px' || style.borderBottomWidth !== '0px' ||
      style.borderLeftWidth !== '0px' || style.borderRightWidth !== '0px' ||
      style.boxShadow !== 'none';
  }

  function hasSameTag(elements) {
    if (elements.length < 2) return false;
    var tag = elements[0].tagName;
    return elements.every(function (element) { return element.tagName === tag; });
  }

  function expandGroup(group) {
    var children = meaningfulChildren(group);
    if (children.length === 0 || isVisualBox(group)) return [group];
    if (children.length === 1) {
      var nested = expandGroup(children[0]);
      return nested.length === 1 ? [group] : nested;
    }

    var blockChildren = children.filter(function (child) { return !isTextLike(child); });
    var repeated = blockChildren.length >= 2 && hasSameTag(blockChildren);
    var visualChildren = children.every(isVisualBox);
    if (!repeated && !visualChildren) return [group];

    return children.reduce(function (targets, child) {
      return targets.concat(expandGroup(child));
    }, []);
  }

  function sectionLayout(section) {
    var container = Array.from(section.children).find(function (element) {
      return element.classList.contains('ui-container');
    }) || section.firstElementChild;
    if (!container) return null;
    return container.children.length === 1 ? container.firstElementChild || container : container;
  }

  function autoTargets(section) {
    var layout = sectionLayout(section);
    if (!layout) return [];

    var groups = meaningfulChildren(layout);
    if (section.tagName === 'FOOTER') {
      var footerContainer = Array.from(section.children).find(function (element) {
        return element.classList.contains('ui-container');
      }) || section.firstElementChild;
      if (!footerContainer || footerContainer.children.length < 2) return [];
      groups = groups.slice(0, 1);
    }

    return groups.reduce(function (targets, group) {
      var directChildren = meaningfulChildren(group);
      var hasHeading = directChildren.some(function (element) { return /^H[1-6]$/.test(element.tagName); });
      if (hasHeading && directChildren.length > 1) {
        return targets.concat(directChildren.reduce(function (nestedTargets, child) {
          return nestedTargets.concat(expandGroup(child));
        }, []));
      }
      return targets.concat(expandGroup(group));
    }, []);
  }

  function prepareTarget(element, index, auto) {
    element.style.setProperty(auto ? '--motion-auto-order' : '--motion-order', String(index));
    markMedia(element);
    if (auto) element.setAttribute('data-motion-auto-target', '');
  }

  function enqueue(element) {
    if (element.hasAttribute('data-motion-visible')) return;
    pending.push(element);
  }

  function flushPending() {
    batchTimer = null;
    if (pending.length === 0) return;

    pending.sort(function (a, b) {
      if (a === b) return 0;
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    pending.forEach(function (element) {
      reveal(element);
      if (observer) observer.unobserve(element);
    });
    pending = [];
  }

  function queue(element) {
    enqueue(element);
    if (!batchTimer) batchTimer = setTimeout(flushPending, 70);
  }

  function observeTarget(element) {
    if (isReduced() || !('IntersectionObserver' in window) || isInViewport(element)) {
      queue(element);
      return;
    }
    observer.observe(element);
  }

  function collectViewportTargets() {
    var targets = [];

    document.querySelectorAll(viewportSelector).forEach(function (element) {
      prepareTarget(element, 0, false);
      targets.push(element);
    });

    document.querySelectorAll(viewportSequenceSelector).forEach(function (sequence) {
      Array.from(sequence.children).forEach(function (element, index) {
        prepareTarget(element, index, false);
        targets.push(element);
      });
    });

    document.querySelectorAll(autoSectionSelector).forEach(function (section) {
      if (section.querySelector('[data-motion], [data-motion-sequence]')) return;
      var sectionTargets = autoTargets(section);
      section.setAttribute('data-motion-auto', '');
      sectionTargets.forEach(function (element, index) {
        prepareTarget(element, index, true);
        targets.push(element);
      });
    });

    return targets;
  }

  function revealFadeSequences() {
    document.querySelectorAll(fadeSelector).forEach(function (element) {
      markMedia(element);
      if (isReduced()) element.setAttribute('data-motion-visible', '');
      else reveal(element);
    });

    document.querySelectorAll(fadeSequenceSelector).forEach(function (sequence) {
      Array.from(sequence.children).forEach(function (element, index) {
        prepareTarget(element, index, false);
        if (isReduced()) element.setAttribute('data-motion-visible', '');
        else reveal(element);
      });
    });
  }

  function resetObserver() {
    if (observer) observer.disconnect();
    observer = null;
    if (batchTimer) clearTimeout(batchTimer);
    batchTimer = null;
    pending = [];
  }

  function init() {
    initFrame = null;
    resetObserver();
    if (isDisabled()) return;

    revealFadeSequences();
    var targets = collectViewportTargets();
    if (targets.length === 0) return;

    if (isReduced() || !('IntersectionObserver' in window)) {
      targets.forEach(function (element) { element.setAttribute('data-motion-visible', ''); });
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) queue(entry.target);
      });
    }, { rootMargin: '0px', threshold: 0.15 });

    targets.forEach(observeTarget);
    flushPending();
  }

  function scheduleInit() {
    if (initFrame !== null) return;
    initFrame = requestAnimationFrame(init);
  }

  document.addEventListener('astro:page-load', scheduleInit);
  document.addEventListener('astro:after-swap', scheduleInit);
  document.addEventListener('astro:before-swap', resetObserver);

  init();
})();
