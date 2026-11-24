import { PerformanceMonitor, Sky, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { playerState } from '../lib/input'
import { useGame } from '../store/game'
import CameraRig from './CameraRig'
import Decor from './Decor'
import Dust from './Dust'
import GoldenBricks from './GoldenBricks'
import Player from './Player'
import StoryIsland from './StoryIsland'
import { Clouds, FloatingBricks, Ocean, Terrain } from './Terrain'

// Outer islands load progressively, one after another.
const DevCity = lazy(() => import('./DevCity'))
const ProjectsIsland = lazy(() => import('./ProjectsIsland'))
const CloudKingdom = lazy(() => import('./CloudKingdom'))
const ExperienceIsland = lazy(() => import('./ExperienceIsland'))
const ContactIsland = lazy(() => import('./ContactIsland'))

function Lights({ low }: { low: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    if (!sun.current) return
    // Snap the shadow frustum to a grid so shadow edges do not shimmer while moving.
    const STEP = 2.25
    const sx = Math.round(playerState.x / STEP) * STEP
    const sz = Math.round(playerState.z / STEP) * STEP
    sun.current.position.set(sx + 28, 42, sz + 18)
    target.position.set(sx, 0, sz)
    target.updateMatrixWorld()
  })
  return (
    <>
      <hemisphereLight args={['#cfe6ff', '#6f7f5e', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        ref={sun}
        target={target}
        intensity={2.6}
        color="#fff2dc"
        castShadow={!low}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />
      <primitive object={target} />
    </>
  )
}

function Staged() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (stage >= 5) return
    // Mount islands one at a time while the opening swoop is still playing.
    const t = setTimeout(() => setStage((s) => s + 1), stage === 0 ? 350 : 420)
    return () => clearTimeout(t)
  }, [stage])
  return (
    <>
      {stage >= 1 && <Suspense fallback={null}><DevCity /></Suspense>}
      {stage >= 2 && <Suspense fallback={null}><ProjectsIsland /></Suspense>}
      {stage >= 3 && <Suspense fallback={null}><CloudKingdom /></Suspense>}
      {stage >= 4 && <Suspense fallback={null}><ExperienceIsland /></Suspense>}
      {stage >= 5 && <Suspense fallback={null}><ContactIsland /></Suspense>}
    </>
  )
}

export default function World() {
  const low = useGame((s) => s.lowGfx)
  const paused = useGame((s) => s.activeGame === 'race')
  const [dpr, setDpr] = useState(low ? 1 : 1.5)
  useEffect(() => setDpr(low ? 1 : 1.5), [low])
  return (
    <Canvas
      shadows={!low}
      dpr={dpr}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 52, near: 0.3, far: 600, position: [0, 30, 40] }}
      gl={{ antialias: !low, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => !low && setDpr(1.5)} />
      <color attach="background" args={['#bcd8f0']} />
      <fog attach="fog" args={['#bcd8f0', 90, 330]} />
      <Sky distance={4500} sunPosition={[100, 45, 60]} turbidity={3} rayleigh={1.1} mieCoefficient={0.004} />
      <Lights low={low} />
      <Terrain />
      <Decor />
      <Ocean />
      <Clouds count={low ? 12 : 26} />
      {!low && <FloatingBricks />}
      {!low && <Sparkles count={90} scale={[150, 22, 150]} position={[0, 8, 0]} size={3} speed={0.3} opacity={0.5} color="#fff6d6" />}
      <StoryIsland />
      <Staged />
      <GoldenBricks />
      <Player />
      <Dust />
      <CameraRig />
      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.4} luminanceThreshold={0.88} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.1} />
          <BrightnessContrast contrast={0.07} />
          <Vignette eskil={false} offset={0.25} darkness={0.5} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
