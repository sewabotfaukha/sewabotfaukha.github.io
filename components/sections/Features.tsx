"use client";

import { MouseEvent, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Zap, Layers, SlidersHorizontal, Headset, LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  judul: string;
  deskripsi: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    judul: "Setup Cepat",
    deskripsi: "Bot aktif dalam hitungan menit tanpa perlu keahlian teknis.",
  },
  {
    icon: Layers,
    judul: "Multi-Platform",
    deskripsi: "Tersedia untuk WhatsApp dan Telegram sekaligus.",
  },
  {
    icon: SlidersHorizontal,
    judul: "Kustomisasi Penuh",
    deskripsi: "Sesuaikan fitur bot sesuai kebutuhan grup/komunitas kamu.",
  },
  {
    icon: Headset,
    judul: "Support 24/7",
    deskripsi: "Tim siap bantu kapan saja lewat WhatsApp/Telegram.",
  },
];

function FeatureCard({ icon: Icon, judul, deskripsi }: Feature) {
  const ref = useRef<HTMLDivElement>(null);

  // Posisi mouse relatif ke kartu, dipetakan jadi sudut rotasi (perspective tilt).
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { stiffness: 150, damping: 15, mass: 0.5 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [8, -8]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-8, 8]),
    springConfig
  );

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    mouseX.set((e.clientX - bounds.left) / bounds.width - 0.5);
    mouseY.set((e.clientY - bounds.top) / bounds.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.02 }}
      className="group relative rounded-2xl border border-border bg-background-surface p-7"
    >
      {/* Glow gradient di belakang card, muncul saat hover, membentuk kesan border menyala */}
      <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-aitech opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" />
      <div className="absolute inset-0 rounded-2xl border border-transparent transition-colors duration-300 group-hover:border-aitech-to/40" />

      <div
        style={{ transform: "translateZ(30px)" }}
        className="relative flex flex-col"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-aitech transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-foreground">{judul}</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {deskripsi}
        </p>
      </div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="fitur" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Kenapa Faukha?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Semua yang kamu butuhkan untuk menjalankan bot WhatsApp & Telegram
            tanpa ribet, dari setup sampai support.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.judul} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
