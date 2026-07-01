// ============================================================================
// NEXUS — ui.js
// Interaksi non-3D: loading screen, tombol premium (glow-follow + ripple),
// label koordinat navbar. Semua akses DOM lewat safeQuery() (null-safe).
// ============================================================================

function safeQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) console.warn(`[NEXUS] Elemen "${selector}" tidak ditemukan di DOM.`);
  return el;
}

export function hideLoader(delay = 400) {
  const loader = safeQuery('.nexus-loader');
  if (!loader) return;
  window.setTimeout(() => loader.classList.add('is-hidden'), delay);
}

/** Glow tombol mengikuti posisi kursor (CSS var --mx/--my dikonsumsi di animation.css). */
function bindButtonGlowFollow(button) {
  button.addEventListener('pointermove', (e) => {
    const rect = button.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    button.style.setProperty('--mx', `${mx}%`);
    button.style.setProperty('--my', `${my}%`);
  });
}

/** Ripple effect saat klik — elemen span dibuang otomatis setelah animasi selesai. */
function bindButtonRipple(button) {
  button.addEventListener('click', (e) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn__ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/** Tombol Explore: efek premium + broadcast event untuk fly-bump kamera (ditangani main.js). */
export function bindExploreButton() {
  const button = safeQuery('[data-action="explore"]');
  if (!button) return;

  bindButtonGlowFollow(button);
  bindButtonRipple(button);

  button.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('nexus:explore'));
    // Section tujuan belum ada pada tahap ini (fokus hero-only).
  });
}

export function bindCoordinateLabel() {
  const coordsEl = safeQuery('[data-coords]');
  if (!coordsEl) return;

  window.addEventListener('pointermove', (event) => {
    if (!coordsEl.isConnected) return;
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    coordsEl.textContent = `X ${x.toString().padStart(2, '0')} · Y ${y.toString().padStart(2, '0')}`;
  });
}

export function initUI() {
  [bindExploreButton, bindCoordinateLabel].forEach((bind) => {
    try {
      bind();
    } catch (err) {
      console.error(`[NEXUS] Gagal menjalankan ${bind.name}:`, err);
    }
  });
}
