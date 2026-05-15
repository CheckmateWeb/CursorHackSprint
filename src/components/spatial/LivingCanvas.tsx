import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Stars, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ArtStyle, ExpansionTextures, SceneAnalysis } from '@/lib/types';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { spatialAudio } from '@/lib/spatialAudio';
import { useAppStore } from '@/store/useAppStore';
import { styleUniforms } from '@/components/world/styleShaders';
import { WeatherLayer } from '@/components/world/WeatherLayer';
import { ArtisticDust } from './ArtisticDust';
import { DepthBillboard } from './DepthBillboard';
import './canvas-shell.css';

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
  const smooth = useRef(new THREE.Quaternion());

  useFrame(() => {
    if (!enabled) return;
    const useGyro = Math.abs(orientation.alpha) > 0.1 || Math.abs(orientation.beta) > 0.1;
    const yaw = useGyro ? orientation.alpha : mouseFallback.x;
    const pitch = useGyro ? orientation.beta - 90 : mouseFallback.y;

    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(pitch * 0.55),
      THREE.MathUtils.degToRad(yaw),
      THREE.MathUtils.degToRad(-orientation.gamma * 0.15),
      'YXZ',
    );
    target.current.setFromEuler(euler);
    smooth.current.slerp(target.current, 0.06);
    camera.quaternion.copy(smooth.current);
    spatialAudio.updateListener(yaw, pitch);
  });

  return null;
}

function ImmersiveSphere({
  equirectTex,
  spill,
  tint,
}: {
  equirectTex: THREE.Texture;
  spill: number;
  tint: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + spill * 0.95;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[48, 72, 48]} />
      <meshBasicMaterial
        map={equirectTex}
        side={THREE.BackSide}
        transparent
        opacity={0.2}
        color={new THREE.Color(tint)}
        toneMapped
      />
    </mesh>
  );
}

function PortalFrame({
  coreTex,
  spill,
}: {
  coreTex: THREE.Texture;
  spill: number;
}) {
  const frameRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (frameRef.current) {
      const s = Math.max(0.15, 1 - spill * 0.85);
      frameRef.current.scale.setScalar(s);
      frameRef.current.visible = spill < 0.98;
    }
  });

  return (
    <group ref={frameRef} position={[0, 0, -2.8]}>
      <mesh>
        <planeGeometry args={[3.4, 2.55]} />
        <meshStandardMaterial
          map={coreTex}
          emissive="#ffffff"
          emissiveIntensity={0.08 * spill}
          roughness={0.9}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.65, 2.8]} />
        <meshStandardMaterial color="#1a1510" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3.75, 2.9]} />
        <meshBasicMaterial color="#c9a962" wireframe transparent opacity={0.35} />
      </mesh>
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
      spillT.current = Math.min(1, spillT.current + delta * 0.22);
      setExpansionProgress(Math.round(spillT.current * 100));
    }
  });

  const layerRadii = useMemo(
    () => analysis.depthPlanes.map((p) => 3.5 + p.depth * 9),
    [analysis.depthPlanes],
  );

  return (
    <>
      <fog attach="fog" args={[analysis.palette.sky, 14, 55]} />
      <ambientLight intensity={0.28} color={analysis.palette.secondary} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={analysis.brightness * 1.4}
        color={analysis.palette.accent}
      />
      <pointLight
        position={[0, 2, -2]}
        intensity={0.6 * spill}
        color={analysis.palette.accent}
        distance={20}
      />
      <hemisphereLight
        args={[analysis.palette.sky, analysis.palette.ground, 0.35 * spill]}
      />

      <ImmersiveSphere equirectTex={equirectTex} spill={spill} tint={uniforms.tint} />

      {analysis.depthPlanes.map((plane, i) => (
        <DepthBillboard
          key={plane.id}
          plane={plane}
          texture={coreTex}
          radius={layerRadii[i]}
          spill={spill}
          tint={uniforms.tint}
          opacityMul={uniforms.opacityMul}
          parallax={1 - plane.depth}
        />
      ))}

      <PortalFrame coreTex={coreTex} spill={spill} />

      {analysis.isNight && (
        <Stars radius={60} depth={30} count={5000} factor={4} saturation={0.6} fade speed={0.4} />
      )}

      <Float speed={0.8} floatIntensity={0.15} rotationIntensity={0.02}>
        <mesh position={[analysis.hasWater ? -4 : 2, 0.5, -5]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={analysis.palette.accent}
            emissive={analysis.palette.accent}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6 * spill}
          />
        </mesh>
      </Float>

      <Sparkles
        count={100}
        scale={22}
        size={analysis.medium === 'oil' ? 2 : 1.2}
        speed={0.2}
        opacity={0.35 * spill}
        color={analysis.palette.accent}
      />
      <ArtisticDust analysis={analysis} expansion={spill} />
      <WeatherLayer weather={analysis.weather} color={analysis.palette.accent} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.85} intensity={uniforms.bloom * spill * 0.6} mipmapBlur />
        <Vignette eskil={false} offset={0.15} darkness={0.45} />
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
      <color attach="background" args={['#050508']} />
      <ExpansionSpace {...props} />
      <DeviceLens enabled={unleashed} orientation={orientation} mouseFallback={mouseFallback} />
    </>
  );
}

export function LivingCanvas(props: LivingCanvasProps) {
  return (
    <div className="canvas-shell">
      <div className="canvas-vignette" aria-hidden />
      <Canvas
        camera={{ fov: 75, near: 0.05, far: 100, position: [0, 0, 0.01] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneRoot {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
