"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot as BotIcon, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform } from "@/types";

interface ChatMessage {
  dari: "user" | "bot";
  isi: string;
}

const percakapan: ChatMessage[] = [
  { dari: "user", isi: "Halo, cara ban member spam gimana ya?" },
  {
    dari: "bot",
    isi: 'Gampang! Reply pesan member itu terus ketik "/ban" — bot langsung keluarkan dari grup otomatis.',
  },
  { dari: "user", isi: "Kalau mau anti-link aktif terus, bisa?" },
  {
    dari: "bot",
    isi: 'Bisa. Ketik "/antilink on" sekali aja, settingan ini otomatis tersimpan untuk grup ini.',
  },
];

const TYPING_DURATION = 1400;
const READ_PAUSE = 1600;
const LOOP_PAUSE = 2200;

const platformTheme: Record<
  Platform,
  { label: string; icon: typeof MessageCircle; color: string; bg: string }
> = {
  whatsapp: {
    label: "Preview WhatsApp",
    icon: MessageCircle,
    color: "text-whatsapp",
    bg: "bg-whatsapp",
  },
  telegram: {
    label: "Preview Telegram",
    icon: Send,
    color: "text-telegram",
    bg: "bg-telegram",
  },
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-background-elevated px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-foreground-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

export function LiveDemo() {
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // Reset animasi tiap kali platform tab diganti
  useEffect(() => {
    setVisibleCount(0);
    setIsTyping(false);
  }, [platform]);

  // Loop percakapan dummy: tampilkan pesan satu-satu, dengan typing
  // indicator sebelum bubble bot muncul, lalu ulang dari awal.
  useEffect(() => {
    let cancelled = false;

    async function playSequence() {
      for (let i = 0; i < percakapan.length; i++) {
        if (cancelled) return;
        const msg = percakapan[i];

        if (msg.dari === "bot") {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, TYPING_DURATION));
          if (cancelled) return;
          setIsTyping(false);
        }

        setVisibleCount(i + 1);
        await new Promise((r) => setTimeout(r, READ_PAUSE));
      }

      if (cancelled) return;
      await new Promise((r) => setTimeout(r, LOOP_PAUSE));
      if (cancelled) return;
      setVisibleCount(0);
      playSequence();
    }

    playSequence();
    return () => {
      cancelled = true;
    };
  }, [platform]);

  const theme = platformTheme[platform];

  return (
    <section id="demo" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Lihat Bot Bekerja
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Contoh percakapan asli dengan Faukha Bot — moderasi grup jadi
            semudah kirim pesan.
          </p>
        </motion.div>

        {/* Tab switcher platform */}
        <div className="mt-10 flex justify-center gap-2">
          {(Object.keys(platformTheme) as Platform[]).map((key) => {
            const t = platformTheme[key];
            const isActive = key === platform;
            const Icon = t.icon;
            return (
              <button
                key={key}
                onClick={() => setPlatform(key)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? cn("border-transparent text-white", t.bg)
                    : "border-border text-foreground-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Mock chat window */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background-surface shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 border-b border-border bg-background-elevated px-5 py-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                theme.bg
              )}
            >
              <BotIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Faukha Bot
              </p>
              <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-whatsapp" />
                Online
              </p>
            </div>
          </div>

          <div className="flex min-h-[22rem] flex-col justify-end gap-3 px-5 py-6">
            <AnimatePresence initial={false}>
              {percakapan.slice(0, visibleCount).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex",
                    msg.dari === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.dari === "user"
                        ? cn("rounded-br-sm text-white", theme.bg)
                        : "rounded-bl-sm bg-background-elevated text-foreground"
                    )}
                  >
                    {msg.isi}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <TypingIndicator />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
