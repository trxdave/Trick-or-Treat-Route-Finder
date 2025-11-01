// static/js/spooky.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('spooky-toggle');
  const layer = document.querySelector('.spooky-layer');
  if (!btn || !layer) return;

  // Restore last choice (default = calm ON for accessibility)
  const saved = localStorage.getItem('spooky') || 'calm';
  setMode(saved);

  btn.addEventListener('click', () => {
    const next = document.body.classList.contains('calm') ? 'spooky' : 'calm';
    setMode(next);
  });

  function setMode(mode) {
    if (mode === 'spooky') {
      document.body.classList.remove('calm');
      layer.hidden = false;
      btn.textContent = 'Calm 💤';
      btn.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.add('calm');
      // Hide layer completely in calm mode (no drift at all)
      layer.hidden = true;
      btn.textContent = 'Spooky 🎃';
      btn.setAttribute('aria-pressed', 'false');
    }
    localStorage.setItem('spooky', mode);
  }
});