// ============================================================================
// NEXUS — controls.js
// Bertanggung jawab untuk membuat & mengonfigurasi OrbitControls.
// ============================================================================

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Membuat instance OrbitControls yang terikat pada kamera & elemen DOM renderer.
 * @param {THREE.Camera} camera
 * @param {HTMLElement} domElement - biasanya renderer.domElement
 * @returns {OrbitControls}
 */
export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);

  // Damping membuat pergerakan kamera terasa halus & premium.
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Batasi zoom & pan agar pengalaman tetap terarah (tidak "tersesat" di scene kosong).
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 12;

  // Batasi rotasi vertikal agar kamera tidak terbalik.
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI - Math.PI / 4;

  // Auto-rotate lembut sebagai sentuhan "hidup" pada scene kosong —
  // akan terasa lebih bermakna begitu object 3D ditambahkan nanti.
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;

  return controls;
}
