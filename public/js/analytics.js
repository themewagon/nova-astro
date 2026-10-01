// Analytics loaded only after cookie consent (GDPR).
// Configuration read from window.__ANALYTICS__ (set inline in Layout.astro).
// External scripts (GA4, GTM, FB Pixel, Clarity) injected dynamically,
// so nothing is loaded before explicit user consent.
(function() {
  // Guard: script is re-executed after every View Transitions navigation
  // (data-astro-rerun), so we inject scripts only once.
  if (window.__analyticsBooted) return;
  window.__analyticsBooted = true;

  var config = window.__ANALYTICS__ || {};
  var trackersLoaded = false;
  var analyticsRevoked = false;
  var initialPageLoadObserved = false;

  // Resilience: config may come as an object or as a JSON string
  // (depending on how it is embedded in the template), we parse both cases.
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch (_error) {
      config = {};
    }
  }

  function injectScript(src) {
    var script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function initGoogleAnalytics(id) {
    // GA4 via gtag.js: standard snippet with dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    injectScript('https://www.googletagmanager.com/gtag/js?id=' + id);
  }

  function initGoogleTagManager(id) {
    // GTM: classic snippet injected dynamically, without document.write
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0];
      var j = d.createElement(s);
      var dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', id);
  }

  function initFacebookPixel(id) {
    // FB Pixel: official snippet, protected against double initialization
    !function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function initClarity(id) {
    // Microsoft Clarity: official snippet from www.clarity.ms
    (function(c, l, a, r, i, t, y) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
  }

  function loadAnalytics() {
    if (trackersLoaded || analyticsRevoked || localStorage.getItem('cookie-consent-status') !== 'accepted') return;
    if (config.googleTagManagerId) {
      initGoogleTagManager(config.googleTagManagerId);
    } else if (config.googleAnalyticsId) {
      initGoogleAnalytics(config.googleAnalyticsId);
    }
    if (config.facebookPixelId) initFacebookPixel(config.facebookPixelId);
    if (config.clarityId) initClarity(config.clarityId);
    trackersLoaded = true;
    if (config.googleTagManagerId) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'page_view',
        page_path: window.location.pathname + window.location.search
      });
    }
  }

  function sendPageView() {
    if (!trackersLoaded || analyticsRevoked || localStorage.getItem('cookie-consent-status') !== 'accepted') return;
    var pagePath = window.location.pathname + window.location.search;
    if (config.googleTagManagerId && window.dataLayer) {
      window.dataLayer.push({ event: 'page_view', page_path: pagePath });
    } else if (config.googleAnalyticsId && window.gtag) {
      window.gtag('event', 'page_view', { page_path: pagePath });
    }
    if (window.fbq) window.fbq('track', 'PageView');
  }

  function sendEvent(name, params) {
    if (!trackersLoaded || analyticsRevoked || localStorage.getItem('cookie-consent-status') !== 'accepted') return;
    if (config.googleTagManagerId && window.dataLayer) {
      window.dataLayer.push({ event: name, ...params });
    } else if (config.googleAnalyticsId && window.gtag) {
      window.gtag('event', name, params);
    }
    if (window.clarity) window.clarity('event', name);
  }

  // Delegacja utrzymuje tracking także po przejściu Astro View Transitions.
  document.addEventListener('click', function(event) {
    var target = event.target instanceof Element ? event.target.closest('[data-analytics-event]') : null;
    if (!target) return;
    var href = target.getAttribute('href');
    var name = target.getAttribute('data-analytics-event');
    if (!href || !name) return;
    sendEvent(name, {
      link_url: href,
      link_location: target.getAttribute('data-analytics-location') || 'unknown',
      page_path: window.location.pathname + window.location.search
    });
  });

  window.addEventListener('astro:page-load', function() {
    if (!initialPageLoadObserved) {
      initialPageLoadObserved = true;
      return;
    }
    sendPageView();
  });

  window.addEventListener('cookie-consent-revoked', function() {
    analyticsRevoked = true;
  });

  // If consent was already granted earlier (localStorage), load immediately;
  // otherwise wait for the event from cookie-consent.js.
  if (localStorage.getItem('cookie-consent-status') === 'accepted') {
    loadAnalytics();
  } else {
    window.addEventListener('cookie-consent-accepted', loadAnalytics);
  }
})();
