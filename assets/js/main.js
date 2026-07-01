// ============================================================================
// NEXUS — main.js
// Entry point. Merangkai scene, hero object (Crystal), lighting, background
// hidup (stars/nebula/particles), cinematic camera rig, bloom composer,
// dan SATU render loop (requestAnimationFrame) untuk semuanya.
// ============================================================================

import * as THREE from 'three';

import { createScene, createHeroObject, createStarfield, createAmbientParticles, createNebulaBackdrop, createLighting } from './scene.js';
import { createCamera, updateCameraOnResize } from './camera.js';
import { createCameraRig } from './controls.js';
import { createLoadingManager } from './loader.js';
import { configureGsapDefaults, playIntroTimeline, initCardParallax, cameraFlyBump } from './animation.js';
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

  const { pointViolet } = createLighting(scene);

  const stars = createStarfield();
  const particles = createAmbientParticles();
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

  // -- Animation loop (satu-satunya rAF loop di project ini) ---------------
  const clock = new THREE.Clock();
  let tiltX = 0;
  let tiltY = 0;
  let rotY = 0;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    rig.update(elapsed);

    // Object: melayang perlahan + rotasi sangat pelan + sedikit mengikuti mouse.
    rotY += 0.0018;
    tiltX += (rig.mouse.y * 0.18 - tiltX) * 0.04;
    tiltY += (rig.mouse.x * 0.22 - tiltY) * 0.04;
    heroGroup.position.y = Math.sin(elapsed * 0.6) * 0.16;
    heroGroup.rotation.x = tiltX;
    heroGroup.rotation.y = rotY + tiltY;

    // Glow (point light violet) mengikuti posisi mouse.
    pointViolet.position.x = -1.5 + rig.mouse.x * 1.5;
    pointViolet.position.y = 1 - rig.mouse.y * 1.2;

    // Background hidup: rotasi sangat pelan, tidak membebani performa.
    stars.rotation.y = elapsed * 0.008;
    particles.rotation.y = -elapsed * 0.015;
    nebula.rotation.y = elapsed * 0.004;

    composer.render();
  }

  safeInitNonThreeParts();
  animate();
}

function safeInitNonThreeParts() {
  try { configureGsapDefaults(); } catch (err) { console.error('[NEXUS] GSAP defaults gagal:', err); }
  try { initUI(); } catch (err) { console.error('[NEXUS] initUI gagal:', err); }
  try { playIntroTimeline(); } catch (err) { console.error('[NEXUS] Intro timeline gagal:', err); }
  try { initCardParallax(); } catch (err) { console.error('[NEXUS] Card parallax gagal:', err); }
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
