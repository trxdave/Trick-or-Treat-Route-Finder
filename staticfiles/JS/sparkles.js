// static/js/sparkles.js
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
      s.className = 'sparkle ' + (Math.random() < 0.5 ? 'star' : 'candy');
      const size = 6 + Math.random() * 12;
      const col = colors[(Math.random() * colors.length) | 0];

      const dx = (Math.random() * 60 - 30) + 'px';
      const dy = (Math.random() * 80 - 10) + 'px';
      s.style.setProperty('--dx', dx);
      s.style.setProperty('--dy', dy);

      s.style.left = (x - size / 2) + 'px';
      s.style.top = (y - size / 2) + 'px';
      s.style.width = s.style.height = size + 'px';
      s.style.color = col;
      s.style.animation = `s-fade ${600 + Math.random() * 300}ms ease-out forwards`;

      container.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }

    // keep under limit
    while (container.childElementCount > MAX) {
      container.firstElementChild.remove();
    }
  }

  window.addEventListener('pointermove', (e) => {
    // only spawn when spooky mode active
    if (document.body.classList.contains('calm')) return;

    const now = performance.now();
    if (now - lastT < 16) return;
    lastT = now;
    spawn(e.clientX, e.clientY);
  });

  // integrate with Spooky toggle
  const toggle = document.getElementById('spooky-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const hidden = container.style.display === 'none';
      container.style.display = hidden ? 'block' : 'none';
    });
  }
})();