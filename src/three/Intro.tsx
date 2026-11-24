import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { FlyingBricks, randomStart, type BrickItem } from './FlyingBricks'
import { Minifigure, type AnimState } from './Minifigure'
import { useGame } from '../store/game'
import { sfx } from '../lib/audio'

const PALETTE = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc', '#f8f8f2', '#ff8fab', '#2dd4bf']

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildCity(): BrickItem[] {
  const rng = mulberry(7)
  const items: BrickItem[] = []
  // baseplate tiles
  for (let ix = 0; ix < 6; ix++) {
    for (let iz = 0; iz < 6; iz++) {
      items.push({
        target: new THREE.Vector3(-10 + ix * 4, 0.15, -10 + iz * 4),
        scale: new THREE.Vector3(3.96, 0.3, 3.96),
        color: (ix + iz) % 2 ? '#2f3a52' : '#374462',
        delay: rng() * 0.18,
        start: randomStart(rng),
        spin: new THREE.Vector3(rng() * 6, rng() * 6, rng() * 6),
      })
    }
  }
  // buildings
  for (let bx = 0; bx < 4; bx++) {
    for (let bz = 0; bz < 4; bz++) {
      const x = -5.4 + bx * 3.6
      const z = -6 + bz * 3.6
      const layers = 2 + Math.floor(rng() * 6)
      const col = PALETTE[Math.floor(rng() * PALETTE.length)]
      const base = 0.2 + rng() * 0.25
      for (let l = 0; l < layers; l++) {
        items.push({
          target: new THREE.Vector3(x, 0.3 + l + 0.5, z),
          scale: new THREE.Vector3(2.3, 0.98, 2.3),
          color: l === layers - 1 ? '#f1f1ec' : col,
          delay: 0.12 + base + (l / 8) * 0.25 + rng() * 0.1,
          start: randomStart(rng),
          spin: new THREE.Vector3(rng() * 6, rng() * 6, rng() * 6),
        })
      }
    }
  }
  return items
}

function buildName(): BrickItem[] {
  const rng = mulberry(21)
  const cv = document.createElement('canvas')
  cv.width = 112
  cv.height = 40
  const g = cv.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, cv.width, cv.height)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '900 19px "Arial Black", Impact, Arial, sans-serif'
  g.fillText('SHREYA', 56, 10)
  g.fillText('SHAH', 56, 30)
  const data = g.getImageData(0, 0, cv.width, cv.height).data
  const items: BrickItem[] = []
  const cell = 0.17
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (data[(y * cv.width + x) * 4] > 140) {
        const hue = PALETTE[(Math.floor(x / 3) + Math.floor(y / 4)) % PALETTE.length]
        items.push({
          target: new THREE.Vector3((x - cv.width / 2) * cell, 14.6 - y * cell * 1.0, -3),
          scale: new THREE.Vector3(cell * 0.94, cell * 0.94, cell * 0.94),
          color: hue,
          delay: (x / cv.width) * 0.45 + rng() * 0.1,
          start: randomStart(rng, 45),
          spin: new THREE.Vector3(rng() * 8, rng() * 8, rng() * 8),
        })
      }
    }
  }
  return items
}

interface Tl {
  bricks: number
  name: number
  figX: number
  figRot: number
  light: number
  cx: number; cy: number; cz: number
  lx: number; ly: number; lz: number
}

function Rig({ st }: { st: React.MutableRefObject<Tl> }) {
  const { camera } = useThree()
  useFrame(() => {
    const s = st.current
    camera.position.set(s.cx, s.cy, s.cz)
    camera.lookAt(s.lx, s.ly, s.lz)
  })
  return null
}

