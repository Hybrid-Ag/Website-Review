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

  var section = document.querySelector('.grower-stories');
  if (section && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        document.body.classList.toggle('has-grower-media-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.08 });
    observer.observe(section);
  }
})();
