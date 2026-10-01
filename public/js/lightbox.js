// Image Lightbox
(function() {
  function init() {
    var dialog = document.getElementById('ui-lightbox');
    var img = document.getElementById('ui-lightbox-img');
    var placeholder = document.getElementById('ui-lightbox-placeholder');
    var placeholderLabel = document.getElementById('ui-lightbox-placeholder-label');
    var loader = document.getElementById('ui-lightbox-loader');
    var caption = document.getElementById('ui-lightbox-caption');
    var closeBtn = document.getElementById('ui-lightbox-close');
    var prevBtn = document.getElementById('ui-lightbox-prev');
    var nextBtn = document.getElementById('ui-lightbox-next');
    if (!dialog || !img || !closeBtn || !prevBtn || !nextBtn) return;
    if (dialog.dataset.lightboxReady === 'true') return;

    dialog.dataset.lightboxReady = 'true';
    var gallery = [];
    var currentIndex = 0;

    function showPlaceholder(label) {
      img.classList.add('hidden');
      if (loader) loader.classList.add('hidden');
      if (placeholderLabel) placeholderLabel.textContent = label || 'Brak podglądu obrazu';
      if (placeholder) placeholder.classList.remove('hidden');
    }

    function showImageLoading() {
      img.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
      if (loader) loader.classList.remove('hidden');
    }

    img.addEventListener('load', function() {
      img.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
      if (loader) loader.classList.add('hidden');
    });

    img.addEventListener('error', function() {
      var item = gallery[currentIndex];
      showPlaceholder((item && (item.alt || item.title)) || 'Brak podglądu obrazu');
    });

    function readGallery(el, src, alt) {
      gallery = [];
      if (!src) {
        gallery = [{ src: '', title: alt, alt: alt }];
        currentIndex = 0;
        return;
      }
      var group = el.closest('[data-lightbox-group]');
      if (group) {
        var triggers = Array.from(group.querySelectorAll('[data-lightbox]')).filter(function(trigger) {
          return !trigger.closest('[hidden], [aria-hidden="true"]');
        });
        gallery = triggers.map(function(trigger) {
          var triggerSrc = trigger.getAttribute('data-href');
          if (!triggerSrc) triggerSrc = (trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img'))?.getAttribute('src') || '';
          var triggerAlt = trigger.getAttribute('data-title') || trigger.querySelector('img')?.getAttribute('alt') || '';
          return { src: triggerSrc, title: triggerAlt, alt: triggerAlt };
        }).filter(function(item) { return item.src; });
      }
      try {
        if (gallery.length === 0) {
          gallery = JSON.parse(el.getAttribute('data-lightbox-gallery') || '[]');
        }
      } catch {
        gallery = [];
      }

      if (!Array.isArray(gallery) || gallery.length === 0) {
        gallery = [{ src: src, title: alt, alt: alt }];
      }

      var foundIndex = gallery.findIndex(function(item) {
        return item && item.src === src;
      });
      currentIndex = foundIndex >= 0 ? foundIndex : 0;
    }

    function renderImage() {
      var item = gallery[currentIndex];
      if (!item || !item.src) {
        showPlaceholder((item && (item.alt || item.title)) || 'Brak podglądu obrazu');
        return;
      }

      var label = item.alt || item.title || '';
      showImageLoading();
      img.src = item.src;
      img.alt = label;
      if (caption) caption.textContent = label;

      var hasNavigation = gallery.length > 1;
      prevBtn.disabled = !hasNavigation || currentIndex <= 0;
      nextBtn.disabled = !hasNavigation || currentIndex >= gallery.length - 1;
      prevBtn.classList.toggle('hidden', !hasNavigation);
      nextBtn.classList.toggle('hidden', !hasNavigation);
      prevBtn.classList.toggle('flex', hasNavigation);
      nextBtn.classList.toggle('flex', hasNavigation);
    }

    function moveImage(direction) {
      var nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= gallery.length) return;
      currentIndex = nextIndex;
      renderImage();
    }

    function handleTrigger(event) {
      var target = event.target;
      var el = target && target.closest ? target.closest('[data-lightbox]') : null;
      if (!el || !document.documentElement.contains(el)) return;

      event.preventDefault();
      var src = el.getAttribute('data-href');
      if (!src) src = (el.tagName === 'IMG' ? el : el.querySelector('img'))?.getAttribute('src') || '';
      var alt = el.getAttribute('data-title') || el.querySelector('img')?.getAttribute('alt') || '';

      readGallery(el, src, alt);
      img.removeAttribute('src');
      img.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() {
        dialog.classList.remove('opacity-0');
        dialog.classList.add('opacity-100');
        img.classList.remove('scale-95');
        img.classList.add('scale-100');
      });
      renderImage();
    }

    function closeLightbox() {
      dialog.classList.remove('opacity-100');
      dialog.classList.add('opacity-0');
      img.classList.remove('scale-100');
      img.classList.add('scale-95');
      setTimeout(function() {
        if (dialog.open) dialog.close();
        document.body.style.overflow = '';
        img.removeAttribute('src');
        if (placeholder) placeholder.classList.add('hidden');
        if (loader) loader.classList.add('hidden');
      }, 300);
    }

    document.addEventListener('click', handleTrigger);
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function(event) {
      event.stopPropagation();
      moveImage(-1);
    });
    nextBtn.addEventListener('click', function(event) {
      event.stopPropagation();
      moveImage(1);
    });
    dialog.addEventListener('click', function(event) {
      if (event.target === dialog) closeLightbox();
    });
    document.addEventListener('keydown', function(event) {
      if (!dialog.open) return;
      if (event.key === 'Escape') { event.preventDefault(); closeLightbox(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveImage(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveImage(1); }
    });
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
