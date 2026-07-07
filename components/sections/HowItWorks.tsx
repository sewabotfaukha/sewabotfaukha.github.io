"use client";

import { motion } from "framer-motion";
import { ListChecks, CreditCard, Rocket, LucideIcon } from "lucide-react";

interface Step {
  nomor: number;
  judul: string;
  deskripsi: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    nomor: 1,
    judul: "Pilih Bot & Paket",
    deskripsi: "Tentukan bot dan paket yang paling cocok dengan kebutuhan grup atau bisnismu.",
    icon: ListChecks,
  },
  {
    nomor: 2,
    judul: "Konfigurasi & Bayar",
    deskripsi: "Atur pengaturan dasar bot, lalu selesaikan pembayaran lewat metode favoritmu.",
    icon: CreditCard,
  },
  {
    nomor: 3,
    judul: "Bot Aktif dalam 5 Menit",
    deskripsi: "Bot langsung aktif dan siap bekerja di grup WhatsApp atau Telegram-mu.",
    icon: Rocket,
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Cara Kerja
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Tiga langkah sederhana dan bot kamu sudah siap bekerja.
          </p>
        </motion.div>

        <div className="relative mt-16 flex flex-col gap-12 md:flex-row md:gap-6">
          {/* Garis penghubung: vertikal di mobile, horizontal di desktop */}
          <div className="absolute left-6 top-0 h-full w-px md:left-0 md:top-6 md:h-px md:w-full">
            <svg
              className="h-full w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <motion.line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                className="md:hidden"
                stroke="url(#line-gradient)"
                strokeWidth="2"
                strokeDasharray="6 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
              <motion.line
                x1="0"
                y1="0"
                x2="100%"
                y2="0"
                className="hidden md:block"
                stroke="url(#line-gradient)"
                strokeWidth="2"
                strokeDasharray="6 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.nomor}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex flex-1 flex-col items-start pl-16 md:items-center md:pl-0 md:text-center"
            >
              <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-aitech text-lg font-bold text-white shadow-lg shadow-aitech-from/30 md:static md:mb-5">
                {step.nomor}
              </div>
              <div className="mt-1 flex items-center gap-2 md:mt-0 md:flex-col md:gap-3">
                <step.icon className="h-5 w-5 text-aitech-to md:h-6 md:w-6" />
                <h3 className="text-lg font-bold text-foreground">
                  {step.judul}
                </h3>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground-muted">
                {step.deskripsi}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
