// ============================================================================
// NEXUS — loader.js
// Menyiapkan LoadingManager & loader dasar Three.js.
// Belum memuat aset apa pun — hanya pondasi agar prompt berikutnya
// (model 3D, tekstur, dsb.) tinggal plug-in tanpa refactor besar.
// ============================================================================

import * as THREE from 'three';

/**
 * Membuat THREE.LoadingManager terpusat beserta callback progress dasar.
 * Callback bisa dihubungkan ke UI loading screen di ui.js.
 * @param {Object} callbacks - { onProgress, onLoad, onError }
 * @returns {THREE.LoadingManager}
 */
export function createLoadingManager({ onProgress, onLoad, onError } = {}) {
  const manager = new THREE.LoadingManager();

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    if (onProgress) onProgress(itemsLoaded / itemsTotal);
  };

  manager.onLoad = () => {
    if (onLoad) onLoad();
  };

  manager.onError = (url) => {
    console.warn(`[NEXUS] Gagal memuat aset: ${url}`);
    if (onError) onError(url);
  };

  return manager;
}

/**
 * Membuat THREE.TextureLoader yang terhubung ke LoadingManager tertentu.
 * Siap dipakai ketika folder assets/textures mulai diisi.
 * @param {THREE.LoadingManager} manager
 * @returns {THREE.TextureLoader}
 */
export function createTextureLoader(manager) {
  return new THREE.TextureLoader(manager);
}

// Catatan pengembangan (Prompt berikutnya):
// - Tambahkan GLTFLoader dari 'three/addons/loaders/GLTFLoader.js' saat
//   model 3D di assets/models/ mulai digunakan.
// - Tambahkan DRACOLoader bila model GLTF terkompresi Draco.
