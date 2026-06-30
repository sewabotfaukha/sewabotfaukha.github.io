// ==========================================================================
// hyperlane.js — Hyperlane Network System (Phase 10)
// A premium, living network of glowing curved lanes connecting websites,
// inspired by No Man's Sky / Elite Dangerous / Star Citizen / EVE Online /
// Universe Sandbox. Built ENTIRELY from assets/data/connections.json — no
// hardcoded edges; adding an entry to that file is enough for a new
// hyperlane to appear automatically.
//
// Three cooperating pieces, all in this one module per the Phase 10 spec:
//   ConnectionLoader     — fetches + validates connections.json
//   HyperlaneManager      — builds the tube meshes once, owns hover/focus
//                            state and the bidirectional connection graph
//   AnimationController   — the shared per-frame uTime/flow/pulse driver
// ==========================================================================

import * as THREE from "three";
import gsap from "gsap";
import { loadJSON } from "./utils.js";

const DATA_PATH = "assets/data/connections.json";

/** Hyperlane colors by category, per the Phase 10 spec (search=green,
 * ai=purple, coding=blue-grey, cloud=blue, social=red, education=yellow).
 * Categories not explicitly specified fall back to a color in the same
 * family so every category still reads distinctly. Pure data — extending
 * this object is the only thing needed to recolor a category's lanes. */
const CATEGORY_HYPERLANE_COLORS = {
  search: 0x4ade80, // hijau
  ai: 0x8a5bff, // ungu
  coding: 0x7a8aa3, // abu biru
  developer: 0x2fd4d9, // abu biru (developer family)
  cloud: 0x5b8cff, // biru
  social: 0xff5b6e, // merah
  education: 0xffd166, // kuning
  finance: 0x4ade80,
  gaming: 0xc45bff,
  shopping: 0xff8a5b,
  entertainment: 0xff4d8d,
  news: 0x9ca3ff,
};

function colorForCategory(categoryId) {
  return new THREE.Color(CATEGORY_HYPERLANE_COLORS[categoryId] ?? 0x8aa0ff);
}

/* ==========================================================================
   CONNECTION LOADER — fetches connections.json and resolves each edge
   against the live planets (skips/warns on dangling references instead of
   throwing, so one bad entry never breaks the whole network).
   ========================================================================== */
