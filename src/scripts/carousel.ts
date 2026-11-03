/* Testimonial carousels: [data-carousel] containing [data-carousel-track] (one child per slide),
   [data-carousel-dots], [data-carousel-prev] and [data-carousel-next]. Auto-advances every
   data-carousel-interval ms (default 15000). */
document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((root) => {
  const track = root.querySelector<HTMLElement>('[data-carousel-track]')!;
  const dotsWrap = root.querySelector<HTMLElement>('[data-carousel-dots]')!;
  const slides = track.children;
  const interval = Number(root.getAttribute('data-carousel-interval')) || 15000;
  let current = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  function goTo(n: number) {
    current = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsWrap.querySelectorAll('.tc-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), interval);
  }

  Array.from(slides).forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `tc-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => {
      goTo(i);
      resetTimer();
    });
    dotsWrap.appendChild(dot);
  });

  root.querySelector('[data-carousel-prev]')!.addEventListener('click', () => {
    goTo(current - 1);
    resetTimer();
  });
  root.querySelector('[data-carousel-next]')!.addEventListener('click', () => {
    goTo(current + 1);
    resetTimer();
  });

  resetTimer();
});
