import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { DetectedObject, SceneAnalysis } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface Props {
  object: DetectedObject;
  analysis: SceneAnalysis;
}

const memories = [
  'A memory stirs — pigment becoming breath.',
  'You hear the artist’s hesitation in this stroke.',
  'Light once fell here exactly like this.',
  'The canvas remembers what the world forgot.',
];

export function InteractiveHotspot({ object, analysis }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const [memory, setMemory] = useState('');

  const x = (object.x - 0.5) * 12;
  const y = (1 - object.y) * 4;
  const z = -object.depth * 14;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.08);
    }
  });

  const onInteract = () => {
    setActive(true);
    setMemory(memories[Math.floor(Math.random() * memories.length)]);
    audioEngine.playSpatialChime(object.x, object.y);
    setTimeout(() => setActive(false), 4000);
  };

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef} onClick={onInteract}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={object.color}
          emissive={analysis.palette.accent}
          emissiveIntensity={active ? 1.2 : 0.4}
          transparent
          opacity={0.7}
        />
      </mesh>
      {active && (
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="hotspot-memory">{memory}</div>
        </Html>
      )}
    </group>
  );
}
