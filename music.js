/*
 * Vaishak & Anagha Wedding Music Controller
 *
 * Behaviour:
 * - Cover page: no music
 * - Tap to Open: first song starts
 * - Invitation <-> Thalikettu: first song continues
 * - Reception: second song starts (from 0:40)
 * - Scrolling: music continues
 * - Music button: mute / unmute only
 *
 * One Audio element is maintained for the entire visit.
 * Internal pages are fetched and swapped without reloading.
 */

(() => {
  if (window.__weddingMusicController) return;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.loop = true;
  audio.volume = 0.55;

  const tracks = {
    invitation: 'music/thalikettu-invitation.mp3',
    thalikettu: 'music/thalikettu-invitation.mp3',
    reception: 'music/reception.mp3'
  };

  // Songs that should begin (and loop back to) a later point, in seconds.
  const startAt = {
    'music/reception.mp3': 40
  };

  const POS_KEY = 'weddingMusicPositions';

  let positions = {};

  try {
    positions = JSON.parse(sessionStorage.getItem(POS_KEY) || '{}') || {};
  } catch (_) {}

  let currentTrack = '';
  let unlocked = false;
  let muted = false;

  try {
    muted = localStorage.getItem('weddingMusicMuted') === 'yes';
  } catch (_) {}

  audio.muted = muted;

  // Music button
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'music-toggle';

  function updateButton() {
    button.innerHTML = muted ? '♪̸' : '♫';

    button.setAttribute(
      'aria-label',
      muted ? 'Unmute background music' : 'Mute background music'
    );

    button.title = muted ? 'Unmute music' : 'Mute music';
    button.classList.toggle('music-needs-tap', !unlocked);
  }

  // Save song positions
  function savePositions() {
    if (currentTrack) {
      positions[currentTrack] = audio.currentTime || 0;
    }

    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify(positions));
    } catch (_) {}
  }

  audio.addEventListener('timeupdate', savePositions);
  window.addEventListener('pagehide', savePositions);

  // Songs with a custom start point loop back to that point, not to 0:00.
  audio.addEventListener('ended', () => {
    const begin = startAt[currentTrack];
    if (begin) {
      audio.currentTime = begin;
      audio.play().catch(() => {});
    }
  });

  // Change song only when necessary
  function setTrack(src) {
    if (currentTrack === src) return;

    if (currentTrack) {
      positions[currentTrack] = audio.currentTime || 0;
    }

    currentTrack = src;

    const begin = startAt[src] || 0;

    // Native looping for normal songs; custom loop (see 'ended') for songs with a start point.
    audio.loop = !begin;

    // Resume saved position, but never earlier than the song's start point.
    const resumeAt = Math.max(positions[src] || 0, begin);

    if (resumeAt > 1) {
      audio.addEventListener(
        'loadedmetadata',
        () => {
          if (
            currentTrack === src &&
            Number.isFinite(audio.duration) &&
            resumeAt < audio.duration - 1
          ) {
            audio.currentTime = resumeAt;
          }
        },
        { once: true }
      );
    }

    audio.src = src;
  }

  // Play the correct song for the current page
  async function playFor(page) {

    // IMPORTANT: Cover page must remain silent
    if (page === 'cover') {
      audio.pause();
      return false;
    }

    setTrack(tracks[page] || tracks.invitation);

    if (!audio.paused) {
      unlocked = true;
      updateButton();
      return true;
    }

    try {
      await audio.play();

      unlocked = true;
      removeUnlockListeners();
      updateButton();

      return true;

    } catch (_) {
      updateButton();
      return false;
    }
  }

  function currentPage() {
    return document.body.dataset.musicPage || 'invitation';
  }

  // Show music button only after leaving cover
  function mountButton() {

    if (currentPage() === 'cover') {
      button.remove();
      return;
    }

    if (!button.isConnected) {
      document.body.appendChild(button);
    }

    updateButton();
  }

  // Music button only mutes and unmutes
  button.addEventListener('click', () => {

    muted = !muted;
    audio.muted = muted;

    try {
      localStorage.setItem(
        'weddingMusicMuted',
        muted ? 'yes' : 'no'
      );
    } catch (_) {}

    // Do not use the music button as the normal playback trigger.
    updateButton();
  });

  // Re-run invitation page scripts after navigation
  async function runInvitationScript() {

    try {
      const res = await fetch('script.js');

      if (!res.ok) return;

      new Function(await res.text())();

    } catch (_) {}
  }

  // Internal page navigation
  async function navigate(url, push = true) {

    const parsedUrl = new URL(url, location.href);

    const requestedPage =
      parsedUrl.pathname.split('/').pop().replace(/\.html$/i, '') ||
      'invitation';

    // Start or switch music inside the navigation click
    playFor(requestedPage);

    try {

      const response = await fetch(parsedUrl.href, {
        headers: {
          'X-Requested-With': 'WeddingNavigation'
        }
      });

      if (!response.ok) {
        throw new Error('Could not load page');
      }

      const html = await response.text();

      const next = new DOMParser().parseFromString(
        html,
        'text/html'
      );

      const nextPage =
        next.body.dataset.musicPage || 'invitation';

      document.title = next.title;

      document.body.className = next.body.className;
      document.body.dataset.musicPage = nextPage;
      document.body.innerHTML = next.body.innerHTML;

      mountButton();

      if (push) {
        history.pushState(
          { weddingPage: true },
          '',
          url
        );
      }

      // Continue or switch music based on destination
      await playFor(nextPage);

      if (nextPage === 'invitation') {
        runInvitationScript();
      }

      window.scrollTo(0, 0);

    } catch (err) {

      // Fallback for normal page navigation
      savePositions();
      location.href = parsedUrl.href;
    }
  }

  // Intercept internal HTML links
  document.addEventListener('click', event => {

    const link = event.target.closest('a[href]');

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (
      link.target === '_blank' ||
      link.hasAttribute('download')
    ) {
      return;
    }

    const url = new URL(link.href, location.href);

    if (
      url.origin !== location.origin ||
      !/\.html$/i.test(url.pathname)
    ) {
      return;
    }

    event.preventDefault();

    navigate(
      url.pathname + url.search + url.hash
    );
  });

  // Browser back / forward navigation
  window.addEventListener('popstate', () => {

    navigate(
      location.pathname + location.search + location.hash,
      false
    );
  });

  // First guest interaction unlocks playback if needed
  const unlockEvents = [
    'pointerup',
    'click',
    'touchend',
    'keydown'
  ];

  function unlockHandler(event) {

    if (unlocked) return;

    if (
      event.target &&
      event.target.closest &&
      event.target.closest('.music-toggle')
    ) {
      return;
    }

    playFor(currentPage());
  }

  function removeUnlockListeners() {

    unlockEvents.forEach(type => {
      document.removeEventListener(
        type,
        unlockHandler,
        true
      );
    });
  }

  unlockEvents.forEach(type => {

    document.addEventListener(
      type,
      unlockHandler,
      true
    );
  });

  // Expose controller
  window.__weddingMusicController = {
    audio,
    playFor
  };

  // Initial setup
  mountButton();

  // Never start music on the cover page
  if (currentPage() !== 'cover') {
    playFor(currentPage());
  }

})();
