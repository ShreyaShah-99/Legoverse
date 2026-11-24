import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BrickBuilding } from '../three/Brick'
import { Spinner, useNear } from './common'
import { interactables, islandById } from './layout'
import { achievementList, experienceAreas } from '../data/content'
import { useGame } from '../store/game'

const o = new THREE.Object3D()
const TRACK_R = 8.6

function Track() {
  const sleepers = useRef<THREE.InstancedMesh>(null)
  const n = 56
  useLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      o.position.set(Math.cos(a) * TRACK_R, 0.06, Math.sin(a) * TRACK_R)
      o.rotation.set(0, -a, 0)
      o.updateMatrix()
      sleepers.current?.setMatrixAt(i, o.matrix)
    }
    if (sleepers.current) sleepers.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <instancedMesh ref={sleepers} args={[undefined, undefined, n]} receiveShadow>
        <boxGeometry args={[0.3, 0.1, 1.5]} />
        <meshStandardMaterial color="#6b4a2c" roughness={0.8} />
      </instancedMesh>
      {[-0.55, 0.55].map((d) => (
        <mesh key={d} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
          <torusGeometry args={[TRACK_R + d, 0.06, 6, 96]} />
          <meshStandardMaterial color="#c9ccd4" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

const CAR_COLORS = ['#e4572e', '#4da6ff', '#4ade80', '#c084fc', '#f6c445']

function Train() {
  const cars = useRef<(THREE.Group | null)[]>([])
  useFrame((s) => {
    const base = s.clock.elapsedTime * 0.3
    cars.current.forEach((g, i) => {
      if (!g) return
      const a = base - i * 0.2
      g.position.set(Math.cos(a) * TRACK_R, 0.2, Math.sin(a) * TRACK_R)
      g.rotation.y = -a - Math.PI / 2 // local +x is forward
    })
  })
  return (
    <group>
      {CAR_COLORS.map((c, i) => (
        <group key={i} ref={(el) => { cars.current[i] = el }}>
          {i === 0 ? (
            <>
              <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.9, 0.9, 1]} /><meshStandardMaterial color={c} roughness={0.3} /></mesh>
              <mesh position={[-0.5, 1.1, 0]} castShadow><boxGeometry args={[0.9, 0.5, 0.9]} /><meshStandardMaterial color="#222a3a" /></mesh>
              <mesh position={[0.6, 1.1, 0]} castShadow><cylinderGeometry args={[0.18, 0.22, 0.6, 10]} /><meshStandardMaterial color="#222a3a" /></mesh>
              <mesh position={[0.97, 0.4, 0]}><boxGeometry args={[0.05, 0.2, 0.4]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} /></mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[1.7, 0.7, 1]} /><meshStandardMaterial color={c} roughness={0.3} /></mesh>
              <mesh position={[0, 0.9, 0]}><boxGeometry args={[1.5, 0.12, 0.85]} /><meshStandardMaterial color="#f4f4f4" /></mesh>
            </>
          )}
          {[-0.55, 0.55].map((x) => [-0.5, 0.5].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.08, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.1, 10]} /><meshStandardMaterial color="#111" /></mesh>
          )))}
        </group>
      ))}
    </group>
  )
}

function Station({ id, areaId, pos, rotY, index }: { id: string; areaId: string; pos: [number, number]; rotY: number; index: number }) {
  const a = experienceAreas.find((x) => x.id === areaId)!
  const { open, glow } = useNear(id)
  const colors = ['#d4a017', '#2f6fb5', '#2e8b6a', '#8b5cc4', '#c25b3a', '#c2487d', '#3a8fa3']
  return (
    <BrickBuilding position={[pos[0], 0, pos[1]]} rotationY={rotY} w={2.8} h={3.2} d={2.6} color={colors[index % colors.length]} roofColor="#f4f4f4" label={a.name} open={open} glow={glow} neon={index === 0 ? '#f6c445' : undefined} />
  )
}

function Tower() {
  const it = interactables.find((i) => i.id === 'achievements')!
  const { open, glow } = useNear(it.id)
  const unlocked = useGame((s) => s.achievements)
  return (
    <BrickBuilding position={[it.pos[0], 0, it.pos[1]]} rotationY={it.rotY} w={5} h={3.2} d={5} color="#2d3350" roofColor="#f6c445" neon="#f6c445" label="ACHIEVEMENT TOWER" open={open} glow={glow}>
      {achievementList.map((a, i) => {
        const on = unlocked.includes(a.id)
        return (
          <group key={a.id} position={[0, 0.2 + i * 1.5 + 0.75, 0]}>
            <mesh castShadow><cylinderGeometry args={[1.9 - i * 0.2, 2.05 - i * 0.2, 1.4, 20]} /><meshStandardMaterial color="#394067" roughness={0.4} /></mesh>
            <mesh><cylinderGeometry args={[1.95 - i * 0.2, 1.95 - i * 0.2, 0.18, 20]} /><meshStandardMaterial color="#000" emissive={on ? '#f6c445' : '#3a3f55'} emissiveIntensity={on ? 2.2 : 0.4} toneMapped={false} /></mesh>
          </group>
        )
      })}
      <Spinner speed={1.2} position={[0, 0.2 + achievementList.length * 1.5 + 0.9, 0]}>
        <mesh castShadow><octahedronGeometry args={[0.7]} /><meshStandardMaterial color="#f6c445" metalness={0.8} roughness={0.2} emissive="#f6c445" emissiveIntensity={0.6} /></mesh>
      </Spinner>
    </BrickBuilding>
  )
}

export default function ExperienceIsland() {
  const c = islandById.experience.center
  return (
    <group>
      <group position={[c[0], 0, c[1]]}>
        <Track />
        <Train />
      </group>
      <Tower />
      {interactables.filter((i) => i.kind === 'exp').map((i, idx) => (
        <Station key={i.id} id={i.id} areaId={i.ref} pos={i.pos} rotY={i.rotY} index={idx} />
      ))}
    </group>
  )
}
