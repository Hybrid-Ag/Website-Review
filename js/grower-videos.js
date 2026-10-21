(function () {
  'use strict';

  var videos = Array.prototype.slice.call(document.querySelectorAll('[data-grower-video]'));
  if (!videos.length) return;

  videos.forEach(function (video) {
    video.addEventListener('play', function () {
      videos.forEach(function (otherVideo) {
        if (otherVideo !== video && !otherVideo.paused) otherVideo.pause();
      });
    });
  });

  // Manual navigation only: a story never changes while somebody is watching.
  var carousel = document.querySelector('[data-grower-carousel]');
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-grower-slide]'));
    var section = carousel.closest('section');
    var controls = section.querySelector('[data-grower-controls]');
    var count = section.querySelector('[data-grower-count]');
    var status = section.querySelector('[data-grower-status]');
    var active = 0;
    if (slides.length > 1 && controls && count && status) {
      section.setAttribute('aria-roledescription', 'carousel');
      slides.forEach(function (slide, index) {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', (index + 1) + ' of ' + slides.length + ': ' + slide.dataset.growerName);
        slide.hidden = index !== active;
      });
      function show(step) {
        slides[active].querySelector('video').pause();
        slides[active].hidden = true;
        active = (active + step + slides.length) % slides.length;
        carousel.style.setProperty('--grower-enter-x', step > 0 ? '18px' : '-18px');
        slides[active].hidden = false;
        count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        status.textContent = slides[active].dataset.growerName + '. Story ' + (active + 1) + ' of ' + slides.length + '.';
      }
      controls.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-grower-step]');
        if (button && controls.contains(button)) show(Number(button.dataset.growerStep));
      });
      carousel.classList.add('is-carousel-ready');
      controls.hidden = false;
    }
  }

  var section = document.querySelector('.grower-stories,.feedback-grower');
  if (section && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        document.body.classList.toggle('has-grower-media-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.08 });
    observer.observe(section);
  }
})();
