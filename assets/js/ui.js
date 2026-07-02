// ============================================================================
// NEXUS — ui.js
// Interaksi non-3D: loading screen, tombol premium (glow-follow + ripple),
// cursor glow, label koordinat navbar. Semua akses DOM lewat safeQuery().
// Semua listener pointermove: passive + throttle via rAF (hindari layout
// thrash / repaint berlebih → scroll & interaksi tetap instan).
// ============================================================================

function safeQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) console.warn(`[NEXUS] Elemen "${selector}" tidak ditemukan di DOM.`);
  return el;
}

/** Wrapper: hanya jalankan handler sekali per frame (rAF throttle). */
function rafThrottle(fn) {
  let scheduled = false;
  let lastEvent;
  return (event) => {
    lastEvent = event;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      fn(lastEvent);
      scheduled = false;
    });
  };
}

export function hideLoader(delay = 400) {
  const loader = safeQuery('.nexus-loader');
  if (!loader) return;
  window.setTimeout(() => loader.classList.add('is-hidden'), delay);
}

function bindButtonGlowFollow(button) {
  let rect = null;
  button.addEventListener('pointerenter', () => {
    rect = button.getBoundingClientRect();
  });
  const handler = rafThrottle((e) => {
    if (!rect) rect = button.getBoundingClientRect();
    button.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    button.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });
  button.addEventListener('pointermove', handler, { passive: true });
  button.addEventListener('pointerleave', () => { rect = null; });
}

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

/** Mengikat efek premium (glow-follow + ripple) ke SEMUA tombol .btn di halaman. */
export function bindButtons() {
  document.querySelectorAll('.btn').forEach((btn) => {
    bindButtonGlowFollow(btn);
    bindButtonRipple(btn);
  });

  const explore = document.querySelector('[data-action="explore"]');
  if (explore) {
    explore.addEventListener('click', () => window.dispatchEvent(new CustomEvent('nexus:explore')));
  }

  const downloadCv = document.querySelector('[data-action="download-cv"]');
  if (downloadCv) {
    downloadCv.addEventListener('click', () =>
      console.info('[NEXUS] Download CV — file belum tersedia pada tahap ini.')
    );
  }

  const viewProjects = document.querySelector('[data-action="view-projects"]');
  if (viewProjects) {
    viewProjects.addEventListener('click', () =>
      console.info('[NEXUS] View Projects — section Projects belum dibuat pada tahap ini.')
    );
  }
}

export function bindCoordinateLabel() {
  const coordsEl = safeQuery('[data-coords]');
  if (!coordsEl) return;

  const handler = rafThrottle((event) => {
    if (!coordsEl.isConnected) return;
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    coordsEl.textContent = `X ${x.toString().padStart(2, '0')} · Y ${y.toString().padStart(2, '0')}`;
  });
  window.addEventListener('pointermove', handler, { passive: true });
}

/** Titik cahaya lembut yang mengikuti kursor — translate3d agar full GPU-composited. */
export function bindCursorGlow() {
  const glow = safeQuery('.cursor-glow');
  if (!glow) return;

  const handler = rafThrottle((e) => {
    glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });
  window.addEventListener('pointermove', handler, { passive: true });
}

export function initUI() {
  [bindButtons, bindCoordinateLabel, bindCursorGlow].forEach((bind) => {
    try {
      bind();
    } catch (err) {
      console.error(`[NEXUS] Gagal menjalankan ${bind.name}:`, err);
    }
  });
}
