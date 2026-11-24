import { Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'
import { Cosmos } from '../world/Cosmos'
import { islands } from '../world/layout'
import { FlyingBricks, randomStart, type BrickItem } from './FlyingBricks'
import { Minifigure, type AnimState } from './Minifigure'

const PALETTE = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc', '#f8f8f2', '#ff8fab', '#2dd4bf']

interface Tl {
  fly: number // camera fly-in progress
  light: number
  hero: number // rock under the island scales in
  base: number // baseplate bricks snapping together
  towers: number // brick towers
  name: number // name spelled out in bricks
  figShow: number
  figY: number // character drops onto the plate
  orbit: number // orbiting islands scale-in
}

function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

function buildBase(): BrickItem[] {
  const r = rng(11)
  const items: BrickItem[] = []
  // A square 8x8 baseplate, like a real LEGO plate, with a stone-coloured rim ring of plates.
  const step = 1.5
  const N = 8
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = (i - (N - 1) / 2) * step
      const z = (j - (N - 1) / 2) * step
      const edge = i === 0 || j === 0 || i === N - 1 || j === N - 1
      const d = Math.hypot(x, z)
      items.push({
        target: new THREE.Vector3(x, -0.15, z),
        scale: new THREE.Vector3(1.46, 0.3, 1.46),
        color: edge ? '#d9d4c7' : (i + j) % 2 ? '#4f9d5f' : '#5aa469',
        delay: (d / 8.5) * 0.32 + r() * 0.16,
        start: randomStart(r, 55),
        spin: new THREE.Vector3(r() * 7, r() * 7, r() * 7),
      })
    }
  }
  return items
}

function buildTowers(): BrickItem[] {
  const r = rng(29)
  const items: BrickItem[] = []
  const spots: [number, number, number][] = [
    [-4.1, -1.6, 5],
    [-2.5, -3.5, 3],
    [2.4, -3.6, 4],
    [4.2, -1.4, 6],
    [0.2, -4.2, 2],
  ]
  spots.forEach(([x, z, layers], k) => {
    const col = PALETTE[(k * 2 + 1) % PALETTE.length]
    for (let l = 0; l < layers; l++) {
      items.push({
        target: new THREE.Vector3(x, 0.26 + l * 0.52, z),
        scale: new THREE.Vector3(1.3, 0.5, 1.3),
        color: l === layers - 1 ? '#f4f4f2' : col,
        delay: 0.1 + k * 0.08 + l * 0.07 + r() * 0.05,
        start: randomStart(r, 50),
        spin: new THREE.Vector3(r() * 7, r() * 7, r() * 7),
      })
    }
  })
  return items
}

function buildName(): BrickItem[] {
  const r = rng(21)
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
        items.push({
          target: new THREE.Vector3((x - cv.width / 2) * cell, 12.2 - y * cell, -3),
          scale: new THREE.Vector3(cell * 0.94, cell * 0.94, cell * 0.94),
          color: PALETTE[(Math.floor(x / 3) + Math.floor(y / 4)) % PALETTE.length],
          delay: (x / cv.width) * 0.45 + r() * 0.1,
          start: randomStart(r, 45),
          spin: new THREE.Vector3(r() * 8, r() * 8, r() * 8),
        })
      }
    }
  }
  return items
}

