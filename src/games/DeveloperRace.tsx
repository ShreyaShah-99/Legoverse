import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'
import { techTexture } from '../three/textures'
import { Icon } from '../ui/shared'

const LANES = [-3.4, 0, 3.4]
const TRACK = 640
const TECHS: [string, string][] = [['JS', '#f7df1e'], ['TS', '#3178c6'], ['React', '#61dafb'], ['Node', '#6cc24a'], ['Py', '#ffd43b'], ['AWS', '#ff9900'], ['SQL', '#00758f'], ['CSS', '#2965f1']]

interface Item { dist: number; lane: number; kind: 'tech' | 'obs'; tech: number; hit: boolean }
interface G {
  dist: number; x: number; lane: number; speed: number; score: number; time: number
  running: boolean; done: boolean; shake: number; collected: number; hits: number; items: Item[]
}

function makeItems(): Item[] {
  let s = 1337
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const items: Item[] = []
  for (let d = 40; d < TRACK - 20; d += 11) {
    const lane = Math.floor(rnd() * 3)
    const obs = rnd() < 0.4
    items.push({ dist: d, lane, kind: obs ? 'obs' : 'tech', tech: Math.floor(rnd() * TECHS.length), hit: false })
    if (rnd() < 0.35) items.push({ dist: d + 4, lane: (lane + 1 + Math.floor(rnd() * 2)) % 3, kind: 'tech', tech: Math.floor(rnd() * TECHS.length), hit: false })
  }
  return items
}

function Car({ g }: { g: React.MutableRefObject<G> }) {
  const grp = useRef<THREE.Group>(null)
  const wheels = useRef<THREE.Mesh[]>([])
  useFrame((_, dt) => {
    const s = g.current
    if (!grp.current) return
    const targetX = LANES[s.lane]
    const dx = targetX - s.x
    s.x += dx * Math.min(1, dt * 12)
    grp.current.position.set(s.x, 0.1 + (s.shake > 0 ? Math.abs(Math.sin(s.shake * 30)) * 0.2 : 0), -s.dist)
    grp.current.rotation.y = -dx * 0.12
    grp.current.rotation.z = dx * 0.04
    wheels.current.forEach((w) => { if (w) w.rotation.x -= dt * s.speed * 0.8 })
  })
  const body = '#e4572e'
  return (
    <group ref={grp}>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.9, 0.6, 3.4]} /><meshStandardMaterial color={body} roughness={0.3} /></mesh>
      <mesh position={[0, 1.05, 0.2]} castShadow><boxGeometry args={[1.5, 0.5, 1.7]} /><meshStandardMaterial color="#cfe8ff" roughness={0.1} metalness={0.3} /></mesh>
      <mesh position={[0, 1.38, 0.2]}><boxGeometry args={[1.5, 0.16, 1.7]} /><meshStandardMaterial color="#f6c445" roughness={0.3} /></mesh>
      {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 1.52, 0.2]}><cylinderGeometry args={[0.2, 0.2, 0.18, 10]} /><meshStandardMaterial color="#f6c445" roughness={0.3} /></mesh>)}
      {[[-1, -1.1], [1, -1.1], [-1, 1.1], [1, 1.1]].map(([x, z], i) => (
        <mesh key={i} ref={(m) => { if (m) wheels.current[i] = m }} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.42, 0.42, 0.3, 14]} /><meshStandardMaterial color="#14161d" roughness={0.7} /></mesh>
      ))}
      {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 0.6, -1.72]}><boxGeometry args={[0.35, 0.18, 0.05]} /><meshStandardMaterial color="#fff" emissive="#ffdca0" emissiveIntensity={2} toneMapped={false} /></mesh>)}
    </group>
  )
}

function Items({ g }: { g: React.MutableRefObject<G> }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const tex = useMemo(() => TECHS.map(([l, c]) => techTexture(l, c)), [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    g.current.items.forEach((it, i) => {
      const r = refs.current[i]
      if (!r) return
      r.visible = !it.hit
      if (it.kind === 'tech') r.rotation.y = t * 2.2 + i
    })
  })
  return (
    <>
      {g.current.items.map((it, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el }} position={[LANES[it.lane], 0, -it.dist]}>
          {it.kind === 'tech' ? (
            <mesh position={[0, 1.4, 0]}><planeGeometry args={[1.7, 1.7]} /><meshBasicMaterial map={tex[it.tech]} transparent side={THREE.DoubleSide} toneMapped={false} /></mesh>
          ) : (
            <group>
              {[0, 1].map((r) => (
                <mesh key={r} position={[0, 0.4 + r * 0.8, 0]} castShadow>
                  <boxGeometry args={[2.6, 0.78, 0.9]} />
                  <meshStandardMaterial color={r ? '#f4f4f2' : '#e4572e'} roughness={0.35} />
                </mesh>
              ))}
              {[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 1.25, 0]}><cylinderGeometry args={[0.22, 0.22, 0.14, 10]} /><meshStandardMaterial color="#f4f4f2" /></mesh>)}
            </group>
          )}
        </group>
      ))}
    </>
  )
}

