// static/js/spooky.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('spooky-toggle');
  const layer = document.querySelector('.spooky-layer');
  if (!btn || !layer) return;

  // default to Spooky ON so you see it immediately
  const saved = localStorage.getItem('spookyMode') || 'spooky';
  setMode(saved);

  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('calm') ? 'spooky' : 'calm';
    setMode(next);
  });

  function setMode(mode) {
    if (mode === 'spooky') {
      document.body.classList.remove('calm');
      layer.removeAttribute('hidden');
      layer.style.opacity = '1';
      layer.style.pointerEvents = 'none';
      btn.textContent = 'Calm 💤';
      btn.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.add('calm');
      layer.style.opacity = '0';
      layer.style.pointerEvents = 'none';
      btn.textContent = 'Spooky 🎃';
      btn.setAttribute('aria-pressed', 'false');
    }
    localStorage.setItem('spookyMode', mode);
  }
});