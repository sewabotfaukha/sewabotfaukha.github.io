// ==========================================================================
// galaxy.js — Category Galaxy system
// Each "Galaxy" represents a website category (Search, AI, Coding, ...).
// A galaxy is built from a small JSON config (assets/data/galaxies.json),
// so adding a new category later is just adding a new entry — no code
// changes required. Each galaxy has: color, fog-like haze, glow, a floating
// name label, a particle swarm, and a defined radius.
// ==========================================================================

import * as THREE from "three";
import { loadJSON } from "./utils.js";

const DATA_PATH = "assets/data/galaxies.json";

/**
 * Loads galaxy config data and builds the full galaxy system.
 * Returns { group, galaxies, update } where:
 *   - group: THREE.Group containing every galaxy (add this to the scene)
 *   - galaxies: array of { id, name, color, position, radius, ... } for
 *     other modules (camera fly-to, sidebar, search) to reference
 *   - update(delta, elapsed): call every frame to animate glow/particles
 */
export async function createGalaxySystem() {
  const configs = await loadJSON(DATA_PATH);
  const group = new THREE.Group();
  group.name = "galaxy-system";

  const placements = autoPlaceGalaxies(configs.length);
  const galaxies = [];
  const updaters = [];

  configs.forEach((config, index) => {
    const placement = placements[index];
    const galaxy = buildGalaxy(config, placement);

    group.add(galaxy.object);
    updaters.push(galaxy.update);

    galaxies.push({
      id: config.id,
      name: config.name,
      description: config.description ?? "",
      color: config.color,
      position: placement.position.clone(),
      radius: placement.radius,
      object: galaxy.object,
    });
  });

  function update(delta, elapsed) {
    for (const fn of updaters) fn(delta, elapsed);
  }

  return { group, galaxies, update };
}

/* ==========================================================================
   AUTO-PLACEMENT — spreads galaxies evenly around the universe origin so
   new categories slot in automatically without manual coordinates.
   ========================================================================== */

function autoPlaceGalaxies(count, ringRadius = 2600) {
  const placements = [];

  // Golden-angle spiral distribution: avoids uniform-grid clustering and
  // scales gracefully whether there are 10 categories or 50 in the future.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const angle = i * goldenAngle;

    // Slight radius variance per ring position keeps galaxies from forming
    // a perfectly flat circle, adding depth to the layout.
    const radius = ringRadius * (0.65 + t * 0.5);
    const height = Math.sin(i * 0.7) * 500;

    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    // Each galaxy's own "footprint" radius scales loosely with its index
    // spread so the auto-layout has breathing room between neighbors.
    placements.push({ position, radius: ringRadius * 0.18 });
  }

  return placements;
}

/* ==========================================================================
   GALAXY BUILDER — constructs one galaxy from its config + placement.
   Each galaxy = particle swarm + soft haze (fog-like sprite) + glow core
   + floating name label (sprite-based, always faces camera).
   ========================================================================== */

function buildGalaxy(config, placement) {
  const object = new THREE.Group();
  object.name = `galaxy-${config.id}`;
  object.position.copy(placement.position);
  object.userData.categoryId = config.id;
  object.userData.categoryName = config.name;

  const color = new THREE.Color(config.color);
  const radius = config.radius ?? 220;
  const particleCount = config.particleCount ?? 2000;

  const particles = createGalaxyParticles(color, radius, particleCount);
  const haze = createGalaxyHaze(color, radius);
  const glow = createGalaxyGlow(color, radius);
  const label = createGalaxyLabel(config.name, color, radius);

  object.add(haze, particles, glow, label);

  // Each galaxy spins gently on its own axis at a slightly different speed
  // (derived from a hash of its id) so the whole system doesn't move in
  // perfect unison — reinforces the "alive" feel from the space environment.
  const spinSpeed = 0.02 + hashToUnit(config.id) * 0.03;

  function update(delta, elapsed) {
    object.rotation.y += spinSpeed * delta;
    // Subtle glow pulse, offset per-galaxy via its hash so they don't sync
    const pulse = 0.85 + Math.sin(elapsed * 0.6 + hashToUnit(config.id) * 10) * 0.15;
    glow.scale.setScalar(pulse);
    label.material.opacity = 0.75 + Math.sin(elapsed * 0.8) * 0.15;
  }

  return { object, update };
}

/** Deterministic 0..1 value derived from a string — used to desync animations */
function hashToUnit(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9973;
  }
  return hash / 9973;
}

/** The galaxy's particle swarm — a flattened spiral disc, same technique as
 * the background galaxy in space.js but parameterized per category. */
function createGalaxyParticles(color, radius, particleCount) {
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const c = new THREE.Color();
  const arms = 3;

  for (let i = 0; i < particleCount; i++) {
    const armOffset = (i % arms) * ((Math.PI * 2) / arms);
    const t = Math.random();
    const angle = t * Math.PI * 3.5 + armOffset;
    const r = t * radius;
    const scatter = (Math.random() - 0.5) * radius * 0.18;

    positions[i * 3] = Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * scatter;
    positions[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.08;
    positions[i * 3 + 2] = Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * scatter;

    // Blend the category color with white toward the core for a hot center
    c.copy(color).lerp(new THREE.Color(0xffffff), Math.max(0, 0.6 - t));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 2.2 + 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 2.6,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "galaxy-particles";
  return points;
}

/** Soft, low-opacity sprite cloud simulating the galaxy's surrounding haze/fog */
function createGalaxyHaze(color, radius) {
  const texture = createRadialGradientTexture(color);
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const haze = new THREE.Sprite(material);
  haze.scale.set(radius * 3.2, radius * 3.2, 1);
  haze.name = "galaxy-haze";
  return haze;
}

/** Bright core glow at the galaxy's center */
function createGalaxyGlow(color, radius) {
  const texture = createRadialGradientTexture(color);
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const glow = new THREE.Sprite(material);
  glow.scale.set(radius * 0.9, radius * 0.9, 1);
  glow.name = "galaxy-glow";
  return glow;
}

/** Procedural radial gradient texture, reused for both haze and glow sprites */
function createRadialGradientTexture(color) {
  const size = 256;
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
  gradient.addColorStop(0.4, hex);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Floating name label (canvas-rendered sprite, always faces the camera) */
function createGalaxyLabel(name, color, radius) {
  const padding = 32;
  const fontSize = 48;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
  const textWidth = ctx.measureText(name.toUpperCase()).width;

  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  ctx.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Soft glow behind the text matching the galaxy's color
  ctx.shadowColor = `#${color.getHexString()}`;
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name.toUpperCase(), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  const label = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  const labelHeight = radius * 0.22;
  label.scale.set(labelHeight * aspect, labelHeight, 1);
  label.position.y = radius * 0.65;
  label.name = "galaxy-label";
  return label;
}
