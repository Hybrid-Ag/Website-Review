/* Hybrid Ag — Vision Journey first-visit modal.
   Pulled forward from old.hybridag.com.au (stakeholders liked the vision video on entry).
   Browsers block autoplay WITH sound, so we present the video and let one click deliver narration.
   Shows once per browser (localStorage), self-injects — only pages that load this script get it (index.html). */
(function () {
  var FLAG = 'hybridag_vision_seen';
  var VIDEO_ID = 'PDJZ6YSQ-cM'; // Journey & Mission — Bob Edit 2022 (same id as the home hero embed)

  function seen() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(FLAG, '1'); } catch (e) {} }

  function build() {
    var m = document.createElement('div');
    m.className = 'vision-modal';
    m.id = 'visionModal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-label', 'The Hybrid-Ag journey');
    m.innerHTML =
      '<div class="vision-card">' +
        '<div class="stripe" aria-hidden="true"><span></span><span></span><span></span></div>' +
        '<button class="vision-close" id="visionClose" aria-label="Close">&times;</button>' +
        '<div class="vision-body" id="visionBody">' +
          '<div class="vision-poster" id="visionPoster" role="button" tabindex="0" aria-label="Play the Hybrid-Ag journey">' +
            '<div class="play"></div>' +
            '<div class="vision-cap"><b>Watch our story</b><span>Optimising Inputs. Maximising Outcomes.</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    return m;
  }

  function open() {
    var modal = build();
    document.body.appendChild(modal);
    var lastFocus = document.activeElement;
    var closeBtn = modal.querySelector('#visionClose');
    var poster = modal.querySelector('#visionPoster');
    var body = modal.querySelector('#visionBody');

    function play() {
      // Swap poster for the autoplaying (with-sound) embed — this is a user gesture, so audio is allowed.
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + VIDEO_ID + '?rel=0&autoplay=1&modestbranding=1';
      f.title = 'The Hybrid-Ag journey';
      f.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      f.setAttribute('allowfullscreen', '');
      body.innerHTML = '';
      body.appendChild(f);
    }
    function close() {
      modal.classList.remove('show');
      modal.parentNode && modal.parentNode.removeChild(modal);
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' && document.activeElement === poster) play();
    }

    poster.addEventListener('click', play);
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', onKey);

    markSeen();            // first visit = seen; never reopens for this browser
    modal.classList.add('show');
    closeBtn.focus();
  }

  function init() { if (!seen()) open(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
