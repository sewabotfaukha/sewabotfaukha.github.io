// ==========================================================================
// planetManager.js — Planet Manager
// The ONLY place Planet instances are created. Responsibilities:
//   1. Load websites.json
//   2. Resolve each website's position from its galaxy (galaxy.js output)
//   3. Decide per-planet visual config (color, ring, moon) with no
//      hardcoded repetition — derived from the galaxy + a deterministic hash
//   4. Own the raycaster for hover/click interaction
//   5. Expose update(delta, elapsed) for the render loop
// Hover/click results are reported via callbacks (onHover/onClick) rather
// than touching the DOM directly here — ui.js owns the tooltip + sidebar.
// ==========================================================================

import * as THREE from "three";
import gsap from "gsap";
import { loadJSON } from "./utils.js";
import { Planet } from "./planet.js";

const DATA_PATH = "assets/data/websites.json";

export class PlanetManager {
  /**
   * @param {THREE.Camera} camera - used for raycasting and billboard sprites
   * @param {HTMLElement} domElement - the canvas, for pointer coordinates
   * @param {object} [callbacks]
   * @param {Function} [callbacks.onHover] - (planet|null, pointerEvent) => void
   * @param {Function} [callbacks.onClick] - (planet|null, websiteData) => void
   */
  constructor(camera, domElement, callbacks = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.onHover = callbacks.onHover ?? null;
    this.onClick = callbacks.onClick ?? null;

    this.group = new THREE.Group();
    this.group.name = "planet-system";

    /** @type {Map<string, Planet>} */
    this.planets = new Map();

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._hoveredPlanet = null;
    this._selectedPlanet = null;

    // Phase 9 focus mode — the currently focused (search-selected or
    // clicked) planet's "hyperlanes" to its connected sites.
    this._focusedId = null;
    this._hyperlaneGroup = null;

    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this.domElement.addEventListener("pointermove", this._onPointerMove);
    this.domElement.addEventListener("click", this._onClick);
  }

  /**
   * Builds every Planet from websites.json, placed within their category
   * galaxy. Call once, after the galaxy system exists.
   * @param {Array} galaxies - galaxy list from scene.userData.galaxies
   */
  async buildFromData(galaxies) {
    const websites = await loadJSON(DATA_PATH);
    this.websitesById = new Map(websites.map((site) => [site.id, site]));
    const galaxyById = new Map(galaxies.map((g) => [g.id, g]));

    // Group websites by category so each galaxy's planets can be spread
    // out around that galaxy's center instead of overlapping at one point.
    const byCategory = new Map();
    for (const site of websites) {
      const list = byCategory.get(site.category) ?? [];
      list.push(site);
      byCategory.set(site.category, list);
    }

    for (const [categoryId, sites] of byCategory) {
      const galaxy = galaxyById.get(categoryId);
      if (!galaxy) {
        console.warn(`[PlanetManager] No galaxy found for category "${categoryId}" — skipping ${sites.length} site(s).`);
        continue;
      }

      sites.forEach((site, index) => {
        const position = this._placeWithinGalaxy(galaxy, index, sites.length);
        const config = this._resolvePlanetConfig(site, galaxy);
        this.addPlanet(site, position, config);
      });
    }

    return this;
  }

  /**
   * Creates a single Planet and registers it. Exposed publicly so planets
   * can also be added one at a time later (e.g. live data, search results)
   * without going through buildFromData again.
   */
  addPlanet(data, position, config) {
    const planet = new Planet(data, position, config);
    this.planets.set(planet.id, planet);
    this.group.add(planet.object);
    return planet;
  }

  removePlanet(id) {
    const planet = this.planets.get(id);
    if (!planet) return;
    this.group.remove(planet.object);
    planet.dispose();
    this.planets.delete(id);
  }

  /** Look up a live Planet instance by its website id — used by Phase 9's
   * intelligent search to resolve a search result into a flyable target. */
  getPlanetById(id) {
    return this.planets.get(id) ?? null;
  }

  /* ========================================================================
     FOCUS MODE (Phase 9) — used by both direct planet clicks and search
     result selection so the experience is consistent either way: the
     target planet gets the "selected" highlight, every other planet dims,
     and glowing hyperlane lines light up to its connected sites.
     ======================================================================== */

  /** Focuses a single planet by id. Returns the Planet instance, or null
   * if no planet with that id exists. */
  focusPlanet(id) {
    const planet = this.planets.get(id);
    if (!planet) return null;

    this._selectedPlanet?.setSelected(false);
    planet.setSelected(true);
    this._selectedPlanet = planet;
    this._focusedId = id;

    for (const p of this.planets.values()) {
      p.setDimmed(p.id !== id);
    }

    this._buildHyperlanes(planet);
    return planet;
  }

  /** Clears focus mode — every planet returns to normal brightness and any
   * hyperlane lines fade out and are removed. */
  clearFocus() {
    this._selectedPlanet?.setSelected(false);
    this._selectedPlanet = null;
    this._focusedId = null;

    for (const p of this.planets.values()) {
      p.setDimmed(false);
    }

    this._clearHyperlanes();
  }

  /** Builds glowing line(s) from `planet` to each of its connected sites
   * (planet.data.connections, the same array the sidebar's "Related
   * Websites" list already uses), fading them in with GSAP. */
  _buildHyperlanes(planet) {
    this._clearHyperlanes();

    const relatedIds = Array.isArray(planet.data.connections) ? planet.data.connections : [];
    const targets = relatedIds.map((id) => this.planets.get(id)).filter(Boolean);
    if (targets.length === 0) return;

    const group = new THREE.Group();
    group.name = "hyperlanes";

    for (const target of targets) {
      const points = [planet.object.position.clone(), target.object.position.clone()];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geometry, material);
      group.add(line);
      gsap.to(material, { opacity: 0.65, duration: 0.8, ease: "power2.out" });
    }

