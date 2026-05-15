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
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  GodRays,
  Noise,
  Scanline,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import type { ArtStyle, Mood, SceneAnalysis, WeatherEffect } from '@/lib/types';
import { audioEngine } from '@/lib/audioEngine';
import { useAppStore } from '@/store/useAppStore';
import { getQualityTier, scaleCount } from '@/lib/quality';
import { BrushStrokeParticles } from './BrushStrokeParticles';
import { WeatherLayer } from './WeatherLayer';
import { InteractiveHotspot } from './InteractiveHotspot';
import { HiddenHotspots } from './HiddenHotspots';
import { styleUniforms } from './styleShaders';

interface PaintingWorldProps {
  imageUrl: string;
  analysis: SceneAnalysis;
  style: ArtStyle;
}

const MOOD_CLOUD_SPEED: Record<Mood, number> = {
  serene: 0.08,
  joyful: 0.12,
  melancholic: 0.1,
  mysterious: 0.22,
  dramatic: 0.3,
  ethereal: 0.16,
};

function fogDistance(weather: WeatherEffect, brightness: number): [number, number] {
  const near = 4;
  let far = 28 - (1 - brightness) * 6;
  if (weather === 'fog') far = 12;
  else if (weather === 'rain') far = 18;
  else if (weather === 'dream') far = 22;
  return [near, far];
}

function PointerLockManager() {
  const entered = useAppStore((s) => s.enteredWorld);
  const setPointerLocked = useAppStore((s) => s.setPointerLocked);
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    const onChange = () => {
      setPointerLocked(document.pointerLockElement === el);
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, [gl, setPointerLocked]);

  useEffect(() => {
    if (!entered) {
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      return;
    }
    const id = requestAnimationFrame(() => {
      void gl.domElement.requestPointerLock();
    });
    return () => cancelAnimationFrame(id);
  }, [entered, gl]);

  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => {
      if (entered && document.pointerLockElement !== el) {
        void el.requestPointerLock();
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [entered, gl]);

  return null;
}

function CameraBounds() {
  const entered = useAppStore((s) => s.enteredWorld);
  const { camera } = useThree();

  useFrame(() => {
    if (!entered) return;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6, 6);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.8, 4.5);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -11, 4);
  });

  return null;
}

function EnterFade() {
  const entered = useAppStore((s) => s.enteredWorld);
  const { camera } = useThree();
  useEffect(() => {
    if (entered) camera.position.set(0, 1.6, 6);
  }, [entered, camera]);
  return null;
}

