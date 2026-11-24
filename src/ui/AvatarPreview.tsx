import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Minifigure, type AnimState, type Mode } from '../three/Minifigure'

function Turntable({ anim }: { anim: React.MutableRefObject<AnimState> }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += Math.min(dt, 0.05) * (anim.current.mode === 'walk' ? 0.4 : 0.7)
  })
  return (
    <group ref={g} position={[0, -1.15, 0]}>
      <Minifigure anim={anim} shadows={false} />
    </group>
  )
}

/** Small live preview of the avatar for the settings panel. */
export default function AvatarPreview() {
  const anim = useRef<AnimState>({ mode: 'idle' })
  useEffect(() => {
    const modes: Mode[] = ['idle', 'wave', 'walk', 'idle']
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % modes.length
      anim.current.mode = modes[i]
      anim.current.speed = modes[i] === 'walk' ? 5 : 0
    }, 2600)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="h-56 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b2236] to-[#0d1018]">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.6, 6.4], fov: 30 }} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0.35, 0)}>
        <hemisphereLight args={['#dbeafe', '#3b4256', 1.1]} />
        <directionalLight position={[3, 5, 4]} intensity={2.4} color="#fff1dd" />
        <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#7db4ff" />
        <Turntable anim={anim} />
      </Canvas>
    </div>
  )
}
