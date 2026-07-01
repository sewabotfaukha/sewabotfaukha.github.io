// ============================================================================
// NEXUS — camera.js
// Bertanggung jawab untuk membuat PerspectiveCamera dan menjaganya tetap
// sinkron dengan ukuran viewport.
// ============================================================================

import * as THREE from 'three';

/**
 * Membuat PerspectiveCamera dengan posisi default.
 * @param {number} aspect - rasio lebar/tinggi viewport saat ini
 * @returns {THREE.PerspectiveCamera}
 */
export function createCamera(aspect) {
  const FOV = 45;
  const NEAR = 0.1;
  const FAR = 100;

  const camera = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);

  // Posisi awal kamera — menjauh sedikit dari origin agar siap
  // menghadap object 3D yang akan ditambahkan pada tahap berikutnya.
  camera.position.set(0, 0, 6);

  return camera;
}

/**
 * Memperbarui aspect ratio & proyeksi kamera ketika viewport berubah ukuran.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} width
 * @param {number} height
 */
export function updateCameraOnResize(camera, width, height) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