/** A spiral galaxy made of tens of thousands of points. */
function Galaxy({ low }: { low: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const n = low ? 7000 : 20000
    const pos = new Float32Array(n * 3)
    const col = new Float32Array(n * 3)
    const r = rng(42)
    const inner = new THREE.Color('#ffd9a0')
    const mid = new THREE.Color('#ff8ac0')
    const outer = new THREE.Color('#6f9bff')
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const rad = Math.pow(r(), 1.7) * 95 + 4
      const arm = (i % 4) * (Math.PI / 2)
      const ang = arm + rad * 0.075 + (r() - 0.5) * (0.9 - Math.min(rad / 120, 0.6))
      const spread = (r() - 0.5) * (2 + rad * 0.05)
      pos[i * 3] = Math.cos(ang) * rad + (r() - 0.5) * 2
      pos[i * 3 + 1] = spread * 0.6
      pos[i * 3 + 2] = Math.sin(ang) * rad + (r() - 0.5) * 2
      const t = Math.min(rad / 95, 1)
      c.copy(inner).lerp(mid, Math.min(t * 2, 1)).lerp(outer, Math.max(0, t * 2 - 1))
      c.multiplyScalar(0.55 + r() * 0.6)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [low])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.02 })
  return (
    <points ref={ref} geometry={geo} position={[0, -14, -10]} rotation={[0.18, 0, 0.1]}>
      <pointsMaterial size={0.5} sizeAttenuation vertexColors transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Stack of shrinking square plates, like an upside-down brick pyramid. */
function Steps({ top, layers, h, colors, shrink }: { top: number; layers: number; h: number; colors: string[]; shrink: number }) {
  return (
    <>
      {Array.from({ length: layers }).map((_, i) => {
        const w = top - i * shrink
        return (
          <mesh key={i} position={[0, -0.3 - h / 2 - i * h, 0]}>
            <boxGeometry args={[w, h - 0.04, w]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.7} />
          </mesh>
        )
      })}
    </>
  )
}

/** A small floating island that orbits the hero. */
function Satellite({ i, st, color }: { i: number; st: React.MutableRefObject<Tl>; color: string }) {
  const g = useRef<THREE.Group>(null)
  const p = useMemo(() => {
    const r = rng(i * 97 + 5)
    return { radius: 11 + (i % 3) * 3 + r() * 1.5, speed: (0.07 + r() * 0.05) * (i % 2 ? 1 : -1), phase: (i / 6) * Math.PI * 2, y: -2 + r() * 6, ph: r() * 6, size: 1.0 + r() * 0.6 }
  }, [i])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (!g.current) return
    const a = p.phase + t * p.speed
    const k = Math.min(1, Math.max(0, st.current.orbit * 1.6 - i * 0.12))
    const e = 1 - Math.pow(1 - k, 3)
    g.current.position.set(Math.cos(a) * p.radius, p.y + Math.sin(t * 0.6 + p.ph) * 0.7, Math.sin(a) * p.radius * 0.8)
    g.current.rotation.y = t * 0.15 + p.ph
    g.current.scale.setScalar(p.size * e)
  })
  return (
    <group ref={g}>
      <mesh>
        <boxGeometry args={[3.8, 0.5, 3.8]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* a studded brick on top so each satellite reads as LEGO */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.5, 0.7, 1.0]} />
        <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 1.08, 0]}><cylinderGeometry args={[0.2, 0.2, 0.16, 12]} /><meshStandardMaterial color={color} roughness={0.35} /></mesh>
      ))}
      <Steps top={3.2} layers={3} h={0.8} shrink={1.0} colors={['#4d4668', '#433d5c', '#393451']} />
      <mesh position={[0, -2.9, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 0.8, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Rig({ st }: { st: React.MutableRefObject<Tl> }) {
  const { camera } = useThree()
  const from = useMemo(() => new THREE.Vector3(0, 30, 95), [])
  const to = useMemo(() => new THREE.Vector3(0, 5.2, 25), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame((s) => {
    const k = st.current.fly
    const t = s.clock.elapsedTime
    camera.position.lerpVectors(from, to, k)
    camera.position.x += Math.sin(t * 0.22) * 2.2 * k
    camera.position.y += Math.sin(t * 0.17) * 0.5 * k
    look.set(0, THREE.MathUtils.lerp(2, 5.2, k), 0)
    camera.lookAt(look)
  })
  return null
}

function Scene({ onReady, low }: { onReady: () => void; low: boolean }) {
  const hair = useGame((s) => s.hair)
  const reduced = useGame((s) => s.reducedMotion)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const base = useMemo(buildBase, [])
  const towers = useMemo(buildTowers, [])
  const name = useMemo(buildName, [])
  const st = useRef<Tl>({ fly: 0, light: 0, hero: 0, base: 0, towers: 0, name: 0, figShow: 0, figY: 18, orbit: 0 })
  const baseP = useRef(0)
  const towerP = useRef(0)
  const nameP = useRef(0)
  const anim = useRef<AnimState>({ mode: 'idle' })
  const rock = useRef<THREE.Group>(null)
  const fig = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Group>(null)
  const amb = useRef<THREE.AmbientLight>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const p1 = useRef<THREE.PointLight>(null)
  const p2 = useRef<THREE.PointLight>(null)
  // keep the brick name inside the screen on narrow displays
  const nameScale = Math.min(1, Math.max(0.3, (aspect * 19) / 21))

  useEffect(() => {
    const s = st.current
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    tl.to(s, { fly: 1, duration: 6.4, ease: 'power3.out' }, 0)
    tl.to(s, { light: 1, duration: 1.8, ease: 'power1.out' }, 0.2)
    tl.call(() => sfx.whoosh(), [], 0.4)
    tl.to(s, { hero: 1, duration: 1.6, ease: 'back.out(1.3)' }, 0.5)
    tl.to(s, { base: 1, duration: 2.6, ease: 'none' }, 0.7)
    tl.to(s, { towers: 1, duration: 2.4, ease: 'none' }, 1.8)
    tl.call(() => { s.figShow = 1 }, [], 3.3)
    tl.to(s, { figY: 0, duration: 1.1, ease: 'bounce.out' }, 3.3)
    tl.call(() => sfx.land(), [], 3.75)
    tl.call(() => { anim.current.mode = 'wave' }, [], 4.7)
    tl.call(() => sfx.whoosh(), [], 3.4)
    tl.to(s, { name: 1, duration: 3.2, ease: 'none' }, 3.4)
    tl.to(s, { orbit: 1, duration: 3.2, ease: 'power2.out' }, 4.4)
    tl.call(onReady, [], 7)
    if (reduced) {
      tl.progress(1)
      s.figShow = 1
    }
    return () => { tl.kill() }
  }, [onReady, reduced])

  useFrame((state) => {
    const s = st.current
    const t = state.clock.elapsedTime
    baseP.current = s.base
    towerP.current = s.towers
    nameP.current = s.name
    if (rock.current) rock.current.scale.setScalar(Math.max(0.0001, s.hero))
    if (fig.current) {
      fig.current.visible = s.figShow > 0
      fig.current.position.y = s.figY
    }
    if (halo.current) halo.current.position.y = Math.sin(t * 1.2) * 0.04 // outline breathes slightly
    if (amb.current) amb.current.intensity = 0.7 * s.light
    if (key.current) key.current.intensity = 2.4 * s.light
    if (p1.current) p1.current.intensity = 220 * s.light
    if (p2.current) p2.current.intensity = 180 * s.light
  })

  return (
    <>
      <color attach="background" args={['#05060f']} />
      <Rig st={st} />
      <Cosmos low={low} />
      <Galaxy low={low} />

      <ambientLight ref={amb} intensity={0} color="#9a8cff" />
      <directionalLight ref={key} position={[14, 16, 18]} intensity={0} color="#ffb98a" />
      <pointLight ref={p1} position={[-14, 6, 8]} color="#ff7ab8" intensity={0} distance={60} />
      <pointLight ref={p2} position={[14, 3, 6]} color="#5cc8ff" intensity={0} distance={60} />

      {/* the island is built brick by brick */}
      <FlyingBricks items={base} progress={baseP} studs studColor="#6bb77a" />
      <FlyingBricks items={towers} progress={towerP} studs />
      <group scale={nameScale}>
        <FlyingBricks items={name} progress={nameP} studs />
      </group>

      <group ref={rock}>
        {/* stepped underside, wide at the top and narrowing down */}
        <Steps top={12.2} layers={6} h={1.0} colors={['#6b4a32', '#5f4a45', '#534a5c', '#4a4468', '#403b5a', '#37334e']} shrink={1.9} />
        {/* glowing square outline around the plate */}
        <group ref={halo}>
          {[[0, 6.15, 12.5, 0.14], [0, -6.15, 12.5, 0.14], [6.15, 0, 0.14, 12.5], [-6.15, 0, 0.14, 12.5]].map(([x, z, w, d], i) => (
            <mesh key={i} position={[x, -0.2, z]}>
              <boxGeometry args={[w, 0.08, d]} />
              <meshStandardMaterial color="#000" emissive="#ffd88a" emissiveIntensity={2.4} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = i * 1.26 + 0.4
          const c = ['#7ee7ff', '#c79bff', '#ff9ad0', '#8ef0b8', '#ffd88a'][i]
          return (
            <mesh key={i} position={[Math.cos(a) * 0.8, -6.9 - (i % 3) * 0.5, Math.sin(a) * 0.8]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.28, 1.3, 5]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.4} toneMapped={false} />
            </mesh>
          )
        })}
      </group>

      <group ref={fig} position={[0, 18, 1.2]} scale={1.5}>
        <Minifigure anim={anim} hair={hair} shadows={false} />
      </group>

      {islands.map((isl, i) => <Satellite key={isl.id} i={i} st={st} color={isl.color} />)}

      <Sparkles count={low ? 50 : 160} scale={[44, 22, 44]} position={[0, 4, 0]} size={3} speed={0.3} opacity={0.8} color="#ffe2b0" />

      {!low && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.8} luminanceThreshold={0.65} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.8} />
        </EffectComposer>
      )}
    </>
  )
}

export default function Intro({ onReady }: { onReady: () => void }) {
  const low = useGame((s) => s.lowGfx)
  return (
    <Canvas dpr={low ? 1 : [1, 1.75]} camera={{ fov: 46, near: 0.5, far: 900, position: [0, 30, 95] }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <Scene onReady={onReady} low={low} />
    </Canvas>
  )
}
