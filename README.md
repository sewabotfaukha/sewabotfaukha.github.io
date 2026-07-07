# Faukha

Digital store untuk sewa bot **WhatsApp** & **Telegram** — moderasi grup otomatis, mini-games interaktif, auto-reply cerdas, hingga bot custom sesuai kebutuhan bisnis. Dibangun sebagai landing page dark-mode-first dengan objek 3D di Hero section.

Kontak admin (dipakai di landing page): WhatsApp [wa.me/6281918650302](https://wa.me/6281918650302), Telegram [@Faukhaa](https://t.me/Faukhaa).

---

## 🧱 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (tema dark kustom) |
| 3D | React Three Fiber + drei (Three.js) |
| Animasi | Framer Motion |
| Icon | lucide-react |
| Utility | clsx + tailwind-merge |
| Hosting rekomendasi | **Vercel** (lihat bagian [Cara Deploy](#-cara-deploy)) |

---

## 🗂️ Struktur Folder

```
faukha/
├── app/
│   ├── layout.tsx          # Root layout: font, metadata SEO + Open Graph, dark mode default
│   ├── page.tsx            # Homepage — merangkai Navbar + semua section + Preloader
│   ├── globals.css         # Tailwind base, scroll offset, focus-visible, prefers-reduced-motion
│   └── dashboard/
│       └── page.tsx         # Placeholder member area (belum fungsional — lihat "Arsitektur untuk Scaling")
│
├── components/
│   ├── ui/                 # Komponen kecil reusable
│   │   ├── Button.tsx       # Tombol gradient/outline
│   │   ├── Badge.tsx        # Badge pill kecil (social proof, dll)
│   │   ├── BotCard.tsx      # Kartu bot generic (dipakai PlatformSelector)
│   │   └── Preloader.tsx    # Splash screen awal
│   ├── sections/           # Section besar landing page
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── PlatformSelector.tsx       # Server wrapper — ambil data lewat lib/data.ts
│   │   ├── PlatformSelectorClient.tsx # Bagian interaktif (tab switcher, filter)
│   │   ├── HowItWorks.tsx
│   │   ├── LiveDemo.tsx
│   │   ├── Pricing.tsx               # Server wrapper — ambil data lewat lib/data.ts
│   │   ├── PricingClient.tsx         # Bagian interaktif (toggle bulanan/tahunan)
│   │   ├── Testimonials.tsx          # Server wrapper — ambil data lewat lib/data.ts
│   │   ├── TestimonialsClient.tsx    # Bagian interaktif (carousel drag/autoplay)
│   │   ├── FAQ.tsx
│   │   └── CTAFooter.tsx
│   └── 3d/
│       └── HeroScene.tsx    # Objek 3D "bot/AI network", auto turun kualitas di mobile
│
├── lib/
│   ├── utils.ts             # cn(), formatRupiah(), kategoriBotStyles
│   └── data.ts              # ⭐ Data access layer — getBots(), getPricingPlans(), getTestimonials()
│
├── data/                     # Sumber data statis saat ini (dipanggil HANYA lewat lib/data.ts)
│   ├── bots.ts               # Katalog bot yang disewakan (nama, harga, fitur, dll)
│   ├── pricing.ts            # Paket harga (Starter, Populer, Bisnis, Enterprise)
│   └── testimonials.ts       # Testimoni pelanggan
│
├── types/
│   └── index.ts               # Interface TypeScript: Bot, PricingPlan, Testimonial
│
├── .env.example               # Contoh environment variable untuk pengembangan berikutnya
├── vercel.json                # Konfigurasi deploy Vercel (headers keamanan, region)
├── tailwind.config.ts          # Tema kustom: warna, font, animasi
├── tsconfig.json
├── next.config.js
├── postcss.config.js
└── package.json
```

> **Kenapa `/data` + `/lib/data.ts` penting:** semua konten bisnis (daftar bot, harga, testimoni) sengaja dipisah dari komponen UI, dan komponen tidak pernah mengambil data itu secara langsung — selalu lewat function di `lib/data.ts`. Nambah bot atau paket baru **tidak perlu menyentuh kode komponen sama sekali** — cukup edit file di `/data`. Lihat juga bagian "Arsitektur untuk Scaling" untuk kenapa lapisan `lib/data.ts` ini penting saat proyek berkembang.

---

## 🎨 Tema Desain

- **Background:** `#0a0e1a` (dark navy-black), dengan varian `background-surface` & `background-elevated`.
- **Aksen platform:** hijau WhatsApp `#25D366`, biru Telegram `#0088cc`.
- **Aksen AI/tech:** gradient ungu → cyan (`#7C3AED` → `#06B6D4`), tersedia sebagai `bg-gradient-aitech`.
- **Font:** `Sora` (heading) + `Inter` (body), via `next/font/google`.

---

## 🚀 Instalasi Lokal

```bash
# 1. Clone repo
git clone https://github.com/<username-kamu>/faukha.git
cd faukha

# 2. Install dependency
npm install

# 3. (Opsional) siapkan environment variable
cp .env.example .env.local
# isi value di .env.local sesuai kebutuhan — saat ini tidak wajib untuk npm run dev

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Build untuk production:

```bash
npm run build
npm run start
```

---

## 🤖 Cara Menambah Bot Baru

Edit `data/bots.ts`, tambahkan satu object baru ke array `bots` sesuai interface `Bot` di `types/index.ts`. Contoh menambah bot auto-reply untuk Telegram:

```ts
// data/bots.ts
export const bots: Bot[] = [
  // ...bot yang sudah ada,

  {
    id: "bot-autoreply-tele",
    nama: "Faukha Reply TG",
    platform: "telegram",
    kategori: "autoreply",
    deskripsi:
      "Bot auto-reply untuk channel/grup Telegram: FAQ otomatis dan broadcast terjadwal.",
    fitur: [
      "Auto-reply berbasis keyword",
      "Broadcast pesan terjadwal",
      "Statistik interaksi member",
      "Integrasi Google Sheets",
    ],
    harga: 60000,
    status: "tersedia", // atau "coming-soon" kalau belum siap dirilis
  },
];
```

Setelah disimpan, kartu bot baru **otomatis muncul** di section "Pilih Platform" (tab Telegram) tanpa perlu mengubah komponen `PlatformSelector.tsx` atau `BotCard.tsx` sama sekali — keduanya sudah dirancang generic dan cukup memfilter berdasarkan `platform`.

Kalau suatu saat ada kategori bot baru di luar `moderasi | games | autoreply | custom`, tambahkan:
1. Value baru di type `BotKategori` (`types/index.ts`)
2. Mapping label + warna badge-nya di `kategoriBotStyles` (`lib/utils.ts`)

---

## 💳 Cara Menambah Paket Pricing Baru

Edit `data/pricing.ts`, tambahkan object baru ke array `pricingPlans` sesuai interface `PricingPlan`:

```ts
// data/pricing.ts
export const pricingPlans: PricingPlan[] = [
  // ...paket yang sudah ada,

  {
    id: "plan-komunitas",
    nama: "Komunitas",
    harga: 90000,
    periode: "/bulan",
    fitur: [
      "3 bot WhatsApp/Telegram",
      "2 kategori bot pilihan",
      "Support respon <12 jam",
    ],
    highlight: false, // set true kalau mau ditandai "Paling Populer"
  },
];
```

Paket baru otomatis tampil di grid section "Pilihan Paket", termasuk ikut logika toggle Bulanan/Tahunan (`Pricing.tsx` mengalikan `harga` dengan `DISKON_BULAN_TAHUNAN` secara otomatis).

---

## ☁️ Cara Deploy

### Kenapa Vercel, bukan GitHub Pages?

Proyek ini dipilih untuk **deploy ke Vercel**, dengan pertimbangan:

| Aspek | Vercel | GitHub Pages |
|---|---|---|
| Next.js App Router | Native, zero-config | Perlu `output: "export"` (static export) |
| `next/image` optimization | ✅ Didukung penuh | ❌ Harus `unoptimized: true` |
| Rute dinamis / API routes | ✅ Didukung (untuk roadmap payment gateway, dashboard, login) | ❌ Tidak didukung sama sekali (murni static hosting) |
| React Three Fiber (client-only via `next/dynamic`) | Jalan tanpa konfigurasi tambahan | Jalan, tapi kehilangan manfaat SSR/streaming Next.js |
| Preview deployment per PR | ✅ Otomatis | ❌ Tidak ada |
| Custom domain + HTTPS | ✅ Otomatis | ✅ Didukung, tapi manual |

Karena roadmap Faukha ke depan mencakup **dashboard status bot real-time**, **integrasi payment gateway**, dan **member area/login** — semuanya butuh server-side logic (API routes / server actions) yang **tidak bisa jalan di GitHub Pages** (hosting statis murni). Vercel memungkinkan proyek ini tumbuh dari landing page statis menjadi aplikasi full-stack tanpa migrasi hosting di kemudian hari.

> Kalau di masa depan proyek ini benar-benar tetap 100% statis selamanya, GitHub Pages tetap opsi valid — tinggal set `output: "export"` di `next.config.js`, nonaktifkan `next/image` optimization, dan pakai GitHub Actions untuk build+deploy ke branch `gh-pages`. Tapi untuk arah pengembangan Faukha saat ini, Vercel lebih sesuai.

### Langkah Deploy ke Vercel

**A. Push proyek ke GitHub (kalau belum)**

```bash
git init
git add .
git commit -m "Initial commit: Faukha landing page"
git branch -M main
git remote add origin https://github.com/<username-kamu>/faukha.git
git push -u origin main
```

**B. Hubungkan repo ke Vercel**

1. Buka [vercel.com](https://vercel.com) → login (bisa pakai akun GitHub langsung).
2. Klik **"Add New..." → "Project"**.
3. Pilih repository `faukha` dari daftar repo GitHub kamu (authorize akses kalau diminta).
4. Vercel otomatis mendeteksi framework **Next.js** — biarkan setting default:
   - Build Command: `next build`
   - Output Directory: (otomatis, tidak perlu diisi manual)
   - Install Command: `npm install`
5. Kalau ada env variable dari `.env.example` yang sudah relevan, isi di bagian **"Environment Variables"** sebelum klik deploy.
6. Klik **"Deploy"** — tunggu build selesai (~1-2 menit).
7. Setelah selesai, Vercel kasih URL preview (`faukha-xxxx.vercel.app`). Untuk custom domain, buka **Project Settings → Domains** dan tambahkan domain kamu (mis. `faukha.id`), lalu arahkan DNS sesuai instruksi Vercel.

**C. Deploy otomatis selanjutnya**

Setelah repo terhubung, **setiap `git push` ke branch `main` otomatis trigger deploy production baru** — tidak perlu langkah manual lagi. Push ke branch lain (mis. `feature/xyz`) otomatis menghasilkan preview deployment terpisah dengan URL unik, jadi bisa direview dulu sebelum merge ke `main`.

---

## 🏗️ Arsitektur untuk Scaling

Faukha saat ini adalah landing page statis, tapi struktur proyeknya sudah disiapkan supaya bisa berkembang jadi platform SaaS penuh (login, dashboard klien, payment) **tanpa perlu menulis ulang dari nol**. Berikut polanya:

### 1. Data selalu lewat `lib/data.ts`, bukan langsung dari `/data`

Komponen tidak pernah `import { bots } from "@/data/bots"` secara langsung. Sebaliknya, section yang butuh data (`PlatformSelector.tsx`, `Pricing.tsx`, `Testimonials.tsx`) adalah **Server Component** yang memanggil `getBots()`, `getPricingPlans()`, atau `getTestimonials()` dari `lib/data.ts`, lalu meneruskan hasilnya sebagai props ke komponen client di sebelahnya (`PlatformSelectorClient.tsx`, `PricingClient.tsx`, `TestimonialsClient.tsx`) yang menangani interaktivitasnya (tab, toggle, carousel).

Kenapa dipisah begini? Karena saat data pindah dari file statis ke database asli, **yang diubah hanya isi function di `lib/data.ts`** — komponen React sama sekali tidak perlu disentuh.

**Migrasi ke Supabase (rekomendasi utama):**

Supabase dipilih karena punya Postgres managed + auth bawaan (jadi satu layanan menutupi dua kebutuhan: database dan login klien), tier gratis cukup untuk skala awal, dan SDK JS-nya ringan dipakai di Next.js App Router. Alternatif seperti PlanetScale (MySQL, tanpa auth bawaan) juga valid kalau ke depan butuh skema relasional yang lebih besar, tapi berarti autentikasi tetap perlu dipasang terpisah.

Contoh migrasi `getBots()` tanpa mengubah komponen pemanggilnya:

```ts
// lib/data.ts — SEBELUM (statis)
export async function getBots(): Promise<Bot[]> {
  return botsData;
}

// lib/data.ts — SESUDAH (Supabase)
import { supabase } from "@/lib/supabase";

export async function getBots(): Promise<Bot[]> {
  const { data, error } = await supabase.from("bots").select("*");
  if (error) throw error;
  return data;
}
```

Signature function (`Promise<Bot[]>`) tetap sama, jadi `PlatformSelector.tsx` yang memanggil `await getBots()` tidak perlu diubah sama sekali.

### 2. Menambah platform baru (misal Discord)

Pola `PlatformSelector` sudah generic sejak awal:

1. Tambah entri baru di array `platformTabs` dalam `PlatformSelectorClient.tsx` (id, label, icon).
2. Tambah data bot dengan `platform: "discord"` di `data/bots.ts` (perlu extend union type `Platform` di `types/index.ts` juga).
3. Selesai — `BotCard.tsx`, filter logic, dan tab switcher otomatis mengikuti tanpa refactor.

### 3. Menambah autentikasi klien (rekomendasi: NextAuth.js / Auth.js)

Untuk fitur dashboard di `/app/dashboard`, NextAuth.js (sekarang bernama Auth.js) direkomendasikan karena native untuk App Router, dan kalau backend-nya sudah Supabase, NextAuth juga punya adapter resmi untuk Supabase sehingga sesi & user tersimpan di database yang sama. Langkah garis besarnya:

1. Install `next-auth` dan konfigurasi provider (email/password, atau Google OAuth untuk kemudahan klien).
2. Buat `app/api/auth/[...nextauth]/route.ts` sesuai dokumentasi Auth.js.
3. Bungkus `app/dashboard/page.tsx` (atau tambahkan `app/dashboard/layout.tsx`) dengan pengecekan sesi — redirect ke halaman login kalau belum terautentikasi.
4. Ganti konten placeholder di `app/dashboard/page.tsx` dengan data klien asli, diambil lewat function baru di `lib/data.ts` (mis. `getClientBots(userId)`).

### 4. Prinsip yang dijaga

Tidak ada data bisnis (bot, harga, testimoni) yang di-hardcode langsung di dalam komponen di luar pola `/data` + `lib/data.ts` di atas. Konten yang murni bagian dari copy/desain section (mis. langkah-langkah di `HowItWorks.tsx`, pertanyaan di `FAQ.tsx`, atau skrip percakapan dummy di `LiveDemo.tsx`) sengaja tetap berada di komponennya masing-masing karena bukan entitas data yang berulang/dinamis seperti katalog bot atau paket harga — jadi tidak perlu lapisan abstraksi tambahan untuk itu.

---

## 🧭 Roadmap Pengembangan

Riwayat pembangunan bertahap:

1. ✅ Setup Fondasi Proyek — struktur folder, tema Tailwind, tipe data, dummy data.
2. ✅ Hero Section — headline gradient, tagline, CTA, objek 3D "bot/AI network".
3. ✅ Features & Platform Selector — kartu keunggulan, tab switcher WhatsApp/Telegram generic.
4. ✅ Cara Kerja, Demo Interaktif, Pricing, Testimoni, FAQ, CTA/Footer.
5. ✅ Polishing — navbar sticky, preloader, optimasi 3D untuk mobile, aksesibilitas dasar, OG meta.
6. ✅ Deployment — konfigurasi Vercel, `.env.example`, dokumentasi lengkap (README ini).
7. ✅ Kesiapan Upgrade Jangka Panjang — data access layer (`lib/data.ts`), placeholder `/dashboard`, dokumentasi arsitektur scaling.

Rencana pengembangan selanjutnya:

- [ ] Member area / login klien (rekomendasi: NextAuth.js/Auth.js — lihat "Arsitektur untuk Scaling")
- [ ] Dashboard status bot real-time (isi ulang `app/dashboard/page.tsx` dengan data asli)
- [ ] Migrasi `lib/data.ts` ke database asli (rekomendasi: Supabase)
- [ ] Integrasi payment gateway (mis. Midtrans/Xendit)
- [ ] Multi-language (ID/EN)
- [ ] Integrasi Discord bot (platform ketiga — tinggal tambah entri di `platformTabs` pada `PlatformSelectorClient.tsx` + data di `data/bots.ts`, arsitektur sudah generic untuk ini)
