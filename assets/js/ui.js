// ============================================================================
// NEXUS — ui.js
// Menangani interaksi antarmuka non-3D: loading screen, tombol,
// dan elemen dekoratif (label koordinat di navbar).
// ============================================================================

/**
 * Menyembunyikan loading screen setelah aplikasi siap.
 * @param {number} delay - jeda dalam ms sebelum loader disembunyikan
 */
export function hideLoader(delay = 400) {
  const loader = document.querySelector('.nexus-loader');
  if (!loader) return;

  window.setTimeout(() => {
    loader.classList.add('is-hidden');
  }, delay);
}

/**
 * Menghubungkan tombol "Explore Portfolio" ke aksi placeholder.
 * Saat ini hanya scroll halus (belum ada section tujuan — disiapkan
 * untuk prompt berikutnya ketika section baru ditambahkan).
 */
export function bindExploreButton() {
  const button = document.querySelector('[data-action="explore"]');
  if (!button) return;

  button.addEventListener('click', () => {
    console.info('[NEXUS] Explore Portfolio diklik — section berikutnya belum tersedia.');
    // Placeholder: nanti akan scroll ke section portfolio.
    // document.querySelector('#work')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/**
 * Memperbarui label koordinat dekoratif di navbar mengikuti posisi kursor.
 * Sekadar sentuhan premium yang menegaskan tema "3D / spatial".
 */
export function bindCoordinateLabel() {
  const coordsEl = document.querySelector('[data-coords]');
  if (!coordsEl) return;

  window.addEventListener('pointermove', (event) => {
    const x = Math.round((event.clientX / window.innerWidth) * 100);
    const y = Math.round((event.clientY / window.innerHeight) * 100);
    coordsEl.textContent = `X ${x.toString().padStart(2, '0')} · Y ${y.toString().padStart(2, '0')}`;
  });
}

/**
 * Inisialisasi seluruh binding UI. Dipanggil dari main.js.
 */
export function initUI() {
  bindExploreButton();
  bindCoordinateLabel();
}
