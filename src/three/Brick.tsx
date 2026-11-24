import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { brickBump, brickColorMap, radialShadow, signTexture, windowTexture } from './textures'

const tmpObj = new THREE.Object3D()

/** A grid of instanced studs; one draw call regardless of count. */
export function Studs({ nx, nz, spacing = 0.9, color, y = 0, radius = 0.24, height = 0.18 }: { nx: number; nz: number; spacing?: number; color: string; y?: number; radius?: number; height?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    let i = 0
    for (let x = 0; x < nx; x++) {
      for (let z = 0; z < nz; z++) {
        tmpObj.position.set((x - (nx - 1) / 2) * spacing, y + height / 2, (z - (nz - 1) / 2) * spacing)
        tmpObj.updateMatrix()
        m.setMatrixAt(i++, tmpObj.matrix)
      }
    }
    m.count = i
    m.instanceMatrix.needsUpdate = true
  }, [nx, nz, spacing, y, height])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, nx * nz)]} castShadow>
      <cylinderGeometry args={[radius, radius, height, 14]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </instancedMesh>
  )
}

export interface BrickBuildingProps {
  w: number
  h: number
  d: number
  color: string
  roofColor?: string
  label?: string
  open?: boolean
  glow?: boolean // proximity highlight
  neon?: string // futuristic trim colour
  progress?: number // 0..1 construction state
  windows?: boolean
  children?: ReactNode
  position?: [number, number, number]
  rotationY?: number
  shadows?: boolean
  assemble?: boolean // animate construction from the ground up on mount
}

const shade = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k).getStyle()

