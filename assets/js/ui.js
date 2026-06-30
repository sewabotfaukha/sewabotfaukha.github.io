// ==========================================================================
// ui.js — DOM/UI wiring: search, sidebar, audio toggle, HUD, planet tooltip
// initUI() accepts the galaxy list + visitGalaxy() (camera fly-to), plus
// exposes handlePlanetHover/handlePlanetClick for main.js to forward
// PlanetManager's raycaster callbacks into — keeping all DOM/GSAP logic
// for the sidebar and tooltip in this single file.
// ==========================================================================

import gsap from "gsap";
import { $, debounce, formatCoord, buildSearchIndex, searchWebsites, getSearchHistory, addSearchHistory, clearSearchHistory } from "./utils.js";

let sidebarTimeline = null;
let tooltipQuickToX = null;
let tooltipQuickToY = null;

/** Module-level context set once by initUI() — referenced by the search,
 * focus-mode, and click/hover handlers below so they don't need every
 * dependency threaded through as a parameter. */
const ctx = {
  galaxies: [],
  searchIndex: [],
  visitGalaxy: null,
  visitPlanet: null,
  planetManager: null,
  galaxySystem: null,
  hyperlaneNetwork: null,
};

/**
 * Wire up static UI interactions.
 * @param {object} [context]
 * @param {Array} [context.galaxies] - galaxy list from scene.userData.galaxies
 * @param {Array} [context.websites] - full website list (websites.json), used to build the Phase 9 search index
 * @param {object} [context.planetManager] - PlanetManager instance, for resolving search results -> live Planet objects + focus mode
 * @param {object} [context.galaxySystem] - galaxy system instance, for dimming other galaxies during focus mode
 * @param {Function} [context.visitGalaxy] - (galaxy) => void, flies the camera there
 * @param {Function} [context.visitPlanet] - (planet, options) => void, cinematic camera fly to a planet (Phase 9)
 */
export function initUI({
  galaxies = [],
  websites = [],
  planetManager = null,
  galaxySystem = null,
  hyperlaneNetwork = null,
  visitGalaxy = null,
  visitPlanet = null,
} = {}) {
  ctx.galaxies = galaxies;
  ctx.searchIndex = buildSearchIndex(websites);
  ctx.planetManager = planetManager;
  ctx.galaxySystem = galaxySystem;
  ctx.hyperlaneNetwork = hyperlaneNetwork;
  ctx.visitGalaxy = visitGalaxy;
  ctx.visitPlanet = visitPlanet;

  initSidebar();
  initAudioToggle();
  initSearch();
  initTooltip();
}

function initSidebar() {
  const sidebar = $("sidebar");
  const closeBtn = $("sidebar-close");

  // Closing the sidebar manually also exits Phase 9 focus mode (un-dims
  // every planet/galaxy, fades out the blur overlay + focus label).
  closeBtn?.addEventListener("click", () => exitFocusMode());

  // Click-away: clicking the canvas with nothing under the cursor should
  // also close the sidebar, matching the "click only selects" planet
  // behavior — handled here since planetManager.js reports null on miss.
  sidebar?.addEventListener("click", (event) => event.stopPropagation());
}

/* ==========================================================================
   SIDEBAR — slides in from the right with GSAP, shared by galaxy search
   results and planet clicks. Content is swapped via innerHTML; only the
   slide/fade transform is animated, so re-opening is cheap and lag-free.
   ========================================================================== */

