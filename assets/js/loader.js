// ==========================================================================
// loader.js — Loading screen orchestration & data preloading
// ==========================================================================

import { $, loadJSON, sleep } from "./utils.js";

/**
 * Drives the loading screen progress bar while data is fetched.
 * Returns the loaded data so main.js can pass it along to other modules.
 */
export async function runLoadingSequence() {
  const fill = $("loading-bar-fill");
  const status = $("loading-status");

  const steps = [
    { label: "Loading websites data...", weight: 40 },
    { label: "Loading connections data...", weight: 40 },
    { label: "Preparing universe...", weight: 20 },
  ];

  let progress = 0;
  const setProgress = (value) => {
    progress = value;
    if (fill) fill.style.width = `${progress}%`;
  };

  let websites = [];
  let connections = [];

  try {
    status.textContent = steps[0].label;
    websites = await loadJSON("assets/data/websites.json");
    setProgress(progress + steps[0].weight);

    status.textContent = steps[1].label;
    connections = await loadJSON("assets/data/connections.json");
    setProgress(progress + steps[1].weight);

    status.textContent = steps[2].label;
    await sleep(250); // brief pause for perceived smoothness
    setProgress(100);
  } catch (err) {
    console.error("[loader] Failed to load data:", err);
    status.textContent = "Failed to load data. Check console for details.";
    throw err;
  }

  return { websites, connections };
}

/** Fade out the loading screen, revealing the premium hero landing page */
export function hideLoadingScreen() {
  const loadingScreen = $("loading-screen");
  const hero = $("hero-landing");

  if (loadingScreen) {
    loadingScreen.classList.add("is-fading-out");
    loadingScreen.addEventListener(
      "animationend",
      () => loadingScreen.classList.add("is-hidden"),
      { once: true }
    );
  }

  // Hand off to hero.js, which owns the GSAP intro timeline for #hero-landing
  if (hero) {
    hero.dispatchEvent(new CustomEvent("loading-complete"));
  }
}
