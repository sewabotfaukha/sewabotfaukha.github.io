// ============================================================================
// NEXUS — effects.js
// Placeholder untuk efek visual tambahan: post-processing (bloom, grain),
// sistem partikel, atau shader kustom. Belum diaktifkan pada tahap ini
// sesuai instruksi ("belum perlu objek 3D").
// ============================================================================

/**
 * Placeholder inisialisasi efek. Saat ini tidak melakukan apa pun,
 * hanya memastikan modul dapat diimpor tanpa error dari main.js
 * sehingga struktur project sudah siap menerima fitur berikutnya.
 * @param {Object} context - { scene, camera, renderer } dari main.js
 */
export function initEffects(context) {
  // Sengaja kosong untuk saat ini.
  // Rencana Prompt berikutnya:
  // - EffectComposer + UnrealBloomPass untuk glow pada object 3D.
  // - Sistem partikel ambient (starfield) memakai THREE.Points.
  // - Custom shader material untuk signature object NEXUS.
  return context;
}
