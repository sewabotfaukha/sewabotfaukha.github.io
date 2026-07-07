import { Check } from "lucide-react";
import { Bot } from "@/types";
import { cn, formatRupiah, kategoriBotStyles } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface BotCardProps {
  bot: Bot;
}

/**
 * Kartu bot generic — dipakai untuk menampilkan bot dari platform mana pun.
 * Tidak ada logic spesifik-platform di sini, sengaja dibuat begitu supaya
 * saat ada platform baru (mis. Discord), komponen ini tetap dipakai apa adanya.
 */
export function BotCard({ bot }: BotCardProps) {
  const kategori = kategoriBotStyles[bot.kategori];
  const isComingSoon = bot.status === "coming-soon";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-background-surface p-6 transition-colors duration-300",
        !isComingSoon && "hover:border-aitech-to/40"
      )}
    >
      {isComingSoon && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-[2px]">
          <span className="rounded-full border border-border bg-background-elevated px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Segera Hadir
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">{bot.nama}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
            kategori.className
          )}
        >
          {kategori.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
        {bot.deskripsi}
      </p>

      <ul className="mt-4 space-y-2">
        {bot.fitur.slice(0, 3).map((fitur) => (
          <li
            key={fitur}
            className="flex items-start gap-2 text-sm text-foreground/90"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-aitech-to" />
            <span>{fitur}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <div>
          <span className="text-xl font-bold text-foreground">
            {formatRupiah(bot.harga)}
          </span>
          <span className="text-sm text-foreground-muted">/bulan</span>
        </div>
        <Button
          variant="gradient"
          disabled={isComingSoon}
          className="px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          Sewa Bot Ini
        </Button>
      </div>
    </div>
  );
}
