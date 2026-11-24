import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { profile } from '../data/content'
import { playerState } from '../lib/input'
import { useGame } from '../store/game'
import { BrickBuilding } from '../three/Brick'
import { Minifigure, type AnimState } from '../three/Minifigure'
import { signTexture } from '../three/textures'
import { Spinner, useNear } from './common'
import { interactables } from './layout'

function SignalRings() {
  const rings = useRef<(THREE.Mesh | null)[]>([])
  useFrame((s) => {
    rings.current.forEach((m, i) => {
      if (!m) return
      const t = (s.clock.elapsedTime * 0.5 + i / 3) % 1
      m.scale.setScalar(0.5 + t * 4)
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { rings.current[i] = el }} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.04, 6, 40]} />
          <meshBasicMaterial color="#ffb35c" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Goodbye({ position }: { position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null)
  const anim = useRef<AnimState>({ mode: 'wave' })
  const hair = useGame((s) => s.hair)
  useFrame(() => {
    if (!g.current) return
    const dx = playerState.x - position[0]
    const dz = playerState.z - position[2]
    const target = Math.atan2(dx, dz)
    let d = target - g.current.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    g.current.rotation.y += d * 0.08
  })
  return (
    <group ref={g} position={position}>
      <Minifigure anim={anim} hair={hair} scale={1.15} />
    </group>
  )
}

export default function ContactIsland() {
  const it = interactables.find((i) => i.id === 'contact')!
  const { open, glow } = useNear(it.id)
  const front = new THREE.Vector3(Math.sin(it.rotY), 0, Math.cos(it.rotY))
  const right = new THREE.Vector3(Math.cos(it.rotY), 0, -Math.sin(it.rotY))
  const npc = new THREE.Vector3(it.pos[0], 0.3, it.pos[1]).addScaledVector(front, 5.2).addScaledVector(right, 3.4)
  return (
    <group>
      <BrickBuilding position={[it.pos[0], 0, it.pos[1]]} rotationY={it.rotY} w={5} h={4.2} d={4} color="#e8743b" roofColor="#2b3a67" label="CONTACT STATION" open={open} glow={glow}>
        {/* email billboard on the roof */}
        <group position={[0, 1.55, 0.6]}>
          {[-1.7, 1.7].map((x) => <mesh key={x} position={[x, -0.6, 0]}><boxGeometry args={[0.12, 1.3, 0.12]} /><meshStandardMaterial color="#394150" /></mesh>)}
          <mesh><planeGeometry args={[4.2, 1.05]} /><meshBasicMaterial map={signTexture(profile.email, '#ffffff', 'rgba(10,12,20,0.92)', '#f6c445')} transparent toneMapped={false} side={THREE.DoubleSide} /></mesh>
        </group>
        <Spinner speed={0.8} position={[1.2, 0.9, 0]}>
          <mesh rotation={[0.8, 0.6, 0]} castShadow><sphereGeometry args={[0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.3} side={2} /></mesh>
        </Spinner>
        <mesh position={[-1.2, 2.2, -0.4]} castShadow><cylinderGeometry args={[0.08, 0.12, 4.4, 8]} /><meshStandardMaterial color="#c9ccd4" metalness={0.6} roughness={0.3} /></mesh>
        <mesh position={[-1.2, 4.5, -0.4]}><sphereGeometry args={[0.18, 10, 10]} /><meshStandardMaterial color="#000" emissive="#ff3b30" emissiveIntensity={3} toneMapped={false} /></mesh>
        <group position={[-1.2, 4.5, -0.4]}><SignalRings /></group>
      </BrickBuilding>
      <Goodbye position={[npc.x, npc.y, npc.z]} />
      {/* mailbox */}
      <group position={[it.pos[0] + front.x * 4.8 - right.x * 3, 0, it.pos[1] + front.z * 4.8 - right.z * 3]}>
        <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.15, 1, 0.15]} /><meshStandardMaterial color="#7b4b2a" /></mesh>
        <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.7, 0.4, 0.5]} /><meshStandardMaterial color="#4da6ff" roughness={0.3} /></mesh>
        <mesh position={[0.4, 1.3, 0]}><boxGeometry args={[0.04, 0.3, 0.1]} /><meshStandardMaterial color="#e4572e" /></mesh>
      </group>
    </group>
  )
}
