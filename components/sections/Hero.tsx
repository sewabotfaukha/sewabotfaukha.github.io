"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroSceneFallback } from "@/components/3d/HeroScene";

// Canvas Three.js butuh akses ke window, jadi di-load client-only.
// loading fallback dipakai selagi chunk-nya di-fetch, sama seperti
// pola Suspense tapi lebih idiomatis untuk Next.js App Router.
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
  loading: () => <HeroSceneFallback />,
});

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      id="beranda"
      className="relative overflow-hidden px-6 pb-20 pt-28 md:pb-28 md:pt-36"
    >
      {/* Ambient glow di belakang seluruh Hero — radial gradient blur, ringan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-radial-glow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-aitech-from/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-8">
        {/* Kolom teks */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center md:items-start md:text-left"
        >
          <motion.div variants={itemVariants}>
            <Badge>🚀 500+ Grup Sudah Menggunakan Faukha</Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 bg-gradient-aitech bg-clip-text text-6xl font-extrabold leading-[1.05] tracking-tight text-transparent sm:text-7xl md:text-8xl"
          >
            Faukha
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-5 max-w-xl text-lg font-semibold text-foreground md:text-xl"
          >
            Digital Store untuk Sewa Bot WhatsApp & Telegram — Jaga Grup,
            Mainkan Games, Otomatiskan Semuanya
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-xl text-base leading-relaxed text-foreground-muted"
          >
            Faukha menyediakan layanan bot siap pakai: moderasi grup otomatis,
            bot games interaktif, auto-reply cerdas, hingga bot custom sesuai
            kebutuhan bisnismu. Tersedia untuk platform WhatsApp maupun
            Telegram, tinggal sewa dan langsung aktif.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <Button variant="gradient" className="animate-glow">
              Sewa Sekarang
            </Button>
            <Button variant="outline">Lihat Demo</Button>
          </motion.div>
        </motion.div>

        {/* Kolom objek 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-[280px] w-full max-w-sm md:h-[460px] md:max-w-none"
        >
          <HeroScene />
        </motion.div>
      </div>
    </section>
  );
}
