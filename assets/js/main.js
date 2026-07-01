// ============================================================================
// NEXUS — main.js
// Entry point aplikasi. Merangkai seluruh modul (scene, camera, controls,
// loader, animation, ui, effects) dan menjalankan render loop.
// ============================================================================

import * as THREE from 'three';

import { createScene } from './scene.js';
import { createCamera, updateCameraOnResize } from './camera.js';
import { createControls } from './controls.js';
import { createLoadingManager } from './loader.js';
import { configureGsapDefaults, playIntroTimeline } from './animation.js';
import { initUI, hideLoader } from './ui.js';
import { initEffects } from './effects.js';

// ---------------------------------------------------------------------------
// 1. Setup dasar: canvas, renderer, scene, camera, controls
// ---------------------------------------------------------------------------

const canvas = document.querySelector('#nexus-canvas');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true, // latar transparan supaya gradient CSS di belakang canvas terlihat
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = createScene();
const camera = createCamera(window.innerWidth / window.innerHeight);
const controls = createControls(camera, renderer.domElement);

// LoadingManager disiapkan meski belum ada aset yang dimuat — begitu
// prompt berikutnya menambahkan model/tekstur, tinggal pakai `manager` ini.
const manager = createLoadingManager({
  onLoad: () => hideLoader(),
});

// Belum ada aset untuk dimuat pada tahap ini, jadi loader disembunyikan
// langsung setelah scene siap dirender.
hideLoader(300);

initEffects({ scene, camera, renderer });

// ---------------------------------------------------------------------------
// 2. Resize handler — menjaga canvas & kamera tetap sinkron dengan viewport
// ---------------------------------------------------------------------------

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  updateCameraOnResize(camera, width, height);
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize);

// ---------------------------------------------------------------------------
// 3. Animation loop
// ---------------------------------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

  controls.update(); // wajib dipanggil setiap frame karena enableDamping aktif

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// 4. Inisialisasi UI & GSAP, lalu mulai loop
// ---------------------------------------------------------------------------

configureGsapDefaults();
initUI();
playIntroTimeline();
animate();
