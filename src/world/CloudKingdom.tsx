import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { Bob, Spinner, TechIcon, useNear } from './common'
import { interactables, islandById } from './layout'
import { awsServices } from '../data/content'
import { signTexture } from '../three/textures'

const o = new THREE.Object3D()

function Shape({ id, color }: { id: string; color: string }) {
  const m = (c = color, e = 0.15) => <meshStandardMaterial color={c} roughness={0.3} emissive={c} emissiveIntensity={e} />
  switch (id) {
    case 'lambda':
      return (
        <group>
          <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[1.8, 2, 1.8]} />{m()}</mesh>
          <mesh position={[0, 2.25, 0]}><boxGeometry args={[2, 0.4, 2]} />{m('#ffb84d')}</mesh>
          <TechIcon label="λ" color={color} size={1.6} position={[0, 3.9, 0]} />
        </group>
      )
    case 'apigw':
      return (
        <group>
          {[-1.1, 1.1].map((x) => <mesh key={x} position={[x, 1.4, 0]} castShadow><boxGeometry args={[0.6, 2.8, 0.8]} />{m()}</mesh>)}
          <mesh position={[0, 3, 0]} castShadow><boxGeometry args={[3.2, 0.6, 0.9]} />{m()}</mesh>
          <Spinner speed={1.4} position={[0, 1.4, 0]}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.5, 0.08, 8, 24]} /><meshStandardMaterial color="#000" emissive="#d1b3ff" emissiveIntensity={2} toneMapped={false} /></mesh></Spinner>
          <TechIcon label="API" color={color} size={1.4} position={[0, 4.3, 0]} />
        </group>
      )
    case 's3':
      return (
        <group>
          <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[1.4, 1.0, 2.4, 20]} />{m()}</mesh>
          <mesh position={[0, 2.45, 0]}><cylinderGeometry args={[1.5, 1.5, 0.2, 20]} />{m('#7ee787')}</mesh>
          <TechIcon label="S3" color={color} size={1.4} position={[0, 4, 0]} />
        </group>
      )
    case 'cognito':
      return (
        <group>
          <Spinner speed={0.9} position={[0, 1.9, 0]}><mesh><torusGeometry args={[1.2, 0.28, 12, 32]} />{m()}</mesh></Spinner>
          <mesh position={[0, 1.9, 0]} castShadow><boxGeometry args={[0.9, 0.8, 0.4]} />{m('#ffb3b6')}</mesh>
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.5, 0.8, 1, 12]} />{m('#a62b30')}</mesh>
          <TechIcon label="ID" color={color} size={1.3} position={[0, 4, 0]} />
        </group>
      )
    case 'rds':
      return (
        <group>
          {[0, 1, 2].map((i) => <mesh key={i} position={[0, 0.5 + i * 0.95, 0]} castShadow><cylinderGeometry args={[1.2, 1.2, 0.8, 24]} />{m(i === 1 ? '#8fb4ff' : color)}</mesh>)}
          <TechIcon label="RDS" color={color} size={1.4} position={[0, 4, 0]} />
        </group>
      )
    default:
      return (
        <group>
          <Spinner speed={0.8} position={[0, 2.3, 0]}>
            <mesh><octahedronGeometry args={[0.9]} />{m()}</mesh>
            {[0, 1, 2, 3].map((i) => (
              <Bob key={i} position={[Math.cos((i * Math.PI) / 2) * 1.8, 0, Math.sin((i * Math.PI) / 2) * 1.8]} amp={0.2} phase={i}>
                <mesh castShadow><boxGeometry args={[0.5, 0.5, 0.5]} />{m(['#ff9900', '#a166ff', '#3fb950', '#4d8dff'][i], 0.4)}</mesh>
              </Bob>
            ))}
          </Spinner>
          <TechIcon label="ARCH" color={color} size={1.5} position={[0, 4.5, 0]} />
        </group>
      )
  }
}

