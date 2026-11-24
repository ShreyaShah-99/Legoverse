import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { forwardRef, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { OUTFITS } from '../data/outfits'
import { useGame, type Hair } from '../store/game'
import { faceTexture, hoodiePrint } from './textures'

export type Mode = 'idle' | 'walk' | 'run' | 'jump' | 'wave' | 'interact'
export interface AnimState {
  mode: Mode
  /** Horizontal speed in world units per second. Drives stride frequency and amplitude. */
  speed?: number
  /** Head yaw relative to the body (radians). Undefined = idle glance around. */
  look?: number
  /** Vertical velocity, used to pose the jump. */
  vy?: number
}

interface Props {
  anim: MutableRefObject<AnimState>
  hair?: Hair
  scale?: number
  shadows?: boolean
}

const SKIN = '#f6c445'
const HAIR = '#3a2417'
const clamp = THREE.MathUtils.clamp
const lerp = THREE.MathUtils.lerp
const damp = THREE.MathUtils.damp

/** Glossy moulded-plastic material. */
function P({ c, r = 0.3, cc = 0.55, e, ei = 0.8, m = 0 }: { c: string; r?: number; cc?: number; e?: string; ei?: number; m?: number }) {
  return <meshPhysicalMaterial color={c} roughness={r} metalness={m} clearcoat={cc} clearcoatRoughness={0.25} emissive={e ?? '#000000'} emissiveIntensity={e ? ei : 0} />
}

function Box({ size, pos, rot, c, radius = 0.05, shadows, r, e }: { size: [number, number, number]; pos?: [number, number, number]; rot?: [number, number, number]; c: string; radius?: number; shadows?: boolean; r?: number; e?: string }) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} position={pos} rotation={rot} castShadow={shadows}>
      <P c={c} r={r} e={e} />
    </RoundedBox>
  )
}

