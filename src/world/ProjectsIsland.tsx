import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { projects } from '../data/content'
import { useGame } from '../store/game'
import { BrickBuilding } from '../three/Brick'
import { useNear } from './common'
import { interactables, islandById } from './layout'

function Site({ id, projectId, pos, rotY }: { id: string; projectId: string; pos: [number, number]; rotY: number }) {
  const p = projects.find((x) => x.id === projectId)!
  const { open, glow, active } = useNear(id)
  const built = useGame((s) => s.builtSites.includes(projectId))
  const buildSite = useGame((s) => s.buildSite)
  useEffect(() => {
    if (active) buildSite(projectId)
  }, [active, buildSite, projectId])
  const progress = built || active ? 1 : 0.55
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, rotY, 0]}>
      <BrickBuilding w={4.4} h={5.2} d={4.4} color={p.color} roofColor="#f4f4f4" label={built ? p.name : undefined} open={open} glow={glow} progress={progress} />
      {progress < 0.98 && (
        <mesh position={[0, 3.1, 0]}>
          <boxGeometry args={[5.1, 5.8, 5.1]} />
          <meshBasicMaterial color="#f6c445" wireframe transparent opacity={0.6} />
        </mesh>
      )}
      {progress < 0.98 && (
        <mesh position={[0, 3.9, 2.4]}>
          <planeGeometry args={[3.4, 0.9]} />
          <meshBasicMaterial color="#f6c445" />
        </mesh>
      )}
    </group>
  )
}

function Crane({ position, speed = 0.3, phase = 0 }: { position: [number, number, number]; speed?: number; phase?: number }) {
  const jib = useRef<THREE.Group>(null)
  const hook = useRef<THREE.Group>(null)
  const cable = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime * speed + phase
    if (jib.current) jib.current.rotation.y = Math.sin(t) * 1.4
    const hy = -(2 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 5)
    if (hook.current) hook.current.position.y = hy
    if (cable.current) {
      cable.current.scale.y = -hy
      cable.current.position.y = -hy / 2
    }
  })
  return (
    <group position={position}>
      <mesh position={[0, 5, 0]} castShadow><boxGeometry args={[0.5, 10, 0.5]} /><meshStandardMaterial color="#f6c445" roughness={0.4} /></mesh>
      <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[1.8, 0.6, 1.8]} /><meshStandardMaterial color="#394150" /></mesh>
      <group ref={jib} position={[0, 10, 0]}>
        <mesh position={[3, 0, 0]} castShadow><boxGeometry args={[8, 0.4, 0.4]} /><meshStandardMaterial color="#f6c445" roughness={0.4} /></mesh>
        <mesh position={[-2, 0, 0]} castShadow><boxGeometry args={[2.6, 0.9, 0.9]} /><meshStandardMaterial color="#394150" /></mesh>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.7, 0.8, 0.7]} /><meshStandardMaterial color="#e4572e" /></mesh>
        <group ref={hook} position={[5.5, -4, 0]}>
          <mesh ref={cable}><cylinderGeometry args={[0.03, 0.03, 1, 4]} /><meshBasicMaterial color="#222" /></mesh>
          <mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[0.9, 0.45, 0.6]} /><meshStandardMaterial color="#4da6ff" roughness={0.3} /></mesh>
        </group>
      </group>
    </group>
  )
}

const o = new THREE.Object3D()

/** Bricks that arc from a supply pile to the unfinished buildings. */
function BrickStream({ center }: { center: [number, number] }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const n = 14
  const pile = new THREE.Vector3(0, 0.6, 0)
  const sites = interactables.filter((i) => i.island === 'projects')
  const targets = useRef(sites.map((s) => new THREE.Vector3(s.pos[0] - center[0], 6.4, s.pos[1] - center[1])))
  useLayoutEffect(() => {
    const c = new THREE.Color()
    const cols = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc']
    for (let i = 0; i < n; i++) { c.set(cols[i % cols.length]); mesh.current?.setColorAt(i, c) }
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [])
  useFrame((s) => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < n; i++) {
      const t = (s.clock.elapsedTime * 0.18 + i / n) % 1
      o.position.lerpVectors(pile, targets.current[i % targets.current.length], t)
      o.position.y += Math.sin(t * Math.PI) * 4
      o.rotation.set(t * 6, t * 4, 0)
      o.scale.set(0.7, 0.4, 0.4)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} position={[center[0], 0, center[1]]} castShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.35} />
    </instancedMesh>
  )
}

export default function ProjectsIsland() {
  const c = islandById.projects.center
  return (
    <group>
      {interactables.filter((i) => i.island === 'projects').map((i) => (
        <Site key={i.id} id={i.id} projectId={i.ref} pos={i.pos} rotY={i.rotY} />
      ))}
      <Crane position={[c[0], 0, c[1]]} speed={0.28} />
      <Crane position={[c[0] + 11, 0, c[1] - 6]} speed={0.22} phase={2} />
      {/* brick pile */}
      <group position={[c[0], 0, c[1]]}>
        {[[-0.9, 0.2], [0.9, 0.2], [0, 0.6]].map(([x, y], i) => (
          <mesh key={i} position={[x, y + 0.2, 1.4]} castShadow><boxGeometry args={[1.5, 0.4, 0.8]} /><meshStandardMaterial color={['#e4572e', '#f6c445', '#4da6ff'][i]} /></mesh>
        ))}
        {/* hazard barrier */}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2
          return <mesh key={i} position={[Math.cos(a) * 2.2, 0.3, Math.sin(a) * 2.2]} rotation={[0, -a, 0]}><boxGeometry args={[0.3, 0.6, 0.9]} /><meshStandardMaterial color={i % 2 ? '#f6c445' : '#222'} /></mesh>
        })}
      </group>
      <BrickStream center={c} />
    </group>
  )
}
