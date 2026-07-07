import { bots as botsData } from "@/data/bots";
import { pricingPlans as pricingPlansData } from "@/data/pricing";
import { testimonials as testimonialsData } from "@/data/testimonials";
import type { Bot, PricingPlan, Testimonial, Platform } from "@/types";

/**
 * Data access layer untuk Faukha.
 *
 * Semua komponen HARUS mengambil data lewat function di file ini
 * (getBots, getPricingPlans, getTestimonials) — jangan import langsung
 * dari /data/*.ts di komponen.
 *
 * Kenapa dipisah begini? Supaya suatu saat sumber data pindah dari file
 * statis ke database/CMS asli (mis. Supabase), yang perlu diubah HANYA
 * isi function-function di bawah ini. Komponen yang memanggilnya tidak
 * perlu disentuh sama sekali karena tanda tangan (signature) function-nya
 * tetap sama.
 *
 * Contoh migrasi ke Supabase nanti:
 *
 *   export async function getBots(): Promise<Bot[]> {
 *     const { data, error } = await supabase.from("bots").select("*");
 *     if (error) throw error;
 *     return data;
 *   }
 *
 * Function di sini sengaja dibuat `async` dari sekarang (meski saat ini
 * cuma me-return array statis) supaya komponen yang memanggilnya sudah
 * terbiasa dengan pola `await`/Server Component data fetching, dan tidak
 * perlu direfactor jadi async saat migrasi ke sumber data asli terjadi.
 */

export async function getBots(): Promise<Bot[]> {
  return botsData;
}

export async function getBotsByPlatform(platform: Platform): Promise<Bot[]> {
  const all = await getBots();
  return all.filter((bot) => bot.platform === platform);
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  return pricingPlansData;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return testimonialsData;
}
