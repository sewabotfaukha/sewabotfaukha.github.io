// ============================================================================
// NEXUS — animation.js
// GSAP core + ScrollTrigger + Lenis smooth scroll + micro-interactions.
// ============================================================================

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;

export function configureGsapDefaults() {
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });
}

export function playIntroTimeline(onComplete) {
  const tl = gsap.timeline({
    onComplete: () => {
      // FIX (5.6.3) — ROOT CAUSE dari bug "NEXUS hilang & tidak balik lagi
      // saat scroll ke atas": initHeroScrollTransition() sebelumnya dipanggil
      // hampir BERSAMAAN dengan intro timeline ini (keduanya jalan di
      // safeInitNonThreeParts() secara berurutan tanpa jeda). Karena GSAP
      // punya default overwrite behavior per-properti, tween scroll (dibuat
      // belakangan) langsung MENGAMBIL ALIH kontrol opacity/y dari tween intro
      // yang MASIH BERJALAN — dan menangkap nilai "start" dari kondisi
      // setengah-jalan itu (misal opacity ~0.3), bukan dari kondisi akhir
      // intro (opacity 1). Karena scroll-scrub itu murni berbasis posisi
      // scroll, begitu ia "menang", posisi awal yang salah itu ikut terbawa
      // selamanya — walau discroll balik ke progress 0, hasilnya tetap nilai
      // yang salah tadi, bukan opacity 1 yang benar. Efeknya persis seperti
      // yang dilaporkan: NEXUS hilang setelah scroll sedikit lalu tidak
      // pernah kembali walau sudah discroll ke atas lagi.
      //
      // Perbaikan: tween scroll-fade (initHeroScrollTransition) HANYA dibuat
      // setelah intro ini benar-benar selesai (onComplete), jadi ia menangkap
      // kondisi akhir yang benar (opacity 1, scale 1, y 0) sebagai titik awal.
      if (typeof onComplete === 'function') onComplete();
    },
  });
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
    syncTouch: true, // FIX (5.6): tanpa ini, scroll di layar sentuh (HP/tablet) TIDAK
                      // di-smoothing oleh Lenis sama sekali — hanya scroll native browser
                      // yang bentrok dengan ScrollTrigger.scrub, itulah sumber "scroll patah"
                      // yang paling terasa di HP.
    syncTouchLerp: 0.075, // sedikit lebih responsif dari default agar tetap terasa natural di jari.
    touchMultiplier: 1.6,
    autoRaf: false, // WAJIB false — di-drive manual lewat gsap.ticker di bawah,
                     // dua rAF loop scroll berjalan bersamaan = penyebab patah-patah.
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  lenisInstance = lenis;

  // Refresh ScrollTrigger setelah semua aset (termasuk web font) benar-benar siap —
  // mencegah start/end trigger meleset akibat perubahan tinggi layout (penyebab
  // scroll terasa "patah/loncat" di titik tertentu).
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  let resizeTimer;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      }, 200);
    },
    { passive: true }
  );

  return lenis;
}

/** Scroll halus terprogram ke section tertentu (dipakai tombol Explore/Start Exploring). */
export function scrollToSelector(selector, options = {}) {
  const target = document.querySelector(selector);
  if (!target) {
    console.warn(`[NEXUS] scrollToSelector: "${selector}" tidak ditemukan.`);
    return;
  }
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3), ...options });
  } else {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Progress 0→1 selama Hero discroll keluar viewport — dipakai untuk transisi
 * cinematic Hero→About (kamera turun, lighting berubah, dsb di main.js).
 *
 * FIX (5.6): trigger dipindah dari `#about` ke `.hero` sendiri. Sebelumnya
 * progress dihitung dari posisi About ("top bottom" → "top top"), yang berarti
 * kamera & hero fade baru bergerak SETELAH About mendekat — kalau tinggi About
 * berubah (misal font lambat load / section berikutnya nanti ditambah), jarak
 * scroll ini ikut bergeser dan transisi terasa telat/patah. Dengan trigger di
 * `.hero`, progress selalu 0→1 tepat selama tinggi Hero itu sendiri di-scroll —
 * konsisten berapa pun tinggi section-section di bawahnya.
 */
export function initSectionTransition(onProgress) {
  const hero = document.querySelector('.hero');
  if (!hero) return null;

  return ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: 1.2,
    onUpdate: (self) => onProgress(self.progress),
  });
}

/**
 * Hero mengecil, naik sedikit, & memudar secara halus saat user mulai scroll
 * ke About. Murni transform + opacity (GPU-friendly), di-scrub langsung oleh
 * ScrollTrigger/Lenis — DIKUNCI ke trigger yang sama (`.hero`) dengan
 * initSectionTransition di atas supaya fade Hero & pergerakan kamera SELALU
 * sinkron satu sama lain (ini yang membuat transisi terasa "satu halaman yang
 * bergerak", bukan berpindah halaman).
 */
