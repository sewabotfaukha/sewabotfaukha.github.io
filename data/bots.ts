import { Bot } from "@/types";

export const bots: Bot[] = [
  {
    id: "bot-moderasi-wa",
    nama: "Faukha Guard",
    platform: "whatsapp",
    kategori: "moderasi",
    deskripsi:
      "Bot moderasi grup WhatsApp otomatis: anti-link, anti-spam, welcome message, dan manajemen member.",
    fitur: [
      "Anti-link & anti-spam otomatis",
      "Welcome & goodbye message custom",
      "Kick/ban otomatis untuk pelanggar rules",
      "Laporan aktivitas grup harian",
    ],
    harga: 50000,
    status: "tersedia",
  },
  {
    id: "bot-games-wa",
    nama: "Faukha Arena",
    platform: "whatsapp",
    kategori: "games",
    deskripsi:
      "Bot mini-games interaktif untuk grup WhatsApp: tebak kata, kuis, family100, dan leaderboard.",
    fitur: [
      "10+ mini-games siap pakai",
      "Sistem poin & leaderboard mingguan",
      "Kuis custom sesuai tema grup",
      "Reward otomatis untuk pemenang",
    ],
    harga: 65000,
    status: "tersedia",
  },
  {
    id: "bot-autoreply-wa",
    nama: "Faukha Reply",
    platform: "whatsapp",
    kategori: "autoreply",
    deskripsi:
      "Bot auto-reply untuk WhatsApp Business: FAQ otomatis, katalog produk, dan follow-up chat pelanggan.",
    fitur: [
      "Auto-reply berbasis keyword & AI",
      "Katalog produk interaktif",
      "Jadwal balas otomatis di luar jam kerja",
      "Integrasi Google Sheets untuk data",
    ],
    harga: 75000,
    status: "tersedia",
  },
  {
    id: "bot-custom-wa",
    nama: "Faukha Custom Bot",
    platform: "whatsapp",
    kategori: "custom",
    deskripsi:
      "Bot WhatsApp custom sesuai kebutuhan bisnis: integrasi API, workflow khusus, dan fitur eksklusif.",
    fitur: [
      "Konsultasi kebutuhan fitur",
      "Integrasi API pihak ketiga",
      "Workflow otomatisasi sesuai bisnis",
      "Support prioritas & maintenance",
    ],
    harga: 150000,
    status: "coming-soon",
  },
  {
    id: "bot-moderasi-tele",
    nama: "Faukha Guard TG",
    platform: "telegram",
    kategori: "moderasi",
    deskripsi:
      "Bot moderasi grup Telegram: filter kata kasar, anti-flood, dan sistem warning otomatis.",
    fitur: [
      "Filter kata kasar & konten sensitif",
      "Anti-flood & anti-raid",
      "Sistem warning bertingkat",
      "Log moderasi realtime",
    ],
    harga: 45000,
    status: "tersedia",
  },
  {
    id: "bot-games-tele",
    nama: "Faukha Arena TG",
    platform: "telegram",
    kategori: "games",
    deskripsi:
      "Bot games untuk grup Telegram dengan inline keyboard interaktif dan turnamen mingguan.",
    fitur: [
      "Inline games interaktif",
      "Turnamen mingguan otomatis",
      "Sistem badge & achievement",
      "Statistik pemain personal",
    ],
    harga: 55000,
    status: "coming-soon",
  },
];
