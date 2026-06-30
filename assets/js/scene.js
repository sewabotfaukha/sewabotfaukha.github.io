// ==========================================================================
// scene.js — Three.js Scene construction
// Holds the THREE.Scene instance, base lighting/fog, the living deep-space
// environment (space.js), the category Galaxy system (galaxy.js), and the
// Planet Engine (planet.js + planetManager.js) representing every website.
// ==========================================================================

import * as THREE from "three";
import { createSpaceEnvironment } from "./space.js";
import { createGalaxySystem } from "./galaxy.js";
import { PlanetManager } from "./planetManager.js";

export async function createScene(camera, domElement, planetCallbacks = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  // Exponential fog gives the void depth — distant objects fade into black
  // rather than popping out sharply at the far clip plane.
  scene.fog = new THREE.FogExp2(0x05060a, 0.00025);

  // Minimal ambient light so future objects aren't pure silhouettes
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // A single directional light acting as a placeholder "sun"
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);

  // Living deep-space environment — see space.js for each layer's details.
  // Stored on the scene so main.js's render loop can call its update().
  const space = createSpaceEnvironment();
  scene.add(space.group);
  scene.userData.spaceUpdate = space.update;

  // Category Galaxy system — built from assets/data/galaxies.json, so new
  // categories can be added later without touching this file. The galaxies
  // array is exposed via scene.userData so other modules (camera fly-to,
  // search, sidebar, and the Planet Manager below) can reference each
  // galaxy's position/radius/color without re-loading the JSON.
  const galaxySystem = await createGalaxySystem();
  scene.add(galaxySystem.group);
  scene.userData.galaxyUpdate = galaxySystem.update;
  scene.userData.galaxies = galaxySystem.galaxies;
  // Exposed whole (not just .galaxies/.update) so Phase 9's intelligent
  // search can call galaxySystem.setFocusCategory() to dim other galaxies.
  scene.userData.galaxySystem = galaxySystem;

  // Planet Engine — every website from assets/data/websites.json becomes a
  // Planet, placed inside its category's galaxy. PlanetManager owns hover/
  // click raycasting against the canvas, so it needs the camera + DOM
  // element passed in from main.js. Hover/click callbacks are forwarded
  // straight through from main.js (which wires them to ui.js's tooltip and
  // sidebar) — scene.js itself stays unaware of any DOM/UI behavior.
  const planetManager = new PlanetManager(camera, domElement, planetCallbacks);
  await planetManager.buildFromData(galaxySystem.galaxies);
  scene.add(planetManager.group);
  scene.userData.planetManager = planetManager;
  scene.userData.planetUpdate = (delta, elapsed) => planetManager.update(delta, elapsed);

  return scene;
}
