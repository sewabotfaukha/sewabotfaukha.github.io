// ============================================================================
// NEXUS — scene.js
// Bertanggung jawab hanya untuk membuat & mengekspos THREE.Scene.
// Object 3D (model, partikel, dll) akan ditambahkan di prompt berikutnya.
// ============================================================================

import * as THREE from 'three';

/**
 * Membuat instance THREE.Scene dengan konfigurasi dasar (warna latar & fog).
 * @returns {THREE.Scene}
 */
export function createScene() {
  const scene = new THREE.Scene();

  // Latar scene dibiarkan transparan (null) karena background visual
  // sebenarnya dikendalikan oleh CSS (gradient + glassmorphism) di belakang canvas.
  scene.background = null;

  // Fog disiapkan lebih awal supaya siap dipakai ketika object 3D ditambahkan.
  scene.fog = new THREE.FogExp2(0x08080d, 0.02);

  return scene;
}
