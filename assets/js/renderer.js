// ==========================================================================
// renderer.js — WebGLRenderer setup bound to #scene-canvas
// Includes tone mapping configuration for an HDR-style look, which also
// feeds correctly into the bloom post-processing pipeline (postprocessing.js).
// ==========================================================================

import * as THREE from "three";

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---- Tone mapping / HDR look ----
  // ACESFilmic gives a cinematic, slightly desaturated highlight roll-off —
  // closer to how real HDR space photography "feels" than the flat default.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  return renderer;
}

/** Resize the renderer to match the current viewport */
export function resizeRenderer(renderer) {
  renderer.setSize(window.innerWidth, window.innerHeight);
}
