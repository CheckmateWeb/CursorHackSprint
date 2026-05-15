import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeatherEffect } from '@/lib/types';

interface Props {
  weather: WeatherEffect;
  color: string;
}

export function WeatherLayer({ weather, color }: Props) {
  if (weather === 'clear') return null;

  const count = weather === 'rain' ? 400 : weather === 'snow' ? 200 : 150;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = Math.random() * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const speed = weather === 'rain' ? 8 : weather === 'snow' ? 1.5 : 0.5;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] -= delta * speed;
      if (pos.array[i * 3 + 1] < -2) pos.array[i * 3 + 1] = 12;
    }
    pos.needsUpdate = true;
  });

  const size = weather === 'rain' ? 0.04 : 0.08;
  const opacity = weather === 'dream' ? 0.25 : 0.5;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={size} transparent opacity={opacity} sizeAttenuation depthWrite={false} />
    </points>
  );
}
