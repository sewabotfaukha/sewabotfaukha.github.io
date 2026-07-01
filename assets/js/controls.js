// ============================================================================
// NEXUS — controls.js
// BUKAN OrbitControls. Cinematic camera rig: idle drift halus + parallax
// mengikuti posisi mouse, plus "impulse" yang dipakai animation.js untuk
// fly-bump saat tombol Explore diklik.
// ============================================================================

export function createCameraRig(camera) {
  const baseZ = camera.position.z;
  const mouse = { x: 0, y: 0 };
  const state = { tiltX: 0, tiltY: 0, impulseZ: 0, scrollY: 0 };

  function onPointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointerMove);

  function update(elapsed) {
    // Idle cinematic drift — sangat kecil, tidak pernah diam total.
    const idleX = Math.sin(elapsed * 0.15) * 0.12;
    const idleY = Math.cos(elapsed * 0.11) * 0.06;

    // Parallax halus menuju posisi mouse (lerp, bukan snap).
    state.tiltX += (mouse.x * 0.25 - state.tiltX) * 0.03;
    state.tiltY += (-mouse.y * 0.16 - state.tiltY) * 0.03;

    camera.position.x = idleX + state.tiltX;
    camera.position.y = idleY + state.tiltY + 0.15 + state.scrollY;
    camera.position.z = baseZ + state.impulseZ;
    camera.lookAt(0, 0, 0);
  }

  function dispose() {
    window.removeEventListener('pointermove', onPointerMove);
  }

  return { update, dispose, state, mouse, baseZ };
}
