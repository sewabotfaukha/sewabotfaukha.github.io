// Tipe data inti untuk Faukha — digital store sewa bot WhatsApp & Telegram.
// Simpan semua interface di sini supaya konsisten dipakai di seluruh komponen & data.

export type Platform = "whatsapp" | "telegram";

export type BotKategori = "moderasi" | "games" | "autoreply" | "custom";

export type BotStatus = "tersedia" | "coming-soon";

export interface Bot {
  id: string;
  nama: string;
  platform: Platform;
  kategori: BotKategori;
  deskripsi: string;
  fitur: string[];
  harga: number; // dalam Rupiah, per bulan
  status: BotStatus;
}

export interface PricingPlan {
  id: string;
  nama: string;
  harga: number; // dalam Rupiah
  periode: string; // contoh: "/bulan", "/tahun"
  fitur: string[];
  highlight: boolean; // true jika ingin ditonjolkan sebagai "paling populer"
}

export interface Testimonial {
  id: string;
  nama: string;
  grup: string; // nama grup/komunitas tempat bot dipakai
  foto: string; // path/URL foto profil
  isi: string;
  rating: number; // 1-5
}
