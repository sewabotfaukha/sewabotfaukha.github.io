// ============================================================================
// NEXUS — effects.js
// Post-processing: bloom (glow premium) via EffectComposer.
// Resolusi bloom diadaptasi turun di layar kecil demi performa.
// ============================================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function initEffects({ scene, camera, renderer }) {
  const isMobile = window.innerWidth < 768;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.32 : 0.5, // strength — dikurangi agar tulisan NEXUS tetap fokus utama
    0.4, // radius
    0.32 // threshold — makin tinggi, makin selektif area yang bloom
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize(width, height) {
    composer.setSize(width, height);
    bloom.setSize(width, height);
  }

  return { composer, bloom, resize };
}
