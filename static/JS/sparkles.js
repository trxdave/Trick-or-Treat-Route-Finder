// Halloween cursor sparkles (tiny stars & candies)
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const container = document.createElement('div');
  container.id = 'sparkles';
  document.body.appendChild(container);

  const colors = ['#ff9a1f', '#ffb347', '#ffffff', '#63ccca'];
  const MAX = 120;
  let lastT = 0;

  function spawn(x, y) {
    for (let i = 0; i < 3; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle ' + (Math.random() < .5 ? 'star' : 'candy');
      const size = 6 + Math.random() * 12;
      const col = colors[(Math.random() * colors.length) | 0];

      // random drift
      const dx = (Math.random() * 60 - 30) + 'px';
      const dy = (Math.random() * 80 - 10) + 'px';
      s.style.setProperty('--dx', dx);
      s.style.setProperty('--dy', dy);

      s.style.left = (x - size / 2) + 'px';
      s.style.top  = (y - size / 2) + 'px';
      s.style.width = s.style.height = size + 'px';
      s.style.color = col;
      s.style.animation = `s-fade ${600 + Math.random()*300}ms ease-out forwards`;

      container.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }

    // hard cap
    while (container.childElementCount > MAX) {
      container.firstElementChild.remove();
    }
  }

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastT < 16) return; // throttle ~60fps
    lastT = now;
    spawn(e.clientX, e.clientY);
  });

  // integrate with existing "Spooky" toggle (optional)
  const toggle = document.getElementById('spooky-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      container.style.display = (container.style.display === 'none') ? 'block' : 'none';
    });
  }
})();