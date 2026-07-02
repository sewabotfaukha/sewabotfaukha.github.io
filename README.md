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

### Prompt 5.6.1 — Critical Fix: Invisible Text di Production (GitHub Pages)

Laporan: setelah deploy ke GitHub Pages, judul "NEXUS", tombol "Start
Exploring", dan teks section About tidak muncul di Chrome — padahal normal
saat ditest lokal. Setelah audit menyeluruh, ditemukan **tiga bug yang saling
bertumpuk**, semuanya berakar dari asumsi bahwa file CSS/JS eksternal PASTI
berhasil & tepat waktu dimuat — asumsi yang valid di localhost tapi tidak
selalu valid di hosting statis (race condition CDN, cache, network):

1. **Gradient-text tanpa fallback.** `.hero__title` ("NEXUS") dan
   `.stat-card__value` memakai teknik `color:transparent` +
   `background-clip:text` dengan `var(--text-primary)`/`var(--accent-gradient)`
   **tanpa nilai fallback**. Kalau `variables.css` belum aktif saat elemen
   itu pertama kali di-render, `background` jadi invalid (dianggap tidak ada)
   sementara `color:transparent` tetap berlaku apa adanya → teks benar-benar
   transparan, tidak ada fallback warna apa pun.
   **Fix:** semua `var()` kritis sekarang punya fallback eksplisit
   (`var(--text-primary, #f5f5fb)`, dst), DAN seluruh design token
   (`:root { --bg-void: ...; --text-primary: ...; dst }`) diduplikasi ke
   `<style>` inline di `<head>` sehingga tersedia sejak dokumen pertama kali
   di-parse — tidak mungkin lagi "belum aktif".
2. **Loading screen bisa nyangkut selamanya.** `.nexus-loader` adalah overlay
   full-screen (`position:fixed; inset:0`) yang HANYA disembunyikan lewat
   `classList.add('is-hidden')` dari JS. Kalau salah satu CDN di import map
   (three.js/GSAP/Lenis) gagal/lambat dimuat, `main.js` tidak pernah sempat
   jalan, overlay ini tidak pernah disembunyikan, dan menutupi seluruh
   Hero + About di baliknya — persis gejala "semua konten hilang".
   **Fix:** ditambahkan CSS-only failsafe (`animation: ... 4s forwards`) yang
   menjamin loader hilang sendiri setelah 4 detik apa pun yang terjadi pada JS.
3. **Tidak ada jaring pengaman kalau animasi reveal gagal.** Ditambahkan
   watchdog kecil (script biasa, bukan ES module, jadi tidak ikut gagal kalau
   import CDN bermasalah) yang mengecek ulang opacity elemen-elemen kritis
   2.5 detik setelah `load`, dan memaksa terlihat kalau ada yang tersangkut.

Ketiganya independen satu sama lain (defense-in-depth) — cukup satu yang
bekerja untuk mencegah halaman terlihat kosong, apa pun penyebab pastinya di
sisi hosting.

### Prompt 5.6 — Architecture Fix (transisi antar-section)

Fokus prompt ini murni perbaikan struktur/arsitektur, **tanpa fitur baru**,
supaya fondasi benar-benar stabil sebelum Prompt 6 (halaman Projects):

- **Start Exploring** tidak lagi memicu "camera bump" cepat (0.22s) yang
  terasa seperti sentakan. Diganti satu gerakan kamera halus, *ease-in-out*,
  durasi ±1 detik (`cameraFlyBump` di `animation.js`), menyatu dengan smooth
  scroll otomatis ke About. Hero tidak pernah dihilangkan — hanya mengecil,
  naik sedikit (`y: -60`), dan opacity turun ke ~0.24 (tetap terlihat samar
  di atas), diproses lewat scrub yang di-*lock* ke tinggi `.hero` itu sendiri
  (bukan ke posisi `#about`) agar tidak meleset kalau tinggi section berubah.
- **Bug "About kadang tidak muncul" — root cause ditemukan & diperbaiki**:
  reveal animation lama membuat tween `.from()` di dalam `scrollTrigger`
  yang langsung menerapkan `opacity:0` ke DOM saat dibuat, sebelum trigger-nya
  aktif — kalau kalkulasi posisi meleset, section itu permanen tak terlihat.
  Sekarang `initAboutReveal()` memakai **IntersectionObserver**: opacity:0
  baru diterapkan tepat saat About benar-benar masuk viewport, plus safety-net
  ganda (re-check setelah `load`, dan `clearProps` di akhir animasi) sehingga
  section ini **tidak mungkin lagi stuck tersembunyi**.
- **Scroll patah di HP**: Lenis sebelumnya hanya men-smoothing scroll roda
  mouse (`smoothWheel`) — scroll sentuh sama sekali tidak di-smoothing.
  Ditambahkan `syncTouch: true` sehingga scroll di layar sentuh ikut halus.
- **Performance pass**: resize di-throttle lewat rAF (bukan per event mentah),
  render loop di-skip saat tab tidak aktif (`document.hidden`), backdrop-filter
  blur & box-shadow diperkecil signifikan di breakpoint mobile/tablet, dan
  `overscroll-behavior` dimatikan untuk menghindari bounce native yang bentrok
  dengan Lenis.
- **UI polish** ringan tanpa mengubah desain utama: glow tombol & dekorasi
  diperhalus (radius/opacity dikurangi sedikit), ditambah `:focus-visible`
  untuk aksesibilitas keyboard.
- Hierarki section didokumentasikan langsung di `index.html` (komentar) agar
  Prompt 6 tahu persis di mana menyisipkan Projects & Contact tanpa merusak
  struktur satu-halaman-scroll yang sudah ada.

### Catatan perbaikan (bug fix pass)

Foundation ini sudah melalui satu putaran perbaikan untuk memastikan
**0 error di console** dan background tidak pernah tampil putih:

- Semua akses DOM di `ui.js` sekarang lewat helper `safeQuery()` yang
  null-check otomatis + `console.warn` jika elemen tidak ditemukan —
  tidak ada lagi kemungkinan `Cannot set properties of null`.
- `main.js` dibungkus dalam `bootstrap()` yang dijalankan setelah
  `DOMContentLoaded`, dengan `try/catch` di setiap tahap dan
  `window.addEventListener('error', ...)` sebagai jaring pengaman global.
- CSS tidak lagi memakai `@import` berantai di `style.css`. Setiap file
  CSS (`variables.css`, `style.css`, `layout.css`, `animation.css`,
  `responsive.css`) sekarang di-`<link>` langsung di `index.html` secara
  paralel, plus ada **critical CSS inline** di `<head>` sebagai lapisan
  pertahanan pertama supaya background selalu gelap premium sejak render
  pertama.

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
