import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DepthPlane } from '@/lib/types';

interface Props {
  plane: DepthPlane;
  texture: THREE.Texture;
  radius: number;
  spill: number;
  tint: string;
  opacityMul: number;
  parallax: number;
}

export function DepthBillboard({
  plane,
  texture,
  radius,
  spill,
  tint,
  opacityMul,
  parallax,
}: Props) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    ref.current.lookAt(camera.position);
    const offset = parallax * plane.depth * 0.35;
    ref.current.position.x = camera.position.x * offset;
    ref.current.position.y = camera.position.y * offset * 0.5;
  });

  const w = 5 * plane.scale;
  const h = 3.2 * plane.scale;

  return (
    <mesh ref={ref} position={[0, plane.offsetY, -radius]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={plane.opacity * spill * opacityMul * 0.32}
        color={new THREE.Color(tint)}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
