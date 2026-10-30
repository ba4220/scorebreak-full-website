/* Testimonial carousels: [data-carousel] containing [data-carousel-track] (one child per slide),
   [data-carousel-dots], [data-carousel-prev] and [data-carousel-next]. Auto-advances every
   data-carousel-interval ms (default 15000). */
document.querySelectorAll('[data-carousel]').forEach(function(root) {
  var track = root.querySelector('[data-carousel-track]');
  var dotsWrap = root.querySelector('[data-carousel-dots]');
  var slides = track.children;
  var interval = Number(root.getAttribute('data-carousel-interval')) || 15000;
  var current = 0;
  var timer;

  Array.prototype.forEach.call(slides, function(_, i) {
    var dot = document.createElement('button');
    dot.className = 'tc-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.addEventListener('click', function() { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });

  function goTo(n) {
    current = (n + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dotsWrap.querySelectorAll('.tc-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(function() { goTo(current + 1); }, interval);
  }

  root.querySelector('[data-carousel-prev]').addEventListener('click', function() { goTo(current - 1); resetTimer(); });
  root.querySelector('[data-carousel-next]').addEventListener('click', function() { goTo(current + 1); resetTimer(); });

  resetTimer();
});
