// ============================================================================
// NEXUS — animation.js
// GSAP core + ScrollTrigger + Lenis smooth scroll + micro-interactions.
// ============================================================================

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

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

/** Smooth scroll "berat tapi halus" — Lenis disinkronkan ke gsap.ticker (bukan rAF baru). */
export function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    autoRaf: false, // WAJIB false — di-drive manual lewat gsap.ticker di bawah,
                     // dua rAF loop scroll berjalan bersamaan = penyebab patah-patah.
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/** Progress 0→1 dari mulai masuk viewport #about — dipakai untuk transisi cinematic Hero→About. */
export function initSectionTransition(onProgress) {
  const about = document.querySelector('#about');
  if (!about) return null;

  return ScrollTrigger.create({
    trigger: about,
    start: 'top bottom',
    end: 'top top',
    scrub: 1.2,
    onUpdate: (self) => onProgress(self.progress),
  });
}

/** Reveal bertahap section About: opacity + translate + blur, stagger. */
export function initAboutReveal() {
  const about = document.querySelector('#about');
  if (!about) return;

  const leftEls = about.querySelectorAll(
    '.about__eyebrow, .about__title, .about__role, .about__desc, .about__buttons .btn'
  );
  const statEls = about.querySelectorAll('.stat-card');

  gsap
    .timeline({ scrollTrigger: { trigger: about, start: 'top 70%', once: true } })
    .from(leftEls, { opacity: 0, y: 32, filter: 'blur(10px)', duration: 1, stagger: 0.12, ease: 'power3.out' })
    .from('.about__card', { opacity: 0, y: 40, filter: 'blur(14px)', duration: 1.2, ease: 'power3.out' }, '-=0.7')
    .from(statEls, { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.6');
}

/**
 * Parallax lembut pada kartu hero mengikuti posisi mouse (seluruh viewport).
 */
export function initCardParallax() {
  const panel = document.querySelector('.hero__panel');
  if (!panel) return;

  const toRotX = gsap.quickTo(panel, 'rotationX', { duration: 0.6, ease: 'power3' });
  const toRotY = gsap.quickTo(panel, 'rotationY', { duration: 0.6, ease: 'power3' });
  gsap.set(panel, { transformPerspective: 900, transformOrigin: 'center' });

  window.addEventListener(
    'pointermove',
    (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      toRotX(ny * -2.6); // maksimal ~3° — halus, tidak berlebihan
      toRotY(nx * 3);
    },
    { passive: true }
  );

  window.addEventListener('pointerleave', () => {
    toRotX(0);
    toRotY(0);
  });
}

/**
 * Tilt card lokal (hover-bound) untuk kartu interaktif About — bereaksi
 * hanya saat kursor berada di atas kartu itu sendiri.
 * @param {string} selector
 */
export function initTiltCard(selector) {
  const card = document.querySelector(selector);
  if (!card) return;

  const toRotX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
  const toRotY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
  const toY = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3' });
  gsap.set(card, { transformPerspective: 800, transformOrigin: 'center' });

  let rect = null;

  card.addEventListener('pointerenter', () => {
    rect = card.getBoundingClientRect();
    toY(-6);
  });

  card.addEventListener(
    'pointermove',
    (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      toRotX(ny * -3);
      toRotY(nx * 3);
    },
    { passive: true }
  );

  card.addEventListener('pointerleave', () => {
    rect = null;
    toRotX(0);
    toRotY(0);
    toY(0);
  });
}

/**
 * Fly-bump kamera kecil saat tombol Explore diklik.
 * @param {THREE.PerspectiveCamera} camera
 * @param {{impulseZ:number}} rigState
 */
export function cameraFlyBump(camera, rigState) {
  gsap
    .timeline()
    .to(rigState, { impulseZ: -0.5, duration: 0.22, ease: 'power2.out', overwrite: true })
    .to(rigState, { impulseZ: 0, duration: 0.45, ease: 'power3.inOut' })
    .to(
      camera,
      { fov: camera.fov - 3, duration: 0.22, ease: 'power2.out', onUpdate: () => camera.updateProjectionMatrix() },
      0
    )
    .to(
      camera,
      { fov: camera.fov, duration: 0.45, ease: 'power3.inOut', onUpdate: () => camera.updateProjectionMatrix() },
      0.22
    );
}
