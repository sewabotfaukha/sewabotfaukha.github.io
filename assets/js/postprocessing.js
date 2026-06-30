// ==========================================================================
// postprocessing.js — Post-processing pipeline (Bloom)
// Wraps Three.js's EffectComposer so main.js can render through bloom
// instead of calling renderer.render() directly. Kept as its own module
// to keep renderer.js focused purely on the WebGLRenderer itself.
// ==========================================================================

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/**
 * Builds an EffectComposer with a RenderPass -> UnrealBloomPass -> OutputPass
 * chain. UnrealBloomPass gives the bright starfield/HDR highlights a soft
 * glow, reinforcing the "deep space" premium look established in the hero.
 */
export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, // strength
    0.4,  // radius
    0.15  // threshold — only sufficiently bright pixels bloom
  );
  composer.addPass(bloomPass);

  // OutputPass applies the renderer's tone mapping + color space conversion
  // as the final step, since composer passes bypass the renderer's own
  // automatic output handling.
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  composer.bloomPass = bloomPass; // convenient reference for tuning/resize
  return composer;
}

/** Keep the composer (and its bloom render targets) sized to the viewport */
export function resizeComposer(composer) {
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.bloomPass?.resolution?.set(window.innerWidth, window.innerHeight);
}
