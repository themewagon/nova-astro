// Toast notifications
(function() {
  var toasts = [];

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function render() {
    var root = document.getElementById('toast-root');
    if (!root) return;
    root.innerHTML = toasts.map(function(t) {
      var icon = t.type === 'success' ? 'ph-check-circle'
        : t.type === 'error' ? 'ph-warning-circle'
        : 'ph-info';
      var spinner = t.loading ? ' animate-spin' : '';
      return '<div data-toast-id="' + t.id + '" data-toast-type="' + t.type + '" role="' + (t.type === 'error' ? 'alert' : 'status') + '" aria-live="' + (t.type === 'error' ? 'assertive' : 'polite') + '" >'
        + '<span data-toast-icon aria-hidden="true"><i class="ph ' + icon + spinner + '"></i></span>'
        + '<div data-toast-content><p data-toast-title>' + escapeHtml(t.title || t.message || '') + '</p>'
        + (t.description ? '<p data-toast-description>' + escapeHtml(t.description) + '</p>' : '') + '</div>'
        + (!t.loading ? '<button type="button" class="size-7 shrink-0" aria-label="Zamknij komunikat" data-toast-close="' + t.id + '"><i class="ph ph-x" aria-hidden="true"></i></button>' : '')
        + '</div>';
    }).join('');

    root.querySelectorAll('[data-toast-close]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = Number(btn.dataset.toastClose);
        remove(id);
      });
    });
  }

  function remove(id) {
    var el = document.querySelector('[data-toast-id="' + id + '"]');
    if (el) { el.classList.add('toast-removing'); }
    setTimeout(function() {
      toasts = toasts.filter(function(t) { return t.id !== id; });
      render();
    }, 200);
  }

  var toastIdCounter = 0;
  function addToast(type, message, autohide) {
    if (autohide === undefined) autohide = true;
    var id = ++toastIdCounter;
    toasts.push({ id: id, type: type, message: message });
    render();
    if (autohide) setTimeout(function() { remove(id); }, 5000);
  }

  document.addEventListener('toast', function(e) {
    var detail = e.detail || {};
    if (detail.replace) toasts = [];
    var id = ++toastIdCounter;
    toasts.push({ id: id, type: detail.type || 'info', message: detail.message, title: detail.title, description: detail.description, loading: detail.autohide === false });
    render();
    if (detail.autohide !== false) setTimeout(function() { remove(id); }, detail.type === 'error' ? 8000 : 5000);
  });
  document.addEventListener('toast-clear', function() { toasts = []; render(); });
})();
