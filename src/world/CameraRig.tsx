import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { playerState } from '../lib/input'
import { rig } from '../lib/rig'
import { useGame } from '../store/game'
import { interactableById } from './layout'

const BASE_FOV = 52

/** Third-person follow camera with look-ahead, speed FOV and a cinematic focus mode for buildings. */
export default function CameraRig() {
  const { camera, gl } = useThree()
  const cur = useRef(new THREE.Vector3(0, 30, 40))
  const look = useRef(new THREE.Vector3(0, 0, 0))
  const ahead = useRef(new THREE.Vector2())
  const fov = useRef(BASE_FOV)
  const dist = useRef(rig.dist)
  const tmp = useRef({ p: new THREE.Vector3(), l: new THREE.Vector3(), fp: new THREE.Vector3(), fl: new THREE.Vector3() })

  // Opening swoop into the world.
  useEffect(() => {
    rig.swoop = 1
    rig.focusMix = 0
    const tw = gsap.to(rig, { swoop: 0, duration: useGame.getState().reducedMotion ? 0.01 : 3.4, ease: 'power3.inOut' })
    return () => { tw.kill() }
  }, [])

  // Drag to orbit, wheel to zoom.
  useEffect(() => {
    const el = gl.domElement
    let down = false
    let lx = 0, ly = 0
    const locked = () => !!useGame.getState().panel || !!useGame.getState().activeGame
    const pd = (e: PointerEvent) => { down = true; lx = e.clientX; ly = e.clientY }
    const pm = (e: PointerEvent) => {
      if (!down || locked()) return
      playerState.yaw -= (e.clientX - lx) * 0.006
      rig.pitch = Math.min(1.25, Math.max(0.1, rig.pitch + (e.clientY - ly) * 0.004))
      lx = e.clientX
      ly = e.clientY
    }
    const pu = () => { down = false }
    const wh = (e: WheelEvent) => {
      if (locked()) return
      rig.dist = Math.min(24, Math.max(6, rig.dist + e.deltaY * 0.01))
    }
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    el.addEventListener('wheel', wh, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      el.removeEventListener('wheel', wh)
    }
  }, [gl])

  // Cinematic move toward / away from the inspected building.
  useEffect(() => {
    let tween: gsap.core.Tween | null = null
    const apply = (id: string | null) => {
      const reduced = useGame.getState().reducedMotion
      if (id) {
        const it = interactableById[id]
        if (it) {
          const fx = Math.sin(it.rotY), fz = Math.cos(it.rotY)
          const rx = Math.cos(it.rotY), rz = -Math.sin(it.rotY)
          const dist = it.size * 2.2 + 5 + it.height * 0.35
          rig.focusPos = [it.pos[0] + fx * dist, it.height * 0.45 + 2.2, it.pos[1] + fz * dist]
          rig.focusLook = [it.pos[0] + rx * it.size * 0.9, it.height * 0.45, it.pos[1] + rz * it.size * 0.9]
        }
      }
      tween?.kill()
      tween = gsap.to(rig, { focusMix: id ? 1 : 0, duration: reduced ? 0.01 : 1.6, ease: 'power3.inOut' })
    }
    apply(useGame.getState().activeId)
    const unsub = useGame.subscribe((s, p) => {
      if (s.activeId !== p.activeId) apply(s.activeId)
    })
    return () => { unsub(); tween?.kill() }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = tmp.current
    const reduced = useGame.getState().reducedMotion
    const f = 1 - Math.exp(-5.5 * dt) // position follow
    const fl = 1 - Math.exp(-8 * dt) // look follow
    dist.current += (rig.dist - dist.current) * (1 - Math.exp(-6 * dt))

    // Look a little ahead of where the player is heading.
    const la = reduced ? 0 : 0.28
    ahead.current.x += (playerState.vx * la - ahead.current.x) * (1 - Math.exp(-3 * dt))
    ahead.current.y += (playerState.vz * la - ahead.current.y) * (1 - Math.exp(-3 * dt))

    const yaw = playerState.yaw
    const cp = Math.cos(rig.pitch), sp = Math.sin(rig.pitch)
    t.l.set(playerState.x + ahead.current.x, 1.5, playerState.z + ahead.current.y)
    t.p.set(playerState.x + Math.sin(yaw) * cp * dist.current, 1.5 + sp * dist.current, playerState.z + Math.cos(yaw) * cp * dist.current)
    t.p.y += rig.swoop * 34
    t.p.z += rig.swoop * 14
    t.fp.set(...rig.focusPos)
    t.fl.set(...rig.focusLook)
    t.p.lerp(t.fp, rig.focusMix)
    t.l.lerp(t.fl, rig.focusMix)
    cur.current.lerp(t.p, f)
    look.current.lerp(t.l, fl)
    if (cur.current.y < 0.8) cur.current.y = 0.8
    camera.position.copy(cur.current)
    camera.lookAt(look.current)

    // FOV widens with speed, tightens when inspecting a building.
    const cam = camera as THREE.PerspectiveCamera
    const runKick = reduced ? 0 : Math.max(0, Math.min(1, (playerState.speed - 6) / 4.5)) * 6
    const targetFov = BASE_FOV + runKick - rig.focusMix * 6 + rig.swoop * 8
    fov.current += (targetFov - fov.current) * (1 - Math.exp(-4 * dt))
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov = fov.current
      cam.updateProjectionMatrix()
    }
  })
  return null
}
