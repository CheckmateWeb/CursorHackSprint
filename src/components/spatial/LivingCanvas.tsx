import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ArtStyle, ExpansionTextures, SceneAnalysis } from '@/lib/types';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { spatialAudio } from '@/lib/spatialAudio';
import { useAppStore } from '@/store/useAppStore';
import { styleUniforms } from '@/components/world/styleShaders';
import { WeatherLayer } from '@/components/world/WeatherLayer';
import { ArtisticDust } from './ArtisticDust';

interface LivingCanvasProps {
  imageUrl: string;
  analysis: SceneAnalysis;
  expansion: ExpansionTextures;
  style: ArtStyle;
}

function DeviceLens({
  enabled,
  orientation,
  mouseFallback,
}: {
  enabled: boolean;
  orientation: { alpha: number; beta: number; gamma: number };
  mouseFallback: { x: number; y: number };
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Quaternion());
  const current = useRef(new THREE.Quaternion());

  useFrame(() => {
    if (!enabled) return;
    const useGyro = orientation.alpha !== 0 || orientation.beta !== 0;
    const yaw = useGyro ? orientation.alpha : mouseFallback.x;
    const pitch = useGyro ? orientation.beta - 90 : mouseFallback.y;
    const roll = useGyro ? -orientation.gamma * 0.25 : 0;

    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(pitch * 0.45),
      THREE.MathUtils.degToRad(yaw),
      THREE.MathUtils.degToRad(roll),
      'YXZ',
    );
    target.current.setFromEuler(euler);
    current.current.slerp(target.current, 0.1);
    camera.quaternion.copy(current.current);
    spatialAudio.updateListener(yaw, pitch);
  });

  return null;
}

function ExpansionSpace({
  imageUrl,
  analysis,
  expansion,
  style,
}: LivingCanvasProps) {
  const coreTex = useTexture(imageUrl);
  const panoTex = useTexture(expansion.panoramaUrl);
  const backTex = useTexture(expansion.backUrl);
  const leftTex = useTexture(expansion.leftStripUrl);
  const rightTex = useTexture(expansion.rightStripUrl);

  const unleashed = useAppStore((s) => s.enteredWorld);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const expansionPct = useAppStore((s) => s.expansionProgress) / 100;
  const setExpansionProgress = useAppStore((s) => s.setExpansionProgress);
  const spillT = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  const uniforms = styleUniforms[style];
  const textures = [coreTex, panoTex, backTex, leftTex, rightTex];

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
    });
  }, [textures]);

  useEffect(() => {
    if (!audioEnabled || !unleashed) return;
    void spatialAudio.init().then(() => spatialAudio.start(analysis));
    return () => spatialAudio.stop();
  }, [analysis, audioEnabled, unleashed]);

  useFrame((_, delta) => {
    if (unleashed && spillT.current < 1) {
      spillT.current = Math.min(1, spillT.current + delta * 0.28);
      setExpansionProgress(Math.round(spillT.current * 100));
    }
    if (groupRef.current) {
      const s = 0.35 + spillT.current * 0.65;
      groupRef.current.scale.setScalar(s);
    }
  });

  const planes = analysis.depthPlanes;
  const spill = expansionPct;

  return (
    <>
      <color attach="background" args={[analysis.palette.sky]} />
      <fog attach="fog" args={[analysis.palette.sky, 8, 32]} />
      <ambientLight intensity={0.35} color={analysis.palette.secondary} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={analysis.brightness * 1.5}
        color={analysis.palette.accent}
      />

      <group ref={groupRef}>
        {/* Central frame — the physical painting */}
        <mesh position={[0, 0, -3]}>
          <planeGeometry args={[3.2, 2.4]} />
          <meshBasicMaterial map={coreTex} toneMapped={false} />
        </mesh>

        {/* Panorama cylinder — extended world spills around user */}
        <mesh rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[8 + spill * 6, 8 + spill * 6, 6, 48, 1, true]} />
          <meshBasicMaterial
            map={panoTex}
            side={THREE.BackSide}
            transparent
            opacity={0.15 + spill * 0.75}
            color={new THREE.Color(uniforms.tint)}
          />
        </mesh>

        {/* Back of scene — visible when turning 180° */}
        <mesh position={[0, 0, 6 + spill * 4]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[14, 8]} />
          <meshBasicMaterial
            map={backTex}
            transparent
            opacity={spill * 0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Side extrapolations */}
        <mesh position={[-5 - spill * 3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[6, 4]} />
          <meshBasicMaterial map={leftTex} transparent opacity={spill * 0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[5 + spill * 3, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6, 4]} />
          <meshBasicMaterial map={rightTex} transparent opacity={spill * 0.7} side={THREE.DoubleSide} />
        </mesh>

        {/* Volumetric depth layers — diorama planes */}
        {planes.map((plane) => {
          const r = 2.5 + plane.depth * (4 + spill * 6);
          return (
            <mesh
              key={plane.id}
              position={[0, plane.offsetY, -r]}
              scale={[plane.scale * 4, plane.scale * 2.8, 1]}
            >
              <planeGeometry />
              <meshBasicMaterial
                map={coreTex}
                transparent
                opacity={plane.opacity * spill * uniforms.opacityMul}
                side={THREE.DoubleSide}
                color={new THREE.Color(uniforms.tint)}
              />
            </mesh>
          );
        })}
      </group>

      <Sparkles
        count={80}
        scale={18}
        size={analysis.medium === 'oil' ? 2.5 : 1.5}
        speed={0.25}
        opacity={0.4 * spill}
        color={analysis.palette.accent}
      />
      <ArtisticDust analysis={analysis} expansion={spill} />
      <WeatherLayer weather={analysis.weather} color={analysis.palette.accent} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.55} intensity={uniforms.bloom * (0.5 + spill * 0.5)} />
        <Vignette offset={0.25} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

function SceneRoot(props: LivingCanvasProps) {
  const unleashed = useAppStore((s) => s.enteredWorld);
  const { orientation, mouseFallback, requestPermission } = useDeviceOrientation(unleashed);

  useEffect(() => {
    if (unleashed) void requestPermission();
  }, [unleashed, requestPermission]);

  return (
    <>
      <ExpansionSpace {...props} />
      <DeviceLens
        enabled={unleashed}
        orientation={orientation}
        mouseFallback={mouseFallback}
      />
    </>
  );
}

export function LivingCanvas(props: LivingCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 70, near: 0.1, far: 80, position: [0, 0, 0] }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneRoot {...props} />
      </Suspense>
    </Canvas>
  );
}
