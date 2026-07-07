"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import type { Bot, Platform } from "@/types";
import { BotCard } from "@/components/ui/BotCard";
import { cn } from "@/lib/utils";

interface PlatformSelectorClientProps {
  bots: Bot[];
}

// Daftar tab platform. Untuk nambah platform baru (mis. Discord), cukup
// tambah satu entri di sini — grid & tab switcher otomatis mengikuti,
// selama data/bots.ts juga punya entri dengan platform tersebut.
const platformTabs: { id: Platform; label: string; icon: typeof MessageCircle }[] = [
  { id: "whatsapp", label: "WhatsApp Bot", icon: MessageCircle },
  { id: "telegram", label: "Telegram Bot", icon: Send },
];

/**
 * Bagian interaktif (tab switcher, filter, animasi) dari section
 * PlatformSelector. Menerima seluruh daftar bot lewat props dan
 * memfilter di sisi client sesuai tab aktif. Wrapper server
 * component-nya ada di PlatformSelector.tsx.
 */
export function PlatformSelectorClient({ bots }: PlatformSelectorClientProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("whatsapp");

  const filteredBots = bots.filter((bot) => bot.platform === activePlatform);

  return (
    <section id="platform" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Pilih Platform
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Bot Faukha tersedia untuk WhatsApp dan Telegram — pilih platform
            yang kamu pakai, lalu sewa bot sesuai kebutuhan grupmu.
          </p>
        </motion.div>

        {/* Segmented control / pill tab switcher */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-background-surface p-1.5">
            {platformTabs.map((tab) => {
              const isActive = tab.id === activePlatform;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePlatform(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                    isActive ? "text-white" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="platform-tab-pill"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className={cn(
                        "absolute inset-0 rounded-full",
                        tab.id === "whatsapp" ? "bg-whatsapp" : "bg-telegram"
                      )}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid bot, transisi fade + slide antar tab */}
        <div className="relative mt-12 min-h-[20rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePlatform}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
