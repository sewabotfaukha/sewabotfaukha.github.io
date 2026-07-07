"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { PricingPlan } from "@/types";

type Periode = "bulanan" | "tahunan";

// Simulasi diskon tahunan: bayar 10 bulan, dapat 12 (hemat ~2 bulan).
const DISKON_BULAN_TAHUNAN = 10;

interface PricingClientProps {
  pricingPlans: PricingPlan[];
}

/**
 * Bagian interaktif (toggle bulanan/tahunan, animasi) dari section Pricing.
 * Menerima data lewat props — TIDAK mengambil data sendiri — supaya
 * komponen ini tetap reusable meski sumber data berubah di masa depan.
 * Wrapper server component-nya ada di Pricing.tsx.
 */
export function PricingClient({ pricingPlans }: PricingClientProps) {
  const [periode, setPeriode] = useState<Periode>("bulanan");

  return (
    <section id="harga" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Pilihan Paket
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Mulai dari kebutuhan kecil sampai skala bisnis, ada paket yang
            pas buat kamu.
          </p>
        </motion.div>

        {/* Toggle Bulanan / Tahunan */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-background-surface p-1.5">
            {(["bulanan", "tahunan"] as Periode[]).map((opt) => {
              const isActive = periode === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setPeriode(opt)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors duration-200",
                    isActive ? "text-white" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="pricing-period-pill"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-gradient-aitech"
                    />
                  )}
                  <span className="relative z-10">
                    {opt === "tahunan" ? "Tahunan (hemat 2 bulan)" : "Bulanan"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => {
            const isGratis = plan.harga === 0;
            const hargaTampil =
              periode === "tahunan" ? plan.harga * DISKON_BULAN_TAHUNAN : plan.harga;
            const periodeLabel = isGratis
              ? plan.periode
              : periode === "tahunan"
              ? "/tahun"
              : "/bulan";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-7",
                  plan.highlight
                    ? "border-transparent bg-background-elevated shadow-2xl shadow-aitech-from/25 md:-mt-6 md:mb-6"
                    : "border-border bg-background-surface hover:shadow-lg hover:shadow-aitech-to/10"
                )}
                style={
                  plan.highlight
                    ? {
                        backgroundImage:
                          "linear-gradient(#161d33, #161d33), linear-gradient(135deg, #7C3AED, #06B6D4)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box, border-box",
                        border: "1px solid transparent",
                      }
                    : undefined
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-aitech px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-aitech-from/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    Paling Populer
                  </span>
                )}

                <h3 className="text-lg font-bold text-foreground">
                  {plan.nama}
                </h3>

                <div className="mt-4">
                  {isGratis ? (
                    <span className="text-2xl font-extrabold text-foreground">
                      Hubungi Kami
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-foreground">
                        {formatRupiah(hargaTampil)}
                      </span>
                      <span className="text-sm text-foreground-muted">
                        {periodeLabel}
                      </span>
                    </>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.fitur.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-aitech-to" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlight ? "gradient" : "outline"}
                  className="mt-7 w-full"
                >
                  {isGratis ? "Hubungi Kami" : "Pilih Paket"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
