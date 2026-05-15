import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneAnalysis } from '@/lib/types';

interface Props {
  analysis: SceneAnalysis;
  expansion: number;
}

export function ArtisticDust({ analysis, expansion }: Props) {
  const ref = useRef<THREE.Points>(null);
  const count = analysis.medium === 'oil' ? 140 : analysis.medium === 'watercolor' ? 90 : 70;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 10;
      arr[i * 3] = Math.cos(theta) * r;
      arr[i * 3 + 1] = (Math.random() - 0.3) * 6;
      arr[i * 3 + 2] = Math.sin(theta) * r;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.0015;
    }
    pos.needsUpdate = true;
  });

  const color = analysis.palette.accent;
  const opacity = 0.25 + expansion * 0.45;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={analysis.medium === 'watercolor' ? 0.06 : 0.1}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