/** Original brick-style female minifigure with a developer outfit. */
export const Minifigure = forwardRef<THREE.Group, Props>(function Minifigure({ anim, hair: hairProp, scale = 1, shadows = true }, ref) {
  const storeHair = useGame((s) => s.hair)
  const outfit = OUTFITS[useGame((s) => s.outfit)]
  const glasses = useGame((s) => s.glasses)
  const hair = hairProp ?? storeHair

  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Mesh>(null)
  const eyeR = useRef<THREE.Mesh>(null)
  const laptop = useRef<THREE.Group>(null)
  const clock = useRef({ t: 0, phase: 0, blinkAt: 2.5, blink: 0 })
  const w = useRef({ walk: 0, jump: 0, wave: 0, interact: 0, look: 0, lean: 0 })

  const face = useMemo(faceTexture, [])
  const print = useMemo(hoodiePrint, [])
  const hoodieDark = useMemo(() => new THREE.Color(outfit.hoodie).multiplyScalar(0.8).getStyle(), [outfit.hoodie])
  const packDark = useMemo(() => new THREE.Color(outfit.pack).multiplyScalar(0.75).getStyle(), [outfit.pack])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const A = anim.current
    const S = w.current
    const C = clock.current
    C.t += dt
    const mode = A.mode
    const walking = mode === 'walk' || mode === 'run'
    const speed = A.speed ?? (mode === 'run' ? 10.5 : mode === 'walk' ? 6 : 0)
    const moveAmt = walking ? clamp((speed - 1.5) / 9, 0, 1) : 0

    // Smoothly blend between poses; oscillations are computed after blending so they stay crisp.
    S.walk = damp(S.walk, walking ? 1 : 0, 12, dt)
    S.jump = damp(S.jump, mode === 'jump' ? 1 : 0, 16, dt)
    S.wave = damp(S.wave, mode === 'wave' ? 1 : 0, 9, dt)
    S.interact = damp(S.interact, mode === 'interact' ? 1 : 0, 10, dt)
    if (walking) C.phase += dt * (speed * 1.3 + 0.5)
    const p = C.phase
    const t = C.t
    const amp = 0.45 + moveAmt * 0.55
    const sw = Math.sin(p) * amp * S.walk

    const up = clamp((A.vy ?? 0) / 9, -1, 1) * 0.5 + 0.5 // 1 rising, 0 falling
    const jl = lerp(0.15, 0.6, up)
    const jr = lerp(0.15, -0.4, up)
    const jarm = lerp(1.1, 2.7, up)
    const idle = 1 - Math.max(S.walk, S.jump, S.wave, S.interact)

    if (legL.current) legL.current.rotation.x = sw + S.jump * jl
    if (legR.current) legR.current.rotation.x = -sw + S.jump * jr
    if (armL.current) {
      armL.current.rotation.x = -sw * 0.9 - S.interact * 1.25 + Math.sin(t * 1.5) * 0.05 * idle
      armL.current.rotation.z = -S.jump * jarm * 0.9
    }
    if (armR.current) {
      armR.current.rotation.x = sw * 0.9 - S.interact * 1.25 - Math.sin(t * 1.5) * 0.05 * idle
      armR.current.rotation.z = S.jump * jarm + S.wave * (2.5 + Math.sin(t * 9) * 0.35)
    }

    S.lean = damp(S.lean, S.walk * (0.05 + moveAmt * 0.2) + S.interact * 0.08 - S.jump * 0.04, 10, dt)
    if (body.current) {
      body.current.position.y = S.walk * Math.abs(Math.cos(p)) * (0.04 + moveAmt * 0.08) + Math.sin(t * 2) * 0.02 * idle + Math.sin(t * 3) * 0.02 * S.wave
      body.current.rotation.x = S.lean
      body.current.rotation.y = Math.sin(p) * 0.09 * moveAmt * S.walk + Math.sin(t * 3) * 0.05 * S.wave
      body.current.rotation.z = Math.cos(p) * 0.03 * moveAmt * S.walk
    }

    // Head glances around when idle, otherwise tracks whatever the player is near.
    const glance = mode === 'idle' ? Math.sin(t * 0.55) * 0.35 * Math.max(0, Math.sin(t * 0.23)) : 0
    const lookTarget = clamp(A.look ?? glance, -0.9, 0.9)
    S.look = damp(S.look, lookTarget, 6, dt)
    if (head.current) {
      head.current.rotation.y = S.look
      head.current.rotation.x = -S.lean * 0.6 + Math.sin(t * 1.3) * 0.015
      head.current.rotation.z = Math.sin(t * 1.2) * 0.025 + S.wave * 0.08
    }

    // Blink.
    if (t > C.blinkAt) {
      C.blink = 0.14
      C.blinkAt = t + 2 + Math.random() * 3.2
    }
    C.blink = Math.max(0, C.blink - dt)
    const open = C.blink > 0 ? 0.08 : 1
    ;[eyeL.current, eyeR.current].forEach((e) => { if (e) e.scale.y = damp(e.scale.y, 1.25 * open, 40, dt) })

    // Ponytail swing.
    if (tail.current) {
      tail.current.rotation.x = 0.25 + Math.sin(p * 1.0 + 1) * 0.28 * S.walk + Math.sin(t * 2) * 0.05
      tail.current.rotation.z = Math.sin(p * 0.5) * 0.18 * S.walk
    }

    // Laptop opens while interacting.
    if (laptop.current) {
      const s = S.interact
      laptop.current.scale.setScalar(Math.max(0.0001, s))
      laptop.current.position.y = 1.2 + Math.sin(t * 3) * 0.02
    }
  })

  const hairMat = <P c={HAIR} r={0.4} cc={0.35} />

  return (
    <group ref={ref} scale={scale}>
      <group ref={body}>
        {/* legs and sneakers */}
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? legL : legR} position={[s * 0.21, 0.62, 0]}>
            <Box size={[0.38, 0.6, 0.42]} pos={[0, -0.31, 0]} c={outfit.pants} radius={0.04} shadows={shadows} />
            <Box size={[0.4, 0.15, 0.56]} pos={[0, -0.56, 0.07]} c="#f4f4f2" radius={0.06} shadows={shadows} r={0.45} />
            <mesh position={[0, -0.63, 0.07]}><boxGeometry args={[0.41, 0.045, 0.57]} /><P c={outfit.pack} /></mesh>
            <mesh position={[0, -0.52, 0.3]}><boxGeometry args={[0.3, 0.05, 0.1]} /><P c="#d8dbe3" /></mesh>
          </group>
        ))}
        <Box size={[0.84, 0.17, 0.46]} pos={[0, 0.66, 0]} c={outfit.pants} radius={0.04} shadows={shadows} />
        <mesh position={[0, 0.7, 0]}><boxGeometry args={[0.86, 0.04, 0.48]} /><P c="#1b1d26" /></mesh>

        {/* hoodie torso */}
        <Box size={[0.92, 0.84, 0.52]} pos={[0, 1.1, 0]} c={outfit.hoodie} radius={0.07} shadows={shadows} />
        <mesh position={[0, 1.22, 0.262]}>
          <planeGeometry args={[0.42, 0.42]} />
          <meshBasicMaterial map={print} transparent toneMapped={false} />
        </mesh>
        <Box size={[0.62, 0.2, 0.05]} pos={[0, 0.86, 0.27]} c={hoodieDark} radius={0.025} />
        {[-0.12, 0.12].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.38, 0.268]}><boxGeometry args={[0.03, 0.22, 0.03]} /><P c="#f4f4f2" /></mesh>
            <mesh position={[x, 1.26, 0.268]}><boxGeometry args={[0.05, 0.05, 0.05]} /><P c="#f4f4f2" /></mesh>
          </group>
        ))}
        {/* hood resting on the back */}
        <Box size={[0.66, 0.24, 0.2]} pos={[0, 1.47, -0.26]} rot={[0.3, 0, 0]} c={hoodieDark} radius={0.07} shadows={shadows} />
        {/* lanyard and ID badge */}
        <mesh position={[0.21, 1.33, 0.266]} rotation={[0, 0, 0.475]}><boxGeometry args={[0.035, 0.42, 0.012]} /><P c="#1c2233" /></mesh>
        <Box size={[0.17, 0.24, 0.02]} pos={[0.3, 1.05, 0.275]} c="#f4f4f2" radius={0.012} />
        <mesh position={[0.3, 1.11, 0.289]}><boxGeometry args={[0.13, 0.06, 0.005]} /><P c="#38bdf8" e="#38bdf8" ei={0.5} /></mesh>

        {/* arms */}
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.6, 1.46, 0]}>
            <Box size={[0.26, 0.6, 0.3]} pos={[0, -0.29, 0]} c={outfit.hoodie} radius={0.05} shadows={shadows} />
            <mesh position={[0, -0.55, 0]}><boxGeometry args={[0.28, 0.08, 0.32]} /><P c={hoodieDark} /></mesh>
            <mesh position={[0, -0.67, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={shadows}><cylinderGeometry args={[0.13, 0.13, 0.18, 16]} /><P c={SKIN} r={0.28} /></mesh>
          </group>
        ))}

        {/* backpack, straps and bottle */}
        <group position={[0, 1.02, -0.4]}>
          <Box size={[0.72, 0.74, 0.28]} c={outfit.pack} radius={0.06} shadows={shadows} />
          <Box size={[0.74, 0.22, 0.3]} pos={[0, 0.3, 0]} c={packDark} radius={0.05} />
          <Box size={[0.5, 0.3, 0.06]} pos={[0, -0.12, -0.16]} c={packDark} radius={0.03} />
          <mesh position={[0, -0.12, -0.195]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.2, 0.2]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
          <mesh position={[0.43, -0.12, 0]} castShadow={shadows}><cylinderGeometry args={[0.08, 0.08, 0.42, 12]} /><P c="#e5e7eb" m={0.4} r={0.2} /></mesh>
        </group>
        {[-0.3, 0.3].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.53, -0.02]}><boxGeometry args={[0.11, 0.05, 0.62]} /><P c="#1c2233" /></mesh>
            <mesh position={[x, 1.2, 0.272]}><boxGeometry args={[0.11, 0.62, 0.025]} /><P c="#1c2233" /></mesh>
          </group>
        ))}

        {/* head */}
        <group ref={head} position={[0, 1.52, 0]}>
          <mesh position={[0, 0.25, 0]} castShadow={shadows}><cylinderGeometry args={[0.4, 0.4, 0.5, 32]} /><P c={SKIN} r={0.25} cc={0.7} /></mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.402, 0.402, 0.5, 32, 1, true, -0.95, 1.9]} />
            <meshBasicMaterial map={face} transparent depthWrite={false} toneMapped={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.14, 0.31, 0.385]}>
              <mesh ref={s < 0 ? eyeL : eyeR} scale={[1, 1.25, 0.5]}><sphereGeometry args={[0.05, 14, 14]} /><meshStandardMaterial color="#14100e" roughness={0.2} /></mesh>
              <mesh position={[0.015 * s, 0.025, 0.02]}><sphereGeometry args={[0.014, 8, 8]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
            </group>
          ))}
          {glasses && (
            <group position={[0, 0.31, 0.43]}>
              {[-1, 1].map((s) => (
                <group key={s} position={[s * 0.14, 0, 0]}>
                  <mesh><torusGeometry args={[0.108, 0.015, 8, 32]} /><P c="#1c2233" m={0.5} r={0.3} /></mesh>
                  <mesh position={[0, 0, -0.004]}><circleGeometry args={[0.1, 24]} /><meshBasicMaterial color="#8fd3ff" transparent opacity={0.14} depthWrite={false} /></mesh>
                </group>
              ))}
              <mesh><boxGeometry args={[0.08, 0.016, 0.016]} /><P c="#1c2233" m={0.5} /></mesh>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.255, 0, -0.14]}><boxGeometry args={[0.016, 0.016, 0.3]} /><P c="#1c2233" m={0.5} /></mesh>
              ))}
            </group>
          )}

          {/* hair */}
          <mesh position={[0, 0.36, -0.06]} scale={[1, 0.8, 1]} castShadow={shadows}>
            <sphereGeometry args={[0.46, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {hairMat}
          </mesh>
          <mesh position={[-0.06, 0.52, 0.22]} rotation={[0.45, 0, 0.12]} castShadow={shadows}><boxGeometry args={[0.8, 0.1, 0.26]} />{hairMat}</mesh>
          <mesh position={[0.18, 0.5, 0.3]} rotation={[0.2, 0, -0.35]}><boxGeometry args={[0.34, 0.07, 0.12]} />{hairMat}</mesh>
          {hair === 'bob' && (
            <>
              <mesh position={[0, 0.14, -0.3]}><boxGeometry args={[0.9, 0.52, 0.2]} />{hairMat}</mesh>
              <mesh position={[-0.43, 0.16, -0.06]}><boxGeometry args={[0.12, 0.46, 0.58]} />{hairMat}</mesh>
              <mesh position={[0.43, 0.16, -0.06]}><boxGeometry args={[0.12, 0.46, 0.58]} />{hairMat}</mesh>
            </>
          )}
          {hair === 'long' && (
            <>
              <mesh position={[0, -0.05, -0.3]}><boxGeometry args={[0.9, 0.8, 0.18]} />{hairMat}</mesh>
              <mesh position={[-0.43, 0.02, -0.08]}><boxGeometry args={[0.12, 0.62, 0.52]} />{hairMat}</mesh>
              <mesh position={[0.43, 0.02, -0.08]}><boxGeometry args={[0.12, 0.62, 0.52]} />{hairMat}</mesh>
            </>
          )}
          {hair === 'ponytail' && (
            <>
              <mesh position={[0, 0.22, -0.33]}><boxGeometry args={[0.86, 0.42, 0.14]} />{hairMat}</mesh>
              <group ref={tail} position={[0, 0.42, -0.46]}>
                <mesh><sphereGeometry args={[0.13, 14, 14]} /><P c={outfit.pack} /></mesh>
                <mesh position={[0, -0.32, -0.04]} castShadow={shadows}><boxGeometry args={[0.2, 0.56, 0.2]} />{hairMat}</mesh>
                <mesh position={[0, -0.64, -0.04]} scale={[1, 0.8, 1]}><sphereGeometry args={[0.1, 10, 10]} />{hairMat}</mesh>
              </group>
            </>
          )}
        </group>

        {/* holographic laptop shown while interacting */}
        <group ref={laptop} position={[0, 1.2, 0.62]} scale={0.0001}>
          <mesh position={[0, -0.02, 0]}><boxGeometry args={[0.56, 0.03, 0.38]} /><P c="#cfd3dc" m={0.6} r={0.25} /></mesh>
          <group position={[0, 0, -0.19]} rotation={[-0.35, 0, 0]}>
            <mesh position={[0, 0.19, 0]}><boxGeometry args={[0.56, 0.38, 0.025]} /><P c="#cfd3dc" m={0.6} r={0.25} /></mesh>
            <mesh position={[0, 0.19, 0.015]}><planeGeometry args={[0.5, 0.32]} /><meshBasicMaterial color="#38bdf8" toneMapped={false} /></mesh>
          </group>
        </group>
      </group>
    </group>
  )
})
