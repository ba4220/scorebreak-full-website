/* Homepage hero demo video: plays at 0.75x, fades near the end, then shows the end card with a replay button. */
const heroVideo = document.getElementById('heroVideo') as HTMLVideoElement | null;
const heroFadeOverlay = document.getElementById('heroFadeOverlay');
const heroEndcard = document.getElementById('heroEndcard');
const heroReplayBtn = document.getElementById('heroReplayBtn');
if (heroVideo) {
  heroVideo.playbackRate = 0.75;
  heroVideo.addEventListener('loadedmetadata', () => {
    heroVideo.playbackRate = 0.75;
  });
}
if (heroVideo && heroFadeOverlay && heroEndcard && heroReplayBtn) {
  heroVideo.addEventListener('timeupdate', () => {
    if (heroVideo.currentTime >= 22.43) {
      heroFadeOverlay.classList.add('fading');
    }
  });
  heroVideo.addEventListener('ended', () => {
    heroEndcard.classList.add('visible');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroEndcard.classList.add('fade-in');
      });
    });
  });
  heroReplayBtn.addEventListener('click', () => {
    heroEndcard.classList.remove('fade-in');
    heroFadeOverlay.classList.remove('fading');
    setTimeout(() => {
      heroEndcard.classList.remove('visible');
      heroVideo.currentTime = 0;
      heroVideo.play();
    }, 600);
  });
}
