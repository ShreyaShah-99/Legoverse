import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { brickBump } from '../three/textures'
import { islands, RING, trees, type Island } from './layout'

const o = new THREE.Object3D()

function IslandBase({ island }: { island: Island }) {
  const studs = useRef<THREE.InstancedMesh>(null)
  const r = island.radius
  const positions = useMemo(() => {
    const p: [number, number][] = []
    const sp = 1.6
    for (let x = -r; x <= r; x += sp) {
      for (let z = -r; z <= r; z += sp) {
        if (Math.hypot(x, z) < r - 0.9) p.push([x, z])
      }
    }
    return p
  }, [r])
  useLayoutEffect(() => {
    const m = studs.current
    if (!m) return
    positions.forEach(([x, z], i) => {
      o.position.set(x, 0.07, z)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [positions])
  const bump = useMemo(() => {
    const t = brickBump().clone()
    t.repeat.set(r * 1.4, 1.6)
    t.needsUpdate = true
    return t
  }, [r])
  const isCloud = island.id === 'cloud'
  const isDev = island.id === 'dev'
  const top = useMemo(() => new THREE.Color(island.color), [island.color])
  const stud = useMemo(() => top.clone().offsetHSL(0, 0, 0.05), [top])
  return (
    <group position={[island.center[0], 0, island.center[1]]}>
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[r, r, 0.5, 64]} />
        <meshStandardMaterial color={top} roughness={0.5} />
      </mesh>
      <mesh position={[0, -2.2, 0]} receiveShadow>
        <cylinderGeometry args={[r * 0.99, r * 0.78, 3.4, 64]} />
        <meshStandardMaterial color={isCloud ? '#dbe8f7' : '#5b6578'} roughness={0.6} bumpMap={bump} bumpScale={0.8} />
      </mesh>
      {/* coloured rim band like a stacked plate edge */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[r + 0.04, r + 0.04, 0.34, 64]} />
        <meshStandardMaterial color={top.clone().multiplyScalar(0.62)} roughness={0.45} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[r * 0.995, r * 0.97, 0.3, 64]} />
        <meshStandardMaterial color={isCloud ? '#f4f8ff' : '#eceae2'} roughness={0.5} />
      </mesh>
      <instancedMesh ref={studs} args={[undefined, undefined, positions.length]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.14, 10]} />
        <meshStandardMaterial color={stud} roughness={0.5} />
      </instancedMesh>
      {isDev && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 1.2, r - 0.9, 96]} />
          <meshStandardMaterial color="#000" emissive="#4da6ff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

function Bridge({ island }: { island: Island }) {
  const planks = useRef<THREE.InstancedMesh>(null)
  const a = island.angle ?? 0
  const start = 17
  const end = RING - island.radius + 1
  const len = end - start
  const mid = (start + end) / 2
  const count = Math.floor(len / 1.1)
  useLayoutEffect(() => {
    const m = planks.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, -len / 2 + (i + 0.5) * (len / count))
      o.scale.set(1, 1, 1)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      c.set(i % 2 ? '#a77b4b' : '#8e6a3f')
      m.setColorAt(i, c)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count, len])
  return (
    <group position={[Math.cos(a) * mid, 0, Math.sin(a) * mid]} rotation={[0, Math.atan2(Math.cos(a), Math.sin(a)), 0]}>
      <instancedMesh ref={planks} args={[undefined, undefined, count]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.3, len / count - 0.08]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.95, 0.45, 0]} castShadow>
          <boxGeometry args={[0.18, 0.18, len]} />
          <meshStandardMaterial color="#e4572e" roughness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(len / 3) + 1 }).map((_, i) => [-1, 1].map((s) => (
        <mesh key={`${i}${s}`} position={[s * 1.95, 0.25, -len / 2 + i * 3]} castShadow>
          <boxGeometry args={[0.24, 0.6, 0.24]} />
          <meshStandardMaterial color="#f6c445" roughness={0.4} />
        </mesh>
      )))}
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
  float h = sin(p.x*0.09+uTime*0.8)*0.35 + sin(p.y*0.13+uTime*0.6)*0.3 + sin((p.x+p.y)*0.21+uTime*1.3)*0.12;
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
  vec3 c = mix(uDeep, uShallow, smoothstep(-0.6, 0.7, vH));
  float s = sin(vXY.x*0.9+uTime*1.5)*sin(vXY.y*0.8-uTime*1.2);
  c += smoothstep(0.82, 1.0, s) * 0.18;
  c = mix(c, uHorizon, smoothstep(90.0, 260.0, d));
  gl_FragColor = vec4(c, 1.0);
}`

export function Ocean() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color('#1c6fa8') },
    uShallow: { value: new THREE.Color('#58c3e6') },
    uHorizon: { value: new THREE.Color('#bcd8f0') },
  }), [])
  useFrame((s) => { if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
      <planeGeometry args={[700, 700, 140, 140]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={waterVert} fragmentShader={waterFrag} />
    </mesh>
  )
}

export function Clouds({ count = 26 }: { count?: number }) {
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const items = useMemo(() => {
    const arr: { p: THREE.Vector3; s: number }[] = []
    let seed = 5
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) {
      const ang = rnd() * Math.PI * 2
      const rad = 85 + rnd() * 120
      const base = new THREE.Vector3(Math.cos(ang) * rad, 8 + rnd() * 26, Math.sin(ang) * rad)
      const puffs = 4 + Math.floor(rnd() * 3)
      for (let k = 0; k < puffs; k++) {
        arr.push({ p: base.clone().add(new THREE.Vector3((k - puffs / 2) * 4.5 + rnd() * 2, rnd() * 2, rnd() * 5)), s: 4 + rnd() * 4 })
      }
    }
    return arr
  }, [count])
  useLayoutEffect(() => {
    items.forEach((it, i) => {
      o.position.copy(it.p)
      o.scale.set(it.s * 1.3, it.s * 0.7, it.s)
      o.rotation.set(0, 0, 0)
      o.updateMatrix()
      mesh.current?.setMatrixAt(i, o.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  }, [items])
  useFrame((_, dt) => { if (group.current) group.current.rotation.y += dt * 0.004 })
  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, items.length]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.92} />
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
