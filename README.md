# Internet Map

Internet Map is a premium web experience that visualizes the internet as a 3D universe — every website a celestial body, every link a connection in space.

This repository currently contains **Phase 1: the project foundation**. No planets, no large-scale visualization features yet — just a clean, professional, working base to build on.

## Tech Stack

- HTML5
- CSS3 (with CSS variables, dark theme)
- JavaScript ES6 Modules (native `import`/`export`, no bundler)
- [Three.js](https://threejs.org/) — via CDN / import map
- [GSAP](https://gsap.com/) — via CDN / import map

No Node.js, no build tools, no frameworks (React/Vue/Angular), no backend. The site runs by opening `index.html` directly, or via any static file host.

## How to Run

### Option A — Open directly
Because this project uses native ES modules and `fetch()` for JSON data, most browsers require it to be served over `http://` (not `file://`). Use any simple static server:

```bash
# Python 3
python3 -m http.server 8000

# Node (npx, no install needed)
npx serve .
```

Then open `http://localhost:8000` in your browser.

### Option B — VS Code Live Server
Install the "Live Server" extension and click "Go Live" from `index.html`.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`.
4. Choose your branch (e.g. `main`) and root folder `/`.
5. Save. GitHub will publish the site at `https://<username>.github.io/<repo-name>/`.

No build step is required — GitHub Pages serves the static files as-is.

## Project Structure

```
InternetMap/
├── index.html              # Entry point — loading screen, canvas, UI shell
├── README.md
├── LICENSE
└── assets/
    ├── css/
    │   ├── variables.css    # Design tokens (colors, spacing, typography)
    │   ├── style.css        # Reset + base element styles
    │   ├── layout.css       # Structural positioning of major regions
    │   ├── glass.css        # Glassmorphism panel styling
    │   ├── animation.css    # Keyframes & transition utilities
    │   └── responsive.css   # Breakpoint adjustments
    ├── js/
    │   ├── main.js          # Entry point — wires all modules together
    │   ├── scene.js         # Three.js Scene construction
    │   ├── camera.js        # Perspective camera setup
    │   ├── renderer.js      # WebGLRenderer setup
    │   ├── controls.js      # OrbitControls wrapper
    │   ├── loader.js        # Loading screen + data preloading
    │   ├── ui.js            # Search / sidebar / audio toggle / HUD wiring
    │   └── utils.js         # Shared helper functions
    ├── data/
    │   ├── websites.json    # Sample website node data
    │   └── connections.json # Sample link data between websites
    ├── textures/            # (reserved for future 3D textures)
    ├── logos/               # (reserved for future website logo sprites)
    ├── audio/               # (reserved for future ambient audio)
    └── images/              # (reserved for future UI/marketing images)
```

## Module Flow

```
main.js
  ├─ loader.js     → loads websites.json / connections.json, drives loading bar
  ├─ scene.js      → creates THREE.Scene + base lighting
  ├─ camera.js     → creates THREE.PerspectiveCamera
  ├─ renderer.js   → creates THREE.WebGLRenderer bound to #scene-canvas
  ├─ controls.js   → creates OrbitControls bound to camera + renderer
  └─ ui.js         → wires search input, sidebar close, audio toggle, HUD
```

All modules communicate exclusively through ES module imports/exports — no globals, no inline scripts.

## What's Next (Future Phases)

- Rendering website nodes as 3D "planets" using `data/websites.json`
- Rendering connection lines using `data/connections.json`
- Real search + sidebar detail population
- Minimap camera projection
- Ambient audio playback
- Texture/logo loading for individual nodes

## License

See [LICENSE](./LICENSE).
