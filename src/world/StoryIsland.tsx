import { Sparkles } from '@react-three/drei'
import { BrickBuilding } from '../three/Brick'
import { signTexture } from '../three/textures'
import { Bob, Roof, Spinner, useNear } from './common'
import { decorHouses, interactableById } from './layout'

function DevHouse() {
  const it = interactableById['story-house']
  const { open, glow } = useNear(it.id)
  return (
    <BrickBuilding position={[it.pos[0], 0, it.pos[1]]} rotationY={it.rotY} w={6} h={3.6} d={5} color="#e4572e" roofColor="#3b2a1d" label="DEVELOPER HOUSE" open={open} glow={glow}>
      <Roof w={6} d={5} color="#2d3340" />
      {/* chimney */}
      <mesh position={[1.7, 2.4, -1]} castShadow><boxGeometry args={[0.7, 1.6, 0.7]} /><meshStandardMaterial color="#9a3b1f" roughness={0.5} /></mesh>
      {/* satellite dish */}
      <Spinner speed={0.6} position={[-1.6, 2.9, 0.4]}>
        <mesh rotation={[0.9, 0, 0]} castShadow><sphereGeometry args={[0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.4} side={2} /></mesh>
      </Spinner>
      <Sparkles count={10} scale={[3, 2, 3]} position={[0, 4, 0]} size={3} speed={0.4} color="#ffd88a" />
    </BrickBuilding>
  )
}

function Arcade() {
  const it = interactableById['arcade']
  const { open, glow } = useNear(it.id)
  return (
    <BrickBuilding position={[it.pos[0], 0, it.pos[1]]} rotationY={it.rotY} w={5} h={3.6} d={4} color="#5b34c9" roofColor="#2a1a6b" neon="#ff3df2" label="BRICK ARCADE" open={open} glow={glow}>
      <Bob position={[0, 1.7, 0]} amp={0.15}>
        <Spinner speed={2}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.8, 0.8, 0.16, 28]} /><meshStandardMaterial color="#f6c445" metalness={0.8} roughness={0.25} emissive="#f6c445" emissiveIntensity={0.35} /></mesh>
        </Spinner>
      </Bob>
      <pointLight color="#ff3df2" intensity={6} distance={9} position={[0, 1, 2]} />
    </BrickBuilding>
  )
}

function Sculpture() {
  const cols = ['#e4572e', '#f6c445', '#4da6ff']
  return (
    <group>
      <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[2.4, 2.6, 0.3, 40]} /><meshStandardMaterial color="#c9ccd4" roughness={0.6} /></mesh>
      <Spinner speed={0.5} position={[0, 0.3, 0]}>
        {cols.map((c, i) => (
          <mesh key={i} position={[0, 0.4 + i * 0.75, 0]} rotation={[0, i * 0.5, 0]} castShadow>
            <boxGeometry args={[1.8 - i * 0.3, 0.7, 1.2 - i * 0.1]} />
            <meshStandardMaterial color={c} roughness={0.3} />
          </mesh>
        ))}
      </Spinner>
      <Bob position={[0, 3.2, 0]} amp={0.2}>
        <Spinner speed={1.5}>
          <mesh castShadow><boxGeometry args={[0.7, 0.4, 0.4]} /><meshStandardMaterial color="#f6c445" metalness={0.7} roughness={0.25} emissive="#f6c445" emissiveIntensity={0.4} /></mesh>
        </Spinner>
      </Bob>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.7, 2.8, 48]} />
        <meshBasicMaterial color="#f6c445" />
      </mesh>
    </group>
  )
}

function SignPost() {
  const tex = signTexture('Explore the islands ->', '#fff', 'rgba(10,12,20,0.9)')
  return (
    <group position={[3.2, 0, 6]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[0.2, 1.8, 0.2]} /><meshStandardMaterial color="#7b4b2a" /></mesh>
      <mesh position={[0, 1.8, 0.12]}><planeGeometry args={[2.4, 0.6]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>
    </group>
  )
}

export default function StoryIsland() {
  return (
    <group>
      <Sculpture />
      <DevHouse />
      <Arcade />
      <SignPost />
      {decorHouses.map((h, i) => {
        const roof = ['#b5442a', '#2f5d8a', '#4a3b6b'][i % 3]
        return (
          <BrickBuilding key={i} position={[h.pos[0], 0, h.pos[1]]} rotationY={h.rotY} w={h.w} h={h.h + 0.6} d={h.d} color={h.color} roofColor={roof}>
            <Roof w={h.w} d={h.d} color={roof} />
            <mesh position={[(i % 2 ? -1 : 1) * 0.9, 1.3, -0.6]} castShadow><boxGeometry args={[0.5, 1.3, 0.5]} /><meshStandardMaterial color="#8a3d24" roughness={0.55} /></mesh>
          </BrickBuilding>
        )
      })}
    </group>
  )
}
