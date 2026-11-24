import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { islands, obstacles, RING, trees, type Island } from './layout'

const o = new THREE.Object3D()

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

const grassCache = new Map<string, THREE.CanvasTexture>()
/** Speckled turf texture tinted with the island colour. */
function grassMap(hex: string) {
  const hit = grassCache.get(hex)
  if (hit) return hit
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = hex
  g.fillRect(0, 0, S, S)
  const r = rng(hex.length * 977 + hex.charCodeAt(1) * 31)
  for (let i = 0; i < 2600; i++) {
    const light = r() > 0.5
    g.fillStyle = light ? `rgba(255,255,255,${0.03 + r() * 0.06})` : `rgba(0,0,0,${0.04 + r() * 0.08})`
    g.fillRect(r() * S, r() * S, 1 + r() * 3, 2 + r() * 5)
  }
  // soft darker patches so the surface is not uniform
  for (let i = 0; i < 26; i++) {
    const x = r() * S, y = r() * S, rad = 14 + r() * 30
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    grd.addColorStop(0, r() > 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  grassCache.set(hex, t)
  return t
}

/** Rugged rock mass that tapers to a point under an island. */
function rockGeometry(r: number, depth: number) {
  const g = new THREE.CylinderGeometry(r * 0.98, r * 0.12, depth, 20, 6)
  const pos = g.attributes.position as THREE.BufferAttribute
  const h = (x: number, y: number, z: number) => {
    const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return v - Math.floor(v)
  }
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const t = (y + depth / 2) / depth // 0 at the tip, 1 under the island top
    if (t < 0.97) {
      const n = h(Math.round(x * 4) / 4, Math.round(y * 4) / 4, Math.round(z * 4) / 4)
      const k = 1 + (n - 0.5) * 0.42
      x *= k
      z *= k
      y += (h(z, x, y) - 0.5) * 1.1 * (1 - t)
    }
    pos.setXYZ(i, x, y, z)
  }
  g.computeVertexNormals()
  return g
}

const CRYSTALS = ['#7ee7ff', '#c79bff', '#ff9ad0', '#8ef0b8']

function IslandBase({ island }: { island: Island }) {
  const studs = useRef<THREE.InstancedMesh>(null)
  const r = island.radius
  const isCloud = island.id === 'cloud'
  const isDev = island.id === 'dev'
  const depth = r * 0.85 + 3
  const top = useMemo(() => new THREE.Color(island.color), [island.color])
  const map = useMemo(() => {
    const t = grassMap(island.color).clone()
    t.repeat.set(r / 5, r / 5)
    t.needsUpdate = true
    return t
  }, [island.color, r])
  const rock = useMemo(() => rockGeometry(r, depth), [r, depth])
  const soil = isCloud ? '#e8f0ff' : isDev ? '#232b45' : '#6b4a32'
  const rockColor = isCloud ? '#c9d8f2' : isDev ? '#2c3452' : '#5a5170'
  const crystalCol = useMemo(() => {
    const rr = rng(island.id.length * 131 + Math.round(r) * 7)
    return Array.from({ length: 6 }, (_, i) => ({
      a: rr() * Math.PI * 2,
      d: 0.25 + rr() * 0.4,
      y: -1.2 - rr() * depth * 0.6,
      s: 0.6 + rr() * 0.9,
      c: isDev ? '#4da6ff' : CRYSTALS[(i + island.id.length) % CRYSTALS.length],
    }))
  }, [island.id, r, depth, isDev])

  // Tech island keeps a studded plate.
  const positions = useMemo(() => {
    const p: [number, number][] = []
    if (!isDev) return p
    const sp = 1.6
    for (let x = -r; x <= r; x += sp) {
      for (let z = -r; z <= r; z += sp) {
        if (Math.hypot(x, z) < r - 0.9) p.push([x, z])
      }
    }
    return p
  }, [r, isDev])
  useLayoutEffect(() => {
    const m = studs.current
    if (!m) return
    positions.forEach(([x, z], i) => {
      o.position.set(x, 0.07, z)
      o.rotation.set(0, 0, 0)
      o.scale.set(1, 1, 1)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [positions])

  return (
    <group position={[island.center[0], 0, island.center[1]]}>
      {/* turf-topped plate: soil edge, grass surface */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[r, r * 0.97, 0.5, 72]} />
        <meshStandardMaterial attach="material-0" color={soil} roughness={0.9} />
        <meshStandardMaterial attach="material-1" map={map} color="#ffffff" roughness={0.88} />
        <meshStandardMaterial attach="material-2" color={soil} roughness={0.9} />
      </mesh>
      {/* grass lip overhanging the soil */}
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[r + 0.08, r + 0.02, 0.2, 72]} />
        <meshStandardMaterial color={top.clone().multiplyScalar(0.82)} roughness={0.85} />
      </mesh>
      {/* floating rock underneath */}
      <mesh geometry={rock} position={[0, -0.5 - depth / 2, 0]} receiveShadow>
        <meshStandardMaterial color={rockColor} roughness={0.95} flatShading />
      </mesh>
      {/* glowing crystals hanging from the rock */}
      {crystalCol.map((c, i) => (
        <mesh key={i} position={[Math.cos(c.a) * r * c.d, c.y, Math.sin(c.a) * r * c.d]} rotation={[Math.PI, 0, 0]} scale={c.s}>
          <coneGeometry args={[0.3, 1.5, 5]} />
          <meshStandardMaterial color={c.c} emissive={c.c} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      ))}
      {isDev && (
        <instancedMesh ref={studs} args={[undefined, undefined, positions.length]} receiveShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.14, 10]} />
          <meshStandardMaterial color={top.clone().offsetHSL(0, 0, 0.05)} roughness={0.5} />
        </instancedMesh>
      )}
      {isDev && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 1.2, r - 0.9, 96]} />
          <meshStandardMaterial color="#000" emissive="#4da6ff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
      {!isDev && !isCloud && <Scatter island={island} />}
    </group>
  )
}

