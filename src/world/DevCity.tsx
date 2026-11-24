import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { techs } from '../data/content'
import { BrickBuilding } from '../three/Brick'
import { Spinner, TechIcon, useNear } from './common'
import { interactables, islandById } from './layout'

function TechBuilding({ id, techId, h, pos, rotY }: { id: string; techId: string; h: number; pos: [number, number]; rotY: number }) {
  const t = techs.find((x) => x.id === techId)!
  const { open, glow } = useNear(id)
  return (
    <BrickBuilding position={[pos[0], 0, pos[1]]} rotationY={rotY} w={3.2} h={h} d={3.2} color="#1c2438" roofColor={t.color} neon={t.color} label={t.name} open={open} glow={glow}>
      <TechIcon label={t.short} color={t.color} position={[0, 2.2, 0]} />
    </BrickBuilding>
  )
}

function Car({ radius, speed, phase, color }: { radius: number; speed: number; phase: number; color: string }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    const a = s.clock.elapsedTime * speed + phase
    if (g.current) {
      g.current.position.set(Math.cos(a) * radius, 0.35, Math.sin(a) * radius)
      g.current.rotation.y = -a - Math.PI / 2
    }
  })
  return (
    <group ref={g}>
      <mesh castShadow position={[0, 0.2, 0]}><boxGeometry args={[1.5, 0.4, 0.8]} /><meshStandardMaterial color={color} roughness={0.3} /></mesh>
      <mesh castShadow position={[-0.1, 0.55, 0]}><boxGeometry args={[0.8, 0.35, 0.7]} /><meshStandardMaterial color="#cfe8ff" roughness={0.15} metalness={0.3} /></mesh>
      {[-0.5, 0.5].map((x) => [-0.4, 0.4].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 0.14, 10]} /><meshStandardMaterial color="#111" /></mesh>
      )))}
      <mesh position={[0.76, 0.22, 0]}><boxGeometry args={[0.04, 0.12, 0.5]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} /></mesh>
    </group>
  )
}

export default function DevCity() {
  const c = islandById.dev.center
  return (
    <group>
      {interactables.filter((i) => i.island === 'dev').map((i) => (
        <TechBuilding key={i.id} id={i.id} techId={i.ref} h={i.height} pos={i.pos} rotY={i.rotY} />
      ))}
      <group position={[c[0], 0, c[1]]}>
        {/* ring road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[6.2, 8.2, 64]} />
          <meshStandardMaterial color="#20263a" roughness={0.8} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[7.15, 7.25, 64]} />
          <meshBasicMaterial color="#f6c445" />
        </mesh>
        <Car radius={7.2} speed={0.45} phase={0} color="#e4572e" />
        <Car radius={7.2} speed={0.45} phase={2.1} color="#4da6ff" />
        <Car radius={7.2} speed={0.45} phase={4.2} color="#4ade80" />
        {/* holographic core */}
        <Spinner speed={0.7} position={[0, 2.6, 0]}>
          <mesh><torusGeometry args={[1.6, 0.06, 8, 48]} /><meshStandardMaterial color="#000" emissive="#4da6ff" emissiveIntensity={2.5} toneMapped={false} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.3, 0.05, 8, 48]} /><meshStandardMaterial color="#000" emissive="#c084fc" emissiveIntensity={2.5} toneMapped={false} /></mesh>
          <mesh><octahedronGeometry args={[0.6]} /><meshStandardMaterial color="#0b0d14" emissive="#38bdf8" emissiveIntensity={1.4} wireframe toneMapped={false} /></mesh>
        </Spinner>
        <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[1.2, 1.5, 0.4, 24]} /><meshStandardMaterial color="#2a3350" roughness={0.5} /></mesh>
        <pointLight position={[0, 3, 0]} color="#4da6ff" intensity={30} distance={14} />
      </group>
    </group>
  )
}
