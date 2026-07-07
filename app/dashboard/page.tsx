import type { Metadata } from "next";
import { LayoutDashboard, Lock, Rocket } from "lucide-react";

/**
 * Placeholder untuk area member/dashboard klien.
 *
 * Belum fungsional (belum ada autentikasi, belum ada data real). Halaman
 * ini sengaja dibuat sekarang supaya route /dashboard sudah "ada" di
 * struktur proyek, jadi saat NextAuth.js + Supabase (lihat README bagian
 * "Arsitektur untuk Scaling") ditambahkan nanti, tinggal:
 *   1. Bungkus halaman ini (atau layout.tsx di folder ini) dengan
 *      pengecekan sesi/login.
 *   2. Ganti konten placeholder dengan data klien asli (status bot,
 *      riwayat pembayaran, dll) yang diambil lewat lib/data.ts.
 *
 * Tidak perlu membuat ulang routing atau layout dasar dari nol.
 */
export const metadata: Metadata = {
  title: "Dashboard — Faukha",
  description: "Area member Faukha untuk mengelola bot yang kamu sewa.",
};

export default function DashboardPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-radial-glow" />

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-surface">
        <LayoutDashboard className="h-8 w-8 text-aitech-to" />
      </div>

      <h1 className="bg-gradient-aitech bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
        Fitur Dashboard Klien Akan Segera Hadir
      </h1>

      <p className="max-w-md text-sm leading-relaxed text-foreground-muted sm:text-base">
        Nantinya di sini kamu bisa memantau status bot yang sedang aktif,
        riwayat pembayaran, dan mengatur konfigurasi bot langsung dari
        akunmu. Untuk saat ini, hubungi admin lewat WhatsApp atau Telegram
        untuk pengelolaan bot.
      </p>

      <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-border bg-background-surface px-6 py-4 text-xs text-foreground-muted sm:flex-row sm:text-sm">
        <span className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Login klien menyusul
        </span>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <span className="flex items-center gap-2">
          <Rocket className="h-4 w-4" />
          Dibangun di atas fondasi yang sudah siap scaling
        </span>
      </div>

      <a
        href="/"
        className="mt-4 text-sm font-semibold text-aitech-to underline underline-offset-4 hover:text-aitech-from"
      >
        Kembali ke Beranda
      </a>
    </main>
  );
}