/** Brick-style building: chunky brick courses, base skirt, cornice, framed windows, awning and a swinging door. */
export function BrickBuilding({ w, h, d, color, roofColor, label, open, glow, neon, progress = 1, windows = true, children, position, rotationY = 0, shadows = true, assemble = true }: BrickBuildingProps) {
  const signRef = useRef<THREE.Mesh>(null)
  const door = useRef<THREE.Group>(null)
  const bodyG = useRef<THREE.Group>(null)
  const roofG = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const prog = useRef(assemble ? 0.02 : progress)

  const bump = useMemo(() => {
    const t = brickBump().clone()
    t.repeat.set(Math.max(1, Math.round((w + d) / 6.4)), Math.max(1, Math.round(h / 3.2)))
    t.needsUpdate = true
    return t
  }, [w, d, h])
  const map = useMemo(() => {
    const t = brickColorMap().clone()
    t.repeat.set(Math.max(1, Math.round((w + d) / 6.4)), Math.max(1, Math.round(h / 3.2)))
    t.needsUpdate = true
    return t
  }, [w, d, h])
  const signTex = useMemo(() => (label ? signTexture(label) : null), [label])
  const winTex = useMemo(() => windowTexture(neon), [neon])
  const skirt = useMemo(() => shade(color, 0.68), [color])
  const accent = neon ?? roofColor ?? '#e4572e'
  const doorW = Math.min(1.3, w * 0.45)
  const doorH = Math.min(2, h * 0.6)

  useFrame((s, dt) => {
    const k = 1 - Math.exp(-4.6 * dt)
    if (door.current) door.current.rotation.y += ((open ? -1.75 : 0) - door.current.rotation.y) * (1 - Math.exp(-7 * dt))
    prog.current += (progress - prog.current) * (1 - Math.exp(-1.6 * dt))
    const p = Math.max(0.02, prog.current)
    if (signRef.current) signRef.current.visible = h > 2.6 && prog.current > 0.92 * progress
    if (bodyG.current) bodyG.current.scale.y = p
    if (roofG.current) roofG.current.position.y = h * p
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial
      const target = glow ? 0.55 + Math.sin(s.clock.elapsedTime * 4) * 0.2 : 0
      m.opacity += (target - m.opacity) * k
      ring.current.visible = m.opacity > 0.01
    }
  })

  const nx = Math.max(1, Math.floor(w / 0.9))
  const nz = Math.max(1, Math.floor(d / 0.9))
  const built = progress > 0.98
  const rows = windows && h > 3 ? Math.max(0, Math.floor((h - doorH - 1.9) / 1.3) + 1) : 0
  const sideWin = windows && h > 3 && !neon && w >= 3

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[w * 2.1, d * 2.1]} />
        <meshBasicMaterial map={radialShadow()} transparent depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, d / 2 + 1.1]} visible={false}>
        <ringGeometry args={[0.7, 1.0, 32]} />
        <meshBasicMaterial color={neon ?? '#f6c445'} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* plinth */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow={shadows}>
        <boxGeometry args={[w + 0.6, 0.2, d + 0.6]} />
        <meshStandardMaterial color="#b9b6ad" roughness={0.7} />
      </mesh>
      <group position={[0, 0.2, 0]}>
        <group ref={bodyG}>
          <mesh position={[0, h / 2, 0]} castShadow={shadows} receiveShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={color} map={map} roughness={0.42} metalness={0.02} bumpMap={bump} bumpScale={0.9} />
          </mesh>
          {/* base skirt and cornice */}
          <mesh position={[0, 0.25, 0]} castShadow={shadows}>
            <boxGeometry args={[w + 0.14, 0.5, d + 0.14]} />
            <meshStandardMaterial color={skirt} roughness={0.5} />
          </mesh>
          {!neon && (
            <mesh position={[0, h - 0.09, 0]} castShadow={shadows}>
              <boxGeometry args={[w + 0.2, 0.18, d + 0.2]} />
              <meshStandardMaterial color="#f6f3ea" roughness={0.45} />
            </mesh>
          )}

          {/* door: frame, glowing interior, swinging leaf, awning */}
          <mesh position={[0, doorH / 2 + 0.05, d / 2 + 0.006]}>
            <boxGeometry args={[doorW + 0.24, doorH + 0.14, 0.05]} />
            <meshStandardMaterial color={neon ? '#0b0d14' : '#f6f3ea'} roughness={0.5} />
          </mesh>
          <mesh position={[0, doorH / 2, d / 2 + 0.034]}>
            <planeGeometry args={[doorW, doorH]} />
            <meshStandardMaterial color="#05060a" emissive={neon ?? '#ffb35c'} emissiveIntensity={open ? 1.6 : 0.12} />
          </mesh>
          <group ref={door} position={[-doorW / 2, 0, d / 2 + 0.05]}>
            <mesh position={[doorW / 2, doorH / 2, 0]} castShadow={shadows}>
              <boxGeometry args={[doorW, doorH, 0.08]} />
              <meshStandardMaterial color={neon ? '#1c2438' : '#6b3f24'} roughness={0.45} />
            </mesh>
            <mesh position={[doorW - 0.15, doorH / 2, 0.07]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#f6c445" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
          {h > 2.6 && (
            <mesh position={[0, doorH + 0.32, d / 2 + 0.42]} rotation={[0.42, 0, 0]} castShadow={shadows}>
              <boxGeometry args={[doorW + 0.8, 0.08, 0.95]} />
              <meshStandardMaterial color={accent} roughness={0.4} emissive={neon ? neon : '#000'} emissiveIntensity={neon ? 0.7 : 0} />
            </mesh>
          )}

          {/* front windows */}
          {Array.from({ length: rows }).map((_, row) =>
            [-1, 1].map((sx) => (
              <mesh key={`${row}-${sx}`} position={[sx * Math.max(0.65, w * 0.28), doorH + 1.7 + row * 1.35, d / 2 + 0.016]}>
                <planeGeometry args={[0.72, 0.9]} />
                <meshBasicMaterial map={winTex} transparent toneMapped={false} />
              </mesh>
            )),
          )}
          {/* side windows */}
          {sideWin &&
            [-1, 1].map((sx) => (
              <mesh key={`s${sx}`} position={[sx * (w / 2 + 0.016), Math.min(h - 1, 2.1), 0]} rotation={[0, sx * Math.PI / 2, 0]}>
                <planeGeometry args={[0.72, 0.9]} />
                <meshBasicMaterial map={winTex} transparent toneMapped={false} />
              </mesh>
            ))}

          {neon && (
            <mesh position={[0, h - 0.06, 0]}>
              <boxGeometry args={[w + 0.06, 0.1, d + 0.06]} />
              <meshStandardMaterial color="#000" emissive={neon} emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          )}
        </group>
        <group ref={roofG} position={[0, h, 0]}>
          <mesh position={[0, 0.1, 0]} castShadow={shadows}>
            <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
            <meshStandardMaterial color={roofColor ?? color} roughness={0.32} />
          </mesh>
          {built && <Studs nx={nx} nz={nz} color={roofColor ?? color} y={0.2} />}
          {built && children}
        </group>
      </group>
      {signTex && built && (
        <mesh ref={signRef} position={[0, doorH + 1.0, d / 2 + 0.06]} visible={false}>
          <planeGeometry args={[Math.min(w * 0.95, 3.4), Math.min(w * 0.95, 3.4) / 4]} />
          <meshBasicMaterial map={signTex} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}
