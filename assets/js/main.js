// ==========================================================================
// main.js — Application entry point
// Connects: loader -> scene (space + galaxy system + planet engine) ->
//           camera -> renderer -> controls -> postprocessing (bloom) -> ui
// ==========================================================================

import * as THREE from "three";
import { $ } from "./utils.js";
import { runLoadingSequence, hideLoadingScreen } from "./loader.js";
import { createScene } from "./scene.js";
import { createCamera, updateCameraAspect, flyToGalaxy, flyToPlanet } from "./camera.js";
import { createRenderer, resizeRenderer } from "./renderer.js";
import { createControls } from "./controls.js";
import { createComposer, resizeComposer } from "./postprocessing.js";
import { initUI, updateHUD, handlePlanetHover, handlePlanetClick } from "./ui.js";
import { createHyperlaneNetwork } from "./hyperlane.js";

/** Application state shared across the render loop */
const state = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  composer: null,
  websites: [],
  connections: [],
  hyperlaneNetwork: null,
};

const clock = new THREE.Clock();

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

async function bootstrap() {
  // 1. Load data + drive the loading screen progress bar
  const { websites, connections } = await runLoadingSequence();
  state.websites = websites;
  state.connections = connections;

  // 2. Build the Three.js core: scene, camera, renderer, controls, bloom
  const canvas = $("scene-canvas");
  state.camera = createCamera();
  // createScene is async: loads galaxies.json + websites.json, and wires
  // PlanetManager's hover/click raycasting to this camera + canvas. Hover
  // shows the tooltip; click opens the sidebar — both handled in ui.js.
  state.scene = await createScene(state.camera, canvas, {
    onHover: handlePlanetHover,
    onClick: handlePlanetClick,
  });
  state.renderer = createRenderer(canvas);
  state.controls = createControls(state.camera, state.renderer.domElement);
  state.composer = createComposer(state.renderer, state.scene, state.camera);

  // 3b. Build the Hyperlane Network (Phase 10) — curved glowing lanes
  //     between connected websites, loaded entirely from connections.json.
  //     Added to the scene AFTER PlanetManager so getPlanetById() resolves.
  state.hyperlaneNetwork = await createHyperlaneNetwork({
    planetManager: state.scene.userData.planetManager,
    camera: state.camera,
    domElement: canvas,
    onHover: (lane, event) => {
      if (lane) {
        showHyperlaneTooltip(lane, event);
        canvas.style.cursor = "pointer";
      } else {
        hideHyperlaneTooltip();
      }
    },
  });
  state.scene.add(state.hyperlaneNetwork.group);
  state.scene.userData.hyperlaneNetwork = state.hyperlaneNetwork;

  // 3. Wire up DOM UI (search, sidebar, audio toggle) — pass the galaxy
  // list + a visit() callback so ui.js can let the user travel to a galaxy
  // (e.g. selecting one from search results) without main.js knowing about
  // DOM specifics, and without ui.js knowing about Three.js internals.
  initUI({
    galaxies: state.scene.userData.galaxies,
    websites: state.websites,
    planetManager: state.scene.userData.planetManager,
    galaxySystem: state.scene.userData.galaxySystem,
    hyperlaneNetwork: state.hyperlaneNetwork,
    visitGalaxy: (galaxy) =>
      flyToGalaxy(state.camera, state.controls, galaxy),
    visitPlanet: (planet, options) =>
      flyToPlanet(state.camera, state.controls, planet, options),
  });

  // 4. Start rendering immediately (scene exists behind the hero landing)
  window.addEventListener("resize", onResize);
  requestAnimationFrame(animate);

  // 5. Reveal the premium hero landing once data is ready
  hideLoadingScreen();

  // 6. When the user clicks "START EXPLORING" in hero.js, reveal the app UI
  document.addEventListener("hero-cta-clicked", revealApp, { once: true });

  console.log(
    `[main] Internet Map foundation ready — ${state.websites.length} websites, ${state.connections.length} connections loaded.`
  );
}

/** Reveal the app container (canvas UI, sidebar, HUD) after the hero intro */
function revealApp() {
  const landing = $("landing-container");
  if (landing) {
    landing.setAttribute("aria-hidden", "false");
    landing.classList.add("is-fading-in");
  }
}

function onResize() {
  updateCameraAspect(state.camera);
  resizeRenderer(state.renderer);
  resizeComposer(state.composer);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Animate the living space environment (Milky Way drift, nebula shader
  // time, shooting star launches, dynamic light color/intensity breathing)
  state.scene.userData.spaceUpdate?.(delta, elapsed);

  // Animate the galaxy system (per-galaxy rotation + glow pulse + label fade)
  state.scene.userData.galaxyUpdate?.(delta, elapsed);

  // Animate every planet (rotation, floating, glow pulse, cloud drift, moons)
  state.scene.userData.planetUpdate?.(delta, elapsed);

  // Animate hyperlane network (uniform uTime, smooth highlight/dim/hover lerp)
  state.hyperlaneNetwork?.update(delta, elapsed);

  state.controls.update(); // required every frame for damping/inertia to work
  state.composer.render(); // renders scene through the bloom post-processing chain

  trackFPS();
  updateHUD(state.camera, fps);
}

/** Lightweight FPS counter sampled once per second */
function trackFPS() {
  frameCount += 1;
  const now = performance.now();
  const elapsed = now - lastFrameTime;

  if (elapsed >= 1000) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastFrameTime = now;
  }
}

/** Show the hyperlane hover tooltip (Phase 10) — "Source ➜ Target" label */
function showHyperlaneTooltip(lane, event) {
  const tooltip = $("hyperlane-tooltip");
  if (!tooltip) return;

  const srcName = lane.sourcePlanet?.data?.name ?? lane.source;
  const tgtName = lane.targetPlanet?.data?.name ?? lane.target;
  $("hyperlane-tooltip-label").textContent = `${srcName} ➜ ${tgtName}`;

  tooltip.hidden = false;
  tooltip.style.left = `${event.clientX + 14}px`;
  tooltip.style.top = `${event.clientY - 28}px`;
}

function hideHyperlaneTooltip() {
  const tooltip = $("hyperlane-tooltip");
  if (tooltip) tooltip.hidden = true;
}

bootstrap().catch((err) => {
  console.error("[main] Fatal error during bootstrap:", err);
  const status = $("loading-status");
  if (status) status.textContent = "Something went wrong. Check console for details.";
});
