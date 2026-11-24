import { PerformanceMonitor, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { playerState } from '../lib/input'
import { useGame } from '../store/game'
import CameraRig from './CameraRig'
import { Cosmos, FOG_COLOR } from './Cosmos'
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
    sun.current.position.set(sx + 40, 28, sz + 24) // low sunset sun gives long, soft shadows
    target.position.set(sx, 0, sz)
    target.updateMatrixWorld()
  })
  return (
    <>
      <hemisphereLight args={['#a99bff', '#3b2a5e', 0.95]} />
      <ambientLight intensity={0.22} color="#8b7bd8" />
      <directionalLight position={[-30, 18, -22]} intensity={0.7} color="#6fa8ff" />
      <directionalLight
        ref={sun}
        target={target}
        intensity={2.5}
        color="#ffb98a"
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

// Render at the screen's native pixel ratio (up to 2x) so edges stay crisp on HiDPI displays.
const HIGH_DPR = typeof window === 'undefined' ? 1.5 : Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
const MID_DPR = Math.min(HIGH_DPR, 1.25)

export default function World() {
  const low = useGame((s) => s.lowGfx)
  const paused = useGame((s) => s.activeGame === 'race')
  const [dpr, setDpr] = useState(low ? 1 : HIGH_DPR)
  useEffect(() => setDpr(low ? 1 : HIGH_DPR), [low])
  return (
    <Canvas
      shadows={!low}
      dpr={dpr}
      frameloop={paused ? 'never' : 'always'}
      camera={{ fov: 52, near: 0.3, far: 600, position: [0, 30, 40] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <PerformanceMonitor onDecline={() => setDpr(low ? 1 : MID_DPR)} onIncline={() => !low && setDpr(HIGH_DPR)} />
      <color attach="background" args={['#0a0820']} />
      <fog attach="fog" args={[FOG_COLOR, 110, 340]} />
      <Cosmos low={low} />
      <Lights low={low} />
      <Terrain />
      <Decor />
      <Ocean />
      <Clouds count={low ? 12 : 26} />
      {!low && <FloatingBricks />}
      {!low && <Sparkles count={90} scale={[150, 22, 150]} position={[0, 8, 0]} size={3} speed={0.3} opacity={0.6} color="#cfe0ff" />}
      <StoryIsland />
      <Staged />
      <GoldenBricks />
      <Player />
      <Dust />
      <CameraRig />
      {!low && (
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.65} luminanceThreshold={0.85} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <HueSaturation saturation={0.1} />
          <BrightnessContrast contrast={0.07} />
          <Vignette eskil={false} offset={0.25} darkness={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