/** Grass tufts, wildflowers and small rocks, kept clear of buildings and bridge entrances. */
function Scatter({ island }: { island: Island }) {
  const tufts = useRef<THREE.InstancedMesh>(null)
  const flowers = useRef<THREE.InstancedMesh>(null)
  const rocks = useRef<THREE.InstancedMesh>(null)
  const r = island.radius
  const data = useMemo(() => {
    const rr = rng(island.id.charCodeAt(0) * 313 + island.id.length)
    const [cx, cz] = island.center
    const free = (x: number, z: number, pad: number) => {
      const wx = cx + x, wz = cz + z
      for (const ob of obstacles) if (Math.hypot(wx - ob.x, wz - ob.z) < ob.r + pad) return false
      for (const isl of islands) {
        if (isl.angle === null) continue
        const dx = Math.cos(isl.angle), dz = Math.sin(isl.angle)
        const along = wx * dx + wz * dz
        const perp = Math.abs(-wx * dz + wz * dx)
        if (along > 0 && along < RING && perp < 2.9) return false
      }
      return true
    }
    const pick = (pad: number, edge: number) => {
      for (let tries = 0; tries < 12; tries++) {
        const a = rr() * Math.PI * 2
        const d = Math.sqrt(rr()) * (r - edge)
        const x = Math.cos(a) * d, z = Math.sin(a) * d
        if (free(x, z, pad)) return [x, z] as const
      }
      return null
    }
    const tuftN = Math.min(240, Math.floor(r * r * 0.4))
    const t: { x: number; z: number; s: number; ry: number; c: THREE.Color }[] = []
    for (let i = 0; i < tuftN; i++) {
      const p = pick(0.9, 1.2)
      if (!p) continue
      for (let k = 0; k < 3; k++) {
        const c = new THREE.Color(island.color).offsetHSL((rr() - 0.5) * 0.04, 0.08, (rr() - 0.35) * 0.16)
        t.push({ x: p[0] + (rr() - 0.5) * 0.3, z: p[1] + (rr() - 0.5) * 0.3, s: 0.6 + rr() * 0.9, ry: rr() * 6, c })
      }
    }
    const fl: { x: number; z: number; s: number; c: THREE.Color }[] = []
    const fcols = ['#ffffff', '#ffd1e8', '#fff2a6', '#c9b5ff']
    for (let i = 0; i < Math.floor(r * r * 0.1); i++) {
      const p = pick(1.0, 1.4)
      if (p) fl.push({ x: p[0], z: p[1], s: 0.7 + rr() * 0.6, c: new THREE.Color(fcols[i % fcols.length]) })
    }
    const rk: { x: number; z: number; s: number; ry: number }[] = []
    for (let i = 0; i < Math.floor(r * 0.5); i++) {
      const p = pick(1.4, 1.0)
      if (p) rk.push({ x: p[0], z: p[1], s: 0.25 + rr() * 0.5, ry: rr() * 6 })
    }
    return { t, fl, rk }
  }, [island, r])

  useLayoutEffect(() => {
    data.t.forEach((b, i) => {
      o.position.set(b.x, 0.2 * b.s, b.z)
      o.rotation.set((b.ry % 1) * 0.3 - 0.15, b.ry, (b.ry % 0.7) * 0.3 - 0.1)
      o.scale.set(b.s, b.s, b.s)
      o.updateMatrix()
      tufts.current?.setMatrixAt(i, o.matrix)
      tufts.current?.setColorAt(i, b.c)
    })
    data.fl.forEach((b, i) => {
      o.position.set(b.x, 0.32 * b.s, b.z)
      o.rotation.set(0, 0, 0)
      o.scale.setScalar(b.s)
      o.updateMatrix()
      flowers.current?.setMatrixAt(i, o.matrix)
      flowers.current?.setColorAt(i, b.c)
    })
    data.rk.forEach((b, i) => {
      o.position.set(b.x, 0.12 * b.s, b.z)
      o.rotation.set(0, b.ry, 0)
      o.scale.set(b.s * 1.3, b.s * 0.8, b.s)
      o.updateMatrix()
      rocks.current?.setMatrixAt(i, o.matrix)
    })
    ;[tufts, flowers, rocks].forEach((m) => {
      if (!m.current) return
      m.current.instanceMatrix.needsUpdate = true
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
    })
  }, [data])

  return (
    <>
      <instancedMesh ref={tufts} args={[undefined, undefined, Math.max(1, data.t.length)]} count={data.t.length}>
        <coneGeometry args={[0.1, 0.65, 4]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, Math.max(1, data.fl.length)]} count={data.fl.length}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial roughness={0.5} emissiveIntensity={0.3} />
      </instancedMesh>
      <instancedMesh ref={rocks} args={[undefined, undefined, Math.max(1, data.rk.length)]} count={data.rk.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#8d89a0" roughness={0.9} flatShading />
      </instancedMesh>
    </>
  )
}

