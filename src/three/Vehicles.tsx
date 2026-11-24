import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/** Where the rider sits, relative to the vehicle origin (ground level, facing +z). */
export const SEAT = {
  car: { y: 0.3, z: -0.15 },
  bike: { y: 0.5, z: -0.4 },
} as const

type SpeedRef = { v: number }

/** A wheel that spins with the vehicle speed. Axle runs along x. */
function Wheel({ r, w, speed, pos, tire = '#14161d', hub = '#f4f4f2' }: { r: number; w: number; speed: SpeedRef; pos: [number, number, number]; tire?: string; hub?: string }) {
  const spin = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.x += (speed.v * Math.min(dt, 0.05)) / r
  })
  return (
    <group position={pos}>
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[r, r, w, 18]} />
          <meshStandardMaterial color={tire} roughness={0.7} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[r * 0.55, r * 0.55, w + 0.02, 14]} />
          <meshStandardMaterial color={hub} roughness={0.4} />
        </mesh>
        {/* a stripe so the rotation is visible */}
        <mesh position={[0, r * 0.35, 0]}>
          <boxGeometry args={[w + 0.03, r * 0.3, 0.07]} />
          <meshStandardMaterial color="#9aa0ad" />
        </mesh>
      </group>
    </group>
  )
}

export function LegoCar({ speed }: { speed: SpeedRef }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.8, 0.45, 3.4]} /><meshStandardMaterial color="#e4572e" roughness={0.3} /></mesh>
      <mesh position={[0, 0.82, 1.1]} castShadow><boxGeometry args={[1.7, 0.2, 1.2]} /><meshStandardMaterial color="#e4572e" roughness={0.3} /></mesh>
      <mesh position={[0, 0.78, -1.3]} castShadow><boxGeometry args={[1.7, 0.2, 0.8]} /><meshStandardMaterial color="#e4572e" roughness={0.3} /></mesh>
      {/* seat back and dash */}
      <mesh position={[0, 1.0, -0.75]}><boxGeometry args={[1.4, 0.6, 0.22]} /><meshStandardMaterial color="#1c2438" roughness={0.6} /></mesh>
      <mesh position={[0, 0.98, 0.62]}><boxGeometry args={[1.5, 0.3, 0.2]} /><meshStandardMaterial color="#1c2438" roughness={0.6} /></mesh>
      {/* windshield */}
      <mesh position={[0, 1.38, 0.72]} rotation={[-0.4, 0, 0]}><boxGeometry args={[1.6, 0.55, 0.06]} /><meshStandardMaterial color="#cfe8ff" transparent opacity={0.45} roughness={0.1} metalness={0.2} /></mesh>
      {/* studs on the hood */}
      {[-0.45, 0.45].map((x) => [0.8, 1.4].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.96, z]}><cylinderGeometry args={[0.15, 0.15, 0.1, 10]} /><meshStandardMaterial color="#f6c445" roughness={0.3} /></mesh>
      )))}
      {/* lights */}
      {[-0.6, 0.6].map((x) => <mesh key={`h${x}`} position={[x, 0.6, 1.71]}><boxGeometry args={[0.36, 0.2, 0.05]} /><meshStandardMaterial color="#fff" emissive="#ffdca0" emissiveIntensity={2} toneMapped={false} /></mesh>)}
      {[-0.6, 0.6].map((x) => <mesh key={`t${x}`} position={[x, 0.6, -1.71]}><boxGeometry args={[0.36, 0.2, 0.05]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={1.2} toneMapped={false} /></mesh>)}
      {[-0.98, 0.98].flatMap((x) => [-1.15, 1.15].map((z) => <Wheel key={`${x}${z}`} r={0.42} w={0.32} speed={speed} pos={[x, 0.42, z]} />))}
    </group>
  )
}

/** Thin cylinder between two points, used for the bicycle frame. */
function Tube({ a, b, r = 0.045, color = '#e4572e' }: { a: [number, number, number]; b: [number, number, number]; r?: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const l = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, len: l }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 8]} />
      <meshStandardMaterial color={color} roughness={0.35} />
    </mesh>
  )
}

const B = {
  rear: [0, 0.5, -0.85] as [number, number, number],
  front: [0, 0.5, 0.85] as [number, number, number],
  crank: [0, 0.42, -0.1] as [number, number, number],
  seat: [0, 1.02, -0.45] as [number, number, number],
  head: [0, 1.15, 0.65] as [number, number, number],
  bars: [0, 1.28, 0.58] as [number, number, number],
}

export function LegoBike({ speed }: { speed: SpeedRef }) {
  const crank = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (crank.current) crank.current.rotation.x += speed.v * Math.min(dt, 0.05) * 0.9
  })
  const wheel = (z: number) => (
    <group position={[0, 0.5, z]}>
      <Wheel r={0.5} w={0.12} speed={speed} pos={[0, 0, 0]} hub="#1c2438" />
    </group>
  )
  return (
    <group>
      {wheel(-0.85)}
      {wheel(0.85)}
      {/* frame */}
      <Tube a={B.rear} b={B.crank} />
      <Tube a={B.crank} b={B.seat} />
      <Tube a={B.rear} b={B.seat} />
      <Tube a={B.crank} b={B.head} />
      <Tube a={B.seat} b={B.head} />
      <Tube a={B.head} b={B.front} color="#cfd3dc" />
      <Tube a={[-0.4, 1.28, 0.58]} b={[0.4, 1.28, 0.58]} color="#1c2438" r={0.04} />
      <Tube a={B.head} b={B.bars} color="#cfd3dc" />
      {/* saddle */}
      <mesh position={[0, 1.07, -0.5]}><boxGeometry args={[0.32, 0.1, 0.55]} /><meshStandardMaterial color="#1c2438" roughness={0.6} /></mesh>
      {/* basket with a brick */}
      <mesh position={[0, 1.25, 0.95]}><boxGeometry args={[0.5, 0.28, 0.4]} /><meshStandardMaterial color="#f6c445" roughness={0.4} /></mesh>
      {/* cranks and pedals */}
      <group ref={crank} position={B.crank}>
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.12, 0, 0]}>
            <mesh position={[0, -s * 0.14, 0]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshStandardMaterial color="#cfd3dc" /></mesh>
            <mesh position={[s * 0.06, -s * 0.28, 0]}><boxGeometry args={[0.12, 0.04, 0.2]} /><meshStandardMaterial color="#1c2438" /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
