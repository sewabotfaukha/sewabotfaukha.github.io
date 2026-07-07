import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Diambil dari .env (NEXT_PUBLIC_SITE_URL) — fallback dipakai kalau env belum diisi
// (mis. saat development lokal). Ganti value di .env.local / dashboard hosting
// dengan domain produksi asli sebelum deploy.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://faukha.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Faukha — Sewa Bot WhatsApp & Telegram",
  description:
    "Faukha menyediakan sewa bot WhatsApp & Telegram untuk moderasi grup, games interaktif, auto-reply, hingga bot custom sesuai kebutuhan bisnis kamu. Cepat, andal, dan mudah dikelola.",
  keywords: [
    "sewa bot whatsapp",
    "sewa bot telegram",
    "bot moderasi grup",
    "bot games whatsapp",
    "bot auto reply",
    "faukha",
  ],
  openGraph: {
    title: "Faukha — Sewa Bot WhatsApp & Telegram",
    description:
      "Sewa bot WhatsApp & Telegram untuk moderasi, games, auto-reply, dan kebutuhan custom bisnismu.",
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Faukha",
    images: [
      {
        // Placeholder — ganti dengan asset og-image final (1200x630) sebelum production.
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Faukha — Sewa Bot WhatsApp & Telegram",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Faukha — Sewa Bot WhatsApp & Telegram",
    description:
      "Sewa bot WhatsApp & Telegram untuk moderasi, games, auto-reply, dan kebutuhan custom bisnismu.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
