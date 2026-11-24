import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sfx } from '../lib/audio'
import { emitDust } from '../lib/fx'
import { bindKeyboard, input, playerState } from '../lib/input'
import { rig } from '../lib/rig'
import { useGame } from '../store/game'
import { Minifigure, type AnimState } from '../three/Minifigure'
import { radialShadow } from '../three/textures'
import { interactables, islandAt, islandById, isWalkable, obstacles, SPAWN } from './layout'

const GRAVITY = 30
const JUMP_V = 9.4
const COYOTE = 0.1
const JUMP_BUFFER = 0.12
const WALK = 6
const RUN = 10.5
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export default function Player() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const blob = useRef<THREE.Mesh>(null)
  const anim = useRef<AnimState>({ mode: 'idle' })
  const st = useRef({
    x: SPAWN[0], z: SPAWN[1], y: 0, vy: 0, vx: 0, vz: 0, facing: 0,
    idle: 0, steps: 0, squash: 0, stretch: 0, locLast: 0, interactT: 0, interactFace: 0,
    wasAir: false, coyote: 0, jumpBuf: 0, dustT: 0, hasTarget: false,
  })
  const shadowTex = useRef(radialShadow())

  useEffect(() => { bindKeyboard() }, [])

  // Teleport requests from the navigation menu.
  useEffect(() => {
    return useGame.subscribe((s, prev) => {
      if (s.travel && s.travel !== prev.travel) {
        const id = s.travel
        sfx.whoosh()
        setTimeout(() => {
          const p = st.current
          if (id === 'story') {
            p.x = SPAWN[0]; p.z = SPAWN[1]
            playerState.yaw = 0
          } else {
            const isl = islandById[id]
            const a = isl.angle ?? 0
            p.x = isl.center[0] - Math.cos(a) * (isl.radius - 3.5)
            p.z = isl.center[1] - Math.sin(a) * (isl.radius - 3.5)
            playerState.yaw = Math.atan2(-Math.cos(a), -Math.sin(a))
          }
          p.vx = p.vz = 0
          p.y = 0
          rig.swoop = 0.9
          gsap.to(rig, { swoop: 0, duration: 2.2, ease: 'power3.out' })
          useGame.getState().setLocation(id)
          setTimeout(() => useGame.getState().clearTravel(), 400)
        }, 550)
      }
    })
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = st.current
    const game = useGame.getState()
    const locked = !!game.panel || !!game.activeGame || !!game.travel

    // --- input ---
    let fx = 0, fy = 0
    if (!locked) {
      const k = input.keys
      if (k.has('w') || k.has('arrowup')) fy += 1
      if (k.has('s') || k.has('arrowdown')) fy -= 1
      if (k.has('d') || k.has('arrowright')) fx += 1
      if (k.has('a') || k.has('arrowleft')) fx -= 1
      fx += input.joy.x
      fy += -input.joy.y
    }
    const mag = Math.min(1, Math.hypot(fx, fy))
    const running = input.keys.has('shift') || Math.hypot(input.joy.x, input.joy.y) > 0.85
    const targetSpeed = (running ? RUN : WALK) * mag
    const yaw = playerState.yaw
    const fwdX = -Math.sin(yaw), fwdZ = -Math.cos(yaw)
    const rgtX = Math.cos(yaw), rgtZ = -Math.sin(yaw)
    let dx = fwdX * fy + rgtX * fx
    let dz = fwdZ * fy + rgtZ * fx
    const l = Math.hypot(dx, dz)
    if (l > 0.001) { dx /= l; dz /= l }

    const grounded = p.y <= 0.001 && p.vy <= 0
    // Quick to start, a touch slower to stop, limited control in the air.
    const rate = !grounded ? 4 : mag > 0.05 ? 13 : 16
    const a = 1 - Math.exp(-rate * dt)
    p.vx += (dx * targetSpeed - p.vx) * a
    p.vz += (dz * targetSpeed - p.vz) * a

    // --- movement + collision ---
    let nx = p.x + p.vx * dt
    let nz = p.z + p.vz * dt
    if (!isWalkable(nx, nz)) {
      if (isWalkable(nx, p.z)) { nz = p.z; p.vz = 0 }
      else if (isWalkable(p.x, nz)) { nx = p.x; p.vx = 0 }
      else { nx = p.x; nz = p.z; p.vx = p.vz = 0 }
    }
    for (const ob of obstacles) {
      const ox = nx - ob.x, oz = nz - ob.z
      const min = ob.r + 0.5
      const d2 = ox * ox + oz * oz
      if (d2 < min * min && d2 > 1e-6) {
        const d = Math.sqrt(d2)
        nx = ob.x + (ox / d) * min
        nz = ob.z + (oz / d) * min
      }
    }
    if (!isWalkable(nx, nz)) { nx = p.x; nz = p.z }
    p.x = nx
    p.z = nz

    // --- jump with coyote time and input buffering ---
    if (grounded) p.coyote = COYOTE
    else p.coyote = Math.max(0, p.coyote - dt)
    if (input.jump) { p.jumpBuf = JUMP_BUFFER; input.jump = false }
    p.jumpBuf = Math.max(0, p.jumpBuf - dt)
    if (!locked && p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = JUMP_V
      p.jumpBuf = 0
      p.coyote = 0
      p.stretch = 1
      sfx.jump()
      if (!game.reducedMotion) emitDust(p.x, 0, p.z, 5, 1.2, 0.8)
    }
    p.vy -= GRAVITY * dt * (p.vy < 0 ? 1.25 : 1) // slightly snappier fall
    p.y += p.vy * dt
    if (p.y <= 0) {
      if (p.wasAir) {
        sfx.land()
        p.squash = 1
        if (!game.reducedMotion) emitDust(p.x, 0, p.z, 9, 2.2, 1)
      }
      p.y = 0
      p.vy = 0
      p.wasAir = false
    } else p.wasAir = true
    p.squash = Math.max(0, p.squash - dt * 4.5)
    p.stretch = Math.max(0, p.stretch - dt * 6)

    // --- facing ---
    const hSpeed = Math.hypot(p.vx, p.vz)
    const moving = hSpeed > 0.4
    if (moving) {
      const target = Math.atan2(p.vx, p.vz)
      p.facing += wrap(target - p.facing) * (1 - Math.exp(-16 * dt))
      p.idle = 0
      p.steps += hSpeed * dt
      if (p.y === 0) {
        if (p.steps > (running ? 2.2 : 1.8)) { p.steps = 0; sfx.step() }
        p.dustT += dt
        if (running && p.dustT > 0.16 && !game.reducedMotion) { p.dustT = 0; emitDust(p.x - p.vx * 0.05, 0, p.z - p.vz * 0.05, 1, 0.5, 0.5, 0.16) }
      }
    } else p.idle += dt

    // --- interaction ---
    let nearest: string | null = null
    let best = Infinity
    let look: number | undefined
    let lookDist = Infinity
    for (const it of interactables) {
      const d = Math.hypot(p.x - it.pos[0], p.z - it.pos[1])
      const range = it.size + 2.8
      if (d < range && d < best) { best = d; nearest = it.id }
      if (d < it.size + 9 && d < lookDist) {
        lookDist = d
        look = wrap(Math.atan2(it.pos[0] - p.x, it.pos[1] - p.z) - p.facing)
      }
    }
    if (!locked) game.setNearby(nearest)
    if (input.interact) {
      input.interact = false
      if (!locked && nearest) {
        const it = interactables.find((i) => i.id === nearest)!
        p.interactT = 1.1
        p.interactFace = Math.atan2(it.pos[0] - p.x, it.pos[1] - p.z)
        sfx.open()
        if (it.kind === 'arcade') game.openPanel('arcade')
        else game.openInfo(it.id)
      }
    }
    if (p.interactT > 0) {
      // turn toward what we are inspecting while the laptop opens
      p.facing += wrap(p.interactFace - p.facing) * (1 - Math.exp(-10 * dt))
    }
    p.interactT = Math.max(0, p.interactT - dt)
    // keep facing the building while its panel is open
    if (game.panel === 'info' && game.activeId) {
      const it = interactables.find((i) => i.id === game.activeId)
      if (it) p.facing += wrap(Math.atan2(it.pos[0] - p.x, it.pos[1] - p.z) - p.facing) * (1 - Math.exp(-6 * dt))
    }

    // --- animation mode ---
    const panelOpen = game.panel === 'info'
    let mode: AnimState['mode'] = 'idle'
    if (p.y > 0.05) mode = 'jump'
    else if (p.interactT > 0 || panelOpen) mode = 'interact'
    else if (moving) mode = running ? 'run' : 'walk'
    else if (p.idle > 6 && p.idle < 9) mode = 'wave'
    else if (p.idle >= 9) p.idle = 0
    anim.current.mode = mode
    anim.current.speed = hSpeed
    anim.current.vy = p.vy
    anim.current.look = moving && mode !== 'interact' ? undefined : look

    // --- apply ---
    if (group.current) {
      group.current.position.set(p.x, p.y, p.z)
      group.current.rotation.y = p.facing
    }
    if (inner.current) {
      // squash on landing, stretch on take-off
      const sq = Math.sin(p.squash * Math.PI) * 0.14
      const st2 = Math.sin(p.stretch * Math.PI * 0.5) * 0.08
      inner.current.scale.set(1 + sq - st2 * 0.5, 1 - sq + st2, 1 + sq - st2 * 0.5)
    }
    if (blob.current) {
      const s = 2.1 / (1 + p.y * 0.35)
      blob.current.position.set(p.x, 0.07, p.z)
      blob.current.scale.set(s, s, 1)
      ;(blob.current.material as THREE.MeshBasicMaterial).opacity = 0.85 / (1 + p.y * 0.4)
    }
    playerState.x = p.x
    playerState.z = p.z
    playerState.vx = p.vx
    playerState.vz = p.vz
    playerState.speed = hSpeed
    playerState.facing = p.facing
    playerState.moving = moving

    // --- location ---
    p.locLast += dt
    if (p.locLast > 0.3) {
      p.locLast = 0
      const isl = islandAt(p.x, p.z)
      if (isl) game.setLocation(isl.id)
    }
  })

  return (
    <>
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[SPAWN[0], 0.07, SPAWN[1]]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex.current} transparent depthWrite={false} />
      </mesh>
      <group ref={group} position={[SPAWN[0], 0, SPAWN[1]]}>
        <group ref={inner}>
          <Minifigure anim={anim} />
        </group>
      </group>
    </>
  )
}
