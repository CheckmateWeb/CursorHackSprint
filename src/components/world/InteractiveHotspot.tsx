import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { DetectedObject, SceneAnalysis } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';

interface Props {
  object: DetectedObject;
  analysis: SceneAnalysis;
  hidden?: boolean;
  revealDistance?: number;
}

const memories = [
  'A memory stirs — pigment becoming breath.',
  'You hear the artist’s hesitation in this stroke.',
  'Light once fell here exactly like this.',
  'The canvas remembers what the world forgot.',
  'A hidden thread of color pulls you deeper.',
  'Something familiar waits in the brushwork.',
];

export function InteractiveHotspot({ object, analysis, hidden = false, revealDistance = 9 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [memory, setMemory] = useState('');
  const [visible, setVisible] = useState(!hidden);
  const opacityRef = useRef(hidden ? 0 : 0.7);
  const swayT = useRef(0);
  const { camera } = useThree();

  const x = (object.x - 0.5) * 12;
  const y = (1 - object.y) * 4;
  const z = -object.depth * 14;

  useFrame((state, delta) => {
    const worldPos = new THREE.Vector3();
    if (groupRef.current) groupRef.current.getWorldPosition(worldPos);
    else worldPos.set(x, y, z);
    const dist = camera.position.distanceTo(worldPos);

    if (hidden) {
      const near = dist < revealDistance;
      setVisible(near || opacityRef.current > 0.05);
      opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, near ? 0.75 : 0, delta * 4);
    } else {
      const fade = THREE.MathUtils.clamp(1 - (dist - 4) / (revealDistance - 4), 0.15, 1);
      opacityRef.current = fade * 0.85;
      setVisible(dist < revealDistance + 2);
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = opacityRef.current;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      meshRef.current.scale.setScalar(pulse * (hovered ? 1.15 : 1));
    }

    if (swayT.current > 0) {
      swayT.current -= delta;
      camera.rotation.z = Math.sin(swayT.current * 12) * 0.012 * swayT.current;
    } else if (Math.abs(camera.rotation.z) > 0.0001) {
      camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, 0, delta * 6);
    }
  });

  const onInteract = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (hidden && opacityRef.current < 0.2) return;
    setActive(true);
    setMemory(memories[Math.floor(Math.random() * memories.length)]);
    audioEngine.playSpatialChime(object.x, object.y);
    swayT.current = 1.2;
    setTimeout(() => setActive(false), 4000);
  };

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onClick={onInteract}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[hidden ? 0.16 : 0.2, 16, 16]} />
        <meshStandardMaterial
          color={object.color}
          emissive={analysis.palette.accent}
          emissiveIntensity={active ? 1.4 : hovered ? 0.9 : 0.35}
          transparent
          opacity={opacityRef.current}
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