function Service({ id, serviceId, pos, rotY }: { id: string; serviceId: string; pos: [number, number]; rotY: number }) {
  const s = awsServices.find((x) => x.id === serviceId)!
  const { glow, open } = useNear(id)
  const g = useRef<THREE.Group>(null)
  const tex = signTexture(s.name, '#fff', 'rgba(10,12,20,0.88)', s.color)
  useFrame((st, dt) => {
    if (!g.current) return
    const target = open ? 1.14 : 1
    g.current.scale.setScalar(g.current.scale.x + (target - g.current.scale.x) * (1 - Math.pow(0.01, dt)))
    g.current.position.y = Math.sin(st.clock.elapsedTime * 1.2 + pos[0]) * 0.15
  })
  return (
    <group position={[pos[0], 0, pos[1]]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.15, 0]} receiveShadow><cylinderGeometry args={[1.9, 2.1, 0.3, 24]} /><meshStandardMaterial color="#eef4ff" roughness={0.6} /></mesh>
      <group ref={g}>
        <Shape id={serviceId} color={s.color} />
      </group>
      <mesh position={[0, 0.5, 2.3]} rotation={[-0.35, 0, 0]}><planeGeometry args={[3, 0.75]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>
      {glow && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.34, 0]}><ringGeometry args={[2.2, 2.45, 40]} /><meshBasicMaterial color={s.color} transparent opacity={0.8} /></mesh>}
    </group>
  )
}

function Monument() {
  const it = interactables.find((i) => i.id === 'cert')!
  const { glow } = useNear('cert')
  const [badge, setBadge] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let alive = true
    new THREE.TextureLoader().load('/aws-badge.png', (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      if (alive) setBadge(t)
    }, undefined, () => { /* badge asset optional */ })
    return () => { alive = false }
  }, [])
  const label = signTexture('AWS Certified Developer - Associate', '#fff', 'rgba(10,12,20,0.9)', '#ff9900')
  return (
    <group position={[it.pos[0], 0, it.pos[1]]} rotation={[0, it.rotY, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.3 + i * 0.6, 0]} castShadow><boxGeometry args={[3.6 - i * 0.7, 0.6, 3.6 - i * 0.7]} /><meshStandardMaterial color={['#eef4ff', '#cfe0ff', '#b5ceff'][i]} roughness={0.4} /></mesh>
      ))}
      <Bob position={[0, 3.6, 0]} amp={0.25} speed={1.4}>
        <Spinner speed={0.7}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[1.35, 1.35, 0.22, 40]} /><meshStandardMaterial color="#ff9900" metalness={0.7} roughness={0.25} emissive="#ff9900" emissiveIntensity={glow ? 0.9 : 0.3} /></mesh>
          {[0.13, -0.13].map((z, i) => (
            <mesh key={i} position={[0, 0, z]} rotation={[0, i ? Math.PI : 0, 0]}>
              <circleGeometry args={[1.12, 40]} />
              <meshBasicMaterial map={badge ?? undefined} color={badge ? '#fff' : '#232f3e'} toneMapped={false} />
            </mesh>
          ))}
        </Spinner>
      </Bob>
      <mesh position={[0, 1.95, 1.9]}><planeGeometry args={[3.4, 0.85]} /><meshBasicMaterial map={label} transparent toneMapped={false} /></mesh>
      <Sparkles count={26} scale={[4, 4, 4]} position={[0, 3.2, 0]} size={4} speed={0.5} color="#ffcf7a" />
    </group>
  )
}

function CloudUnderside() {
  const c = islandById.cloud.center
  const mesh = useRef<THREE.InstancedMesh>(null)
  const n = 22
  useLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 3)
      const r = 6 + (i % 5) * 2
      o.position.set(Math.cos(a) * r, -2.6 - (i % 4) * 0.7, Math.sin(a) * r)
      const s = 3 + (i % 3)
      o.scale.set(s * 1.2, s * 0.6, s)
      o.rotation.set(0, 0, 0)
      o.updateMatrix()
      mesh.current?.setMatrixAt(i, o.matrix)
    }
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} position={[c[0], 0, c[1]]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.95} />
    </instancedMesh>
  )
}

export default function CloudKingdom() {
  return (
    <group>
      <Monument />
      {interactables.filter((i) => i.island === 'cloud' && i.kind === 'aws').map((i) => (
        <Service key={i.id} id={i.id} serviceId={i.ref} pos={i.pos} rotY={i.rotY} />
      ))}
      <CloudUnderside />
    </group>
  )
}
