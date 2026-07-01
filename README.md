# NEXUS — Interactive 3D Developer Portfolio

Portfolio premium berbasis **Three.js** dan **GSAP**, dibangun murni dengan
HTML5, CSS3, dan JavaScript ES Modules — tanpa backend, tanpa framework,
tanpa Node.js, dan tanpa build tools. Siap dijalankan langsung dari
**GitHub Pages**.

## Status

Ini adalah **fondasi project (Prompt 1)**: landing page premium dengan
setup Three.js dasar (scene, camera, renderer, OrbitControls) dan
konfigurasi GSAP awal. Belum ada object 3D atau animasi besar — struktur
ini dirancang agar mudah dikembangkan pada prompt-prompt berikutnya.

## Struktur Project

```
NexusPortfolio/
├── index.html                 # Entry point HTML + import map (Three.js & GSAP via CDN)
├── assets/
│   ├── css/
│   │   ├── style.css          # Entry point CSS (mengimpor modul di bawah)
│   │   ├── variables.css      # Design tokens: warna, tipografi, spacing, easing
│   │   ├── layout.css         # Struktur layout: hero, glass panel, nav
│   │   ├── animation.css      # Keyframes & transisi CSS ringan
│   │   └── responsive.css     # Breakpoint desktop / tablet / mobile
│   ├── js/
│   │   ├── main.js            # Entry point JS — merangkai semua modul
│   │   ├── scene.js           # Setup THREE.Scene
│   │   ├── camera.js          # Setup PerspectiveCamera + handler resize
│   │   ├── controls.js        # Setup OrbitControls
│   │   ├── loader.js          # LoadingManager & loader dasar (siap dipakai)
│   │   ├── animation.js       # Konfigurasi & timeline dasar GSAP
│   │   ├── ui.js               # Interaksi UI non-3D (loader, tombol, dsb)
│   │   └── effects.js         # Placeholder efek visual tambahan
│   ├── textures/              # Aset tekstur (kosong — untuk prompt berikutnya)
│   ├── models/                # Model 3D .glb/.gltf (kosong — untuk prompt berikutnya)
│   ├── images/                # Gambar statis (kosong — untuk prompt berikutnya)
│   └── fonts/                 # Font lokal opsional (saat ini pakai Google Fonts CDN)
├── README.md
└── LICENSE
```

## Teknologi

| Teknologi     | Keterangan                                      |
|---------------|--------------------------------------------------|
| HTML5 / CSS3  | Struktur & styling murni, tanpa preprocessor     |
| JavaScript ES Modules | Tanpa bundler — dimuat langsung via `<script type="module">` |
| Three.js `0.160.0` | Scene, camera, renderer, OrbitControls, dimuat via CDN (`jsdelivr`) melalui import map |
| GSAP `3.12.5` | Orkestrasi animasi, dimuat via CDN melalui import map |

Tidak ada proses build. Semua dependency diambil langsung dari CDN lewat
`<script type="importmap">` di `index.html`, sehingga project bisa langsung
dibuka di browser atau di-deploy ke GitHub Pages tanpa langkah kompilasi.

## Menjalankan Secara Lokal

Karena project menggunakan ES Modules, buka file `index.html` **melalui
local server**, bukan langsung dari `file://` (browser modern memblokir
`import` pada protokol file). Contoh:

```bash
# Opsi 1: Python
python3 -m http.server 8000

# Opsi 2: VS Code Live Server extension
```

Lalu buka `http://localhost:8000` di browser.

## Deploy ke GitHub Pages

1. Push seluruh isi folder `NexusPortfolio/` ke branch `main` (atau `gh-pages`).
2. Buka **Settings → Pages** pada repository.
3. Pilih branch & folder root (`/`), lalu simpan.
4. Situs akan tersedia di `https://<username>.github.io/<nama-repo>/`.

## Roadmap (Prompt Berikutnya)

- Menambahkan object 3D utama (signature element) ke dalam `scene.js`.
- Mengisi `loader.js` dengan `GLTFLoader` untuk model di `assets/models/`.
- Menambahkan section portfolio, about, dan contact.
- Mengaktifkan `effects.js` (post-processing / partikel ambient).
- Menambahkan scroll-triggered animation dengan GSAP `ScrollTrigger`.

## Lisensi

Lihat file [LICENSE](./LICENSE).
