// ==========================================================================
// space.js — Living deep-space environment
// Builds: Milky Way band, nebula clouds (shader-based), background galaxy,
// floating dust, dense starfield, shooting stars, and a slow dynamic light.
// Everything here is either THREE.Points (single draw call) or a small
// number of shader-driven meshes, kept deliberately cheap so frame rate
// stays smooth even with thousands of particles on screen.
// ==========================================================================

import * as THREE from "three";

/* ==========================================================================
   SHARED CIRCULAR POINT SPRITE — THREE.PointsMaterial renders perfectly
   square points when no `map` is supplied (gl_PointCoord without a mask).
   At normal distance the squareness is hidden by small point size, but on
   close zoom (large gl_PointSize) it becomes an obvious square artifact.
   This soft radial-gradient texture, shared by every plain PointsMaterial
   in this file, masks each point into a clean soft circle instead.
   ========================================================================== */
let sharedCirclePointTexture = null;
function getCirclePointTexture() {
  if (sharedCirclePointTexture) return sharedCirclePointTexture;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  sharedCirclePointTexture = new THREE.CanvasTexture(canvas);
  sharedCirclePointTexture.needsUpdate = true;
  return sharedCirclePointTexture;
}

/**
 * Creates the full space environment and returns a group plus an update()
 * function the render loop calls every frame (drift, shooting stars, light).
 */
export function createSpaceEnvironment() {
  const group = new THREE.Group();
  group.name = "space-environment";

  const starfield = createStarfield();
  const milkyWay = createMilkyWayBand();
  const nebula = createNebulaClouds();
  const galaxy = createBackgroundGalaxy();
  const dust = createFloatingDust();
  const shootingStars = createShootingStars();
  const dynamicLight = createDynamicLight();

  group.add(
    starfield,
    milkyWay,
    nebula,
    galaxy,
    dust,
    shootingStars.group,
    dynamicLight.light
  );

  // Clock-independent slow rotation speeds (radians/second) — keeps the
  // whole environment feeling alive without any per-frame allocation.
  const ROTATION_SPEEDS = {
    starfield: 0.0006,
    milkyWay: 0.0009,
    nebula: 0.0004,
    galaxy: 0.0003,
    dust: 0.0015,
  };

  /** Called once per frame from main.js's animation loop */
  function update(delta, elapsed) {
    starfield.rotation.y += ROTATION_SPEEDS.starfield * delta;
    milkyWay.rotation.z += ROTATION_SPEEDS.milkyWay * delta;
    nebula.rotation.y += ROTATION_SPEEDS.nebula * delta;
    galaxy.rotation.z -= ROTATION_SPEEDS.galaxy * delta;
    dust.rotation.y += ROTATION_SPEEDS.dust * delta;

    // Nebula shader animates its own internal noise via a time uniform
    nebula.children.forEach((mesh) => {
      if (mesh.material.uniforms?.uTime) {
        mesh.material.uniforms.uTime.value = elapsed;
      }
    });

    shootingStars.update(delta, elapsed);
    dynamicLight.update(elapsed);
  }

  return { group, update };
}

/* ==========================================================================
   STARFIELD — dense field of thousands of stars (single draw call)
   ========================================================================== */

