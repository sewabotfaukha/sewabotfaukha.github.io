// ==========================================================================
// hero.js — Premium "AAA game intro" landing page behavior
// Owns: starfield particle canvas, GSAP intro timeline, mouse parallax,
// and the CTA -> app handoff. Waits for loader.js to signal data is ready.
// ==========================================================================

import gsap from "gsap";
import { $ } from "./utils.js";

let stars = [];
let starCanvas, starCtx;
let parallaxTarget = { x: 0, y: 0 };
let parallaxCurrent = { x: 0, y: 0 };

/** Entry point — called once the module loads */
function initHero() {
  const hero = $("hero-landing");
  if (!hero) return;

  setupStarfield();
  setupParallax();
  setupCTA();

  // Wait for loader.js (via main.js) to signal the loading sequence finished
  hero.addEventListener("loading-complete", playIntroTimeline, { once: true });
}

/* ==========================================================================
   STARFIELD — lightweight canvas particle system (no Three.js dependency)
   ========================================================================== */

function setupStarfield() {
  starCanvas = $("hero-stars-canvas");
  if (!starCanvas) return;

  starCtx = starCanvas.getContext("2d");
  resizeStarCanvas();
  generateStars();

  window.addEventListener("resize", () => {
    resizeStarCanvas();
    generateStars();
  });

  requestAnimationFrame(renderStars);
}

function resizeStarCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  starCanvas.width = window.innerWidth * dpr;
  starCanvas.height = window.innerHeight * dpr;
  starCanvas.style.width = `${window.innerWidth}px`;
  starCanvas.style.height = `${window.innerHeight}px`;
  starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function generateStars() {
  const density = Math.floor((window.innerWidth * window.innerHeight) / 9000);
  stars = Array.from({ length: density }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.3 + 0.2,
    baseAlpha: Math.random() * 0.6 + 0.2,
    twinkleSpeed: Math.random() * 0.015 + 0.004,
    twinklePhase: Math.random() * Math.PI * 2,
    parallaxFactor: Math.random() * 0.04 + 0.01, // depth — farther stars move less
  }));
}

function renderStars(time) {
  if (!starCtx) return;
  starCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const star of stars) {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.3;
    const alpha = Math.min(1, Math.max(0, star.baseAlpha + twinkle));

    const offsetX = parallaxCurrent.x * star.parallaxFactor * 40;
    const offsetY = parallaxCurrent.y * star.parallaxFactor * 40;

    starCtx.beginPath();
    starCtx.arc(star.x + offsetX, star.y + offsetY, star.radius, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    starCtx.fill();
  }

  requestAnimationFrame(renderStars);
}

/* ==========================================================================
   PARALLAX — mouse-driven movement of background + content layers
   ========================================================================== */

function setupParallax() {
  const bg = $("hero-bg");
  const content = $("hero-content");

  window.addEventListener("mousemove", (event) => {
    // Normalize to -1..1 range relative to viewport center
    parallaxTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
    parallaxTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  // Smoothly interpolate toward the target each frame for a fluid feel
  gsap.ticker.add(() => {
    parallaxCurrent.x += (parallaxTarget.x - parallaxCurrent.x) * 0.04;
    parallaxCurrent.y += (parallaxTarget.y - parallaxCurrent.y) * 0.04;

    if (bg) {
      gsap.set(bg, {
        x: parallaxCurrent.x * 18,
        y: parallaxCurrent.y * 14,
      });
    }
    if (content) {
      gsap.set(content, {
        x: parallaxCurrent.x * -8,
        y: parallaxCurrent.y * -6,
      });
    }
  });
}

/* ==========================================================================
   GSAP INTRO TIMELINE — fade, scale, floating, glow pulse, smooth transitions
   ========================================================================== */

function playIntroTimeline() {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl.to("#hero-landing", { opacity: 1, duration: 0.6, ease: "power1.out" })
    .to("#hero-kicker", { opacity: 1, y: 0, duration: 0.6 }, "+=0.1")
    .from("#hero-kicker", { y: 14 }, "<")
    .to(
      ".hero-title-line",
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.15,
        ease: "back.out(1.6)",
      },
      "-=0.2"
    )
    .from(".hero-title-line", { y: 40, scale: 0.85 }, "<")
    .to("#hero-subtitle", { opacity: 1, y: 0, duration: 0.7 }, "-=0.3")
    .from("#hero-subtitle", { y: 16 }, "<")
    .to(
      "#hero-cta",
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)" },
      "-=0.25"
    )
    .to("#hero-scroll-hint", { opacity: 1, duration: 0.6 }, "-=0.1");

  // Gentle continuous floating motion on the title (idle animation)
  gsap.to("#hero-title", {
    y: -10,
    duration: 3.2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: 1.4,
  });

  // Subtle floating on the CTA too, offset so it doesn't sync identically
  gsap.to("#hero-cta", {
    y: -6,
    duration: 2.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: 1.8,
  });
}

/* ==========================================================================
   CTA — "START EXPLORING" handoff into the main app
   ========================================================================== */

function setupCTA() {
  const cta = $("hero-cta");
  cta?.addEventListener("click", dismissHero);
}

function dismissHero() {
  const hero = $("hero-landing");
  if (!hero || hero.classList.contains("hero-dismissed")) return;

  hero.classList.add("hero-dismissed");

  const tl = gsap.timeline({
    onComplete: () => {
      hero.classList.add("is-hidden");
      // Tell main.js it's time to reveal the actual app UI
      document.dispatchEvent(new CustomEvent("hero-cta-clicked"));
    },
  });

  tl.to("#hero-content", { opacity: 0, y: -24, duration: 0.5, ease: "power2.in" })
    .to("#hero-scroll-hint", { opacity: 0, duration: 0.3 }, "<")
    .to("#hero-landing", { opacity: 0, duration: 0.6, ease: "power2.inOut" }, "-=0.1");
}

initHero();
