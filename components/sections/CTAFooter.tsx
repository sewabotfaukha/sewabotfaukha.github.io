"use client";

import { motion } from "framer-motion";
import { MessageCircle, Send, Instagram, Twitter } from "lucide-react";
import { getButtonClasses } from "@/components/ui/Button";

// Kontak admin resmi Faukha.
const WHATSAPP_ADMIN_URL = "https://wa.me/6281918650302";
const TELEGRAM_ADMIN_URL = "https://t.me/Faukhaa";

export function CTAFooter() {
  return (
    <>
      <section id="kontak" className="px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-background-surface px-8 py-16 text-center"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-radial-glow"
          />
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Siap Aktifkan Bot Kamu?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-foreground-muted">
            Chat admin sekarang, konsultasi kebutuhan gratis, dan bot bisa
            langsung aktif hari ini juga.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={WHATSAPP_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={getButtonClasses("gradient", "w-full sm:w-auto animate-glow")}
            >
              <MessageCircle className="h-4 w-4" />
              Chat Admin via WhatsApp
            </a>
            <a
              href={TELEGRAM_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={getButtonClasses("outline", "w-full sm:w-auto")}
            >
              <Send className="h-4 w-4" />
              Chat Admin via Telegram
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-1 md:items-start">
            <span className="bg-gradient-aitech bg-clip-text text-xl font-extrabold text-transparent">
              Faukha
            </span>
            <p className="text-xs text-foreground-muted">
              © {new Date().getFullYear()} Faukha. Semua hak dilindungi.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-foreground-muted">
            <a href="#" className="hover:text-foreground">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-foreground">
              Syarat Layanan
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              aria-label="Instagram Faukha"
              className="text-foreground-muted hover:text-foreground"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Twitter/X Faukha"
              className="text-foreground-muted hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href={TELEGRAM_ADMIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram Faukha"
              className="text-foreground-muted hover:text-foreground"
            >
              <Send className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
