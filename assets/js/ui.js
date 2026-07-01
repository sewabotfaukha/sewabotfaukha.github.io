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

  // Close button is injected dynamically into sidebar-content by the
  // showPlanetSidebar template. Use event delegation on the sidebar itself
  // so we don't need to re-bind on every content swap.
  sidebar?.addEventListener("click", (event) => {
    // Delegate close button click
    if (event.target.closest("#sidebar-close")) {
      exitFocusMode();
      return;
    }
    // Stop click-through to canvas (so clicking inside sidebar doesn't
    // deselect the planet)
    event.stopPropagation();
  });
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
    <div class="sidebar-header-premium">
      <div class="sidebar-galaxy-swatch" style="background:${galaxy.color}; box-shadow: 0 0 20px ${galaxy.color}55; border-radius:50%; width:52px; height:52px; flex-shrink:0;"></div>
      <div class="sidebar-header-info">
        <h2 class="sidebar-title-premium">${escapeHTML(galaxy.name)} Galaxy</h2>
        <p class="sidebar-subtitle">Category overview</p>
      </div>
      <button id="sidebar-close" aria-label="Close sidebar" class="sidebar-close-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="sidebar-divider" style="background: linear-gradient(90deg, ${galaxy.color}66, transparent); margin-bottom: var(--space-md);"></div>
    <p class="sidebar-description-premium">${escapeHTML(galaxy.description || "")}</p>
  `;

  openSidebar();
}

/**
 * Populate and reveal the sidebar with a website/planet's full details.
 * Premium version: favicon logo, status badge, country, ripple button.
 * @param {object} site - website data (+ relatedWebsites) from
 *   planetManager.js's onClick callback, matching websites.json's format.
 */
function showPlanetSidebar(site) {
  const content = $("sidebar-content");
  if (!content) return;

  const visitors = formatVisitors(site.visitors);
  const founded = site.founded ?? "—";
  const country = site.country ?? "—";

  // Phase 10: use hyperlane graph as authoritative connection list
  const hyperlaneConnections = ctx.hyperlaneNetwork?.getConnectionsForSite(site.id) ?? [];
  const related = hyperlaneConnections.length > 0
    ? hyperlaneConnections
    : (Array.isArray(site.relatedWebsites) ? site.relatedWebsites : []);

  // Group by category for badge summary
  const categoryCount = related.reduce((acc, r) => {
    const cat = capitalize(r.category ?? "other");
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const categoryBadges = Object.entries(categoryCount)
    .map(([cat, n]) => `<span class="sidebar-conn-badge">${escapeHTML(cat)} (${n})</span>`)
    .join(" ");

  // Build favicon URL — try site's own logo field, fallback to Google favicon service
  const faviconUrl = buildFaviconUrl(site);
  const accentColor = site.color ?? "#5b8cff";
  const accentColorAlpha = accentColor + "33";

  content.innerHTML = `
    <!-- ── HEADER ─────────────────────────────────────────── -->
    <div class="sidebar-header-premium">
      <div class="sidebar-logo-premium" style="--planet-color:${accentColor}; box-shadow: 0 0 24px ${accentColor}44, inset 0 1px 0 rgba(255,255,255,0.12);">
        <img
          class="sidebar-logo-img"
          src="${escapeAttr(faviconUrl)}"
          alt="${escapeHTML(site.name)} logo"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <span class="sidebar-logo-fallback" style="display:none; background:${accentColor};">${escapeHTML((site.name || "?").charAt(0).toUpperCase())}</span>
      </div>

      <div class="sidebar-header-info">
        <h2 class="sidebar-title-premium">${escapeHTML(site.name)}</h2>
        <div class="sidebar-header-meta">
          <span class="sidebar-category-badge" style="color:${accentColor}; border-color:${accentColor}44; background:${accentColorAlpha};">
            ${escapeHTML(capitalize(site.category))}
          </span>
          <span class="sidebar-status-dot"></span>
          <span class="sidebar-status-label">Online</span>
        </div>
      </div>

      <button id="sidebar-close" aria-label="Close sidebar" class="sidebar-close-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- ── DIVIDER ─────────────────────────────────────────── -->
    <div class="sidebar-divider" style="background: linear-gradient(90deg, ${accentColor}55, transparent);"></div>

    <!-- ── DESCRIPTION ───────────────────────────────────────── -->
    <p class="sidebar-description-premium">${escapeHTML(site.description || "")}</p>

    <!-- ── META GRID ─────────────────────────────────────────── -->
    <div class="sidebar-meta-grid">
      <div class="sidebar-meta-card">
        <span class="sidebar-meta-icon">🏢</span>
        <div class="sidebar-meta-card-inner">
          <dt class="sidebar-meta-label">Owner</dt>
          <dd class="sidebar-meta-value">${escapeHTML(site.owner || "—")}</dd>
        </div>
      </div>
      <div class="sidebar-meta-card">
        <span class="sidebar-meta-icon">📅</span>
        <div class="sidebar-meta-card-inner">
          <dt class="sidebar-meta-label">Founded</dt>
          <dd class="sidebar-meta-value">${escapeHTML(String(founded))}</dd>
        </div>
      </div>
      <div class="sidebar-meta-card">
        <span class="sidebar-meta-icon">👥</span>
        <div class="sidebar-meta-card-inner">
          <dt class="sidebar-meta-label">Visitors</dt>
          <dd class="sidebar-meta-value">${escapeHTML(visitors)}</dd>
        </div>
      </div>
      <div class="sidebar-meta-card">
        <span class="sidebar-meta-icon">🌏</span>
        <div class="sidebar-meta-card-inner">
          <dt class="sidebar-meta-label">Country</dt>
          <dd class="sidebar-meta-value">${escapeHTML(country)}</dd>
        </div>
      </div>
    </div>

    <!-- ── CONNECTED WEBSITES ────────────────────────────────── -->
    ${related.length > 0 ? `
    <div class="sidebar-related-premium">
      <div class="sidebar-related-header">
        <h3 class="sidebar-related-title-premium">Connected Websites</h3>
        <span class="sidebar-conn-count">${related.length}</span>
      </div>
      ${categoryBadges ? `<div class="sidebar-conn-categories">${categoryBadges}</div>` : ""}
      <ul class="sidebar-related-list-premium">
        ${related.map((r) => `
          <li>
            <button type="button" class="sidebar-conn-item-premium" data-fly-to="${escapeAttr(r.id)}">
              <span class="sidebar-conn-dot-premium" style="background:${r.color ?? "#5b8cff"}; box-shadow: 0 0 6px ${r.color ?? "#5b8cff"}88;"></span>
              <span class="sidebar-conn-name">${escapeHTML(r.name)}</span>
              <span class="sidebar-conn-cat">${escapeHTML(capitalize(r.category))}</span>
              <svg class="sidebar-conn-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </li>
        `).join("")}
      </ul>
    </div>` : ""}

    <!-- ── VISIT BUTTON ──────────────────────────────────────── -->
    <a
      class="sidebar-visit-btn-premium"
      href="${escapeAttr(site.url || "#")}"
      target="_blank"
      rel="noopener noreferrer"
      style="--planet-color:${accentColor};"
    >
      <span class="sidebar-visit-btn-label">Visit Website</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="sidebar-visit-ripple"></span>
    </a>
  `;

  // Wire up "click name → camera fly" for connected websites (Phase 10)
  content.querySelectorAll("[data-fly-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetSite = ctx.planetManager?.getPlanetById(btn.dataset.flyTo)?.data;
      if (targetSite) focusOnSite(targetSite);
    });
  });

  // Ripple effect on visit button
  const visitBtn = content.querySelector(".sidebar-visit-btn-premium");
  if (visitBtn) {
    visitBtn.addEventListener("click", (e) => {
      const ripple = visitBtn.querySelector(".sidebar-visit-ripple");
      if (!ripple) return;
      const rect = visitBtn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.classList.remove("is-active");
      void ripple.offsetWidth; // reflow to restart animation
      ripple.classList.add("is-active");
    });
  }

  openSidebar();
}

/** Build a favicon/logo URL for the given site.
 *  Priority: site.logo → Google favicon service fallback. */
function buildFaviconUrl(site) {
  // If logo field points to a real asset path (not empty), use it directly
  if (site.logo && !site.logo.includes("undefined")) {
    return site.logo;
  }
  // Fallback: Google's favicon service (reliable, fast, free, no auth required)
  if (site.url) {
    try {
      const domain = new URL(site.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { /* noop */ }
  }
  return "";
}

/** Detect mobile (≤640px) for bottom-sheet vs side-drawer behaviour */
function isMobile() {
  return window.innerWidth <= 640;
}

/** Slide the sidebar in — right drawer on desktop, bottom sheet on mobile */
function openSidebar() {
  const sidebar = $("sidebar");
  if (!sidebar) return;

  sidebar.removeAttribute("hidden");
  sidebarTimeline?.kill();

  const mobile = isMobile();

  if (mobile) {
    // Bottom sheet: slide up from below with scale + blur
    gsap.set(sidebar, { yPercent: 100, opacity: 0, scale: 0.98, filter: "blur(6px)", xPercent: 0 });
    sidebarTimeline = gsap.timeline()
      .to(sidebar, {
        yPercent: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.48,
        ease: "power3.out",
      })
      .fromTo(
        "#sidebar-content > *",
        { opacity: 0, y: 10, filter: "blur(3px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, stagger: 0.045, ease: "power2.out" },
        "-=0.2"
      );
  } else {
    // Desktop: slide from the right with blur + scale
    gsap.set(sidebar, { xPercent: 100, opacity: 0, scale: 0.97, filter: "blur(8px)", yPercent: 0 });
    sidebarTimeline = gsap.timeline()
      .to(sidebar, {
        xPercent: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power3.out",
      })
      .fromTo(
        "#sidebar-content > *",
        { opacity: 0, y: 14, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.38, stagger: 0.055, ease: "power2.out" },
        "-=0.22"
      );
  }
}

/** Slide the sidebar back out — reverse of openSidebar */
function closeSidebar() {
  const sidebar = $("sidebar");
  if (!sidebar || sidebar.hasAttribute("hidden")) return;

  sidebarTimeline?.kill();

  const mobile = isMobile();

  if (mobile) {
    sidebarTimeline = gsap.to(sidebar, {
      yPercent: 100,
      opacity: 0,
      scale: 0.98,
      filter: "blur(4px)",
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        sidebar.setAttribute("hidden", "");
        gsap.set(sidebar, { filter: "blur(0px)", scale: 1, yPercent: 0 });
      },
    });
  } else {
    sidebarTimeline = gsap.to(sidebar, {
      xPercent: 100,
      opacity: 0,
      scale: 0.97,
      filter: "blur(6px)",
      duration: 0.38,
      ease: "power2.in",
      onComplete: () => {
        sidebar.setAttribute("hidden", "");
        gsap.set(sidebar, { filter: "blur(0px)", scale: 1, xPercent: 0 });
      },
    });
  }
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