async function loadConnections(planetManager) {
  let raw = [];
  try {
    raw = await loadJSON(DATA_PATH);
  } catch (err) {
    console.warn("[hyperlane] Failed to load connections.json:", err);
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const resolved = [];
  for (const entry of raw) {
    const sourcePlanet = planetManager.getPlanetById(entry.source);
    const targetPlanet = planetManager.getPlanetById(entry.target);

    if (!sourcePlanet || !targetPlanet) {
      console.warn(
        `[hyperlane] Skipping connection "${entry.source} -> ${entry.target}" — unknown website id.`
      );
      continue;
    }

    resolved.push({
      source: entry.source,
      target: entry.target,
      weight: typeof entry.weight === "number" ? entry.weight : 0.5,
      sourcePlanet,
      targetPlanet,
    });
  }
  return resolved;
}

/* ==========================================================================
   GEOMETRY — gently curved tube along a CatmullRomCurve3 (never a straight
   line), built once per edge and reused for the lane's whole lifetime.
   ========================================================================== */
function buildLaneCurve(start, end) {
  const distance = start.distanceTo(end);
  const mid = start.clone().lerp(end, 0.5);

  // Bow the midpoint outward (away from the universe origin) so lanes read
  // as gentle arcs through space rather than chords cutting through it.
  const outward = mid.clone().normalize();
  const arcHeight = THREE.MathUtils.clamp(distance * 0.16, 40, 260);
  mid.add(outward.multiplyScalar(arcHeight));

  return new THREE.CatmullRomCurve3([start, mid, end], false, "catmullrom", 0.4);
}

function buildLaneGeometry(curve, distance) {
  const tubularSegments = THREE.MathUtils.clamp(Math.round(distance / 40), 16, 96);
  return new THREE.TubeGeometry(curve, tubularSegments, 1.6, 6, false);
}

/* ==========================================================================
   SHADER MATERIAL — one ShaderMaterial per lane (cheap: a handful of edges
   max, not thousands). TubeGeometry's own UVs give u = position along the
   lane's length, v = position around its circumference, which the
   fragment shader uses for the gradient, the flowing energy pulses, and a
   soft glow falloff toward the tube's silhouette — all without any extra
   geometry or per-frame allocation.
   ========================================================================== */
function createLaneMaterial(colorA, colorB, flowSpeed) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uFlowSpeed: { value: flowSpeed },
      uHighlight: { value: 0 }, // 0..1, smoothed — boosts a focused lane
      uDim: { value: 0 }, // 0..1, smoothed — dims lanes unrelated to focus
      uHover: { value: 0 }, // 0..1, smoothed — hover glow/thickness boost
    },
    vertexShader: /* glsl */ `
      uniform float uHover;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // Hover makes the lane read visually thicker by pushing surface
        // vertices outward along their normal — cheaper than rebuilding
        // geometry, and reverts smoothly once uHover eases back to 0.
        vec3 displaced = position + normal * uHover * 0.9;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFlowSpeed, uHighlight, uDim, uHover;
      uniform vec3 uColorA, uColorB;
      varying vec2 vUv;

      void main() {
        // Gradient color along the lane's length, source -> target.
        vec3 baseColor = mix(uColorA, uColorB, vUv.x);

        // Animated energy flow — a couple of bright pulses travelling
        // along the lane's length (vUv.x), at this lane's own speed.
        float travel = fract(vUv.x * 2.4 - uTime * uFlowSpeed);
        float pulse = smoothstep(0.9, 1.0, travel) + smoothstep(0.08, 0.0, travel) * 0.5;

        // Soft glow falloff toward the tube's silhouette (circumference).
        float edge = 1.0 - smoothstep(0.0, 0.5, abs(vUv.y - 0.5));

        float dimMul = 1.0 - uDim * 0.88;
        float energy = 0.22 + uHighlight * 0.55 + uHover * 0.5;

        float alpha = (edge * 0.35 + pulse * (0.55 + energy)) * (0.45 + uHighlight * 0.7 + uHover * 0.4) * dimMul;
        vec3 color = baseColor * (1.0 + uHighlight * 0.9 + uHover * 0.7) + vec3(pulse) * 0.6;

        gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Deterministic 0..1 value derived from a string (same technique used
 * throughout the project for stable, reload-safe "randomness"). */
function hashToUnit(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9973;
  }
  return hash / 9973;
}

/* ==========================================================================
   HYPERLANE MANAGER
   ========================================================================== */
export class HyperlaneManager {
  /**
   * @param {object} options
   * @param {object} options.planetManager - live PlanetManager (planetManager.js)
   * @param {THREE.Camera} options.camera - for hover raycasting + tooltip placement
   * @param {HTMLElement} options.domElement - canvas, for pointer coordinates + cursor
   * @param {Function} [options.onHover] - (edge|null, pointerEvent) => void
   */
  constructor({ planetManager, camera, domElement, onHover } = {}) {
    this.planetManager = planetManager;
    this.camera = camera;
    this.domElement = domElement;
    this.onHover = onHover ?? null;

    this.group = new THREE.Group();
    this.group.name = "hyperlane-network";

    /** @type {Array<object>} every built lane: {source,target,mesh,material,...} */
    this.lanes = [];
    /** @type {Map<string, Set<string>>} bidirectional adjacency, siteId -> connected siteIds */
    this.graph = new Map();

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._hoveredLane = null;
    this._focusedId = null;

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this.domElement.addEventListener("pointermove", this._onPointerMove);
    this.domElement.addEventListener("click", this._onClick);
  }

  /** Builds every lane from connections.json. Call once, after the planet
   * system exists (each lane needs its endpoints' live world positions). */
  async build() {
    const connections = await loadConnections(this.planetManager);

    for (const conn of connections) {
      this._addLane(conn);
      this._addToGraph(conn.source, conn.target);
    }

    return this;
  }

  _addToGraph(a, b) {
    if (!this.graph.has(a)) this.graph.set(a, new Set());
    if (!this.graph.has(b)) this.graph.set(b, new Set());
    this.graph.get(a).add(b);
    this.graph.get(b).add(a);
  }

  _addLane({ source, target, weight, sourcePlanet, targetPlanet }) {
    const start = sourcePlanet.object.position;
    const end = targetPlanet.object.position;
    const distance = start.distanceTo(end);

    const curve = buildLaneCurve(start, end);
    const geometry = buildLaneGeometry(curve, distance);

    const colorA = colorForCategory(sourcePlanet.data.category);
    const colorB = colorForCategory(targetPlanet.data.category);
    // Each lane's flow speed varies (deterministic per edge) so the whole
    // network doesn't pulse in lockstep — reads as alive, not mechanical.
    const flowSpeed = 0.25 + hashToUnit(`${source}-${target}`) * 0.35 + weight * 0.2;

    const material = createLaneMaterial(colorA, colorB, flowSpeed);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `hyperlane-${source}-${target}`;

    const lane = {
      id: `${source}->${target}`,
      source,
      target,
      sourcePlanet,
      targetPlanet,
      mesh,
      material,
      targetHighlight: 0,
      targetDim: 0,
      targetHover: 0,
    };

    mesh.userData.lane = lane;
    this.group.add(mesh);
    this.lanes.push(lane);
  }

  /** AnimationController — called once per frame from main.js's render
   * loop. Advances the shared flow time and smoothly lerps every lane's
   * highlight/dim/hover uniforms toward their current targets — no new
   * objects, no geometry rebuilt, just uniform updates. */
  update(delta, elapsed) {
    for (const lane of this.lanes) {
      const u = lane.material.uniforms;
      u.uTime.value = elapsed;
      u.uHighlight.value += (lane.targetHighlight - u.uHighlight.value) * Math.min(delta * 4, 1);
      u.uDim.value += (lane.targetDim - u.uDim.value) * Math.min(delta * 4, 1);
      u.uHover.value += (lane.targetHover - u.uHover.value) * Math.min(delta * 8, 1);
    }
  }

  /* ========================================================================
     FOCUS INTEGRATION — shared by direct planet clicks, search selection,
     and camera fly-to (main.js/ui.js call this; PlanetManager itself
     doesn't know about hyperlanes, keeping the two systems decoupled).
     ======================================================================== */

  /**
   * Lights up every lane connected to `siteId` and dims every other lane.
   * @param {string} siteId
   * @param {object} [options]
   * @param {boolean} [options.cascade=true] - stagger the highlight tween
   *   across connected lanes so they light up "bertahap" (gradually) like
   *   a cinematic camera-fly arrival, instead of snapping on all at once.
   */
  highlightForPlanet(siteId, { cascade = true } = {}) {
    this._focusedId = siteId;
    let cascadeIndex = 0;

    for (const lane of this.lanes) {
      const isConnected = lane.source === siteId || lane.target === siteId;

      if (isConnected) {
        lane.targetDim = 0;
        if (cascade) {
          // Reset to 0 first so the cascade reads as each lane igniting in
          // turn rather than all jumping straight to lit.
          lane.targetHighlight = 0;
          gsap.to(lane, {
            targetHighlight: 1,
            duration: 0.5,
            delay: cascadeIndex * 0.08,
            ease: "power2.out",
          });
          cascadeIndex += 1;
        } else {
          lane.targetHighlight = 1;
        }
      } else {
        gsap.killTweensOf(lane);
        lane.targetHighlight = 0;
        lane.targetDim = 1;
      }
    }
  }

  /** Returns every lane to its neutral resting state (no highlight, no dim) */
  clearHighlight() {
    this._focusedId = null;
    for (const lane of this.lanes) {
      gsap.killTweensOf(lane);
      lane.targetHighlight = 0;
      lane.targetDim = 0;
    }
  }

  /** Connected-website summary for the sidebar (Phase 10): id/name/category
   * for every site directly linked to `siteId` via connections.json. */
  getConnectionsForSite(siteId) {
    const neighborIds = this.graph.get(siteId);
    if (!neighborIds) return [];

    const sites = [];
    for (const id of neighborIds) {
      const site = this.planetManager.getPlanetById(id)?.data;
      if (site) sites.push(site);
    }
    return sites;
  }

  /* ========================================================================
     HOVER / CLICK — raycasts against lane meshes. Cursor is only cleared
     when a planet isn't hovered either, so PlanetManager's own hover cursor
     (registered first, in scene.js) is never fought over.
     ======================================================================== */

  _onPointerMove(event) {
    this._updatePointer(event);
    const lane = this._raycastLane();

    if (lane !== this._hoveredLane) {
      if (this._hoveredLane) this._hoveredLane.targetHover = 0;
      if (lane) lane.targetHover = 1;
      this._hoveredLane = lane;
    }

    if (lane) {
      this.domElement.style.cursor = "pointer";
    } else if (!this.planetManager?.getHoveredPlanet?.()) {
      this.domElement.style.cursor = "";
    }

    this.onHover?.(lane, event);
  }

  _onClick() {
    // Hyperlanes are informational (hover tooltip only) — clicking through
    // to a connected planet is handled by the sidebar's connected-websites
    // list (ui.js), so a plain click here intentionally does nothing.
  }

  _updatePointer(event) {
    const rect = this.domElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _raycastLane() {
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const hits = this._raycaster.intersectObjects(
      this.lanes.map((lane) => lane.mesh),
      false
    );
    if (hits.length === 0) return null;
    return hits[0].object.userData.lane ?? null;
  }

  dispose() {
    this.domElement.removeEventListener("pointermove", this._onPointerMove);
    this.domElement.removeEventListener("click", this._onClick);
    for (const lane of this.lanes) {
      gsap.killTweensOf(lane);
      lane.mesh.geometry.dispose();
      lane.material.dispose();
    }
    this.lanes = [];
    this.graph.clear();
  }
}

/**
 * Entry point matching the project's other system factories (createScene,
 * createGalaxySystem, etc.) — builds and returns a ready HyperlaneManager.
 */
export async function createHyperlaneNetwork(options) {
  const manager = new HyperlaneManager(options);
  await manager.build();
  return manager;
}
