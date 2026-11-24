import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useGame } from '../store/game'
import { techTexture } from '../three/textures'
import { interactableById } from './layout'

export function useNear(id: string) {
  const nearby = useGame((s) => s.nearby === id)
  const active = useGame((s) => s.activeId === id)
  return { glow: nearby, open: nearby || active, active }
}

export function Spinner({ speed = 1, children, position, axis = 'y' }: { speed?: number; children: ReactNode; position?: [number, number, number]; axis?: 'y' | 'x' | 'z' }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation[axis] += dt * speed
  })
  return <group ref={g} position={position}>{children}</group>
}

export function Bob({ amp = 0.3, speed = 1.5, children, position, phase = 0 }: { amp?: number; speed?: number; children: ReactNode; position?: [number, number, number]; phase?: number }) {
  const g = useRef<THREE.Group>(null)
  const base = position?.[1] ?? 0
  useFrame((s) => {
    if (g.current) g.current.position.y = base + Math.sin(s.clock.elapsedTime * speed + phase) * amp
  })
  return <group ref={g} position={position}>{children}</group>
}

/** Rotating technology icon: a double-sided textured tile with a soft glow. */
export function TechIcon({ label, color, size = 1.5, position }: { label: string; color: string; size?: number; position: [number, number, number] }) {
  return (
    <Bob position={position} amp={0.2} speed={2} phase={position[0]}>
      <Spinner speed={1.1}>
        <mesh>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={techTexture(label, color)} transparent side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </Spinner>
    </Bob>
  )
}

/** Gabled roof for houses; place as a BrickBuilding child. */
export function Roof({ w, d, color }: { w: number; d: number; color: string }) {
  const R = (w / Math.sqrt(3)) * 1.12
  return (
    <mesh position={[0, 0.25 * R + 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.55]} castShadow>
      <cylinderGeometry args={[R, R, d + 0.6, 3]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  )
}

export function interactableFor(id: string) {
  return interactableById[id]
}
