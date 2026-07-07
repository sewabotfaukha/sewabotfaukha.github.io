import { PricingPlan } from "@/types";

export const pricingPlans: PricingPlan[] = [
  {
    id: "plan-starter",
    nama: "Starter",
    harga: 50000,
    periode: "/bulan",
    fitur: [
      "1 bot (WhatsApp atau Telegram)",
      "1 kategori bot (moderasi/games/autoreply)",
      "Update fitur reguler",
      "Support via chat",
    ],
    highlight: false,
  },
  {
    id: "plan-populer",
    nama: "Populer",
    harga: 120000,
    periode: "/bulan",
    fitur: [
      "2 bot (WhatsApp & Telegram)",
      "Semua kategori bot tersedia",
      "Prioritas antrean update",
      "Support respon cepat 24 jam",
      "Laporan aktivitas mingguan",
    ],
    highlight: true,
  },
  {
    id: "plan-bisnis",
    nama: "Bisnis",
    harga: 250000,
    periode: "/bulan",
    fitur: [
      "Bot tanpa batas (WhatsApp & Telegram)",
      "Custom fitur sesuai kebutuhan",
      "Integrasi API pihak ketiga",
      "Dedicated support",
      "SLA maintenance & uptime",
    ],
    highlight: false,
  },
  {
    id: "plan-custom",
    nama: "Enterprise / Custom",
    harga: 0,
    periode: "hubungi kami",
    fitur: [
      "Solusi bot fully custom",
      "Konsultasi arsitektur & workflow",
      "Integrasi sistem internal perusahaan",
      "Kontrak & SLA khusus",
    ],
    highlight: false,
  },
];
