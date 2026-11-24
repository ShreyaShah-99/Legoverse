import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { islands, type Island } from './layout'

const o = new THREE.Object3D()
const col = new THREE.Color()

/** Directions (radians) in which a bridge leaves this island. */
function bridgeDirs(i: Island): number[] {
  if (i.angle === null) return islands.filter((x) => x.angle !== null).map((x) => x.angle as number)
  return [i.angle + Math.PI]
}
function angDist(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
}
const nearBridge = (i: Island, a: number, tol: number) => bridgeDirs(i).some((d) => angDist(a, d) < tol)

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

interface Item { x: number; z: number; ry?: number; s?: number; c?: string; y?: number }

function useInstances(items: Item[], build: (it: Item, i: number, obj: THREE.Object3D) => void) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    items.forEach((it, i) => {
      o.position.set(0, 0, 0)
      o.rotation.set(0, it.ry ?? 0, 0)
      o.scale.setScalar(it.s ?? 1)
      build(it, i, o)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      if (it.c) { col.set(it.c); m.setColorAt(i, col) }
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])
  return ref
}

function PathTiles() {
  const items = useMemo(() => {
    const out: Item[] = []
    const stop: Record<string, number> = { story: 3.6, dev: 3, projects: 3.2, cloud: 3.4, experience: 3.4, contact: 4.4 }
    islands.forEach((isl) => {
      const rays: number[] = isl.angle === null ? islands.filter((x) => x.angle !== null).map((x) => x.angle as number) : [isl.angle + Math.PI]
      if (isl.id === 'story') rays.push((252 * Math.PI) / 180, (36 * Math.PI) / 180)
      rays.forEach((a) => {
        const start = isl.radius - 1.1
        for (let r = start, k = 0; r > stop[isl.id]; r -= 1.45, k++) {
          out.push({ x: isl.center[0] + Math.cos(a) * r, z: isl.center[1] + Math.sin(a) * r, c: k % 2 ? '#d8c9a6' : '#e8dcc0', ry: a })
        }
      })
    })
    return out
  }, [])
  const ref = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 0.11, it.z) })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} receiveShadow>
      <cylinderGeometry args={[0.62, 0.62, 0.22, 20]} />
      <meshStandardMaterial roughness={0.55} />
    </instancedMesh>
  )
}

function LampPosts() {
  const items = useMemo(() => {
    const out: Item[] = []
    islands.forEach((isl, idx) => {
      const n = Math.max(6, Math.round(isl.radius * 0.55))
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + idx * 0.37
        if (nearBridge(isl, a, 0.32)) continue
        const r = isl.radius - 1.7
        out.push({ x: isl.center[0] + Math.cos(a) * r, z: isl.center[1] + Math.sin(a) * r })
      }
    })
    return out
  }, [])
  const pole = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 1.2, it.z) })
  const head = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 2.55, it.z) })
  const base = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 0.18, it.z) })
  return (
    <>
      <instancedMesh ref={pole} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 2.4, 8]} />
        <meshStandardMaterial color="#2a2f3d" roughness={0.45} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={base} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.36, 10]} />
        <meshStandardMaterial color="#394150" roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, items.length]}>
        <sphereGeometry args={[0.27, 14, 12]} />
        <meshStandardMaterial color="#fff3c4" emissive="#ffd88a" emissiveIntensity={2.4} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

function Hedges() {
  const items = useMemo(() => {
    const out: Item[] = []
    const rand = rng(41)
    islands.forEach((isl) => {
      const r = isl.radius - 0.38
      const n = Math.floor((Math.PI * 2 * r) / 1.95)
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2
        if (nearBridge(isl, a, 0.3)) continue
        out.push({
          x: isl.center[0] + Math.cos(a) * r,
          z: isl.center[1] + Math.sin(a) * r,
          ry: Math.atan2(-Math.cos(a), -Math.sin(a)),
          c: rand() > 0.5 ? '#2f8f5b' : '#3aa86c',
        })
      }
    })
    return out
  }, [])
  const body = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 0.42, it.z) })
  const studsA = useInstances(items, (it, _i, ob) => {
    const tx = Math.cos(it.ry ?? 0), tz = -Math.sin(it.ry ?? 0)
    ob.position.set(it.x + tx * 0.5, 0.9, it.z + tz * 0.5)
  })
  const studsB = useInstances(items, (it, _i, ob) => {
    const tx = Math.cos(it.ry ?? 0), tz = -Math.sin(it.ry ?? 0)
    ob.position.set(it.x - tx * 0.5, 0.9, it.z - tz * 0.5)
  })
  return (
    <>
      <instancedMesh ref={body} args={[undefined, undefined, items.length]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.84, 0.75]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
      {[studsA, studsB].map((r, i) => (
        <instancedMesh key={i} ref={r} args={[undefined, undefined, items.length]}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 10]} />
          <meshStandardMaterial color="#44b57a" roughness={0.45} />
        </instancedMesh>
      ))}
    </>
  )
}

function Flowers() {
  const items = useMemo(() => {
    const out: Item[] = []
    const rand = rng(77)
    const palette = ['#ff6b8b', '#ffd23f', '#ffffff', '#c084fc', '#ff9a3c', '#6ec6ff']
    islands.forEach((isl) => {
      const clumps = isl.id === 'story' ? 12 : 7
      for (let c = 0; c < clumps; c++) {
        const a = rand() * Math.PI * 2
        if (nearBridge(isl, a, 0.4)) continue
        const r = isl.radius - 3.1 - rand() * 1.1
        const cx = isl.center[0] + Math.cos(a) * r
        const cz = isl.center[1] + Math.sin(a) * r
        const color = palette[Math.floor(rand() * palette.length)]
        for (let f = 0; f < 5; f++) {
          out.push({ x: cx + (rand() - 0.5) * 1.4, z: cz + (rand() - 0.5) * 1.4, s: 0.8 + rand() * 0.5, c: color })
        }
      }
    })
    return out
  }, [])
  const stems = useInstances(items.map((i) => ({ ...i, c: undefined })), (it, _i, ob) => { ob.position.set(it.x, 0.3 * (it.s ?? 1), it.z) })
  const heads = useInstances(items, (it, _i, ob) => { ob.position.set(it.x, 0.62 * (it.s ?? 1), it.z) })
  return (
    <>
      <instancedMesh ref={stems} args={[undefined, undefined, items.length]}>
        <cylinderGeometry args={[0.035, 0.045, 0.6, 5]} />
        <meshStandardMaterial color="#2f8f5b" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, items.length]} castShadow>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial roughness={0.4} />
      </instancedMesh>
    </>
  )
}

export default function Decor() {
  return (
    <>
      <PathTiles />
      <Hedges />
      <LampPosts />
      <Flowers />
    </>
  )
}
