import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { DetectedObject, SceneAnalysis } from '@/lib/types';
import { spatialAudio } from '@/lib/spatialAudio';

interface Props {
  object: DetectedObject;
  analysis: SceneAnalysis;
  paintingW: number;
  paintingH: number;
}

const memories = [
  'A memory stirs — pigment becoming breath.',
  'You hear the artist’s hesitation in this stroke.',
  'Light once fell here exactly like this.',
  'The canvas remembers what the world forgot.',
  'This stroke held the artist’s breath.',
];

export function PaintingHotspot({ object, analysis, paintingW, paintingH }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [memory, setMemory] = useState('');

  const x = (object.x - 0.5) * paintingW;
  const y = (0.5 - object.y) * paintingH;

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5 + object.x * 10) * 0.12;
    meshRef.current.scale.setScalar(pulse * (hovered || active ? 1.25 : 1));
  });

  const onInteract = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setActive(true);
    setMemory(memories[Math.floor(Math.random() * memories.length)]);
    spatialAudio.playSpatialChime(object.x, object.y);
    setTimeout(() => setActive(false), 4500);
  };

  return (
    <group position={[x, y, 0.06]}>
      <mesh
        ref={meshRef}
        onClick={onInteract}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshStandardMaterial
          color={object.color}
          emissive={analysis.palette.accent}
          emissiveIntensity={active ? 0.9 : hovered ? 0.55 : 0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {hovered && !active && (
        <mesh>
          <ringGeometry args={[0.14, 0.2, 32]} />
          <meshBasicMaterial color={analysis.palette.accent} transparent opacity={0.45} />
        </mesh>
      )}
      {active && (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div className="hotspot-memory">{memory}</div>
        </Html>
      )}
    </group>
  );
}