/** Lantern-lit stone walkway with glowing edges, suspended over the void. */
function Bridge({ island }: { island: Island }) {
  const slabs = useRef<THREE.InstancedMesh>(null)
  const posts = useRef<THREE.InstancedMesh>(null)
  const orbs = useRef<THREE.InstancedMesh>(null)
  const a = island.angle ?? 0
  const start = 17
  const end = RING - island.radius + 1
  const len = end - start
  const mid = (start + end) / 2
  const count = Math.floor(len / 1.4)
  const postCount = Math.floor(len / 5) + 1
  useLayoutEffect(() => {
    const m = slabs.current
    if (m) {
      const c = new THREE.Color()
      for (let i = 0; i < count; i++) {
        o.position.set(0, 0, -len / 2 + (i + 0.5) * (len / count))
        o.rotation.set(0, 0, 0)
        o.scale.set(1, 1, 1)
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        c.set(i % 2 ? '#454b63' : '#3b4157').offsetHSL(0, 0, ((i * 37) % 7) * 0.004)
        m.setColorAt(i, c)
      }
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    for (let i = 0; i < postCount; i++) {
      for (let k = 0; k < 2; k++) {
        const s = k ? 1 : -1
        const z = -len / 2 + (i * len) / Math.max(1, postCount - 1)
        o.rotation.set(0, 0, 0)
        o.scale.set(1, 1, 1)
        o.position.set(s * 1.95, 0.7, z)
        o.updateMatrix()
        posts.current?.setMatrixAt(i * 2 + k, o.matrix)
        o.position.set(s * 1.95, 1.55, z)
        o.updateMatrix()
        orbs.current?.setMatrixAt(i * 2 + k, o.matrix)
      }
    }
    ;[posts, orbs].forEach((p) => { if (p.current) p.current.instanceMatrix.needsUpdate = true })
  }, [count, len, postCount])
  const pylons = Math.floor(len / 14)
  return (
    <group position={[Math.cos(a) * mid, 0, Math.sin(a) * mid]} rotation={[0, Math.atan2(Math.cos(a), Math.sin(a)), 0]}>
      <instancedMesh ref={slabs} args={[undefined, undefined, count]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.3, len / count - 0.06]} />
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>
      {/* glowing edge lines */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.82, 0.17, 0]}>
          <boxGeometry args={[0.1, 0.05, len]} />
          <meshStandardMaterial color="#000" emissive="#7ee7ff" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      ))}
      {/* centre keel under the deck */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[1.1, 0.5, len]} />
        <meshStandardMaterial color="#2a2e42" roughness={0.7} />
      </mesh>
      {/* handrails */}
      {[-1, 1].map((s) => (
        <mesh key={`r${s}`} position={[s * 1.95, 1.05, 0]}>
          <boxGeometry args={[0.07, 0.07, len]} />
          <meshStandardMaterial color="#8d93ad" roughness={0.35} metalness={0.5} />
        </mesh>
      ))}
      <instancedMesh ref={posts} args={[undefined, undefined, postCount * 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 1.5, 8]} />
        <meshStandardMaterial color="#2a2e42" roughness={0.5} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={orbs} args={[undefined, undefined, postCount * 2]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color="#ffd9a0" emissive="#ffb866" emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>
      {/* tapered pylons dropping into the void */}
      {Array.from({ length: pylons }).map((_, i) => (
        <mesh key={i} position={[0, -3.2, -len / 2 + ((i + 1) * len) / (pylons + 1)]}>
          <coneGeometry args={[0.9, 5.5, 6]} />
          <meshStandardMaterial color="#3a3350" roughness={0.9} flatShading />
          <mesh position={[0, -2.6, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.18, 0.7, 5]} />
            <meshStandardMaterial color="#7ee7ff" emissive="#7ee7ff" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        </mesh>
      ))}
    </group>
  )
}

