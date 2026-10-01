(function() {
  function getContactForms() {
    return Array.prototype.slice.call(document.querySelectorAll('form')).filter(function(form) {
      return form.hasAttribute('data-contact-form') || form.hasAttribute('data-form');
    });
  }

  function ensureHoneypot(form) {
    if (form.querySelector('[name="website"]')) return;

    var wrapper = document.createElement('div');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.opacity = '0';
    wrapper.style.pointerEvents = 'none';

    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'website';
    input.tabIndex = -1;
    input.autocomplete = 'off';

    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }

  function getMessage(form, key, fallback) {
    return form.dataset['formMsg' + key] || fallback;
  }

  function showToast(form, state, message) {
    var titleFallback = {
      loading: 'Sending message',
      success: 'Message sent',
      error: 'Message could not be sent'
    }[state];
    var descriptionFallback = {
      loading: 'Please wait a moment.',
      success: 'Thank you for your message.',
      error: 'Please try again.'
    }[state];
    var title = getMessage(form, state.charAt(0).toUpperCase() + state.slice(1) + 'Title', titleFallback);
    var description = message || getMessage(form, state.charAt(0).toUpperCase() + state.slice(1), descriptionFallback);
    document.dispatchEvent(new CustomEvent('toast', {
      detail: {
        type: state === 'loading' ? 'info' : state,
        title: title,
        description: description,
        autohide: state !== 'loading',
        replace: true
      }
    }));
  }

  function initFormDebugControls() {
    var params = new URLSearchParams(window.location.search);
    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal || params.get('formDebug') !== '1' || document.getElementById('form-debug-controls')) return;

    var style = document.createElement('style');
    style.textContent = '\
      #form-debug-controls { position: fixed; left: 1rem; bottom: 4.5rem; z-index: 1999; display: flex; flex-wrap: wrap; gap: .375rem; max-width: calc(100vw - 2rem); padding: .5rem; border: 1px solid color-mix(in oklab, var(--color-brand-dark) 14%, transparent); border-radius: .75rem; background: color-mix(in oklab, var(--color-brand-light) 94%, transparent); box-shadow: 0 .75rem 2rem color-mix(in oklab, var(--color-brand-dark) 14%, transparent); }\
      #form-debug-controls button { min-height: 2rem; padding: .375rem .625rem; border: 1px solid color-mix(in oklab, var(--color-brand-dark) 14%, transparent); border-radius: .5rem; background: var(--color-brand-light); color: var(--color-brand-dark); font: 600 .6875rem/1 var(--font-body, inherit); cursor: pointer; }\
      #form-debug-controls button:hover, #form-debug-controls button:focus-visible { border-color: var(--color-brand-primary); outline: none; }\
      #form-debug-controls [data-debug-state="error"] { color: var(--color-error); }\
      @media (max-width: 639px) { #form-debug-controls { right: 1rem; } }\
    ';
    document.head.appendChild(style);

    var panel = document.createElement('div');
    panel.id = 'form-debug-controls';
    panel.setAttribute('aria-label', 'Form status debugging');
    panel.innerHTML = '<strong style="width:100%;font-size:.6875rem">Form debug</strong>'
      + '<button type="button" data-debug-state="loading">Loading</button>'
      + '<button type="button" data-debug-state="success">Success</button>'
      + '<button type="button" data-debug-state="error">Error</button>'
      + '<button type="button" data-debug-state="clear">Clear</button>';
    document.body.appendChild(panel);

    panel.querySelectorAll('[data-debug-state]').forEach(function(button) {
      button.addEventListener('click', function() {
        var state = button.getAttribute('data-debug-state');
        var form = document.querySelector('form[data-contact-form], form[data-form]');
        if (state === 'clear') {
          document.dispatchEvent(new CustomEvent('toast-clear'));
          return;
        }
        if (!form) return;
        var messages = {
          loading: 'This is a loading state preview.',
          success: 'This is a success message preview.',
          error: 'This is an error message preview.'
        };
        showToast(form, state, messages[state]);
      });
    });
  }

  function setLegacyStatus(form, state, message) {
    var status = form.querySelector('[data-contact-status]');
    if (!(status instanceof HTMLElement)) return;

    status.hidden = true;
    status.classList.add('hidden');
    status.textContent = message || '';
    status.dataset.formState = state || '';
    status.style.color = state === 'loading'
      ? 'color-mix(in oklab, var(--color-brand-dark) 60%, transparent)'
      : state === 'success'
        ? 'var(--color-success)'
        : state === 'error'
          ? 'var(--color-error)'
          : '';
  }

  function setFeedbackMessage(form, state, message) {
    if (!message) return;
    var description = form.querySelector('[data-form-feedback="' + state + '"] [data-form-feedback-description]');
    if (description) description.textContent = message;
  }

  function setFeedbackState(form, state, message) {
    ['loading', 'success', 'error', 'reset'].forEach(function(name) {
      var box = form.querySelector('[data-form-feedback="' + name + '"]');
      if (box) {
        box.hidden = true;
        box.classList.add('hidden');
      }
    });

    if (state) {
      var feedback = form.querySelector('[data-form-feedback="' + state + '"]');
      if (feedback) {
        feedback.hidden = false;
        feedback.classList.remove('hidden');
        var stateName = state === 'loading' ? 'LoadingStatus' : state.charAt(0).toUpperCase() + state.slice(1);
        setFeedbackMessage(form, state, message || getMessage(form, stateName, ''));
      }
    }

    setLegacyStatus(form, state, message || '');
    form.classList.toggle('is-submitted', state === 'success');
    var resetFeedback = form.querySelector('[data-form-feedback="reset"]');
    if (resetFeedback) {
      resetFeedback.hidden = state !== 'success';
      resetFeedback.classList.toggle('hidden', state !== 'success');
    }
  }

  function focusFeedback(form, state) {
    var feedback = form.querySelector('[data-form-feedback="' + state + '"]');
    if (!(feedback instanceof HTMLElement)) return;

    setTimeout(function() {
      feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof feedback.focus === 'function') feedback.focus({ preventScroll: true });
    }, 50);
  }

  function setCustomLoadingState(form, isLoading) {
    var text = form.querySelector('[data-form-submit-text]');
    var spinner = form.querySelector('[data-form-spinner]');
    if (!text && !spinner) return false;

    if (text) text.classList.toggle('invisible', isLoading);
    if (spinner) spinner.classList.toggle('hidden', !isLoading);
    return true;
  }

  function setLoadingState(button, isLoading, state, form) {
    if (!button) return;

    var customLoading = setCustomLoadingState(form, isLoading);
    var label = button.querySelector('[data-form-submit-text], .ui-button-text-default');
    var target = label || button;
    var originalLabel = form.dataset.formMsgOriginal || 'Send';
    var loadingLabel = form.dataset.formMsgLoading || 'Sending...';
    var successRetry = form.dataset.formMsgSuccessRetry || 'Send another';
    var errorRetry = form.dataset.formMsgErrorRetry || 'Try again';

    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = target.textContent || originalLabel;
    }

    button.disabled = isLoading;
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');

    if (isLoading) {
      if (!customLoading) target.textContent = loadingLabel;
      return;
    }

    if (state === 'success') {
      if (!customLoading) target.textContent = successRetry;
      return;
    }

    if (state === 'error') {
      if (!customLoading) target.textContent = errorRetry;
      return;
    }

    if (!customLoading) target.textContent = button.dataset.originalLabel;
  }

  function buildRequest(form, formData) {
    if (form.dataset.formTransport !== 'json') {
      return { body: formData, headers: { Accept: 'application/json' } };
    }

    var payload = {};
    formData.forEach(function(value, key) {
      payload[key] = value;
    });

    return {
      body: JSON.stringify(payload),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
    };
  }

  function bindForm(form) {
    if (form.dataset.formHandlerBound === 'true') return;

    form.dataset.formHandlerBound = 'true';
    ensureHoneypot(form);

    var submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    var resetButton = form.querySelector('[data-form-reset]');
    var endpoint = form.getAttribute('action') || form.dataset.endpoint || '/send-form.php';
    form.setAttribute('method', 'post');
    form.setAttribute('action', endpoint);

    if (resetButton) {
      resetButton.addEventListener('click', function() {
        setFeedbackState(form, null);
        setLoadingState(submitButton, false, null, form);
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    form.addEventListener('submit', function(event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var formData = new FormData(form);
      var request = buildRequest(form, formData);

      setFeedbackState(form, 'loading');
      setLoadingState(submitButton, true, null, form);

      fetch(endpoint, {
        method: 'POST',
        body: request.body,
        headers: request.headers
      })
        .then(function(response) {
          return response.json().catch(function() {
            return { status: 'error', invalidResponse: true };
          }).then(function(data) {
            return { data: data, responseOk: response.ok };
          });
        })
        .then(function(result) {
          var data = result.data;
          var successful = result.responseOk && data && (data.status === 'ok' || data.status === 'success' || data.success === true);
          if (!successful) {
            var failureMessage = data && data.invalidResponse
              ? getMessage(form, 'InvalidResponse', 'The server returned an invalid response.')
              : getMessage(form, 'Error', 'An error occurred. Please try again later.');
            setFeedbackState(form, 'error', failureMessage);
            setLoadingState(submitButton, false, 'error', form);
            focusFeedback(form, 'error');
            return;
          }

          form.reset();
          setFeedbackState(form, 'success');
          setLoadingState(submitButton, false, 'success', form);
          focusFeedback(form, 'success');
        })
        .catch(function(error) {
          var fallbackMessage = getMessage(form, 'Error', 'An error occurred. Please try again later.');
          var failureMessage = error instanceof TypeError
            ? getMessage(form, 'NetworkError', fallbackMessage)
            : fallbackMessage;
          setFeedbackState(form, 'error', failureMessage);
          setLoadingState(submitButton, false, 'error', form);
          focusFeedback(form, 'error');
        });
    });
  }

  function initForms() {
    getContactForms().forEach(bindForm);
    initFormDebugControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
})();
