import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Stars, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, BrightnessContrast } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ArtStyle, ExpansionTextures, SceneAnalysis } from '@/lib/types';
import { spatialAudio } from '@/lib/spatialAudio';
import { useAppStore } from '@/store/useAppStore';
import { styleUniforms } from '@/components/world/styleShaders';
import { WeatherLayer } from '@/components/world/WeatherLayer';
import { ArtisticDust } from './ArtisticDust';
import { PaintingHotspot } from './PaintingHotspot';
import './canvas-shell.css';

const PAINTING_W = 3.6;
const PAINTING_H = 2.7;
const PAINTING_Z = -4.2;

interface LivingCanvasProps {
  imageUrl: string;
  analysis: SceneAnalysis;
  expansion: ExpansionTextures;
  style: ArtStyle;
}

/** Environment sphere — slow drift only, painting stays fixed */
function EnvironmentSphere({
  equirectTex,
  spill,
  tint,
}: {
  equirectTex: THREE.Texture;
  spill: number;
  tint: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.015 * spill;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[55, 64, 48]} />
      <meshBasicMaterial
        map={equirectTex}
        side={THREE.BackSide}
        color={new THREE.Color(tint)}
        transparent
        opacity={0.35 + spill * 0.65}
        toneMapped
      />
    </mesh>
  );
}

/** Fixed painting on the wall — gentle breathing motion only */
function AnchoredPainting({
  coreTex,
  analysis,
  unleashed,
}: {
  coreTex: THREE.Texture;
  analysis: SceneAnalysis;
  unleashed: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !unleashed) return;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.45) * 0.006;
    groupRef.current.scale.set(breathe, breathe, 1);
  });

  return (
    <group ref={groupRef} position={[0, 0, PAINTING_Z]}>
      {/* Museum frame */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[PAINTING_W + 0.35, PAINTING_H + 0.35]} />
        <meshStandardMaterial color="#1c1814" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[PAINTING_W + 0.12, PAINTING_H + 0.12]} />
        <meshBasicMaterial color="#3d3428" />
      </mesh>

      {/* The artwork — fixed center */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[PAINTING_W, PAINTING_H]} />
        <meshBasicMaterial map={coreTex} toneMapped />
      </mesh>

      {unleashed &&
        analysis.objects.slice(0, 6).map((obj) => (
          <PaintingHotspot
            key={obj.id}
            object={obj}
            analysis={analysis}
            paintingW={PAINTING_W}
            paintingH={PAINTING_H}
          />
        ))}
    </group>
  );
}

function ExpansionSpace({ imageUrl, analysis, expansion, style }: LivingCanvasProps) {
  const coreTex = useTexture(imageUrl);
  const equirectTex = useTexture(expansion.equirectUrl);

  const unleashed = useAppStore((s) => s.enteredWorld);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const expansionPct = useAppStore((s) => s.expansionProgress) / 100;
  const setExpansionProgress = useAppStore((s) => s.setExpansionProgress);
  const spillT = useRef(0);

  const uniforms = styleUniforms[style];
  const spill = expansionPct;

  useEffect(() => {
    [coreTex, equirectTex].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 16;
      t.generateMipmaps = true;
    });
  }, [coreTex, equirectTex]);

  useEffect(() => {
    if (!audioEnabled || !unleashed) return;
    void spatialAudio.init().then(() => spatialAudio.start(analysis));
    return () => spatialAudio.stop();
  }, [analysis, audioEnabled, unleashed]);

  useFrame((_, delta) => {
    if (unleashed && spillT.current < 1) {
      spillT.current = Math.min(1, spillT.current + delta * 0.2);
      setExpansionProgress(Math.round(spillT.current * 100));
    }
  });

  return (
    <>
      <fog attach="fog" args={[analysis.palette.sky, 20, 65]} />
      <ambientLight intensity={0.14} color={analysis.palette.secondary} />
      <directionalLight
        position={[4, 6, 2]}
        intensity={0.3 + analysis.brightness * 0.2}
        color={analysis.palette.accent}
      />

      <EnvironmentSphere equirectTex={equirectTex} spill={spill} tint={uniforms.tint} />

      <AnchoredPainting coreTex={coreTex} analysis={analysis} unleashed={unleashed} />

      {unleashed && analysis.isNight && spill > 0.5 && (
        <Stars radius={80} depth={50} count={1500} factor={1.5} saturation={0.35} fade speed={0.2} />
      )}

      {unleashed && spill > 0.5 && (
        <>
          <Sparkles
            count={28}
            position={[0, 0, PAINTING_Z - 1]}
            scale={8}
            size={0.6}
            speed={0.12}
            opacity={0.15}
            color={analysis.palette.accent}
          />
          <ArtisticDust analysis={analysis} expansion={spill * 0.4} />
        </>
      )}

      {unleashed && spill > 0.75 && analysis.weather !== 'clear' && (
        <WeatherLayer weather={analysis.weather} color={analysis.palette.accent} />
      )}

      <OrbitControls
        makeDefault
        enabled={unleashed}
        target={[0, 0, PAINTING_Z]}
        enablePan={false}
        enableZoom={true}
        minDistance={2.8}
        maxDistance={5.5}
        minAzimuthAngle={-0.85}
        maxAzimuthAngle={0.85}
        minPolarAngle={Math.PI / 2 - 0.55}
        maxPolarAngle={Math.PI / 2 + 0.55}
        rotateSpeed={0.35}
        zoomSpeed={0.4}
        dampingFactor={0.06}
        enableDamping
      />

      <EffectComposer>
        <BrightnessContrast brightness={0.02} contrast={0.06} />
        <Bloom
          luminanceThreshold={0.92}
          luminanceSmoothing={0.4}
          intensity={0.08 + uniforms.bloom * 0.1}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.12} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

function SceneRoot(props: LivingCanvasProps) {
  return (
    <>
      <color attach="background" args={['#050508']} />
      <ExpansionSpace {...props} />
    </>
  );
}

export function LivingCanvas(props: LivingCanvasProps) {
  return (
    <div className="canvas-shell">
      <div className="canvas-vignette" aria-hidden />
      <Canvas
        camera={{
          fov: 55,
          near: 0.1,
          far: 100,
          position: [0, 0.2, 0.5],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.78,
        }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneRoot {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
