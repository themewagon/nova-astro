(function() {
  // Guard: script is re-executed after every View Transitions navigation
  // (data-astro-rerun), so we guard against a double Lenis instance
  // and duplicated listeners.
  if (window.__lenisBooted) return;
  window.__lenisBooted = true;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var html = document.documentElement;
  if (html.getAttribute('data-lenis') !== 'true') return;

  // Library is loaded statically in Layout.astro BEFORE this script
  // (both with defer, so declaration order is preserved). If missing,
  // we silently give up on smooth scroll instead of appending the script
  // at runtime, which caused a noticeable jump on start.
  if (!window.Lenis) return;

  var currentLenis = null;
  var rafId = 0;
  var isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // With reduced motion scrolling stays native, because Lenis
  // intercepts wheel and touch even when anchor has zero duration.
  if (isReducedMotion) return;

  function getHeaderOffset() {
    var header = document.querySelector('[data-site-header]');
    return header ? Math.ceil(header.getBoundingClientRect().height) + 16 : 0;
  }

  function getSameDocumentHash(href) {
    if (!href || href === '#') return null;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (_error) {
      return null;
    }

    if (url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !url.hash) {
      return null;
    }

    return url.hash;
  }

  function getAnchorTarget(hash) {
    if (!hash || hash === '#') return null;
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  }

  function scrollToHash(hash, immediate) {
    var target = getAnchorTarget(hash);
    if (!target || !currentLenis) return false;

    currentLenis.scrollTo(target, {
      offset: -getHeaderOffset(),
      duration: immediate || isReducedMotion ? 0 : 1.2,
      immediate: immediate || isReducedMotion,
    });
    return true;
  }

  function stopAnimationLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function startAnimationLoop(instance) {
    function raf(time) {
      instance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
  }

  function createLenis() {
    var instance = new Lenis({
      // lerp 0.1 instead of 0.08: less "rubber" and smearing at 60 Hz,
      // because the value catches up to the target faster and scroll does not lag behind the wheel.
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      // 1.0 instead of 0.85: wheel deltas are not dampened, so motion does not
      // feel "sticky" and Lenis does not have to chase endlessly.
      wheelMultiplier: 1.0,
      touchMultiplier: 0.7,
      infinite: false,
      anchors: false,
      // Elements with data-lenis-prevent (textarea, floating buttons) have their own scroll,
      // Lenis should not intercept them. Lenis 1.3.25 also supports this attribute
      // natively, the prevent function is an extra safeguard for descendants.
      prevent: function(node) {
        var el = node;
        while (el && el !== document.body) {
          if (el.hasAttribute && el.hasAttribute('data-lenis-prevent')) return true;
          el = el.parentNode;
        }
        return false;
      },
    });
    startAnimationLoop(instance);
    return instance;
  }

  function destroyLenis() {
    stopAnimationLoop();
    if (currentLenis) currentLenis.destroy();
    currentLenis = null;
  }

  function scheduleAnchorScroll() {
    if (!window.location.hash) return;

    // Astro finishes DOM swap before the next layout frames. Only then
    // does the target have a stable position and Lenis can calculate the offset under the header.
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        scrollToHash(window.location.hash, true);
      });
    });
  }

  function resetAfterNavigation() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    currentLenis = createLenis();
    // New instance lives in closure, but we must synchronize the global
    // reference. Without this after navigation window.__lenis points to the old,
    // destroyed instance, so FloatingBar stops working.
    window.__lenis = currentLenis;

    scheduleAnchorScroll();
  }

  currentLenis = createLenis();
  window.__lenis = currentLenis;
  scheduleAnchorScroll();

  // Elements with data-lenis-prevent (textarea, floating buttons) have their own scroll.
  // We block wheel capture by Lenis when the cursor is over such an element.
  // Safer than options.prevent because it does not depend on Lenis version.
  document.addEventListener('wheel', function(event) {
    var el = event.target;
    while (el && el !== document.documentElement) {
      if (el.hasAttribute && el.hasAttribute('data-lenis-prevent')) {
        event.stopPropagation();
        return;
      }
      el = el.parentNode;
    }
  }, true);

  document.addEventListener('click', function(event) {
    var link = event.target.closest('a');
    if (!link) return;

    var hash = getSameDocumentHash(link.getAttribute('href'));
    if (!hash || !scrollToHash(hash, false)) return;

    history.pushState(null, '', link.href);
    event.preventDefault();
  });

  document.addEventListener('astro:before-swap', function() {
    // Stop the animation loop and destroy Lenis before Astro swaps the DOM,
    // so the old page does not scroll during the transition.
    // destroyLenis() is idempotent, and after-swap will create a new
    // instance anyway (resetAfterNavigation).
    stopAnimationLoop();
    destroyLenis();
  });

  document.addEventListener('astro:after-swap', function() {
    destroyLenis();
    resetAfterNavigation();
  });

  window.addEventListener('pageshow', function() {
    if (!currentLenis) resetAfterNavigation();
  });
})();
