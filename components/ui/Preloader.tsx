"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Durasi maksimal splash — sengaja singkat (di bawah 1.5 detik) supaya
// tidak terasa menghalangi, murni sebagai transisi awal yang halus.
const SPLASH_DURATION = 900;
const FADE_OUT_DURATION = 0.4;

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Kalau user minta reduce motion, langsung skip splash — tidak ada gunanya menahan mereka.
    const duration = prefersReducedMotion ? 0 : SPLASH_DURATION;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Kunci scroll selagi splash tampil supaya tidak ada "flash" konten di baliknya.
  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_OUT_DURATION, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          aria-hidden
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-aitech bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl"
          >
            Faukha
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