    this.group.add(group);
    this._hyperlaneGroup = group;
  }

  /** Fades out and disposes any active hyperlane lines */
  _clearHyperlanes() {
    if (!this._hyperlaneGroup) return;

    const group = this._hyperlaneGroup;
    this._hyperlaneGroup = null;

    for (const line of group.children) {
      gsap.killTweensOf(line.material);
      gsap.to(line.material, {
        opacity: 0,
        duration: 0.35,
        ease: "power1.in",
        onComplete: () => {
          line.geometry.dispose();
          line.material.dispose();
        },
      });
    }
    // Removed after the fade-out tween has had time to run; cheap enough
    // (a handful of lines max) not to need precise completion tracking.
    gsap.delayedCall(0.4, () => this.group.remove(group));
  }

  /** Called once per frame from main.js */
  update(delta, elapsed) {
    for (const planet of this.planets.values()) {
      planet.update(delta, elapsed);
    }
  }

  /* ========================================================================
     PLACEMENT — spreads each galaxy's planets around that galaxy's center
     using the same golden-angle technique as galaxy.js's own auto-placement,
     so adding more websites to a category never requires manual coordinates.
     ======================================================================== */

  _placeWithinGalaxy(galaxy, index, total) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;

    // Planets sit within a fraction of their galaxy's radius, leaving room
    // for the galaxy's own particle swarm to remain visible around them.
    const orbitRadius = galaxy.radius * (0.25 + (index / Math.max(total, 1)) * 0.5);
    const height = (Math.sin(index * 1.3) ) * galaxy.radius * 0.1;

    return new THREE.Vector3(
      galaxy.position.x + Math.cos(angle) * orbitRadius,
      galaxy.position.y + height,
      galaxy.position.z + Math.sin(angle) * orbitRadius
    );
  }

  /* ========================================================================
     CONFIG RESOLUTION — derives a planet's visuals from its galaxy's color
     plus a deterministic hash of its id. No per-website hardcoded styling.
     ======================================================================== */

  _resolvePlanetConfig(site, galaxy) {
    const hash = hashToUnit(site.id);

    return {
      // Prefer the website's own "color" field from websites.json (per the
      // data format spec); fall back to the parent galaxy's color if a
      // site doesn't define one. Either way, this stays fully data-driven.
      color: site.color ?? galaxy.color,
      size: 6 + hash * 4,
      // Roughly 1 in 4 planets gets a ring, 1 in 3 gets a moon — purely
      // derived from the hash, never authored per-site.
      hasRing: hash > 0.75,
      hasMoon: hash < 0.35 || hash > 0.85,
    };
  }

  /* ========================================================================
     INTERACTION — hover (scale up, glow, cursor, tooltip placeholder) and
     click (select only — sidebar opening comes in a future phase).
     ======================================================================== */

  _onPointerMove(event) {
    this._updatePointer(event);
    const planet = this._raycastPlanet();

    if (planet !== this._hoveredPlanet) {
      this._hoveredPlanet?.setHovered(false);
      planet?.setHovered(true);
      this._hoveredPlanet = planet;
      this.domElement.style.cursor = planet ? "pointer" : "";
    }

    // Reported every move (not just on change) so the tooltip can smoothly
    // follow the cursor via GSAP while it's hovering the same planet.
    this.onHover?.(planet, event);
  }

  _onClick(event) {
    this._updatePointer(event);
    const planet = this._raycastPlanet();

    // Click and search selection now share the same focus-mode path
    // (dim other planets, light up hyperlanes) — opening the sidebar UI
    // itself is still handled by whoever passed in onClick (main.js ->
    // ui.js), keeping PlanetManager unaware of sidebar/DOM specifics.
    if (planet) {
      this.focusPlanet(planet.id);
      const relatedWebsites = this._resolveRelatedWebsites(planet.data);
      this.onClick?.(planet, { ...planet.data, relatedWebsites });
    } else {
      this.clearFocus();
      this.onClick?.(null, null);
    }
  }

  /** Resolves a website's "connections" id array into full website objects */
  _resolveRelatedWebsites(site) {
    if (!Array.isArray(site.connections)) return [];
    return site.connections
      .map((id) => this.websitesById?.get(id))
      .filter(Boolean);
  }

  _updatePointer(event) {
    const rect = this.domElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _raycastPlanet() {
    this._raycaster.setFromCamera(this._pointer, this.camera);

    // Collect every planet's surface mesh once per raycast — cheap relative
    // to the geometry intersection test itself, and keeps Planet's internal
    // mesh structure private to planet.js (manager only knows about Planet).
    const targets = [];
    const meshToPlanet = new Map();
    for (const planet of this.planets.values()) {
      for (const mesh of planet.getRaycastTargets()) {
        targets.push(mesh);
        meshToPlanet.set(mesh, planet);
      }
    }

    const hits = this._raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return null;

    return meshToPlanet.get(hits[0].object) ?? null;
  }

  dispose() {
    this.domElement.removeEventListener("pointermove", this._onPointerMove);
    this.domElement.removeEventListener("click", this._onClick);
    for (const id of [...this.planets.keys()]) this.removePlanet(id);
  }
}

/** Deterministic 0..1 value derived from a string (same technique used
 * throughout the project — galaxy.js, planet.js — for stable "randomness") */
function hashToUnit(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9973;
  }
  return hash / 9973;
}