function Scenery() {
  const bld = useRef<THREE.InstancedMesh>(null)
  const stripes = useRef<THREE.InstancedMesh>(null)
  const N = 120
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    const cols = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc', '#f4f4f2']
    let s = 99
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1
      const h = 3 + rnd() * 12
      o.position.set(side * (9 + rnd() * 8), h / 2, -(i / N) * (TRACK + 60) + 20)
      o.scale.set(3 + rnd() * 3, h, 3 + rnd() * 3)
      o.updateMatrix()
      bld.current?.setMatrixAt(i, o.matrix)
      c.set(cols[i % cols.length])
      bld.current?.setColorAt(i, c)
    }
    const S = 90
    for (let i = 0; i < S; i++) {
      o.position.set(0, 0.02, -i * 7.2 + 4)
      o.scale.set(1, 1, 1)
      o.updateMatrix()
      stripes.current?.setMatrixAt(i, o.matrix)
    }
    ;[bld, stripes].forEach((r) => { if (r.current) { r.current.instanceMatrix.needsUpdate = true; if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true } })
  }, [])
  return (
    <>
      <mesh position={[0, -0.02, -TRACK / 2]} receiveShadow><boxGeometry args={[12.5, 0.1, TRACK + 100]} /><meshStandardMaterial color="#2a2f3d" roughness={0.8} /></mesh>
      <mesh position={[0, -0.2, -TRACK / 2]}><boxGeometry args={[200, 0.2, TRACK + 200]} /><meshStandardMaterial color="#5aa469" roughness={0.8} /></mesh>
      {[-6.4, 6.4].map((x) => <mesh key={x} position={[x, 0.3, -TRACK / 2]}><boxGeometry args={[0.4, 0.6, TRACK + 100]} /><meshStandardMaterial color="#e4572e" /></mesh>)}
      <instancedMesh ref={stripes} args={[undefined, undefined, 90]}>
        <boxGeometry args={[0.2, 0.02, 3.6]} />
        <meshBasicMaterial color="#f6c445" />
      </instancedMesh>
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x, 0.01, -TRACK / 2]}><boxGeometry args={[0.08, 0.02, TRACK + 100]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.25} /></mesh>
      ))}
      <instancedMesh ref={bld} args={[undefined, undefined, N]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      {/* finish line */}
      <mesh position={[0, 0.03, -TRACK]}><boxGeometry args={[12, 0.02, 1.6]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 5, -TRACK]}><boxGeometry args={[13, 0.9, 0.4]} /><meshStandardMaterial color="#f6c445" emissive="#f6c445" emissiveIntensity={0.6} /></mesh>
      {[-6.4, 6.4].map((x) => <mesh key={x} position={[x, 2.5, -TRACK]}><boxGeometry args={[0.5, 5, 0.5]} /><meshStandardMaterial color="#f6c445" /></mesh>)}
    </>
  )
}

function Rig({ g, onFinish }: { g: React.MutableRefObject<G>; onFinish: () => void }) {
  const { camera } = useThree()
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = g.current
    if (s.running && !s.done) {
      s.time += dt
      s.speed = Math.min(40, s.speed + dt * 1.6)
      s.dist += s.speed * dt
      for (const it of s.items) {
        if (it.hit) continue
        if (Math.abs(it.dist - s.dist) < 1.5 && it.lane === s.lane) {
          it.hit = true
          if (it.kind === 'tech') { s.score += 10; s.collected++; sfx.collect() }
          else { s.score = Math.max(0, s.score - 5); s.speed = Math.max(18, s.speed * 0.55); s.shake = 0.5; s.hits++; sfx.fail() }
        }
      }
      if (s.dist >= TRACK) { s.done = true; s.running = false; onFinish() }
    }
    s.shake = Math.max(0, s.shake - dt)
    const sh = s.shake > 0 ? (Math.random() - 0.5) * 0.4 : 0
    camera.position.set(s.x * 0.55 + sh, 5.2, -s.dist + 10)
    camera.lookAt(s.x * 0.3, 1.2, -s.dist - 12)
  })
  return null
}

function Sunlight({ g }: { g: React.MutableRefObject<G> }) {
  const l = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    if (!l.current) return
    l.current.position.set(18, 30, -g.current.dist + 10)
    target.position.set(0, 0, -g.current.dist - 10)
    target.updateMatrixWorld()
  })
  return (
    <>
      <directionalLight ref={l} target={target} intensity={2.4} color="#fff2dc" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90} />
      <primitive object={target} />
    </>
  )
}