export function Trees() {
  const trunk = useRef<THREE.InstancedMesh>(null)
  const c1 = useRef<THREE.InstancedMesh>(null)
  const c2 = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    trees.forEach(([x, z, s], i) => {
      o.rotation.set(0, i, 0)
      o.scale.setScalar(s)
      o.position.set(x, 0.7 * s, z)
      o.updateMatrix()
      trunk.current?.setMatrixAt(i, o.matrix)
      o.position.set(x, 2.0 * s, z)
      o.updateMatrix()
      c1.current?.setMatrixAt(i, o.matrix)
      o.position.set(x, 3.1 * s, z)
      o.scale.setScalar(s * 0.72)
      o.updateMatrix()
      c2.current?.setMatrixAt(i, o.matrix)
    })
    ;[trunk, c1, c2].forEach((r) => { if (r.current) r.current.instanceMatrix.needsUpdate = true })
  }, [])
  const n = trees.length
  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, 1.4, 8]} />
        <meshStandardMaterial color="#7b4b2a" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={c1} args={[undefined, undefined, n]} castShadow>
        <coneGeometry args={[1.25, 2, 8]} />
        <meshStandardMaterial color="#2f8f5b" roughness={0.45} flatShading />
      </instancedMesh>
      <instancedMesh ref={c2} args={[undefined, undefined, n]} castShadow>
        <coneGeometry args={[1.25, 2, 8]} />
        <meshStandardMaterial color="#3aa86c" roughness={0.45} flatShading />
      </instancedMesh>
    </>
  )
}

