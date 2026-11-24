import { Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/audio'
import { playerState } from '../lib/input'
import { useGame } from '../store/game'
import { glowTexture } from '../three/textures'
import { goldenBricks } from './layout'

function Gold({ x, z, phase }: { x: number; z: number; phase: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!g.current) return
    const t = s.clock.elapsedTime
    g.current.position.y = 1.3 + Math.sin(t * 2 + phase) * 0.25
    g.current.rotation.y = t * 1.6 + phase
  })
  return (
    <group position={[x, 0, z]}>
      <group ref={g}>
        <mesh castShadow><boxGeometry args={[0.95, 0.55, 0.55]} /><meshStandardMaterial color="#ffc933" metalness={0.85} roughness={0.2} emissive="#ffb300" emissiveIntensity={0.55} /></mesh>
        {[-0.22, 0.22].map((px) => (
          <mesh key={px} position={[px, 0.33, 0]}><cylinderGeometry args={[0.15, 0.15, 0.14, 12]} /><meshStandardMaterial color="#ffc933" metalness={0.85} roughness={0.2} emissive="#ffb300" emissiveIntensity={0.55} /></mesh>
        ))}
        <sprite scale={[2.6, 2.6, 1]}>
          <spriteMaterial map={glowTexture()} color="#ffcc33" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      <Sparkles count={6} scale={[1.6, 2, 1.6]} position={[0, 1.2, 0]} size={3} speed={0.6} color="#ffe28a" />
    </group>
  )
}

function Burst({ x, z, onDone }: { x: number; z: number; onDone: () => void }) {
  const g = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    const k = t.current / 0.9
    if (!g.current) return
    g.current.children.forEach((c, i) => {
      const a = (i / 14) * Math.PI * 2
      const r = k * 2.6
      c.position.set(Math.cos(a) * r, 1.3 + Math.sin(k * Math.PI) * 1.4, Math.sin(a) * r)
      c.scale.setScalar(Math.max(0.01, (1 - k) * 0.22))
      c.rotation.set(k * 8, k * 6, 0)
    })
    if (k >= 1) onDone()
  })
  return (
    <group ref={g} position={[x, 0, z]}>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i}><boxGeometry args={[1, 0.6, 0.6]} /><meshBasicMaterial color={i % 2 ? '#ffd24d' : '#ffffff'} toneMapped={false} /></mesh>
      ))}
    </group>
  )
}

/** Brick Hunter collectibles. Walk into one to collect it. */
export default function GoldenBricks() {
  const collected = useGame((s) => s.bricks)
  const [bursts, setBursts] = useState<{ key: number; x: number; z: number }[]>([])
  const locked = useRef<Set<number>>(new Set())

  useFrame(() => {
    for (const b of goldenBricks) {
      if (locked.current.has(b.id)) {
        if (!useGame.getState().bricks.includes(b.id)) locked.current.delete(b.id)
        continue
      }
      if (collected.includes(b.id)) continue
      const d = Math.hypot(playerState.x - b.pos[0], playerState.z - b.pos[1])
      if (d < 1.6) {
        locked.current.add(b.id)
        sfx.collect()
        useGame.getState().collectBrick(b.id)
        setBursts((s) => [...s, { key: b.id, x: b.pos[0], z: b.pos[1] }])
      }
    }
  })

  return (
    <>
      {goldenBricks.filter((b) => !collected.includes(b.id)).map((b) => <Gold key={b.id} x={b.pos[0]} z={b.pos[1]} phase={b.id} />)}
      {bursts.map((b) => <Burst key={b.key} x={b.x} z={b.z} onDone={() => setBursts((s) => s.filter((q) => q.key !== b.key))} />)}
    </>
  )
}
