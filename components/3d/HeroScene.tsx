"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * Deteksi device mobile/low-end & preferensi reduce-motion di sisi client.
 * Dipakai untuk menurunkan kompleksitas geometry dan mematikan animasi berat
 * supaya Canvas 3D tidak menyebabkan lag di perangkat low-end.
 */
function useSceneCapability() {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function updateMobile() {
      setIsMobile(mobileQuery.matches);
    }
    function updateMotion() {
      setPrefersReducedMotion(motionQuery.matches);
    }

    updateMobile();
    updateMotion();
    mobileQuery.addEventListener("change", updateMobile);
    motionQuery.addEventListener("change", updateMotion);
    return () => {
      mobileQuery.removeEventListener("change", updateMobile);
      motionQuery.removeEventListener("change", updateMotion);
    };
  }, []);

  return { isMobile, prefersReducedMotion };
}

/**
 * Node kecil yang mengorbit di sekitar core, merepresentasikan
 * koneksi ke platform WhatsApp / Telegram.
 */
function OrbitNode({
  radius,
  speed,
  offset,
  color,
  size,
}: {
  radius: number;
  speed: number;
  offset: number;
  color: string;
  size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 1.5) * 0.4;

    if (ref.current) {
      ref.current.position.set(x, y, z);
    }
    if (lineRef.current) {
      const positions = lineRef.current.attributes.position
        .array as Float32Array;
      positions[3] = x;
      positions[4] = y;
      positions[5] = z;
      lineRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <line>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, radius, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          toneMapped={false}
        />
      </line>
    </group>
  );
}

/**
 * Core bot: icosahedron dengan material distort, mengambang pelan.
 * `detail` diturunkan di mobile (geometry lebih ringan), dan wireframe
 * overlay + efek distort dimatikan kalau user minta reduce-motion.
 */
function BotCore({
  detail,
  showWireframe,
  animate,
}: {
  detail: number;
  showWireframe: boolean;
  animate: boolean;
}) {
  return (
    <Float
      speed={animate ? 1.4 : 0}
      rotationIntensity={animate ? 0.3 : 0}
      floatIntensity={animate ? 0.8 : 0}
    >
      <mesh>
        <icosahedronGeometry args={[1.15, detail]} />
        <MeshDistortMaterial
          color="#7C3AED"
          emissive="#06B6D4"
          emissiveIntensity={0.35}
          distort={animate ? 0.35 : 0}
          speed={2}
          roughness={0.15}
          metalness={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* Wireframe overlay tipis supaya kesan "jaringan/AI" makin kuat — dilewati di mobile untuk hemat draw call */}
      {showWireframe && (
        <mesh scale={1.01}>
          <icosahedronGeometry args={[1.15, 1]} />
          <meshBasicMaterial
            color="#06B6D4"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      )}
    </Float>
  );
}

function Scene({
  isMobile,
  prefersReducedMotion,
}: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
}) {
  const allNodes = useMemo(
    () => [
      { radius: 2.2, speed: 0.35, offset: 0, color: "#25D366", size: 0.14 },
      { radius: 2.6, speed: 0.25, offset: 2.1, color: "#0088cc", size: 0.16 },
      { radius: 1.9, speed: 0.45, offset: 4.2, color: "#25D366", size: 0.1 },
      { radius: 2.9, speed: 0.2, offset: 1.1, color: "#0088cc", size: 0.11 },
    ],
    []
  );

  // Mobile: cukup 2 node biar tetap ringan. Icosahedron detail ikut diturunkan.
  const nodes = isMobile ? allNodes.slice(0, 2) : allNodes;
  const animate = !prefersReducedMotion;

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#06B6D4" />
      <pointLight position={[-4, -2, -4]} intensity={0.8} color="#7C3AED" />

      <BotCore
        detail={isMobile ? 2 : 4}
        showWireframe={!isMobile}
        animate={animate}
      />

      {nodes.map((n, i) => (
        <OrbitNode key={i} {...n} speed={animate ? n.speed : 0} />
      ))}

      <OrbitControls
        autoRotate={animate}
        autoRotateSpeed={0.8}
        enableZoom={false}
        enablePan={false}
        enableRotate={!prefersReducedMotion}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.6}
      />
    </>
  );
}

/** Skeleton loader gelap selagi canvas 3D disiapkan. */
export function HeroSceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-background-elevated to-background-surface md:h-80 md:w-80" />
    </div>
  );
}

export default function HeroScene() {
  const { isMobile, prefersReducedMotion } = useSceneCapability();

  return (
    <Canvas
      // dpr dibatasi lebih rendah di mobile supaya jumlah pixel yang dirender lebih sedikit.
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      frameloop="always"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      className="!touch-none"
    >
      <Scene isMobile={isMobile} prefersReducedMotion={prefersReducedMotion} />
    </Canvas>
  );
}
