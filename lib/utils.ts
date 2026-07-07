import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan className secara kondisional dan menyelesaikan konflik
 * utility Tailwind (mis. "px-2" vs "px-4") secara otomatis.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka menjadi format Rupiah, contoh: 150000 -> "Rp150.000"
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Mapping kategori bot -> label & warna badge.
 * Disimpan terpusat supaya kategori baru cukup ditambah di sini,
 * tanpa perlu menyentuh komponen kartu bot.
 */
export const kategoriBotStyles = {
  moderasi: {
    label: "Moderasi",
    className: "bg-whatsapp/15 text-whatsapp border-whatsapp/30",
  },
  games: {
    label: "Games",
    className: "bg-aitech-from/15 text-[#A78BFA] border-aitech-from/30",
  },
  autoreply: {
    label: "Auto-Reply",
    className: "bg-telegram/15 text-telegram border-telegram/30",
  },
  custom: {
    label: "Custom",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
} as const;
