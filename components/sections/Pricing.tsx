import { getPricingPlans } from "@/lib/data";
import { PricingClient } from "@/components/sections/PricingClient";

/**
 * Server component wrapper — ambil data lewat lib/data.ts (bukan langsung
 * dari /data), lalu teruskan ke PricingClient untuk bagian interaktifnya.
 * Saat getPricingPlans() nanti diganti isinya jadi fetch ke database,
 * file ini tidak perlu diubah sama sekali.
 */
export async function Pricing() {
  const pricingPlans = await getPricingPlans();
  return <PricingClient pricingPlans={pricingPlans} />;
}
