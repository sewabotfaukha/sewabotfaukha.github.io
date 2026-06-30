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

/* ==========================================================================
   INTELLIGENT SEARCH — Phase 9
   Builds a flat, pre-normalized search index over the website list once
   (O(n)), so every keystroke afterward is a cheap O(n) scan over already-
   lowercased strings instead of re-deriving fields each time. For the
   dataset sizes this app targets (hundreds of sites) this stays fast
   without needing a trie/inverted index.
   ========================================================================== */

/** Common short-hand search terms mapped to one or more category ids —
 * lets "git"/"dev" find the developer galaxy, "ai"/"ml" find AI, etc.
 * Pure-data lookup table, easy to extend without touching search logic. */
export const CATEGORY_ALIASES = {
  git: ["developer", "coding"],
  dev: ["developer"],
  developer: ["developer"],
  code: ["coding", "developer"],
  coding: ["coding"],
  ai: ["ai"],
  ml: ["ai"],
  "machine learning": ["ai"],
  social: ["social"],
  "social media": ["social"],
  cloud: ["cloud"],
  hosting: ["cloud"],
  server: ["cloud"],
  money: ["finance"],
  finance: ["finance"],
  bank: ["finance"],
  crypto: ["finance"],
  pay: ["finance"],
  game: ["gaming"],
  games: ["gaming"],
  gaming: ["gaming"],
  play: ["gaming"],
  news: ["news"],
  media: ["news", "entertainment"],
  shop: ["shopping"],
  shopping: ["shopping"],
  store: ["shopping"],
  ecommerce: ["shopping"],
  video: ["entertainment"],
  stream: ["entertainment"],
  streaming: ["entertainment"],
  music: ["entertainment"],
  movie: ["entertainment"],
  learn: ["education"],
  course: ["education"],
  education: ["education"],
  school: ["education"],
  search: ["search"],
};

/** Extracts a bare, lowercase domain ("github.com") from a full URL string */
export function extractDomain(url) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return String(url).toLowerCase();
  }
}

/**
 * Builds the search index once after websites.json loads. Each entry keeps
 * a reference to the original site object plus pre-lowercased fields, so
 * searchWebsites() never has to call .toLowerCase() per keystroke.
 */
export function buildSearchIndex(websites = []) {
  return websites.map((site) => ({
    site,
    id: site.id,
    nameLower: (site.name || "").toLowerCase(),
    domainLower: extractDomain(site.url),
    categoryLower: (site.category || "").toLowerCase(),
    ownerLower: (site.owner || "").toLowerCase(),
  }));
}

/**
 * Ranked multi-field search across name / domain / category / owner / alias.
 * Scoring (higher = better): exact id/name match > startsWith > substring,
 * with a small bonus for matches on more "important" fields (name > domain
 * > category > owner). Alias hits resolve to a category match.
 */
export function searchWebsites(index, rawQuery, limit = 8) {
  const query = (rawQuery || "").trim().toLowerCase();
  if (!query) return [];

  const aliasCategories = CATEGORY_ALIASES[query] || [];
  const scored = [];

  for (const entry of index) {
    let score = 0;

    if (entry.nameLower === query || entry.id.toLowerCase() === query) score = Math.max(score, 100);
    else if (entry.nameLower.startsWith(query)) score = Math.max(score, 80);
    else if (entry.nameLower.includes(query)) score = Math.max(score, 60);

    if (entry.domainLower === query) score = Math.max(score, 90);
    else if (entry.domainLower.startsWith(query)) score = Math.max(score, 70);
    else if (entry.domainLower.includes(query)) score = Math.max(score, 50);

    if (entry.categoryLower === query) score = Math.max(score, 65);
    else if (entry.categoryLower.includes(query)) score = Math.max(score, 40);

    if (entry.ownerLower === query) score = Math.max(score, 55);
    else if (entry.ownerLower.includes(query)) score = Math.max(score, 35);

    if (aliasCategories.includes(entry.categoryLower)) score = Math.max(score, 45);

    if (score > 0) scored.push({ ...entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.nameLower.localeCompare(b.nameLower));
  return scored.slice(0, limit);
}

/* ==========================================================================
   SEARCH HISTORY — last 10 searches, persisted via localStorage so it
   survives reloads. Pure data helpers; ui.js owns rendering/wiring.
   ========================================================================== */
const SEARCH_HISTORY_KEY = "internetmap.searchHistory";
const SEARCH_HISTORY_LIMIT = 10;

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(term) {
  const clean = (term || "").trim();
  if (!clean) return getSearchHistory();

  const existing = getSearchHistory().filter(
    (entry) => entry.toLowerCase() !== clean.toLowerCase()
  );
  const updated = [clean, ...existing].slice(0, SEARCH_HISTORY_LIMIT);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (e.g. private mode) — fail silently, search
    // itself still works without history persistence.
  }
  return updated;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    /* noop */
  }
}
