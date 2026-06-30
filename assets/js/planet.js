// ==========================================================================
// planet.js — Planet Class
// Represents a single website as a 3D planet. Every visual feature
// (atmosphere, glow, clouds, rings, moons, shadow, tilt, floating motion)
// is built once in the constructor and animated cheaply in update().
// Instances are created exclusively through PlanetManager (planetManager.js)
// — this file has no knowledge of JSON, raycasting, or the DOM.
// ==========================================================================

import * as THREE from "three";

// ---- Shared geometry cache ----
// Every planet/cloud-layer/moon of the same detail level reuses the same
// SphereGeometry instance instead of allocating a new one per planet.
// This is the single biggest performance win when there are dozens of
// planets on screen at once.
const geometryCache = new Map();

function getSphereGeometry(segments = 48) {
  const key = `sphere-${segments}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.SphereGeometry(1, segments, segments));
  }
  return geometryCache.get(key);
}

let sharedRingGeometry = null;
function getRingGeometry() {
  if (!sharedRingGeometry) {
    sharedRingGeometry = new THREE.RingGeometry(1.5, 2.4, 64);
  }
  return sharedRingGeometry;
}

/** Deterministic 0..1 value derived from a string — keeps per-planet
 * "randomness" (tilt, speed, phase) stable across reloads instead of
 * using Math.random(), so the universe looks the same every visit. */
function hashToUnit(str, seedOffset = 0) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i) + seedOffset) % 9973;
  }
  return hash / 9973;
}

export class Planet {
  /**
   * @param {object} data - website entry from websites.json
   *   { id, name, domain, category, rank }
   * @param {THREE.Vector3} position - world position assigned by PlanetManager
   * @param {object} [config] - visual config resolved from the planet's galaxy
   *   { color, hasRing, hasMoon, size }
   */
  constructor(data, position, config = {}) {
    this.data = data;
    this.id = data.id;
    this.name = data.name;

    this.color = new THREE.Color(config.color ?? 0x5b8cff);
    this.radius = config.size ?? 6 + hashToUnit(data.id, 1) * 4;
    this.hasRing = config.hasRing ?? false;
    this.hasMoon = config.hasMoon ?? false;

    // Per-planet deterministic randomness for tilt/speed/phase so every
    // planet feels unique without needing per-planet authored data.
    this._rotationSpeed = 0.08 + hashToUnit(data.id, 2) * 0.18;
    this._floatSpeed = 0.4 + hashToUnit(data.id, 3) * 0.5;
    this._floatAmplitude = this.radius * 0.18;
    this._floatPhase = hashToUnit(data.id, 4) * Math.PI * 2;
    this._glowPhase = hashToUnit(data.id, 5) * Math.PI * 2;
    this._tilt = hashToUnit(data.id, 6) * 0.5 - 0.25; // ~ -0.25..0.25 rad

    // ---- Root object: everything (mesh, atmosphere, glow, ring, moon)
    // lives under this group so PlanetManager only has to move one object.
    this.object = new THREE.Group();
    this.object.name = `planet-${data.id}`;
    this.object.position.copy(position);
    this.basePosition = position.clone();

    this._buildSurface();
    this._buildCloudLayer();
    this._buildAtmosphere();
    this._buildGlow();
    if (this.hasRing) this._buildRing();
    if (this.hasMoon) this._buildMoon();

    // Random tilt applied to the whole planet group, not just the mesh,
    // so rings/moons inherit the same axial tilt realistically.
    this.object.rotation.z = this._tilt;

    // Hover/select state — read by planetManager.js's raycaster logic.
    this.isHovered = false;
    this.isSelected = false;
    this._baseScale = 1;

    // Focus-mode dim state (Phase 9 intelligent search) — when another
    // planet is focused via search or click, every other planet smoothly
    // dims instead of snapping, so the universe still feels alive while
    // attention is drawn to the selected one.
    this.isDimmed = false;
    this._dimAmount = 0; // smoothed 0 (normal) .. 1 (fully dimmed)

    // Tag every raycastable mesh with a back-reference to this Planet
    // instance, so the manager's raycaster can resolve hits directly.
    this.object.userData.planet = this;
    this.surfaceMesh.userData.planet = this;
  }

  /* ========================================================================
     CONSTRUCTION — each method builds one visual feature, called once.
     ======================================================================== */

  _buildSurface() {
    // Shadow comes for free from a lit MeshStandardMaterial reacting to the
    // scene's directional light — no separate shadow-plane needed at this
    // scale, which keeps the draw call / shader cost down.
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.75,
      metalness: 0.05,
      emissive: this.color,
      emissiveIntensity: 0.06, // tiny self-glow so the night side isn't pure black
    });

    this.surfaceMesh = new THREE.Mesh(getSphereGeometry(48), material);
    this.surfaceMesh.scale.setScalar(this.radius);
    this.surfaceMesh.castShadow = true;
    this.surfaceMesh.receiveShadow = true;
    this.surfaceMesh.name = "planet-surface";
    this.object.add(this.surfaceMesh);
  }

  _buildCloudLayer() {
    // A slightly larger, semi-transparent sphere with a procedural noise
    // texture simulates moving clouds without needing an external asset.
    const texture = createCloudTexture(this.color);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      roughness: 1,
    });

    this.cloudMesh = new THREE.Mesh(getSphereGeometry(32), material);
    this.cloudMesh.scale.setScalar(this.radius * 1.03);
    this.cloudMesh.name = "planet-clouds";
    this.object.add(this.cloudMesh);
  }

  _buildAtmosphere() {
    // Fresnel-style glow shell: brighter at the silhouette edge, transparent
    // facing the camera — the classic cheap "atmosphere" look.
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: this.color.clone() },
        uDim: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uDim;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(uColor, clamp(intensity, 0.0, 1.0) * (1.0 - uDim * 0.85));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });

    this.atmosphereMesh = new THREE.Mesh(getSphereGeometry(32), material);
    this.atmosphereMesh.scale.setScalar(this.radius * 1.18);
    this.atmosphereMesh.name = "planet-atmosphere";
    this.object.add(this.atmosphereMesh);
  }

  _buildGlow() {
    // Soft outer glow sprite, billboarded toward the camera automatically
    // (THREE.Sprite always faces the camera) — pulses in update().
    const texture = getGlowTexture(this.color);
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.glowSprite = new THREE.Sprite(material);
    this.glowSprite.scale.setScalar(this.radius * 4.5);
    this.glowSprite.name = "planet-glow";
    this.object.add(this.glowSprite);
  }

  _buildRing() {
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.ringMesh = new THREE.Mesh(getRingGeometry(), material);
    this.ringMesh.scale.setScalar(this.radius);
    this.ringMesh.rotation.x = Math.PI / 2.3;
    this.ringMesh.name = "planet-ring";
    this.object.add(this.ringMesh);
  }

  _buildMoon() {
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.9,
      metalness: 0,
    });

    this.moonMesh = new THREE.Mesh(getSphereGeometry(20), moonMaterial);
    const moonRadius = this.radius * 0.28;
    this.moonMesh.scale.setScalar(moonRadius);
    this.moonMesh.name = "planet-moon";

    // Orbit radius/speed/phase derived deterministically, same pattern as
    // the planet's own animation parameters.
    this._moonOrbitRadius = this.radius * 2.2;
    this._moonOrbitSpeed = 0.6 + hashToUnit(this.id, 7) * 0.4;
    this._moonPhase = hashToUnit(this.id, 8) * Math.PI * 2;

    this.object.add(this.moonMesh);
  }

  /* ========================================================================
     PER-FRAME UPDATE — called by PlanetManager for every planet, every frame.
     Kept allocation-free (no `new` inside) to stay cheap at scale.
     ======================================================================== */

  update(delta, elapsed) {
    // Slow self-rotation
    this.surfaceMesh.rotation.y += this._rotationSpeed * delta;
    this.cloudMesh.rotation.y += this._rotationSpeed * 0.6 * delta; // clouds drift slightly slower
    this.atmosphereMesh.rotation.y += this._rotationSpeed * 0.3 * delta;

    // Floating up/down — offsets the whole group's Y from its base position
    const floatOffset =
      Math.sin(elapsed * this._floatSpeed + this._floatPhase) * this._floatAmplitude;
    this.object.position.y = this.basePosition.y + floatOffset;

    // Smoothly approach the dim target rather than snapping — keeps focus
    // mode transitions (Phase 9) feeling cinematic instead of abrupt.
    const dimTarget = this.isDimmed ? 1 : 0;
    this._dimAmount += (dimTarget - this._dimAmount) * Math.min(delta * 4, 1);
    const dimMul = 1 - this._dimAmount * 0.78;

    this.surfaceMesh.material.color.copy(this.color).multiplyScalar(dimMul);
    this.surfaceMesh.material.emissiveIntensity = 0.06 * dimMul;
    this.cloudMesh.material.opacity = 0.45 * dimMul;
    this.atmosphereMesh.material.uniforms.uDim.value = this._dimAmount;
    if (this.ringMesh) this.ringMesh.material.opacity = 0.55 * dimMul;
    if (this.moonMesh) this.moonMesh.material.color.setScalar(0.8 * dimMul + 0.2);

    // Glow pulse — sprite scale breathing. Hover gives the strongest boost
    // (transient, mouse-driven); a selected/focused planet (search result
    // or click) gets a sustained, gentler pulse so it stays visually
    // "switched on" even without the cursor over it.
    const pulse = 0.9 + Math.sin(elapsed * 1.4 + this._glowPhase) * 0.1;
    const focusPulse = this.isSelected
      ? 1 + Math.sin(elapsed * 2.2 + this._glowPhase) * 0.12
      : 1;
    const hoverBoost = this.isHovered ? 1.6 : this.isSelected ? 1.35 * focusPulse : 1;
    this.glowSprite.scale.setScalar(this.radius * 4.5 * pulse * hoverBoost);
    this.glowSprite.material.opacity =
      (this.isHovered ? 0.85 : this.isSelected ? 0.75 : 0.5) * pulse * dimMul;

    // Moon orbit, if present
    if (this.hasMoon) {
      const angle = elapsed * this._moonOrbitSpeed + this._moonPhase;
      this.moonMesh.position.set(
        Math.cos(angle) * this._moonOrbitRadius,
        Math.sin(angle * 0.5) * this._moonOrbitRadius * 0.15,
        Math.sin(angle) * this._moonOrbitRadius
      );
      this.moonMesh.rotation.y += delta * 0.5;
    }

    // Hover/select scale — smoothly approach the target scale rather than
    // snapping, giving the "scale membesar" interaction a soft, premium
    // feel. Selected (focused) planets settle to a smaller sustained scale
    // than an active hover, so hovering still reads as the "stronger" state.
    const targetScale = this.isHovered ? 1.18 : this.isSelected ? 1.1 : 1;
    this._baseScale += (targetScale - this._baseScale) * Math.min(delta * 6, 1);
    this.object.scale.setScalar(this._baseScale);
  }

  /** Called by PlanetManager when the pointer enters this planet */
  setHovered(value) {
    this.isHovered = value;
  }

  /** Called by PlanetManager when this planet is clicked/selected, or
   * focused via the Phase 9 intelligent search result selection. */
  setSelected(value) {
    this.isSelected = value;
  }

  /** Called by PlanetManager's focus mode — true dims this planet down
   * (used for every planet except the one currently focused/searched). */
  setDimmed(value) {
    this.isDimmed = value;
  }

  /** Every mesh that should be tested by the raycaster for this planet */
  getRaycastTargets() {
    return [this.surfaceMesh];
  }

  dispose() {
    this.surfaceMesh.material.dispose();
    this.cloudMesh.material.map?.dispose();
    this.cloudMesh.material.dispose();
    this.atmosphereMesh.material.dispose();
    this.glowSprite.material.dispose();
    this.ringMesh?.material.dispose();
    this.moonMesh?.material.dispose();
    // Geometries are shared via geometryCache and intentionally NOT disposed
    // here — other planets may still be using them.
  }
}

/* ==========================================================================
   SHARED TEXTURE HELPERS — cached so identical-colored planets reuse
   the same GPU texture instead of generating a new canvas each time.
   ========================================================================== */

const glowTextureCache = new Map();

function getGlowTexture(color) {
  const key = color.getHexString();
  if (!glowTextureCache.has(key)) {
    glowTextureCache.set(key, createRadialTexture(color));
  }
  return glowTextureCache.get(key);
}

function createRadialTexture(color) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  const hex = `#${color.getHexString()}`;
  gradient.addColorStop(0, hex);
  gradient.addColorStop(0.5, hex);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Procedural blotchy cloud texture, tinted faintly by the planet's color */
function createCloudTexture(color) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, size, size);

  const blotchCount = 40;
  for (let i = 0; i < blotchCount; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 10;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}
