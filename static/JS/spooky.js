// spooky.js — handles the "Spooky Mode" toggle

document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('spooky-toggle');
  const spookyLayer = document.querySelector('.spooky-layer');

  if (toggleBtn && spookyLayer) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = spookyLayer.style.display === 'none';
      spookyLayer.style.display = isHidden ? 'block' : 'none';
      toggleBtn.innerText = isHidden ? 'Spooky 🎃' : 'Calm 😌';
    });
  }
});