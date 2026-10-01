// Global accordion pattern [data-accordion]: exclusive group behavior.
// After opening one question the remaining open questions in the same group
// are closed. Expand animation itself is handled by CSS (accordion.css).
// Script loaded via defer, no exports.
(function () {
  // Each [data-accordion] element is an independent accordion group
  document.querySelectorAll("[data-accordion]").forEach(function (group) {
    const items = [...group.querySelectorAll("details")];

    items.forEach(function (detail) {
      // "toggle" event fires on every open state change
      detail.addEventListener("toggle", function () {
        // Act only on opening, closing does not close anything else
        if (!detail.open) return;

        // Close all remaining questions in the group,
        // so only the clicked one stays open
        items.forEach(function (other) {
          if (other !== detail && other.open) other.removeAttribute("open");
        });
      });
    });
  });
})();