/** Populate and reveal the sidebar with a galaxy's details */
function showGalaxySidebar(galaxy) {
  const content = $("sidebar-content");
  if (!content) return;

  content.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-galaxy-swatch" style="background:${galaxy.color};"></div>
      <div>
        <h2 class="sidebar-title">${escapeHTML(galaxy.name)} Galaxy</h2>
        <p class="sidebar-subtitle">Category overview</p>
      </div>
    </div>
    <p class="sidebar-description">${escapeHTML(galaxy.description || "")}</p>
  `;

  openSidebar();
}

/**
 * Populate and reveal the sidebar with a website/planet's full details.
 * @param {object} site - website data (+ relatedWebsites) from
 *   planetManager.js's onClick callback, matching websites.json's format.
 */
function showPlanetSidebar(site) {
  const content = $("sidebar-content");
  if (!content) return;

  const visitors = formatVisitors(site.visitors);
  const founded = site.founded ?? "—";

  // Phase 10: use hyperlane graph as authoritative connection list (richer
  // than the static site.connections[] from websites.json, and guaranteed
  // in sync with what's actually rendered as lanes in the scene).
  const hyperlaneConnections = ctx.hyperlaneNetwork?.getConnectionsForSite(site.id) ?? [];
  const related = hyperlaneConnections.length > 0
    ? hyperlaneConnections
    : (Array.isArray(site.relatedWebsites) ? site.relatedWebsites : []);

  // Group by category for the "Category Connections" summary line
  const categoryCount = related.reduce((acc, r) => {
    const cat = capitalize(r.category ?? "other");
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const categoryBadges = Object.entries(categoryCount)
    .map(([cat, n]) => `<span class="sidebar-conn-badge">${escapeHTML(cat)} (${n})</span>`)
    .join(" ");

  content.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo" style="background:${site.color ?? "#5b8cff"};">
        ${escapeHTML((site.name || "?").charAt(0))}
      </div>
      <div>
        <h2 class="sidebar-title">${escapeHTML(site.name)}</h2>
        <p class="sidebar-subtitle">${escapeHTML(capitalize(site.category))}</p>
      </div>
    </div>

    <p class="sidebar-description">${escapeHTML(site.description || "")}</p>

    <dl class="sidebar-meta">
      <div class="sidebar-meta-row">
        <dt>Owner</dt><dd>${escapeHTML(site.owner || "—")}</dd>
      </div>
      <div class="sidebar-meta-row">
        <dt>Founded</dt><dd>${escapeHTML(String(founded))}</dd>
      </div>
      <div class="sidebar-meta-row">
        <dt>Visitors</dt><dd>${escapeHTML(visitors)}</dd>
      </div>
    </dl>

    ${related.length > 0 ? `
    <div class="sidebar-related">
      <h3 class="sidebar-related-title">
        Connected Websites
        <span class="sidebar-conn-count">${related.length}</span>
      </h3>
      ${categoryBadges ? `<div class="sidebar-conn-categories">${categoryBadges}</div>` : ""}
      <ul class="sidebar-related-list">
        ${related.map((r) => `
          <li>
            <button type="button" class="sidebar-conn-item" data-fly-to="${escapeAttr(r.id)}">
              <span class="sidebar-related-dot" style="background:${r.color ?? "#5b8cff"};"></span>
              <span class="sidebar-conn-name">${escapeHTML(r.name)}</span>
              <span class="sidebar-conn-cat">${escapeHTML(capitalize(r.category))}</span>
            </button>
          </li>
        `).join("")}
      </ul>
    </div>` : ""}

    <a
      class="sidebar-visit-btn"
      href="${escapeAttr(site.url || "#")}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit Website
    </a>
  `;

  // Wire up "click name → camera fly" for connected websites (Phase 10)
  content.querySelectorAll("[data-fly-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSite = ctx.planetManager?.getPlanetById(btn.dataset.flyTo)?.data;
      if (targetSite) focusOnSite(targetSite);
    });
  });

  openSidebar();
}

/** Slide the sidebar in from the right with GSAP, killing any in-flight tween */
function openSidebar() {
  const sidebar = $("sidebar");
  if (!sidebar) return;

  sidebar.removeAttribute("hidden");
  sidebarTimeline?.kill();

  sidebarTimeline = gsap.timeline()
    .fromTo(
      sidebar,
      { xPercent: 100, opacity: 0 },
      { xPercent: 0, opacity: 1, duration: 0.55, ease: "power3.out" }
    )
    .fromTo(
      "#sidebar-content > *",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" },
      "-=0.25"
    );
}

/** Slide the sidebar back out, then hide it so it stops catching clicks */
function closeSidebar() {
  const sidebar = $("sidebar");
  if (!sidebar || sidebar.hasAttribute("hidden")) return;

  sidebarTimeline?.kill();
  sidebarTimeline = gsap.to(sidebar, {
    xPercent: 100,
    opacity: 0,
    duration: 0.4,
    ease: "power2.in",
    onComplete: () => sidebar.setAttribute("hidden", ""),
  });
}