const waterVert = /* glsl */ `
uniform float uTime;
varying float vH;
varying vec2 vXY;
void main(){
  vec3 p = position;
  float h = sin(p.x*0.09+uTime*0.5)*0.5 + sin(p.y*0.13+uTime*0.4)*0.4 + sin((p.x+p.y)*0.21+uTime*0.9)*0.15;
  p.z += h;
  vH = h;
  vXY = p.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}`
const waterFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uHorizon;
varying float vH;
varying vec2 vXY;
void main(){
  float d = length(vXY);
  vec3 c = mix(uDeep, uShallow, smoothstep(-0.8, 0.9, vH));
  // twinkles on the surface like reflected stars
  float s = sin(vXY.x*1.3+uTime*1.1)*sin(vXY.y*1.1-uTime*0.9);
  c += vec3(0.55, 0.8, 1.0) * smoothstep(0.88, 1.0, s) * 0.5;
  c = mix(c, uHorizon, smoothstep(80.0, 240.0, d));
  gl_FragColor = vec4(c, 1.0);
}`

/** A faintly glowing cosmic sea far below the islands. */
export function Ocean() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color('#0d0a2e') },
    uShallow: { value: new THREE.Color('#3b2a86') },
    uHorizon: { value: new THREE.Color('#3b2468') },
  }), [])
  useFrame((s) => { if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -26, 0]}>
      <planeGeometry args={[800, 800, 120, 120]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={waterVert} fragmentShader={waterFrag} />
    </mesh>
  )
}

/** A soft sea of cloud drifting below and around the islands. */
export function Clouds({ count = 26 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const items = useMemo(() => {
    const arr: { p: THREE.Vector3; s: number }[] = []
    let seed = 5
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      const ang = rnd() * Math.PI * 2
      const rad = 40 + rnd() * 160
      const base = new THREE.Vector3(Math.cos(ang) * rad, -18 + rnd() * 14, Math.sin(ang) * rad)
      const puffs = 4 + Math.floor(rnd() * 3)
      for (let k = 0; k < puffs; k++) {
        arr.push({ p: base.clone().add(new THREE.Vector3((k - puffs / 2) * 5.5 + rnd() * 2, rnd() * 2, rnd() * 6)), s: 6 + rnd() * 6 })
      }
    }
    return arr
  }, [count])
  useLayoutEffect(() => {
    items.forEach((it, i) => {
      o.position.copy(it.p)
      o.scale.set(it.s * 1.5, it.s * 0.55, it.s)
      o.rotation.set(0, 0, 0)
      o.updateMatrix()
      mesh.current?.setMatrixAt(i, o.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  }, [items])
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.006 })
  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, items.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e9dcff" emissive="#5b3a99" emissiveIntensity={0.45} roughness={1} flatShading transparent opacity={0.8} />
      </instancedMesh>
    </group>
  )
}

export function FloatingBricks({ count = 46 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const data = useMemo(() => {
    const colors = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc', '#ffffff']
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, (_, i) => {
      const a = rnd() * Math.PI * 2
      const r = 20 + rnd() * 80
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: 5 + rnd() * 16, ph: rnd() * 6, sp: 0.3 + rnd() * 0.6, c: colors[i % colors.length], s: 0.5 + rnd() * 0.7 }
    })
  }, [count])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    data.forEach((d, i) => { c.set(d.c); mesh.current?.setColorAt(i, c) })
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [data])
  useFrame((s) => {
    const m = mesh.current
    if (!m) return
    const t = s.clock.elapsedTime
    data.forEach((d, i) => {
      o.position.set(d.x, d.y + Math.sin(t * d.sp + d.ph) * 1.2, d.z)
      o.rotation.set(t * d.sp * 0.5 + d.ph, t * d.sp + d.ph, 0)
      o.scale.set(d.s * 1.6, d.s, d.s)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.35} />
    </instancedMesh>
  )
}

export function Terrain() {
  return (
    <>
      {islands.map((i) => <IslandBase key={i.id} island={i} />)}
      {islands.filter((i) => i.angle !== null).map((i) => <Bridge key={i.id} island={i} />)}
      <Trees />
    </>
  )
}
