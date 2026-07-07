import { getTestimonials } from "@/lib/data";
import { TestimonialsClient } from "@/components/sections/TestimonialsClient";

/**
 * Server component wrapper — ambil data lewat lib/data.ts, teruskan ke
 * TestimonialsClient untuk carousel interaktifnya.
 */
export async function Testimonials() {
  const testimonials = await getTestimonials();
  return <TestimonialsClient testimonials={testimonials} />;
}
