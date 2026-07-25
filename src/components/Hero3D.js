/* eslint-disable */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Floating particle sphere — cursor-reactive, tasteful, not a game
function ParticleSphere({ mousePos }) {
  const ref = useRef();
  
  const [positions, sizes] = useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Distribute on a sphere surface with some depth variation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + (Math.random() - 0.5) * 0.6;
      
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      sz[i] = Math.random() * 0.012 + 0.003;
    }
    return [pos, sz];
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Slow base rotation
    ref.current.rotation.y += delta * 0.10;
    ref.current.rotation.x += delta * 0.04;
    
    // Subtle cursor reactivity (target, not immediate)
    if (mousePos.current) {
      const targetX = mousePos.current.y * 0.3;
      const targetY = mousePos.current.x * 0.3;
      ref.current.rotation.x += (targetX - ref.current.rotation.x) * 0.02;
      ref.current.rotation.y += (targetY - ref.current.rotation.y) * 0.02;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#5EEAD4"
        size={0.008}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.75}
      />
    </Points>
  );
}

// Second ring of particles — slightly different color for depth
function ParticleRing({ mousePos }) {
  const ref = useRef();
  
  const positions = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 1.7 + (Math.random() - 0.5) * 0.4;
      pos[i * 3]     = r * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y -= delta * 0.05;
    ref.current.rotation.z += delta * 0.02;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#D8A13B"
        size={0.005}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

// Inner core glow points
function ParticleCore() {
  const ref = useRef();
  
  const positions = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.18;
    ref.current.rotation.x += delta * 0.08;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#FFFFFF"
        size={0.014}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

export default function Hero3D({ mousePos }) {
  // Check for reduced motion preference
  const prefersReduced = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 55 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
    >
      <ambientLight intensity={0.5} />
      <ParticleSphere mousePos={mousePos} />
      <ParticleRing mousePos={mousePos} />
      <ParticleCore />
    </Canvas>
  );
}
