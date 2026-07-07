"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  pertanyaan: string;
  jawaban: string;
}

const faqs: FAQItem[] = [
  {
    pertanyaan: "Apakah data grup saya aman?",
    jawaban:
      "Aman. Faukha tidak menyimpan isi percakapan pribadi member, hanya data konfigurasi bot (setting moderasi, jadwal, dsb) yang dienkripsi dan hanya bisa diakses oleh admin grup terkait.",
  },
  {
    pertanyaan: "Bagaimana proses refund jika bot tidak sesuai kebutuhan?",
    jawaban:
      "Kamu bisa ajukan refund penuh dalam 3 hari pertama setelah aktivasi jika bot belum digunakan secara aktif. Setelah itu, refund dihitung prorata sesuai sisa masa aktif.",
  },
  {
    pertanyaan: "Bagaimana cara aktivasi bot setelah bayar?",
    jawaban:
      "Setelah pembayaran terkonfirmasi, kamu akan menerima link invite bot ke grup WhatsApp/Telegram-mu beserta panduan setting dasar. Prosesnya cuma butuh beberapa klik.",
  },
  {
    pertanyaan: "Apakah bisa custom fitur di luar yang tersedia?",
    jawaban:
      "Bisa. Paket Bisnis dan Enterprise/Custom mendukung permintaan fitur khusus — konsultasikan kebutuhanmu dengan tim kami dan kami akan buatkan solusinya.",
  },
  {
    pertanyaan: "Berapa lama proses setup sampai bot aktif?",
    jawaban:
      "Rata-rata hanya 5 menit untuk bot standar (moderasi, games, auto-reply). Untuk bot custom, waktu setup menyesuaikan kompleksitas fitur yang diminta.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-5xl">
            Pertanyaan Umum
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground-muted">
            Hal-hal yang sering ditanyakan sebelum sewa bot Faukha.
          </p>
        </motion.div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.pertanyaan}
                className="overflow-hidden rounded-2xl border border-border bg-background-surface"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-foreground md:text-base">
                    {faq.pertanyaan}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-foreground-muted" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-foreground-muted">
                        {faq.jawaban}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
