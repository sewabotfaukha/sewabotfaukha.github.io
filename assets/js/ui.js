// ==========================================================================
// ui.js — DOM/UI wiring: search, sidebar, audio toggle, HUD, planet tooltip
// initUI() accepts the galaxy list + visitGalaxy() (camera fly-to), plus
// exposes handlePlanetHover/handlePlanetClick for main.js to forward
// PlanetManager's raycaster callbacks into — keeping all DOM/GSAP logic
// for the sidebar and tooltip in this single file.
// ==========================================================================

import gsap from "gsap";
import { $, debounce, formatCoord } from "./utils.js";

let sidebarTimeline = null;
let tooltipQuickToX = null;
let tooltipQuickToY = null;

/**
 * Wire up static UI interactions.
 * @param {object} [context]
 * @param {Array} [context.galaxies] - galaxy list from scene.userData.galaxies
 * @param {Function} [context.visitGalaxy] - (galaxy) => void, flies the camera there
 */
export function initUI({ galaxies = [], visitGalaxy = null } = {}) {
  initSidebar();
  initAudioToggle();
  initSearch(galaxies, visitGalaxy);
  initTooltip();
}

function initSidebar() {
  const sidebar = $("sidebar");
  const closeBtn = $("sidebar-close");

  closeBtn?.addEventListener("click", () => closeSidebar());

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
  const related = Array.isArray(site.relatedWebsites) ? site.relatedWebsites : [];

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

    ${
      related.length > 0
        ? `
      <div class="sidebar-related">
        <h3 class="sidebar-related-title">Related Websites</h3>
        <ul class="sidebar-related-list">
          ${related
            .map(
              (r) => `
            <li>
              <span class="sidebar-related-dot" style="background:${r.color ?? "#5b8cff"};"></span>
              ${escapeHTML(r.name)}
            </li>
          `
            )
            .join("")}
        </ul>
      </div>`
        : ""
    }

    <a
      class="sidebar-visit-btn"
      href="${escapeAttr(site.url || "#")}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit Website
    </a>
  `;

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

function initSearch(galaxies, visitGalaxy) {
  const input = $("search-input");
  const results = $("search-results");
  if (!input || !results) return;

  const handleInput = debounce((event) => {
    const query = event.target.value.trim().toLowerCase();

    if (!query) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    const matches = galaxies.filter((g) => g.name.toLowerCase().includes(query));

    if (matches.length === 0) {
      results.hidden = false;
      results.innerHTML = `<p style="color: var(--color-text-muted); font-size: var(--fs-xs); padding: 8px;">No galaxies found for "${escapeHTML(query)}"</p>`;
      return;
    }

    results.hidden = false;
    results.innerHTML = matches
      .map(
        (g) => `
        <button
          type="button"
          class="search-result-item"
          data-galaxy-id="${g.id}"
          style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; text-align: left; border-radius: var(--radius-sm); font-size: var(--fs-sm);"
        >
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${g.color}; flex-shrink: 0;"></span>
          ${escapeHTML(g.name)} Galaxy
        </button>
      `
      )
      .join("");
  }, 200);

  input.addEventListener("input", handleInput);

  // Delegate clicks on result items — list is re-rendered on every keystroke
  // so a single listener on the container avoids re-binding every time.
  results.addEventListener("click", (event) => {
    const button = event.target.closest("[data-galaxy-id]");
    if (!button) return;

    const galaxy = galaxies.find((g) => g.id === button.dataset.galaxyId);
    if (!galaxy) return;

    visitGalaxy?.(galaxy);
    showGalaxySidebar(galaxy);

    results.hidden = true;
    input.value = "";
  });
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
    showPlanetSidebar(siteWithRelated);
  } else {
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
