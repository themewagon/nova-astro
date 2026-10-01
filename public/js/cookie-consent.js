// Cookie consent
(function() {
  var consent = document.getElementById('cookie-consent');
  var acceptBtn = document.getElementById('accept-cookies');
  var declineBtn = document.getElementById('decline-cookies');
  var storageKey = 'cookie-consent-status';
  var hideTimer;

  function getStatus() {
    try {
      return localStorage.getItem(storageKey);
    } catch (_error) {
      return null;
    }
  }

  function setStatus(status) {
    try {
      localStorage.setItem(storageKey, status);
    } catch (_error) {
      // No storage access should block the user's decision.
    }
  }

  function showConsent() {
    if (!consent) return;
    clearTimeout(hideTimer);
    consent.classList.remove('hidden', 'opacity-0', 'translate-y-4');
    consent.setAttribute('aria-hidden', 'false');
  }

  function hideConsent() {
    if (!consent) return;
    consent.classList.add('opacity-0', 'translate-y-4');
    consent.setAttribute('aria-hidden', 'true');
    hideTimer = setTimeout(function() {
      consent.classList.add('hidden');
    }, 500);
  }

  window.WebScaleCookies = window.WebScaleCookies || {};
  window.WebScaleCookies.openSettings = showConsent;

  if (consent && !getStatus()) {
    setTimeout(showConsent, 1000);
  }

  if (acceptBtn) acceptBtn.addEventListener('click', function() {
    setStatus('accepted');
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
    hideConsent();
  });

  if (declineBtn) declineBtn.addEventListener('click', function() {
    var wasAccepted = getStatus() === 'accepted';
    setStatus('declined');
    if (wasAccepted) {
      window.dispatchEvent(new CustomEvent('cookie-consent-revoked'));
    }
    hideConsent();
  });

})();
