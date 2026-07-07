import { getBots } from "@/lib/data";
import { PlatformSelectorClient } from "@/components/sections/PlatformSelectorClient";

/**
 * Server component wrapper — ambil seluruh daftar bot lewat lib/data.ts,
 * teruskan ke PlatformSelectorClient yang menangani tab switching dan
 * filter platform di sisi client.
 *
 * Untuk menambah platform baru (mis. Discord): cukup tambah entri baru
 * di array `platformTabs` dalam PlatformSelectorClient.tsx dan tambah
 * data bot dengan platform tersebut di data/bots.ts — file ini tidak
 * perlu diubah.
 */
export async function PlatformSelector() {
  const bots = await getBots();
  return <PlatformSelectorClient bots={bots} />;
}
