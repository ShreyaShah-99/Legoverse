import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface BrickItem {
  target: THREE.Vector3
  scale: THREE.Vector3
  color: string
  delay: number // 0..0.55
  start: THREE.Vector3
  spin: THREE.Vector3
}

const o = new THREE.Object3D()
const so = new THREE.Object3D()
const tmpC = new THREE.Color()
const easeOutBack = (x: number) => {
  const c1 = 1.4, c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

export function randomStart(rng: () => number, spread = 60) {
  const v = new THREE.Vector3(rng() - 0.5, rng() * 0.8 + 0.1, rng() - 0.5).normalize()
  return v.multiplyScalar(spread * (0.6 + rng() * 0.6))
}

/** Instanced bricks that fly in from random directions and snap into place as `progress` goes 0 -> 1. */
export function FlyingBricks({ items, progress, studs = false, studColor = '#fff' }: { items: BrickItem[]; progress: MutableRefObject<number>; studs?: boolean; studColor?: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const stud = useRef<THREE.InstancedMesh>(null)
  const settled = useRef(false)
  const lastP = useRef(-1)

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    items.forEach((it, i) => {
      tmpC.set(it.color)
      m.setColorAt(i, tmpC)
      stud.current?.setColorAt(i, tmpC)
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (stud.current?.instanceColor) stud.current.instanceColor.needsUpdate = true
    settled.current = false
    lastP.current = -1
  }, [items])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const p = progress.current
    if (p === lastP.current && settled.current) return
    lastP.current = p
    let allDone = p >= 1
    items.forEach((it, i) => {
      const local = Math.min(1, Math.max(0, (p - it.delay) / 0.4))
      if (local <= 0) {
        o.scale.setScalar(0.0001)
        o.position.copy(it.start)
        o.rotation.set(0, 0, 0)
      } else {
        const e = easeOutBack(local)
        o.position.lerpVectors(it.start, it.target, Math.min(1, e))
        o.position.y += Math.sin(local * Math.PI) * 2.2 * (1 - local) // arc
        o.rotation.set(it.spin.x * (1 - local), it.spin.y * (1 - local), it.spin.z * (1 - local))
        o.scale.copy(it.scale)
        if (local < 1) allDone = false
      }
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const s = stud.current
      if (s) {
        so.position.copy(o.position)
        so.position.y += it.scale.y / 2 + 0.06
        so.rotation.copy(o.rotation)
        so.scale.setScalar(local >= 1 ? 1 : 0.0001)
        so.updateMatrix()
        s.setMatrixAt(i, so.matrix)
      }
    })
    m.instanceMatrix.needsUpdate = true
    if (stud.current) stud.current.instanceMatrix.needsUpdate = true
    settled.current = allDone
  })

  const count = items.length
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.32} metalness={0.02} />
      </instancedMesh>
      {studs && (
        <instancedMesh ref={stud} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
          <cylinderGeometry args={[0.28, 0.28, 0.12, 10]} />
          <meshStandardMaterial roughness={0.32} color={studColor} />
        </instancedMesh>
      )}
    </>
  )
}

export function useItems(build: () => BrickItem[], deps: unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(build, deps)
}
