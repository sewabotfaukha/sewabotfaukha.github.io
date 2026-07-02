// ============================================================================
// NEXUS — main.js
// Entry point. Scene + hero object + lighting + background + camera rig +
// bloom composer + smooth scroll + transisi cinematic Hero→About, SEMUA
// dalam satu render loop (requestAnimationFrame).
// ============================================================================

import * as THREE from 'three';

import { createScene, createHeroObject, createStarfield, createAmbientParticles, createNebulaBackdrop, createLighting } from './scene.js';
import { createCamera, updateCameraOnResize } from './camera.js';
import { createCameraRig } from './controls.js';
import { createLoadingManager } from './loader.js';
import {
  configureGsapDefaults,
  playIntroTimeline,
  initCardParallax,
  initTiltCard,
  initAboutReveal,
  initSmoothScroll,
  initSectionTransition,
  cameraFlyBump,
} from './animation.js';
import { initUI, hideLoader } from './ui.js';
import { initEffects } from './effects.js';

function bootstrap() {
  const canvas = document.querySelector('#nexus-canvas');
  if (!canvas) {
    console.error('[NEXUS] #nexus-canvas tidak ditemukan. Setup 3D dilewati.');
    safeInitNonThreeParts();
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    console.error('[NEXUS] WebGLRenderer gagal dibuat:', err);
    safeInitNonThreeParts();
    return;
  }

  const isMobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = createScene();
  const camera = createCamera(window.innerWidth / window.innerHeight);
  const rig = createCameraRig(camera);

  const { group: heroGroup } = createHeroObject();
  scene.add(heroGroup);

  const { pointViolet, rimCyan } = createLighting(scene);

  const stars = createStarfield(isMobile ? 160 : 380);
  const particles = createAmbientParticles(isMobile ? 20 : 50);
  const nebula = createNebulaBackdrop();
  scene.add(nebula, stars, particles);

  createLoadingManager({ onLoad: () => hideLoader() });
  hideLoader(300);

  const { composer, resize: resizeEffects } = initEffects({ scene, camera, renderer });

  // -- Resize --------------------------------------------------------------
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    updateCameraOnResize(camera, w, h);
    renderer.setSize(w, h);
    resizeEffects(w, h);
  }
  window.addEventListener('resize', onResize);

  // -- Fly-bump kamera saat tombol Explore diklik ---------------------------
  window.addEventListener('nexus:explore', () => cameraFlyBump(camera, rig.state));

  // -- Transisi cinematic Hero → About (di-drive oleh scroll, via Lenis+ScrollTrigger) --
  let scrollProgress = 0;
  initSectionTransition((p) => {
    scrollProgress = p;
  });

  // -- Animation loop (satu-satunya rAF loop di project ini) ---------------
  const clock = new THREE.Clock();
  let tiltX = 0;
  let tiltY = 0;
  let rotY = 0;
  const baseScale = heroGroup.scale.x;
  const baseViolet = pointViolet.intensity;
  const baseRim = rimCyan.intensity;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Scroll → camera turun cinematic, object mengecil & bergeser, lighting berubah.
    rig.state.scrollY = -scrollProgress * 1.6;
    const targetScale = baseScale * (1 - scrollProgress * 0.4);
    heroGroup.scale.setScalar(THREE.MathUtils.lerp(heroGroup.scale.x, targetScale, 0.08));
    heroGroup.position.x = THREE.MathUtils.lerp(heroGroup.position.x, scrollProgress * 1.1, 0.08);
    pointViolet.intensity = THREE.MathUtils.lerp(pointViolet.intensity, baseViolet * (1 - scrollProgress * 0.5), 0.08);
    rimCyan.intensity = THREE.MathUtils.lerp(rimCyan.intensity, baseRim * (1 + scrollProgress * 0.8), 0.08);

    rig.update(elapsed);

    // Object: melayang perlahan + rotasi sangat pelan + sedikit mengikuti mouse.
    rotY += 0.0018;
    tiltX += (rig.mouse.y * 0.18 - tiltX) * 0.04;
    tiltY += (rig.mouse.x * 0.22 - tiltY) * 0.04;
    heroGroup.position.y = Math.sin(elapsed * 0.6) * 0.16;
    heroGroup.rotation.x = tiltX;
    heroGroup.rotation.y = rotY + tiltY;

    // Glow (point light violet) mengikuti posisi mouse — lebih pelan dari objek (parallax berlapis).
    pointViolet.position.x = -1.5 + rig.mouse.x * 0.8;
    pointViolet.position.y = 1 - rig.mouse.y * 0.6;

    // Background hidup: rotasi sangat pelan + parallax sangat kecil mengikuti mouse.
    stars.rotation.y = elapsed * 0.008;
    stars.position.x = rig.mouse.x * 0.15;
    stars.position.y = -rig.mouse.y * 0.1;
    particles.rotation.y = -elapsed * 0.015;
    nebula.rotation.y = elapsed * 0.004;

    composer.render();
  }

  safeInitNonThreeParts();
  animate();
}

function safeInitNonThreeParts() {
  try { configureGsapDefaults(); } catch (err) { console.error('[NEXUS] GSAP defaults gagal:', err); }
  try { initSmoothScroll(); } catch (err) { console.error('[NEXUS] Smooth scroll gagal:', err); }
  try { initUI(); } catch (err) { console.error('[NEXUS] initUI gagal:', err); }
  try { playIntroTimeline(); } catch (err) { console.error('[NEXUS] Intro timeline gagal:', err); }
  try { initCardParallax(); } catch (err) { console.error('[NEXUS] Card parallax gagal:', err); }
  try { initTiltCard('.about__card'); } catch (err) { console.error('[NEXUS] Tilt card gagal:', err); }
  try { initAboutReveal(); } catch (err) { console.error('[NEXUS] About reveal gagal:', err); }
  hideLoader(800);
}

window.addEventListener('error', (event) => {
  console.error('[NEXUS] Unhandled error:', event.error || event.message);
  hideLoader(0);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
