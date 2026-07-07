import { Preloader } from "@/components/ui/Preloader";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { PlatformSelector } from "@/components/sections/PlatformSelector";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { CTAFooter } from "@/components/sections/CTAFooter";

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <Features />
        <PlatformSelector />
        <HowItWorks />
        <LiveDemo />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTAFooter />
      </main>
    </>
  );
}