function SceneContent({ imageUrl, analysis, style }: PaintingWorldProps) {
  const texture = useTexture(imageUrl);
  const entered = useAppStore((s) => s.enteredWorld);
  const pointerLocked = useAppStore((s) => s.pointerLocked);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const groupRef = useRef<THREE.Group>(null);
  const layerRefs = useRef<THREE.Mesh[]>([]);
  const backWallRef = useRef<THREE.Mesh>(null);
  const sunRef = useRef<THREE.Mesh>(null);
  const enterT = useRef(0);
  const tier = getQualityTier();

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    return () => texture.dispose();
  }, [texture]);

  useEffect(() => {
    if (!audioEnabled || !entered) return;
    void audioEngine.init().then(() => audioEngine.start(analysis));
    return () => audioEngine.stop();
  }, [analysis, audioEnabled, entered]);

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
  const fogColor = analysis.palette.sky;
  const [fogNear, fogFar] = fogDistance(analysis.weather, analysis.brightness);
  const cloudSpeed = MOOD_CLOUD_SPEED[analysis.mood];
  const showGodRays =
    tier === 'high' &&
    !analysis.isNight &&
    (analysis.mood === 'joyful' || analysis.mood === 'serene');
  const sparkleCount = scaleCount(analysis.mood === 'ethereal' ? 120 : 60, tier);
  const starCount = scaleCount(3000, tier, 0.27);

  useFrame((state, delta) => {
    if (entered && enterT.current < 1) enterT.current = Math.min(1, enterT.current + delta * 0.35);
    if (groupRef.current) {
      groupRef.current.position.z = THREE.MathUtils.lerp(8, 0, enterT.current);
    }

    const { camera } = state;
    layerRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const base = layers[i];
      if (!base) return;
      const factor = (i + 1) * 0.028;
      mesh.position.x = camera.position.x * factor;
      mesh.position.y = base.y + camera.position.y * factor * 0.35;
    });

    if (backWallRef.current) {
      backWallRef.current.position.x = camera.position.x * 0.04;
      backWallRef.current.position.y = camera.position.y * 0.02;
    }
  });

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      <ambientLight intensity={analysis.isNight ? 0.25 : 0.45} color={analysis.palette.secondary} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={analysis.brightness * 1.8}
        color={analysis.palette.accent}
        castShadow
      />
      <pointLight position={[-6, 4, -2]} intensity={0.4} color={analysis.palette.dominant} />

      <mesh ref={sunRef} position={[8, 12, 4]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial color="#fffef0" toneMapped={false} />
      </mesh>

      <group ref={groupRef}>
        {layers.map((layer, i) => (
          <mesh
            key={i}
            ref={(el) => {
              if (el) layerRefs.current[i] = el;
            }}
            position={[0, layer.y, layer.z]}
            scale={[layer.scale, layer.scale * 0.65, 1]}
          >
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

        <mesh ref={backWallRef} position={[0, 0, -18]} scale={[40, 24, 1]}>
          <planeGeometry />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        <mesh position={[0, 10, -17.2]} scale={[42, 14, 1]}>
          <planeGeometry />
          <meshBasicMaterial color={analysis.palette.sky} transparent opacity={0.55} toneMapped={false} />
        </mesh>

        {analysis.hasWater && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, -2]}>
              <planeGeometry args={[30, 30]} />
              <meshStandardMaterial color={analysis.palette.ground} transparent opacity={0.4} roughness={0.9} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -2]}>
              <planeGeometry args={[30, 30]} />
              <MeshDistortMaterial
                color={analysis.palette.accent}
                transparent
                opacity={0.5}
                distort={0.18}
                speed={0.85}
                roughness={0.05}
                metalness={0.75}
              />
            </mesh>
          </>
        )}
      </group>

      {analysis.isNight && (
        <Stars radius={80} depth={40} count={starCount} factor={3} fade speed={0.5} />
      )}
      {analysis.hasSky && (
        <Clouds>
          <Cloud
            opacity={0.35}
            speed={cloudSpeed}
            bounds={[12, 2, 2]}
            segments={tier === 'low' ? 10 : 18}
            position={[0, 6, -12]}
          />
          <Cloud
            opacity={0.2}
            speed={cloudSpeed * 0.85}
            bounds={[8, 1, 2]}
            segments={tier === 'low' ? 8 : 12}
            position={[-8, 5, -8]}
          />
        </Clouds>
      )}

      <Sparkles
        count={sparkleCount}
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
      <HiddenHotspots analysis={analysis} />

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

      {entered && (
        <FirstPersonControls
          lookSpeed={pointerLocked ? 0.003 : 0}
          movementSpeed={1.6}
          makeDefault
        />
      )}

      <EffectComposer multisampling={tier === 'high' ? 4 : 0}>
        <Bloom luminanceThreshold={uniforms.bloomThreshold} intensity={uniforms.bloom} />
        <Vignette offset={0.3} darkness={0.65} />
<<<<<<< HEAD
        {uniforms.chromatic ? (
          <ChromaticAberration
            offset={new THREE.Vector2(0.0025, 0.0025)}
            radialModulation={false}
            modulationOffset={0}
          />
        ) : (
          <></>
        )}
        {uniforms.scanline ? <Scanline density={1.4} opacity={0.35} /> : <></>}
        {uniforms.noiseOpacity > 0 ? <Noise opacity={uniforms.noiseOpacity} /> : <></>}
        {showGodRays ? (
          <GodRays sun={sunRef as never} density={0.9} decay={0.92} weight={0.4} exposure={0.4} />
=======
        {style === 'cyberpunk' ? (
          <ChromaticAberration
            offset={new THREE.Vector2(0.002, 0.002)}
            radialModulation={false}
            modulationOffset={0}
          />
>>>>>>> origin/master
        ) : (
          <></>
        )}
      </EffectComposer>
    </>
  );
}

export function PaintingWorld(props: PaintingWorldProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 100, position: [0, 1.6, 10] }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
        <PointerLockManager />
        <EnterFade />
        <CameraBounds />
        <Environment preset={props.analysis.isNight ? 'night' : 'sunset'} />
      </Suspense>
    </Canvas>
  );
}
