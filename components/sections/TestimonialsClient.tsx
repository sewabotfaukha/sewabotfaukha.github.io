"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, PanInfo } from "framer-motion";
import { Star } from "lucide-react";
import type { Testimonial } from "@/types";

const GAP = 24; // px, sesuai gap-6 di Tailwind

interface TestimonialsClientProps {
  testimonials: Testimonial[];
}

/** Avatar inisial sebagai fallback, tanpa bergantung pada file foto eksternal. */
function AvatarInisial({ nama }: { nama: string }) {
  const inisial = nama
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-aitech text-sm font-bold text-white">
      {inisial}
    </div>
  );
}

/**
 * Bagian interaktif (carousel drag, autoplay) dari section Testimonials.
 * Menerima data lewat props. Wrapper server component-nya ada di
 * Testimonials.tsx.
 */
export function TestimonialsClient({ testimonials }: TestimonialsClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cardStep, setCardStep] = useState(340);

  // Ukur lebar kartu asli (responsive) supaya carousel akurat di semua layar.
  useEffect(() => {
    function measure() {
      if (cardRef.current) {
        setCardStep(cardRef.current.offsetWidth + GAP);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const maxIndex = testimonials.length - 1;

  useEffect(() => {
    controls.start({
      x: -index * cardStep,
      transition: { type: "spring", stiffness: 260, damping: 30 },
    });
  }, [index, cardStep, controls]);

  // Autoplay: maju satu kartu tiap beberapa detik, berhenti saat hover/drag.
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setIsPaused(false);
    if (info.offset.x < -cardStep / 3 && index < maxIndex) {
      setIndex((prev) => prev + 1);
    } else if (info.offset.x > cardStep / 3 && index > 0) {
      setIndex((prev) => prev - 1);
    } else {
      controls.start({
        x: -index * cardStep,
        transition: { type: "spring", stiffness: 260, damping: 30 },
      });
    }
  }

  return (
    <section id="testimoni" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Apa Kata Mereka
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Ratusan grup dan komunitas sudah merasakan manfaat Faukha.
          </p>
        </motion.div>
      </div>

      <div
        ref={containerRef}
        className="mt-14 overflow-hidden px-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -maxIndex * cardStep, right: 0 }}
          dragElastic={0.08}
          onDragStart={() => setIsPaused(true)}
          onDragEnd={handleDragEnd}
          animate={controls}
          className="mx-auto flex max-w-6xl cursor-grab gap-6 active:cursor-grabbing"
        >
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              ref={i === 0 ? cardRef : undefined}
              className="w-[85%] shrink-0 select-none rounded-2xl border border-border bg-background-surface p-6 sm:w-[380px]"
            >
              <div className="flex items-center gap-3">
                <AvatarInisial nama={t.nama} />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.nama}
                  </p>
                  <p className="text-xs text-foreground-muted">{t.grup}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, starIdx) => (
                  <Star
                    key={starIdx}
                    className="h-4 w-4"
                    fill={starIdx < t.rating ? "#06B6D4" : "transparent"}
                    stroke={starIdx < t.rating ? "#06B6D4" : "#64748B"}
                  />
                ))}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                &ldquo;{t.isi}&rdquo;
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Indikator titik */}
      <div className="mt-8 flex justify-center gap-2">
        {testimonials.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setIndex(i)}
            aria-label={`Ke testimoni ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-aitech-to" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
