// ============================================================================
// NEXUS — scene.js
// Scene + object 3D utama (Crystal Futuristic) + background hidup
// (starfield, nebula, ambient particles). Fog sudah disiapkan sejak awal.
// ============================================================================

import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = null; // gradient/glass tetap dikendalikan CSS di belakang canvas
  scene.fog = new THREE.FogExp2(0x08080d, 0.045);
  return scene;
}

/** Crystal Futuristic — object 3D utama hero. */
export function createHeroObject() {
  const group = new THREE.Group();

  const geo = new THREE.IcosahedronGeometry(1.35, 0);

  const core = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 1.6,
      ior: 1.4,
      iridescence: 1,
      iridescenceIOR: 1.3,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: 0x2a1a55,
      emissiveIntensity: 0.35,
    })
  );

  const glow = new THREE.Mesh(
    geo.clone(),
    new THREE.MeshBasicMaterial({
      color: 0x7c5cff,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.setScalar(1.08);

  group.add(core, glow);
  return { group, core, glow };
}

/** Titik bintang latar — sedikit, kecil, redup, terasa seperti debu cahaya jauh. */
export function createStarfield(count = 380) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 18 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.028,
    transparent: true,
    opacity: 0.32,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

/** Partikel ambient dekat object — sedikit, kecil, melayang sangat pelan (debu cahaya). */
export function createAmbientParticles(count = 50) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x00e5ff,
    size: 0.018,
    transparent: true,
    opacity: 0.28,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geo, mat);
}

/** Nebula — sphere besar di belakang, gradient radial halus dari dalam. */
export function createNebulaBackdrop() {
  const geo = new THREE.SphereGeometry(24, 32, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
    uniforms: {
      colorA: { value: new THREE.Color(0x1a0f3d) },
      colorB: { value: new THREE.Color(0x08080d) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 colorA;
      uniform vec3 colorB;
      void main() {
        float h = clamp(length(vPos) / 24.0, 0.0, 1.0);
        vec3 color = mix(colorA, colorB, h);
        gl_FragColor = vec4(color, 0.9);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

/** Lighting rig: ambient + directional + point (violet) + rim (cyan). */
export function createLighting(scene) {
  const ambient = new THREE.AmbientLight(0x404066, 0.7);

  const directional = new THREE.DirectionalLight(0xffffff, 1.1);
  directional.position.set(3, 4, 3);

  const pointViolet = new THREE.PointLight(0x7c5cff, 6, 12, 2);
  pointViolet.position.set(-2, 1, 2);

  const rimCyan = new THREE.PointLight(0x00e5ff, 4, 12, 2);
  rimCyan.position.set(2, -1, -2);

  scene.add(ambient, directional, pointViolet, rimCyan);

  return { ambient, directional, pointViolet, rimCyan };
}