export function initHeroScrollTransition() {
  const panel = document.querySelector('.hero__panel');
  const hero = document.querySelector('.hero');
  if (!panel || !hero) return;

  // FIX (5.6.3) — safety-net tambahan: pastikan tidak ada inline style sisa
  // (opacity/transform/filter) dari tween lain sebelum tween scroll-fade ini
  // dibuat, supaya titik awalnya SELALU kondisi normal (opacity 1, scale 1,
  // y 0) — apa pun yang terjadi pada urutan pemanggilan fungsi ini.
  gsap.set(panel, { clearProps: 'opacity,transform,filter' });
  gsap.set(panel, { transformOrigin: 'center', willChange: 'transform, opacity, filter' });

  gsap.to(panel, {
    scale: 0.82,
    y: -60, // "naik sedikit" — sesuai requirement, hero bergerak ke atas selagi mengecil
    opacity: 0.24, // tetap sedikit terlihat di bagian atas, tidak langsung hilang
    filter: 'blur(3px)',
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2,
    },
  });
}

/**
 * Reveal bertahap section About: opacity + translate + blur, stagger.
 *
 * FIX (5.6) — "About kadang tidak muncul": versi lama membuat tween `.from()`
 * di dalam `gsap.timeline({ scrollTrigger: { once: true } })`. GSAP menghitung
 * & MENERAPKAN nilai awal `.from()` (opacity:0, blur, dst) ke DOM secara
 * INSTAN begitu timeline dibuat — sebelum ScrollTrigger-nya sempat aktif.
 * Kalau posisi trigger meleset sedikit (layout belum stabil saat load, web
 * font telat, dsb), animasi reveal tidak pernah jalan dan section itu
 * TERTINGGAL di opacity:0 selamanya. Itulah sumber bug "About kadang tidak
 * muncul".
 *
 * Perbaikan: timeline HANYA dibuat (dan opacity:0 baru diterapkan) pada saat
 * IntersectionObserver benar-benar melaporkan About masuk viewport — bukan
 * dihitung lebih dulu dari posisi scroll yang bisa meleset. Section tetap
 * 100% terlihat (CSS default) sampai saat itu. Ditambah dua safety-net: (1)
 * pengecekan ulang setelah `load` kalau-kalau observer belum sempat terpasang
 * saat About sudah terlihat, (2) `clearProps` di akhir animasi supaya tidak
 * ada inline style (opacity/transform/filter) yang bisa "nyangkut".
 */
export function initAboutReveal() {
  const about = document.querySelector('#about');
  if (!about) return;

  const leftEls = about.querySelectorAll(
    '.about__eyebrow, .about__title, .about__role, .about__desc, .about__focus, .tech-stack, .about__buttons .btn'
  );
  const cardEl = about.querySelector('.about__card');
  const statEls = about.querySelectorAll('.stat-card');
  const allEls = [...leftEls, cardEl, ...statEls].filter(Boolean);

  let revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;

    gsap
      .timeline({
        onComplete: () => gsap.set(allEls, { clearProps: 'opacity,transform,filter,willChange' }),
      })
      .from(leftEls, { opacity: 0, y: 32, filter: 'blur(10px)', duration: 1, stagger: 0.12, ease: 'power3.out' })
      .from(
        cardEl,
        { opacity: 0, y: 40, scale: 0.94, filter: 'blur(14px)', duration: 1.2, ease: 'power3.out' },
        '-=0.7'
      )
      .from(statEls, { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.6');
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(about);
  } else {
    // Browser tanpa dukungan IntersectionObserver — langsung tampilkan tanpa animasi reveal.
    reveal();
  }

  // Safety-net: kalau di titik ini About sudah (atau ternyata) terlihat di
  // viewport tapi observer belum sempat menembak (edge-case halaman pendek /
  // reload di posisi scroll tertentu), paksa reveal supaya tidak pernah stuck.
  window.addEventListener('load', () => {
    const rect = about.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
    if (inViewport) reveal();
  });
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
 * Fly-bump kamera halus saat tombol Explore diklik — dorongan kecil kamera
 * ke depan yang menyatu dengan scroll otomatis ke About.
 *
 * FIX (5.6): versi lama "menyodok" kamera dalam 0.22s lalu kembali dalam
 * 0.45s (total ~0.67s, ease power2.out/power3.inOut yang tajam di ujung
 * awal) — terasa seperti sentakan/teleport kecil, bukan gerakan kamera yang
 * halus. Sekarang satu tween tunggal, ease-in-out penuh, durasi di dalam
 * rentang yang diminta (0.8–1.2s), jadi dorongannya menyatu dengan
 * scrollToSelector (yang juga berjalan ~1.4s) tanpa terasa dua gerakan
 * terpisah.
 * @param {THREE.PerspectiveCamera} camera
 * @param {{impulseZ:number}} rigState
 */
export function cameraFlyBump(camera, rigState) {
  const baseFov = camera.fov;
  const TOTAL = 1; // detik — total gerak maju + kembali, sesuai rentang 0.8–1.2s yang diminta.

  gsap
    .timeline({ defaults: { ease: 'power2.inOut', overwrite: true } })
    .to(rigState, { impulseZ: -0.32, duration: TOTAL / 2 })
    .to(rigState, { impulseZ: 0, duration: TOTAL / 2 });

  gsap
    .timeline({ defaults: { ease: 'power2.inOut', onUpdate: () => camera.updateProjectionMatrix() } })
    .to(camera, { fov: baseFov - 1.6, duration: TOTAL / 2 })
    .to(camera, { fov: baseFov, duration: TOTAL / 2 });
}
