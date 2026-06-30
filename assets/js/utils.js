// ==========================================================================
// utils.js — Generic helper functions shared across modules
// ==========================================================================

/** Shorthand for document.getElementById */
export function $(id) {
  return document.getElementById(id);
}

/** Clamp a number between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/** Simple async sleep, useful for staged loading sequences */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch and parse a local JSON file (used for data/websites.json, data/connections.json) */
export async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load JSON at ${path}: ${response.status}`);
  }
  return response.json();
}

/** Debounce — limits how often a function can fire (used for search input) */
export function debounce(fn, delay = 200) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Format a number with fixed decimals, used for HUD coordinate display */
export function formatCoord(value) {
  return value.toFixed(2);
}