export default function DeveloperRace() {
  const unlock = useGame((s) => s.unlock)
  const low = useGame((s) => s.lowGfx)
  const g = useRef<G>({ dist: 0, x: 0, lane: 1, speed: 22, score: 0, time: 0, running: false, done: false, shake: 0, collected: 0, hits: 0, items: makeItems() })
  const [phase, setPhase] = useState<'ready' | 'count' | 'run' | 'done'>('ready')
  const [count, setCount] = useState(3)
  const [hud, setHud] = useState({ score: 0, time: 0, p: 0 })
  const [best, setBest] = useState<number | null>(() => {
    const v = localStorage.getItem('legoverse-race-best')
    return v ? parseFloat(v) : null
  })
  const [result, setResult] = useState<{ time: number; score: number; hits: number; collected: number } | null>(null)

  const reset = () => {
    g.current = { dist: 0, x: 0, lane: 1, speed: 22, score: 0, time: 0, running: false, done: false, shake: 0, collected: 0, hits: 0, items: makeItems() }
    setResult(null)
    setHud({ score: 0, time: 0, p: 0 })
    setPhase('ready')
  }

  const start = () => {
    sfx.click()
    setPhase('count')
    setCount(3)
  }

  useEffect(() => {
    if (phase !== 'count') return
    if (count === 0) {
      g.current.running = true
      const t = setTimeout(() => setPhase('run'), 600)
      return () => clearTimeout(t)
    }
    sfx.hover()
    const t = setTimeout(() => setCount((c) => c - 1), 800)
    return () => clearTimeout(t)
  }, [phase, count])

  useEffect(() => {
    const id = setInterval(() => {
      const s = g.current
      setHud({ score: s.score, time: s.time, p: Math.min(1, s.dist / TRACK) })
    }, 100)
    return () => clearInterval(id)
  }, [])

  const steer = (d: -1 | 1) => {
    const s = g.current
    if (!s.running) return
    const n = Math.max(0, Math.min(2, s.lane + d))
    if (n !== s.lane) { s.lane = n; sfx.hover() }
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') steer(-1)
      if (key === 'arrowright' || key === 'd') steer(1)
      if (key === ' ' && phase === 'ready') start()
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const onFinish = () => {
    const s = g.current
    const time = s.time
    setResult({ time, score: s.score, hits: s.hits, collected: s.collected })
    setPhase('done')
    sfx.success()
    unlock('racer')
    if (best === null || time < best) {
      setBest(time)
      localStorage.setItem('legoverse-race-best', String(time))
    }
  }

  return (
    <div className="relative mx-auto h-[min(70vh,640px)] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10">
      <Canvas shadows={!low} dpr={low ? 1 : [1, 1.5]} camera={{ fov: 62, near: 0.3, far: 260, position: [0, 5, 10] }}>
        <color attach="background" args={['#9fd0ff']} />
        <fog attach="fog" args={['#9fd0ff', 40, 190]} />
        <hemisphereLight args={['#dff0ff', '#6f7f5e', 0.9]} />
        <Sunlight g={g} />
        <Scenery />
        <Items g={g} />
        <Car g={g} />
        <Rig g={g} onFinish={onFinish} />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="glass rounded-xl px-3 py-2 text-sm"><span className="text-white/50">Score </span><b className="text-gold">{hud.score}</b></div>
        <div className="glass w-40 rounded-xl px-3 py-2 text-xs">
          <div className="flex justify-between text-white/60"><span>Time</span><b className="font-mono text-white">{hud.time.toFixed(1)}s</b></div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400" style={{ width: `${hud.p * 100}%` }} /></div>
        </div>
      </div>

      {phase === 'run' && (
        <div className="absolute inset-x-0 bottom-4 flex justify-between px-4 md:hidden">
          <button className="glass pointer-events-auto flex h-16 w-24 items-center justify-center rounded-2xl active:scale-95" onPointerDown={() => steer(-1)} aria-label="Steer left"><span className="-rotate-90"><Icon name="up" size={28} /></span></button>
          <button className="glass pointer-events-auto flex h-16 w-24 items-center justify-center rounded-2xl active:scale-95" onPointerDown={() => steer(1)} aria-label="Steer right"><span className="rotate-90"><Icon name="up" size={28} /></span></button>
        </div>
      )}

      {phase === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 p-6 text-center backdrop-blur-sm">
          <h2 className="font-display text-4xl font-bold text-white">Developer Race</h2>
          <p className="mt-2 max-w-sm text-white/70">Steer with A / D or the arrow keys. Grab technology tiles, dodge the brick walls, reach the finish line.</p>
          {best !== null && <p className="mt-2 text-sm text-gold">Best time {best.toFixed(1)}s</p>}
          <button className="btn-primary mt-5" onClick={start}>Start race</button>
        </div>
      )}
      {phase === 'count' && <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-8xl font-bold text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.4)]">{count || 'GO!'}</div>}
      {phase === 'done' && result && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-6 text-center backdrop-blur-sm">
          <h2 className="font-display text-4xl font-bold text-white">Finish!</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="glass rounded-xl px-4 py-3"><p className="text-white/50">Time</p><b className="text-xl text-white">{result.time.toFixed(1)}s</b></div>
            <div className="glass rounded-xl px-4 py-3"><p className="text-white/50">Score</p><b className="text-xl text-gold">{result.score}</b></div>
            <div className="glass rounded-xl px-4 py-3"><p className="text-white/50">Tech tiles</p><b className="text-xl text-white">{result.collected}</b></div>
          </div>
          {best !== null && <p className="mt-3 text-sm text-white/60">Best time {best.toFixed(1)}s</p>}
          <button className="btn-primary mt-5" onClick={reset}>Race again</button>
        </div>
      )}
    </div>
  )
}
