import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Cloud,
  Clouds,
  Environment,
  FirstPersonControls,
  Float,
  MeshDistortMaterial,
  Sparkles,
  Stars,
  useTexture,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ArtStyle, SceneAnalysis } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';
import { useAppStore } from '@/store/useAppStore';
import { BrushStrokeParticles } from './BrushStrokeParticles';
import { WeatherLayer } from './WeatherLayer';
import { InteractiveHotspot } from './InteractiveHotspot';
import { styleUniforms } from './styleShaders';

interface PaintingWorldProps {
  imageUrl: string;
  analysis: SceneAnalysis;
  style: ArtStyle;
}

function SceneContent({ imageUrl, analysis, style }: PaintingWorldProps) {
  const texture = useTexture(imageUrl);
  const entered = useAppStore((s) => s.enteredWorld);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const groupRef = useRef<THREE.Group>(null);
  const enterT = useRef(0);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  }, [texture]);

  useEffect(() => {
    if (!audioEnabled || !entered) return;
    void audioEngine.init().then(() => audioEngine.start(analysis));
    return () => audioEngine.stop();
  }, [analysis, audioEnabled, entered]);

  useFrame((_, delta) => {
    if (entered && enterT.current < 1) enterT.current = Math.min(1, enterT.current + delta * 0.35);
    if (groupRef.current) {
      groupRef.current.position.z = THREE.MathUtils.lerp(8, 0, enterT.current);
    }
  });

  const fogColor = analysis.palette.sky;
  const layers = useMemo(() => {
    const n = analysis.depthLayers;
    return Array.from({ length: n }, (_, i) => ({
      z: -4 - i * 2.2,
      scale: 14 + i * 1.5,
      opacity: 0.35 + (1 - i / n) * 0.45,
      y: -1 + i * 0.15,
    }));
  }, [analysis.depthLayers]);

  const uniforms = styleUniforms[style];

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 4, 28]} />
      <ambientLight intensity={analysis.isNight ? 0.25 : 0.45} color={analysis.palette.secondary} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={analysis.brightness * 1.8}
        color={analysis.palette.accent}
        castShadow
      />
      <pointLight position={[-6, 4, -2]} intensity={0.4} color={analysis.palette.dominant} />

      <group ref={groupRef}>
        {layers.map((layer, i) => (
          <mesh key={i} position={[0, layer.y, layer.z]} scale={[layer.scale, layer.scale * 0.65, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={layer.opacity * uniforms.opacityMul}
              side={THREE.DoubleSide}
              color={new THREE.Color(uniforms.tint)}
            />
          </mesh>
        ))}

        <mesh position={[0, 0, -18]} scale={[40, 24, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        {analysis.hasWater && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -2]}>
            <planeGeometry args={[30, 30]} />
            <MeshDistortMaterial
              color={analysis.palette.accent}
              transparent
              opacity={0.55}
              distort={0.25}
              speed={1.2}
              roughness={0.1}
              metalness={0.6}
            />
          </mesh>
        )}
      </group>

      {analysis.isNight && <Stars radius={80} depth={40} count={3000} factor={3} fade speed={0.5} />}
      {analysis.hasSky && (
        <Clouds>
          <Cloud opacity={0.35} speed={0.15} bounds={[12, 2, 2]} segments={18} position={[0, 6, -12]} />
          <Cloud opacity={0.2} speed={0.1} bounds={[8, 1, 2]} segments={12} position={[-8, 5, -8]} />
        </Clouds>
      )}

      <Sparkles
        count={analysis.mood === 'ethereal' ? 120 : 60}
        scale={20}
        size={2}
        speed={0.3}
        opacity={0.35}
        color={analysis.palette.accent}
      />
      <BrushStrokeParticles analysis={analysis} />
      <WeatherLayer weather={analysis.weather} color={analysis.palette.accent} />

      {analysis.objects.slice(0, 5).map((obj) => (
        <InteractiveHotspot key={obj.id} object={obj} analysis={analysis} />
      ))}

      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.3}>
        <mesh position={[3, 1.5, -3]}>
          <icosahedronGeometry args={[0.35, 1]} />
          <meshStandardMaterial
            color={analysis.palette.accent}
            emissive={analysis.palette.accent}
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.5}
            transparent
            opacity={0.85}
          />
        </mesh>
      </Float>

      <FirstPersonControls
        lookSpeed={0.004}
        movementSpeed={4}
        makeDefault
      />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} intensity={uniforms.bloom} />
        <Vignette offset={0.3} darkness={0.65} />
        {style === 'cyberpunk' ? (
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
        ) : (
          <></>
        )}
      </EffectComposer>
    </>
  );
}

function EnterFade() {
  const entered = useAppStore((s) => s.enteredWorld);
  const { camera } = useThree();
  useEffect(() => {
    if (entered) {
      camera.position.set(0, 1.6, 6);
    }
  }, [entered, camera]);
  return null;
}

export function PaintingWorld(props: PaintingWorldProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 100, position: [0, 1.6, 10] }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
        <EnterFade />
        <Environment preset={props.analysis.isNight ? 'night' : 'sunset'} />
      </Suspense>
    </Canvas>
  );
}
