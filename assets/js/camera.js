// ==========================================================================
// camera.js — Perspective camera setup + galaxy travel
// ==========================================================================

import * as THREE from "three";
import gsap from "gsap";

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    60,                                   // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1,                                  // near plane
    20000                                 // far plane — large universe scale
  );

  camera.position.set(0, 0, 50);

  return camera;
}

/** Keep camera aspect ratio correct on resize */
export function updateCameraAspect(camera) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/**
 * Smoothly flies the camera to "visit" a galaxy, easing both the camera's
 * position and the OrbitControls' orbit target so the controls stay in
 * sync (no snapping once the user drags again after the tween finishes).
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 * @param {{position: THREE.Vector3, radius: number}} galaxy - from galaxy.js
 * @param {object} [options]
 * @param {number} [options.duration=2.2] - tween duration in seconds
 * @param {Function} [options.onComplete] - called when the flight finishes
 */
export function flyToGalaxy(camera, controls, galaxy, options = {}) {
  const { duration = 2.2, onComplete } = options;

  // Approach the galaxy from a viewing distance proportional to its radius,
  // offset slightly so the camera doesn't fly straight through its center.
  const viewDistance = galaxy.radius * 2.6;
  const direction = new THREE.Vector3(0.4, 0.25, 1).normalize();
  const destination = galaxy.position.clone().add(
    direction.multiplyScalar(viewDistance)
  );

  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  tl.to(camera.position, {
    x: destination.x,
    y: destination.y,
    z: destination.z,
    duration,
    onUpdate: () => camera.updateProjectionMatrix(),
  });

  // Animate the orbit target alongside the camera so OrbitControls ends up
  // correctly centered on the galaxy once the user takes control again.
  tl.to(
    controls.target,
    {
      x: galaxy.position.x,
      y: galaxy.position.y,
      z: galaxy.position.z,
      duration,
      onComplete,
    },
    "<" // start at the same time as the camera position tween
  );

  return tl;
}

/**
 * Smoothly flies the camera to "visit" a single planet (used by Phase 9's
 * intelligent search). Same approach as flyToGalaxy — ease both the camera
 * position and the OrbitControls target together so the planet ends up
 * centered on screen with no snap once the user takes control again.
 *
 * @param {THREE.PerspectiveCamera} camera
 * @param {OrbitControls} controls
 * @param {Planet} planet - a Planet instance (planet.js), has .object.position + .radius
 * @param {object} [options]
 * @param {number} [options.duration=2]
 * @param {Function} [options.onComplete]
 */
export function flyToPlanet(camera, controls, planet, options = {}) {
  const { duration = 2, onComplete } = options;

  // View distance proportional to the planet's own radius so small and
  // large planets both end up framed nicely, not too close/too far.
  const viewDistance = Math.max(planet.radius * 7, 28);
  const direction = new THREE.Vector3(0.35, 0.2, 1).normalize();
  const targetPos = planet.object.position;
  const destination = targetPos.clone().add(direction.multiplyScalar(viewDistance));

  const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  tl.to(camera.position, {
    x: destination.x,
    y: destination.y,
    z: destination.z,
    duration,
    onUpdate: () => camera.updateProjectionMatrix(),
  });

  tl.to(
    controls.target,
    {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration,
      onComplete,
    },
    "<"
  );

  return tl;
}
