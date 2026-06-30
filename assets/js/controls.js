// ==========================================================================
// controls.js — Camera controls (OrbitControls) for navigating the universe
// Supports rotate, pan, zoom, damping and inertia out of the box via
// Three.js's OrbitControls — configured explicitly below for clarity.
// ==========================================================================

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);

  // ---- Damping / inertia ----
  // enableDamping + a non-zero dampingFactor gives the camera "inertia":
  // motion eases out smoothly after the user releases the mouse, instead
  // of stopping instantly. controls.update() must be called every frame
  // (done in main.js's animation loop) for damping to take effect.
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;

  // ---- Rotate ----
  controls.enableRotate = true;
  controls.rotateSpeed = 0.4;

  // ---- Zoom ----
  controls.enableZoom = true;
  controls.zoomSpeed = 0.6;
  controls.minDistance = 5;
  controls.maxDistance = 5000;

  // ---- Pan ----
  controls.enablePan = true;
  controls.panSpeed = 0.4;
  controls.screenSpacePanning = true; // pan parallel to the screen plane

  // Keep the orbit target at the scene origin for now (the future "core"
  // of the internet universe); this can be retargeted once nodes exist.
  controls.target.set(0, 0, 0);

  return controls;
}
