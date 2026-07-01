// ============================================================================
// NEXUS — animation.js
// Konfigurasi dasar GSAP. Belum berisi animasi besar/scroll-trigger —
// hanya menyiapkan default & satu timeline intro ringan untuk hero.
// ============================================================================

import gsap from 'gsap';

/**
 * Mengatur konfigurasi default GSAP agar konsisten di seluruh project.
 * Dipanggil sekali saat aplikasi start (lihat main.js).
 */
export function configureGsapDefaults() {
  gsap.defaults({
    ease: 'power3.out',
    duration: 0.8,
  });
}

/**
 * Timeline intro sederhana: memunculkan panel hero secara halus.
 * Elemen-elemen diberi kelas via HTML (lihat index.html: .hero__eyebrow, dst).
 * @returns {gsap.core.Timeline}
 */
export function playIntroTimeline() {
  const tl = gsap.timeline();

  tl.from('.hero__panel', {
    opacity: 0,
    y: 24,
    duration: 1,
    ease: 'power4.out',
  })
    .from(
      '.hero__eyebrow, .hero__title, .hero__subtitle, .hero__axis, .btn',
      {
        opacity: 0,
        y: 16,
        stagger: 0.12,
        duration: 0.8,
      },
      '-=0.6'
    );

  return tl;
}

// Catatan pengembangan (Prompt berikutnya):
// - Daftarkan ScrollTrigger di sini ketika section tambahan (About, Work, dsb) dibuat.
// - Hubungkan animasi kamera/scene Three.js dengan timeline GSAP bila diperlukan.