function formatVisitors(visitors) {
  if (typeof visitors !== "number") return "—";
  if (visitors >= 1_000_000_000) return `${(visitors / 1_000_000_000).toFixed(1)}B / mo`;
  if (visitors >= 1_000_000) return `${(visitors / 1_000_000).toFixed(0)}M / mo`;
  if (visitors >= 1_000) return `${(visitors / 1_000).toFixed(0)}K / mo`;
  return String(visitors);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function initAudioToggle() {
  const btn = $("audio-toggle");
  const icon = $("audio-icon");

  let isMuted = true;

  btn?.addEventListener("click", () => {
    isMuted = !isMuted;
    btn.setAttribute("aria-pressed", String(!isMuted));
    icon.textContent = isMuted ? "🔈" : "🔊";
    // Actual audio playback will be implemented in a future phase
  });
}

/* ==========================================================================
   PHASE 9 — INTELLIGENT SEARCH
   Multi-field search (name / domain / category / owner / alias) over the
   pre-built index from utils.js, with a Google-Earth-style autocomplete
   dropdown: arrow keys move a highlighted result, Enter selects it, Esc
   closes the dropdown. Selecting a result cinematically flies the camera
   to that planet and enters Focus Mode (see focusOnSite() below).
   ========================================================================== */

let searchActiveIndex = -1;
let searchCurrentResults = []; // last rendered list of {site,...} entries

function initSearch() {
  const input = $("search-input");
  const results = $("search-results");
  if (!input || !results) return;

  const runQuery = (query) => {
    const trimmed = query.trim();

    if (!trimmed) {
      renderHistoryDropdown(input, results);
      return;
    }

    const matches = searchWebsites(ctx.searchIndex, trimmed, 8);
    searchCurrentResults = matches;
    searchActiveIndex = -1;

    if (matches.length === 0) {
      renderEmptyState(results);
      return;
    }

    renderResultsDropdown(results, matches, trimmed);
  };

  const handleInput = debounce((event) => runQuery(event.target.value), 150);
  input.addEventListener("input", handleInput);

  // Show search history as soon as the user focuses an empty input —
  // feels like a real search bar's "recent searches" affordance.
  input.addEventListener("focus", () => {
    if (!input.value.trim()) renderHistoryDropdown(input, results);
  });

  input.addEventListener("keydown", (event) => {
    if (results.hidden) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveResult(results, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveResult(results, -1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const items = results.querySelectorAll("[data-result-index], [data-history-term]");
      const index = searchActiveIndex >= 0 ? searchActiveIndex : 0;
      const target = items[index];
      if (target) target.click();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown(results);
      input.blur();
    }
  });

  // Click-away closes the dropdown without clearing the typed query.
  document.addEventListener("click", (event) => {
    if (!results.contains(event.target) && event.target !== input) {
      closeDropdown(results);
    }
  });

  // Delegate clicks on result/history items — list is re-rendered on every
  // keystroke so a single listener on the container avoids re-binding.
  results.addEventListener("click", (event) => {
    const resultBtn = event.target.closest("[data-result-index]");
    if (resultBtn) {
      const entry = searchCurrentResults[Number(resultBtn.dataset.resultIndex)];
      if (entry) selectSearchResult(entry, input, results);
      return;
    }

    const historyBtn = event.target.closest("[data-history-term]");
    if (historyBtn) {
      input.value = historyBtn.dataset.historyTerm;
      runQuery(input.value);
      return;
    }

    const clearBtn = event.target.closest("[data-clear-history]");
    if (clearBtn) {
      clearSearchHistory();
      renderHistoryDropdown(input, results);
    }
  });
}

function moveActiveResult(results, delta) {
  const items = Array.from(results.querySelectorAll("[data-result-index], [data-history-term]"));
  if (items.length === 0) return;

  searchActiveIndex = (searchActiveIndex + delta + items.length) % items.length;

  items.forEach((item, i) => item.classList.toggle("is-active", i === searchActiveIndex));
  items[searchActiveIndex]?.scrollIntoView({ block: "nearest" });
}

function closeDropdown(results) {
  results.hidden = true;
  results.innerHTML = "";
  searchActiveIndex = -1;
}

/** Renders the ranked search results, with the matched substring bolded */
function renderResultsDropdown(results, matches, query) {
  results.hidden = false;
  results.innerHTML = matches
    .map(
      (entry, index) => `
      <button
        type="button"
        class="search-result-item"
        data-result-index="${index}"
        role="option"
      >
        <span class="search-result-swatch" style="background:${entry.site.color ?? "#5b8cff"};"></span>
        <span class="search-result-text">
          <span class="search-result-name">${highlightMatch(entry.site.name, query)}</span>
          <span class="search-result-meta">${escapeHTML(capitalize(entry.categoryLower))} · ${escapeHTML(entry.site.owner || "—")}</span>
        </span>
      </button>
    `
    )
    .join("");
}

/** Shown when the input is focused but empty — last 10 searches (Phase 9) */
function renderHistoryDropdown(input, results) {
  const history = getSearchHistory();

  if (history.length === 0) {
    results.hidden = true;
    results.innerHTML = "";
    return;
  }

  results.hidden = false;
  results.innerHTML = `
    <div class="search-history-label">
      <span>Recent Searches</span>
      <button type="button" class="search-history-clear" data-clear-history>Clear</button>
    </div>
    ${history
      .map(
        (term) => `
      <button type="button" class="search-result-item" data-history-term="${escapeAttr(term)}">
        <span class="search-result-swatch" style="background: var(--color-text-muted);"></span>
        <span class="search-result-text">
          <span class="search-result-name">${escapeHTML(term)}</span>
        </span>
      </button>
    `
      )
      .join("")}
  `;
}

/** "No Website Found" empty state with a soft pulsing icon (Phase 9) */
function renderEmptyState(results) {
  results.hidden = false;
  results.innerHTML = `
    <div class="search-empty-state">
      <span class="search-empty-icon">✦</span>
      <p>No Website Found</p>
    </div>
  `;
}

/** Wraps the portion of `text` matching `query` in <mark> for bold highlight */
function highlightMatch(text, query) {
  const safe = escapeHTML(text);
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return safe;

  const before = escapeHTML(text.slice(0, index));
  const match = escapeHTML(text.slice(index, index + query.length));
  const after = escapeHTML(text.slice(index + query.length));
  return `${before}<mark>${match}</mark>${after}`;
}

/**
 * Resolves a search result selection: saves it to history, closes the
 * dropdown, then hands off to focusOnSite() for the cinematic camera fly +
 * Focus Mode (highlight/dim/blur/hyperlanes/label — all shared with direct
 * planet clicks via PlanetManager.focusPlanet()).
 */
function selectSearchResult(entry, input, results) {
  const site = entry.site;

  addSearchHistory(site.name);
  closeDropdown(results);
  input.value = site.name;
  input.blur();

  focusOnSite(site);
}

/**
 * Phase 9 cinematic focus: flies the camera to the planet, highlights it
 * (PlanetManager.focusPlanet — scale/glow/pulse + dims every other planet
 * + lights up hyperlanes), dims other galaxies, shows the persistent focus
 * label, and opens the sidebar once the camera arrives.
 */
function focusOnSite(site) {
  const planet = ctx.planetManager?.getPlanetById(site.id);
  if (!planet) return;

  ctx.planetManager.focusPlanet(site.id);
  ctx.galaxySystem?.setFocusCategory(site.category);
  // Phase 10: light up this planet's hyperlane connections with a cascade
  // stagger so they ignite one-by-one as the camera flies in (cinematic).
  ctx.hyperlaneNetwork?.highlightForPlanet(site.id, { cascade: true });
  activateFocusOverlay();
  showFocusLabel(site);

  ctx.visitPlanet?.(planet, {
    onComplete: () => {
      const relatedWebsites = resolveRelatedWebsites(site);
      showPlanetSidebar({ ...site, relatedWebsites });
    },
  });
}

/** Resolves a website's connections[] id array into full website objects,
 * using the live PlanetManager so it stays in sync with what's on screen. */
function resolveRelatedWebsites(site) {
  if (!Array.isArray(site.connections)) return [];
  return site.connections
    .map((id) => ctx.planetManager?.getPlanetById(id)?.data)
    .filter(Boolean);
}

/* ==========================================================================
   FOCUS MODE — blur overlay + persistent label, shared by search selection
   and direct planet clicks (planetManager.js owns the 3D dim/highlight side).
   ========================================================================== */

function activateFocusOverlay() {
  $("focus-blur-overlay")?.classList.add("is-active");
}

function deactivateFocusOverlay() {
  $("focus-blur-overlay")?.classList.remove("is-active");
}

function showFocusLabel(site) {
  const label = $("focus-label");
  if (!label) return;

  $("focus-label-name").textContent = site.name;
  $("focus-label-category").textContent = capitalize(site.category);
  $("focus-label-owner").textContent = site.owner || "—";

  label.hidden = false;
  gsap.fromTo(label, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
}

function hideFocusLabel() {
  const label = $("focus-label");
  if (!label || label.hidden) return;

  gsap.to(label, {
    opacity: 0,
    y: -8,
    duration: 0.3,
    ease: "power1.in",
    onComplete: () => (label.hidden = true),
  });
}

/** Fully exits focus mode: un-dims every planet + galaxy, fades out the
 * blur overlay and label, and closes the sidebar. Used when the sidebar is
 * closed manually or Esc is pressed while a planet is focused. */
export function exitFocusMode() {
  ctx.planetManager?.clearFocus();
  ctx.galaxySystem?.setFocusCategory(null);
  ctx.hyperlaneNetwork?.clearHighlight();
  deactivateFocusOverlay();
  hideFocusLabel();
  closeSidebar();
}

/* ==========================================================================
   PLANET TOOLTIP — follows the mouse via GSAP's quickTo (a tween that's
   re-targeted every call instead of recreated), which is the cheapest way
   to chase a fast-moving cursor every frame without dropping frames.
   ========================================================================== */

function initTooltip() {
  const tooltip = $("planet-tooltip");
  if (!tooltip) return;

  // Centered horizontally and lifted above the cursor. Setting these once
  // via gsap.set is safe to combine with quickTo's later x/y writes — GSAP
  // merges xPercent/yPercent and x/y into a single transform under the hood.
  gsap.set(tooltip, { xPercent: -50, yPercent: -140 });

  // quickTo precompiles the tween once; calling the returned function just
  // updates its target value, reusing the same GSAP tick — far cheaper
  // than gsap.to() on every pointermove.
  tooltipQuickToX = gsap.quickTo(tooltip, "x", { duration: 0.25, ease: "power3.out" });
  tooltipQuickToY = gsap.quickTo(tooltip, "y", { duration: 0.25, ease: "power3.out" });
}

/** Move + populate the tooltip; called every pointermove while hovering */
function showTooltip(site, event) {
  const tooltip = $("planet-tooltip");
  if (!tooltip || !site) return;

  $("tooltip-name").textContent = site.name;
  $("tooltip-category").textContent = capitalize(site.category);
  $("tooltip-visitors").textContent = formatVisitors(site.visitors);

  if (tooltip.hidden) {
    tooltip.hidden = false;
    // Snap to position instantly on first appearance (no slide-in lag),
    // then subsequent moves glide smoothly via the quickTo tweens above.
    gsap.set(tooltip, { x: event.clientX, y: event.clientY });
  }

  tooltipQuickToX?.(event.clientX);
  tooltipQuickToY?.(event.clientY);
}

function hideTooltip() {
  const tooltip = $("planet-tooltip");
  if (tooltip) tooltip.hidden = true;
}

/* ==========================================================================
   EXPORTED HANDLERS — main.js forwards PlanetManager's raycaster callbacks
   here, so all DOM/GSAP specifics for hover/click stay inside ui.js.
   ========================================================================== */

/** Call from main.js's PlanetManager onHover callback */
export function handlePlanetHover(planet, event) {
  if (planet) {
    showTooltip(planet.data, event);
  } else {
    hideTooltip();
  }
}

/** Call from main.js's PlanetManager onClick callback */
export function handlePlanetClick(planet, siteWithRelated) {
  if (planet && siteWithRelated) {
    ctx.galaxySystem?.setFocusCategory(siteWithRelated.category);
    // Phase 10: instant highlight (no cascade) for direct clicks — the user
    // is already at the planet, so the lanes should snap on immediately.
    ctx.hyperlaneNetwork?.highlightForPlanet(siteWithRelated.id, { cascade: false });
    activateFocusOverlay();
    showFocusLabel(siteWithRelated);
    showPlanetSidebar(siteWithRelated);
  } else {
    ctx.galaxySystem?.setFocusCategory(null);
    ctx.hyperlaneNetwork?.clearHighlight();
    deactivateFocusOverlay();
    hideFocusLabel();
    closeSidebar();
  }
}

/** Minimal HTML-escape to keep injected text safe */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Escape a value for safe use inside an HTML attribute (e.g. href) */
function escapeAttr(str) {
  return escapeHTML(str).replace(/"/g, "&quot;");
}

/** Update the bottom-left HUD with camera coordinates and FPS */
export function updateHUD(camera, fps) {
  const coords = $("hud-coords");
  const fpsEl = $("hud-fps");

  if (coords) {
    coords.textContent = `x: ${formatCoord(camera.position.x)}, y: ${formatCoord(camera.position.y)}, z: ${formatCoord(camera.position.z)}`;
  }
  if (fpsEl) {
    fpsEl.textContent = `FPS: ${fps}`;
  }
}
