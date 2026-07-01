// ============================================================================
// NEXUS — animation.js
// Konfigurasi GSAP + intro timeline + micro-interactions bertenaga GSAP
// (card parallax, camera fly-bump saat klik Explore).
// ============================================================================

import gsap from 'gsap';

export function configureGsapDefaults() {
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });
}

export function playIntroTimeline() {
  const tl = gsap.timeline();
  tl.from('.hero__panel', { opacity: 0, y: 24, duration: 1, ease: 'power4.out' }).from(
    '.hero__eyebrow, .hero__title, .hero__subtitle, .hero__axis, .btn',
    { opacity: 0, y: 16, stagger: 0.12, duration: 0.8 },
    '-=0.6'
  );
  return tl;
}

/**
 * Parallax lembut pada kartu hero mengikuti posisi mouse (rotateX/rotateY).
 * Pakai gsap.quickTo agar sangat murah dipanggil tiap pointermove (tween di-reuse).
 */
export function initCardParallax() {
  const panel = document.querySelector('.hero__panel');
  if (!panel) return;

  const toRotX = gsap.quickTo(panel, 'rotationX', { duration: 0.6, ease: 'power3' });
  const toRotY = gsap.quickTo(panel, 'rotationY', { duration: 0.6, ease: 'power3' });

  gsap.set(panel, { transformPerspective: 900, transformOrigin: 'center' });

  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    toRotX(ny * -4); // derajat, sangat kecil agar tetap premium bukan norak
    toRotY(nx * 5);
  });

  window.addEventListener('pointerleave', () => {
    toRotX(0);
    toRotY(0);
  });
}

/**
 * Fly-bump kamera kecil saat tombol Explore diklik — bukan pindah section,
 * hanya sentuhan cinematic push-in lalu kembali.
 * @param {THREE.PerspectiveCamera} camera
 * @param {{impulseZ:number}} rigState - state dari createCameraRig (controls.js)
 */
export function cameraFlyBump(camera, rigState) {
  gsap.timeline()
    .to(rigState, { impulseZ: -0.7, duration: 0.35, ease: 'power2.out' })
    .to(rigState, { impulseZ: 0, duration: 0.6, ease: 'power3.inOut' })
    .to(camera, {
      fov: camera.fov - 4,
      duration: 0.35,
      ease: 'power2.out',
      onUpdate: () => camera.updateProjectionMatrix(),
    }, 0)
    .to(camera, {
      fov: camera.fov,
      duration: 0.6,
      ease: 'power3.inOut',
      onUpdate: () => camera.updateProjectionMatrix(),
    }, 0.35);
}
