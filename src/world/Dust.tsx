import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dust, MAX_DUST } from '../lib/fx'

const o = new THREE.Object3D()

export default function Dust() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  useFrame((_, rawDt) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(rawDt, 0.05)
    for (let i = 0; i < MAX_DUST; i++) {
      dust.age[i] += dt
      const k = dust.age[i] / dust.life[i]
      if (k >= 1) {
        o.scale.setScalar(0.0001)
      } else {
        const drag = Math.exp(-dt * 3.5)
        dust.vx[i] *= drag
        dust.vz[i] *= drag
        dust.vy[i] *= Math.exp(-dt * 2)
        dust.x[i] += dust.vx[i] * dt
        dust.y[i] += dust.vy[i] * dt
        dust.z[i] += dust.vz[i] * dt
        // grow quickly, then shrink away
        const s = dust.size[i] * Math.sin(Math.min(1, k * 1.3) * Math.PI) * 1.4
        o.scale.setScalar(Math.max(0.0001, s))
      }
      o.position.set(dust.x[i], dust.y[i], dust.z[i])
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_DUST]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#fbf4e6" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  )
}
