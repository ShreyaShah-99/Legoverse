import * as THREE from 'three'
import { islandById, RING, type IslandId } from './layout'

/**
 * Route for the automatic quick tour: out over each bridge, once around the island
 * (outside its buildings), then back to the hub and on to the next bridge.
 */

// Distance from each island centre at which the vehicle circles it, chosen to pass between buildings and trees.
const LOOP_RADIUS: Record<string, number> = {
  dev: 15.7,
  projects: 13,
  cloud: 13.8,
  experience: 16.2,
  contact: 8,
}

// Islands in the order they are met when circling the hub, starting from the spawn point.
const ORDER: IslandId[] = ['cloud', 'experience', 'contact', 'dev', 'projects']

const HUB_R = 4.5
const deg = (d: number) => (d * Math.PI) / 180

function buildPoints(): [number, number][] {
  const pts: [number, number][] = []
  const hubArc = (from: number, to: number) => {
    const n = Math.max(1, Math.ceil(Math.abs(to - from) / 8))
    for (let i = 0; i <= n; i++) {
      const a = deg(from + ((to - from) * i) / n)
      pts.push([Math.cos(a) * HUB_R, Math.sin(a) * HUB_R])
    }
  }

  let prev = 90 // spawn is at (0, 4), which is 90 degrees around the hub
  for (const id of ORDER) {
    const isl = islandById[id]
    let target = Math.round((isl.angle! * 180) / Math.PI)
    while (target <= prev) target += 360
    hubArc(prev, target)
    prev = target

    const a = isl.angle!
    const dx = Math.cos(a), dz = Math.sin(a)
    const R = LOOP_RADIUS[id]
    const entry = RING - R
    // out along the bridge
    for (let d = HUB_R + 10; d < entry - 4; d += 10) pts.push([dx * d, dz * d])
    pts.push([dx * entry, dz * entry])
    // once around the island
    const steps = 36
    for (let j = 1; j < steps; j++) {
      const phi = a + Math.PI + (j / steps) * Math.PI * 2
      pts.push([isl.center[0] + Math.cos(phi) * R, isl.center[1] + Math.sin(phi) * R])
    }
    // back along the bridge
    for (let d = entry - 10; d > HUB_R + 1; d -= 10) pts.push([dx * d, dz * d])
    pts.push([dx * HUB_R, dz * HUB_R])
  }
  hubArc(prev, 450)
  return pts
}

export interface TourPath {
  total: number
  step: number
  xs: Float32Array
  zs: Float32Array
}

let cached: TourPath | null = null

export function getTourPath(): TourPath {
  if (cached) return cached
  const curve = new THREE.CatmullRomCurve3(buildPoints().map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
  const total = curve.getLength()
  const n = Math.max(2, Math.round(total / 0.8))
  const sp = curve.getSpacedPoints(n)
  const xs = new Float32Array(sp.length)
  const zs = new Float32Array(sp.length)
  sp.forEach((p, i) => { xs[i] = p.x; zs[i] = p.z })
  cached = { total, step: total / n, xs, zs }
  return cached
}

/** Position and heading (radians, same convention as player facing) at distance s along the route. */
export function sampleTour(path: TourPath, s: number, out: { x: number; z: number; heading: number }) {
  const f = Math.min(Math.max(s / path.step, 0), path.xs.length - 1.001)
  const i = Math.floor(f)
  const t = f - i
  out.x = path.xs[i] + (path.xs[i + 1] - path.xs[i]) * t
  out.z = path.zs[i] + (path.zs[i + 1] - path.zs[i]) * t
  // heading from a short look-ahead so turns are anticipated
  const j = Math.min(i + 3, path.xs.length - 1)
  const k = Math.max(i - 1, 0)
  out.heading = Math.atan2(path.xs[j] - path.xs[k], path.zs[j] - path.zs[k])
}