function Scene({ onReady, low }: { onReady: () => void; low: boolean }) {
  const hair = useGame((s) => s.hair)
  const reduced = useGame((s) => s.reducedMotion)
  const city = useMemo(buildCity, [])
  const name = useMemo(buildName, [])
  const st = useRef<Tl>({ bricks: 0, name: 0, figX: -18, figRot: Math.PI / 2, light: 0, cx: 24, cy: 17, cz: 30, lx: 0, ly: 3, lz: 0 })
  const bricksP = useRef(0)
  const nameP = useRef(0)
  const fig = useRef<THREE.Group>(null)
  const anim = useRef<AnimState>({ mode: 'idle' })
  const amb = useRef<THREE.AmbientLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const rim1 = useRef<THREE.PointLight>(null)
  const rim2 = useRef<THREE.PointLight>(null)

  useEffect(() => {
    const s = st.current
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    tl.to(s, { light: 1, duration: 1.2, ease: 'power1.out' }, 0.2)
    tl.call(() => sfx.whoosh(), [], 0.6)
    tl.to(s, { bricks: 1, duration: 4.6, ease: 'none' }, 0.6)
    tl.to(s, { cx: 0, cy: 11, cz: 33, lx: 0, ly: 3, lz: 0, duration: 5.4 }, 0.4)
    tl.call(() => { anim.current.mode = 'walk' }, [], 5.4)
    tl.to(s, { figX: 0, duration: 3.1, ease: 'none' }, 5.4)
    tl.to(s, { figRot: 0, duration: 0.5 }, 8.5)
    tl.call(() => { anim.current.mode = 'wave' }, [], 8.6)
    tl.to(s, { cx: 0, cy: 7.5, cz: 27, lx: 0, ly: 6.5, lz: 0, duration: 3.2 }, 8.4)
    tl.call(() => sfx.whoosh(), [], 8.7)
    tl.to(s, { name: 1, duration: 3.2, ease: 'none' }, 8.8)
    tl.call(onReady, [], 12.2)
    if (reduced) tl.progress(1)
    return () => { tl.kill() }
  }, [onReady, reduced])

  useFrame(() => {
    const s = st.current
    bricksP.current = s.bricks
    nameP.current = s.name
    if (fig.current) {
      fig.current.position.set(s.figX, 0.3, 10.5)
      fig.current.rotation.y = s.figRot
    }
    if (amb.current) amb.current.intensity = 0.55 * s.light
    if (sun.current) sun.current.intensity = 2.6 * s.light
    if (rim1.current) rim1.current.intensity = 260 * s.light
    if (rim2.current) rim2.current.intensity = 200 * s.light
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <fog attach="fog" args={['#05060a', 40, 110]} />
      <Rig st={st} />
      <ambientLight ref={amb} intensity={0} color="#9db4ff" />
      <directionalLight ref={sun} position={[14, 24, 18]} intensity={0} castShadow={!low} shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-bias={-0.0004} color="#fff1dd" />
      <pointLight ref={rim1} position={[-16, 8, 8]} color="#4da6ff" intensity={0} distance={70} />
      <pointLight ref={rim2} position={[16, 10, -6]} color="#ff7a45" intensity={0} distance={70} />

      <FlyingBricks items={city} progress={bricksP} />
      <FlyingBricks items={name} progress={nameP} studs />

      <group ref={fig} scale={1.55}>
        <Minifigure anim={anim} hair={hair} shadows={!low} />
      </group>

      <Sparkles count={low ? 40 : 140} scale={[46, 22, 46]} position={[0, 8, 0]} size={3} speed={0.35} opacity={0.7} color="#ffd88a" />

      {!low && (
        <EffectComposer multisampling={0}>
          <DepthOfField worldFocusDistance={28} worldFocusRange={22} bokehScale={2.2} />
          <Bloom intensity={0.45} luminanceThreshold={0.7} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      )}
    </>
  )
}

export default function Intro({ onReady }: { onReady: () => void }) {
  const low = useGame((s) => s.lowGfx)
  return (
    <Canvas shadows={!low} dpr={low ? 1 : [1, 1.75]} camera={{ fov: 42, near: 0.5, far: 220, position: [24, 17, 30] }} gl={{ antialias: !low, powerPreference: 'high-performance' }}>
      <Scene onReady={onReady} low={low} />
    </Canvas>
  )
}