function createStarfield(starCount = 9000, radius = 4500) {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  const color = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const r = radius * (0.3 + Math.random() * 0.7);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const tint = Math.random();
    if (tint > 0.93) color.setHSL(0.06, 0.65, 0.85);      // warm amber
    else if (tint > 0.82) color.setHSL(0.62, 0.55, 0.85); // cool blue
    else color.setHSL(0.0, 0.0, 0.92);                    // near-white

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 1.8 + 0.6;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Custom shader so star size attenuates with distance but twinkles subtly
  // via a cheap per-vertex sine — avoids a second pass or extra geometry.
  const material = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
    vertexShader: /* glsl */ `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const starfield = new THREE.Points(geometry, material);
  starfield.name = "starfield";
  return starfield;
}

/* ==========================================================================
   MILKY WAY — a flattened, tilted disc of points simulating the galactic
   band visible across the sky.
   ========================================================================== */

function createMilkyWayBand(starCount = 7000, radius = 3200) {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const color = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    // Bias distribution toward the disc plane (thin in Y) using a Gaussian-
    // like approximation (sum of randoms), giving a denser galactic band.
    const angle = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.5) * radius;
    const thickness = (Math.random() + Math.random() + Math.random() - 1.5) * 80;

    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = thickness;
    positions[i * 3 + 2] = Math.sin(angle) * r;

    // Milky Way core glows warm white/blue, fading cooler toward the edges
    const distRatio = r / radius;
    color.setHSL(0.58 - distRatio * 0.1, 0.4, 0.75 - distRatio * 0.25);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 3.5,
    sizeAttenuation: true,
    vertexColors: true,
    map: getCirclePointTexture(),
    alphaMap: getCirclePointTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const band = new THREE.Points(geometry, material);
  band.name = "milky-way";
  band.rotation.x = THREE.MathUtils.degToRad(20);
  band.rotation.z = THREE.MathUtils.degToRad(35);
  return band;
}

/* ==========================================================================
   NEBULA — soft volumetric-looking clouds via a custom shader plane
   (cheap: just a few large billboarded quads, not a particle system).
   ========================================================================== */

function createNebulaClouds() {
  const group = new THREE.Group();
  group.name = "nebula";

  const configs = [
    { pos: [800, 200, -1800], scale: 1600, hue: 0.62, opacity: 0.5 },
    { pos: [-1200, -300, -2200], scale: 1900, hue: 0.78, opacity: 0.4 },
    { pos: [400, -500, 2000], scale: 1400, hue: 0.55, opacity: 0.35 },
  ];

  for (const cfg of configs) {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color().setHSL(cfg.hue, 0.65, 0.55) },
        uOpacity: { value: cfg.opacity },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      // Lightweight fractal-ish noise (2 octaves of sine) — cheap enough
      // for full-screen-sized billboards without a real noise texture.
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 centered = vUv - 0.5;
          float dist = length(centered) * 2.0;
          float falloff = smoothstep(1.0, 0.0, dist);

          vec2 drift = vec2(uTime * 0.004, uTime * 0.003);
          float n1 = noise(vUv * 3.0 + drift);
          float n2 = noise(vUv * 6.0 - drift * 1.5);
          float cloud = (n1 * 0.6 + n2 * 0.4);

          float alpha = falloff * cloud * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...cfg.pos);
    mesh.scale.set(cfg.scale, cfg.scale, 1);
    group.add(mesh);
  }

  return group;
}

/* ==========================================================================
   BACKGROUND GALAXY — a distant spiral-like disc of particles, far away,
   suggesting another galaxy visible from within our own starfield.
   ========================================================================== */

function createBackgroundGalaxy(starCount = 3000, radius = 600) {
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const color = new THREE.Color();

  const arms = 3;
  for (let i = 0; i < starCount; i++) {
    const armOffset = (i % arms) * ((Math.PI * 2) / arms);
    const t = Math.random();
    const angle = t * Math.PI * 4 + armOffset;
    const r = t * radius;

    // Slight scatter perpendicular to the spiral arm for thickness
    const scatter = (Math.random() - 0.5) * radius * 0.15;

    positions[i * 3] = Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * scatter;
    positions[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.05;
    positions[i * 3 + 2] = Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * scatter;

    color.setHSL(0.66 - t * 0.15, 0.5, 0.6 + t * 0.2);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 4,
    sizeAttenuation: true,
    vertexColors: true,
    map: getCirclePointTexture(),
    alphaMap: getCirclePointTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const galaxy = new THREE.Points(geometry, material);
  galaxy.name = "background-galaxy";
  galaxy.position.set(-3200, 900, -3800);
  galaxy.rotation.x = THREE.MathUtils.degToRad(55);
  return galaxy;
}

/* ==========================================================================
   FLOATING DUST — fine particles close to the camera's orbit range,
   giving a sense of scale and movement through space (No Man's Sky feel).
   ========================================================================== */

function createFloatingDust(particleCount = 1500, radius = 350) {
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const r = Math.random() * radius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.9,
    sizeAttenuation: true,
    color: 0xaeb8ff,
    map: getCirclePointTexture(),
    alphaMap: getCirclePointTexture(),
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const dust = new THREE.Points(geometry, material);
  dust.name = "floating-dust";
  return dust;
}

/* ==========================================================================
   SHOOTING STARS — a small pool of short-lived streak particles that
   periodically launch across the sky. Pooled/reused, not recreated per
   shot, to keep garbage collection pressure near zero.
   ========================================================================== */

function createShootingStars(poolSize = 6) {
  const group = new THREE.Group();
  group.name = "shooting-stars";

  const pool = [];

  for (let i = 0; i < poolSize; i++) {
    // Each shooting star is a short line with a fading-tail gradient,
    // built once and reused — only its transform/opacity changes at runtime.
    const geometry = new THREE.BufferGeometry();
    const length = 60;
    const positions = new Float32Array([0, 0, 0, -length, 0, 0]);
    const alphas = new Float32Array([1, 0]);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0xffffff) } },
      vertexShader: /* glsl */ `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(uColor, vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geometry, material);
    line.visible = false;
    group.add(line);

    pool.push({
      mesh: line,
      active: false,
      progress: 0,
      duration: 0,
      nextSpawnAt: Math.random() * 6, // stagger initial launches
    });
  }

  function launch(star, elapsed) {
    const radius = 1800;
    const start = new THREE.Vector3(
      (Math.random() - 0.5) * radius,
      Math.random() * radius * 0.5 + 200,
      (Math.random() - 0.5) * radius
    );

    star.mesh.position.copy(start);
    // Random streak direction, mostly downward/sideways like a real meteor
    star.mesh.rotation.z = Math.random() * Math.PI * 2;
    star.mesh.rotation.x = (Math.random() - 0.5) * 0.6;

    star.active = true;
    star.progress = 0;
    star.duration = 0.7 + Math.random() * 0.5;
    star.mesh.visible = true;
  }

  function update(delta, elapsed) {
    for (const star of pool) {
      if (!star.active) {
        if (elapsed >= star.nextSpawnAt) {
          launch(star, elapsed);
        }
        continue;
      }

      star.progress += delta / star.duration;

      if (star.progress >= 1) {
        star.active = false;
        star.mesh.visible = false;
        // Schedule the next launch randomly between 3 and 10 seconds out
        star.nextSpawnAt = elapsed + 3 + Math.random() * 7;
        continue;
      }

      // Travel forward along local -X (the streak's own length axis)
      const travelDistance = 900 * delta;
      star.mesh.translateX(-travelDistance);

      // Fade in quickly, fade out near the end of its life
      const fadeIn = Math.min(star.progress / 0.15, 1);
      const fadeOut = Math.min((1 - star.progress) / 0.3, 1);
      star.mesh.material.uniforms.uColor.value.setScalar(Math.min(fadeIn, fadeOut));
    }
  }

  return { group, update };
}

/* ==========================================================================
   DYNAMIC LIGHTING — a slow-shifting point light simulating a distant,
   unseen star or stellar event subtly tinting the scene over time.
   ========================================================================== */

function createDynamicLight() {
  const light = new THREE.PointLight(0x5b8cff, 1.2, 6000, 1.2);
  light.position.set(600, 300, -400);

  const baseColor = new THREE.Color(0x5b8cff);
  const altColor = new THREE.Color(0x8a5bff);
  const blended = new THREE.Color();

  function update(elapsed) {
    // Slow oscillation between two hues + a gentle intensity breathe —
    // cheap (one color lerp + one sine) but reads as "alive" lighting.
    const t = (Math.sin(elapsed * 0.08) + 1) / 2;
    blended.copy(baseColor).lerp(altColor, t);
    light.color.copy(blended);
    light.intensity = 1.0 + Math.sin(elapsed * 0.15) * 0.4;
  }

  return { light, update };
}
