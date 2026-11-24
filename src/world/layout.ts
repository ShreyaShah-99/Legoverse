import { awsServices, experienceAreas, projects, techs } from '../data/content'

export type IslandId = 'story' | 'dev' | 'projects' | 'cloud' | 'experience' | 'contact'

export interface Island {
  id: IslandId
  name: string
  short: string
  center: [number, number]
  radius: number
  color: string
  angle: number | null // direction from the hub, null for hub
}

export const RING = 52
const deg = (d: number) => (d * Math.PI) / 180

function mk(id: IslandId, name: string, short: string, angleDeg: number | null, radius: number, color: string): Island {
  const a = angleDeg === null ? 0 : deg(angleDeg)
  return {
    id, name, short, radius, color,
    angle: angleDeg === null ? null : a,
    center: angleDeg === null ? [0, 0] : [Math.cos(a) * RING, Math.sin(a) * RING],
  }
}

export const islands: Island[] = [
  mk('story', 'My Story Island', 'Story', null, 18, '#5aa469'),
  mk('dev', 'Developer City', 'Dev City', 0, 20, '#3b4a6b'),
  mk('projects', 'Project Construction Island', 'Projects', 72, 17, '#b89455'),
  mk('cloud', 'AWS Cloud Kingdom', 'AWS', 144, 16, '#cfe4ff'),
  mk('experience', 'Experience & Achievements', 'Career', 216, 18, '#7a8f6a'),
  mk('contact', 'Contact Station', 'Contact', 288, 14, '#d98c5f'),
]

export const islandById = Object.fromEntries(islands.map((i) => [i.id, i])) as Record<IslandId, Island>

export type Kind = 'story' | 'tech' | 'project' | 'aws' | 'cert' | 'exp' | 'achievements' | 'arcade' | 'contact'

export interface Interactable {
  id: string
  kind: Kind
  island: IslandId
  ref: string
  label: string
  pos: [number, number]
  rotY: number // facing direction (front = +z rotated by rotY)
  size: number // collision radius and rough footprint
  height: number
  color: string
}

const out: Interactable[] = []

function place(island: IslandId, angleRad: number, r: number): [number, number] {
  const c = islandById[island].center
  return [c[0] + Math.cos(angleRad) * r, c[1] + Math.sin(angleRad) * r]
}
function facing(from: [number, number], to: [number, number]) {
  return Math.atan2(to[0] - from[0], to[1] - from[1])
}
const dirRot = (a: number) => Math.atan2(Math.cos(a), Math.sin(a))
/** Angle pointing from an island back toward the hub (where the bridge enters). */
function inbound(island: IslandId) {
  const a = islandById[island].angle
  return a === null ? 0 : a + Math.PI
}
function ring(island: IslandId, count: number, r: number, i: number) {
  const a = inbound(island) + ((i + 0.5) * Math.PI * 2) / count
  return place(island, a, r)
}

// Story island
{
  const c = islandById.story.center
  const house = place('story', deg(252), 9)
  out.push({ id: 'story-house', kind: 'story', island: 'story', ref: 'story', label: 'Developer House', pos: house, rotY: facing(house, [c[0], c[1] + 1]), size: 3.4, height: 4.6, color: '#e4572e' })
  const arcade = place('story', deg(36), 10)
  out.push({ id: 'arcade', kind: 'arcade', island: 'story', ref: 'arcade', label: 'Brick Arcade', pos: arcade, rotY: facing(arcade, [c[0], c[1]]), size: 3, height: 4, color: '#7c3aed' })
}

// Developer City
techs.forEach((t, i) => {
  const c = islandById.dev.center
  const p = ring('dev', techs.length, 12, i)
  out.push({ id: `tech-${t.id}`, kind: 'tech', island: 'dev', ref: t.id, label: t.name, pos: p, rotY: facing(p, c), size: 2.2, height: 4 + (i % 4) * 1.2, color: t.color })
})

// Projects
projects.forEach((p, i) => {
  const c = islandById.projects.center
  const pos = ring('projects', projects.length, 8.5, i)
  out.push({ id: `project-${p.id}`, kind: 'project', island: 'projects', ref: p.id, label: p.name, pos, rotY: facing(pos, c), size: 3.2, height: 5.5, color: p.color })
})

// Cloud
{
  const c = islandById.cloud.center
  out.push({ id: 'cert', kind: 'cert', island: 'cloud', ref: 'aws-dev', label: 'AWS Certified Developer - Associate', pos: [c[0], c[1]], rotY: dirRot(inbound('cloud')), size: 2.6, height: 5, color: '#ff9900' })
  awsServices.forEach((s, i) => {
    const p = ring('cloud', awsServices.length, 9, i)
    out.push({ id: `aws-${s.id}`, kind: 'aws', island: 'cloud', ref: s.id, label: s.name, pos: p, rotY: facing(p, c), size: 1.8, height: 3.6, color: s.color })
  })
}

// Experience
{
  const c = islandById.experience.center
  out.push({ id: 'achievements', kind: 'achievements', island: 'experience', ref: 'achievements', label: 'Achievement Tower', pos: [c[0], c[1]], rotY: dirRot(inbound('experience')), size: 3.4, height: 11, color: '#f6c445' })
  experienceAreas.forEach((e, i) => {
    const p = ring('experience', experienceAreas.length, 13, i)
    out.push({ id: `exp-${e.id}`, kind: 'exp', island: 'experience', ref: e.id, label: e.name, pos: p, rotY: facing(p, c), size: 1.8, height: 3, color: i === 0 ? '#f6c445' : '#7dd3fc' })
  })
}

// Contact
{
  const c = islandById.contact.center
  out.push({ id: 'contact', kind: 'contact', island: 'contact', ref: 'contact', label: 'Communication Station', pos: [c[0], c[1] - 1], rotY: dirRot(inbound('contact')), size: 3, height: 6, color: '#f97316' })
}

export const interactables = out
export const interactableById = Object.fromEntries(out.map((i) => [i.id, i]))

// Static decorative obstacles (trees, houses, etc.)
export interface Obstacle { x: number; z: number; r: number }
export const decorHouses: { pos: [number, number]; rotY: number; color: string; w: number; h: number; d: number }[] = []
export const trees: [number, number, number][] = []
{
  const c = islandById.story.center
  const palette = ['#4da6ff', '#f6c445', '#4ade80', '#ff7a45']
  ;[108, 180, 324].forEach((a, i) => {
    const p = place('story', deg(a), 12.5)
    decorHouses.push({ pos: p, rotY: facing(p, c), color: palette[i % palette.length], w: 3.4, h: 2.8, d: 3 })
  })
  const treeAngles = [20, 55, 90, 130, 160, 200, 235, 270, 305, 345]
  treeAngles.forEach((a, i) => {
    const p = place('story', deg(a), 14.5 + (i % 2))
    trees.push([p[0], p[1], 0.9 + (i % 3) * 0.15])
  })
  // a few trees on other islands for life
  ;(['dev', 'projects', 'experience', 'contact'] as IslandId[]).forEach((id, k) => {
    const isl = islandById[id]
    for (let i = 0; i < 3; i++) {
      const p = place(id, inbound(id) + deg(90 + i * 60 + k * 17), isl.radius - 2.2)
      trees.push([p[0], p[1], 0.8])
    }
  })
}

export const obstacles: Obstacle[] = [
  ...interactables.map((i) => ({ x: i.pos[0], z: i.pos[1], r: i.size })),
  ...decorHouses.map((h) => ({ x: h.pos[0], z: h.pos[1], r: 2.4 })),
  ...trees.map((t) => ({ x: t[0], z: t[1], r: 0.6 })),
  { x: 0, z: 0, r: 2.6 }, // welcome sculpture
  { x: islandById.projects.center[0], z: islandById.projects.center[1], r: 1.1 }, // crane base
]

// Golden bricks for Brick Hunter
function g(island: IslandId, angle: number, r: number): [number, number] {
  return place(island, deg(angle), r)
}
export const goldenBricks: { id: number; pos: [number, number]; hint: string }[] = [
  { id: 0, pos: g('story', 300, 6), hint: 'Near the developer house' },
  { id: 1, pos: g('story', 150, 8), hint: 'Behind the neighborhood' },
  { id: 2, pos: g('dev', 180 + 0, 4), hint: 'Dev City plaza' },
  { id: 3, pos: g('dev', 90, 15.5), hint: 'Edge of Developer City' },
  { id: 4, pos: g('projects', 20, 5), hint: 'Between the construction sites' },
  { id: 5, pos: g('projects', 230, 13), hint: 'By the cranes' },
  { id: 6, pos: g('cloud', 30, 4.5), hint: 'Near the certification monument' },
  { id: 7, pos: g('experience', 60, 6), hint: 'Inside the railway loop' },
  { id: 8, pos: g('experience', 300, 15), hint: 'Past the stations' },
  { id: 9, pos: g('contact', 100, 8), hint: 'Behind the communication station' },
]

// Walkability: islands plus bridges from the hub.
export function isWalkable(x: number, z: number) {
  for (const i of islands) {
    const dx = x - i.center[0], dz = z - i.center[1]
    if (dx * dx + dz * dz < (i.radius - 0.7) * (i.radius - 0.7)) return true
  }
  for (const i of islands) {
    if (i.angle === null) continue
    const dx = Math.cos(i.angle), dz = Math.sin(i.angle)
    const along = x * dx + z * dz
    const perp = Math.abs(-x * dz + z * dx)
    if (along > 0 && along < RING && perp < 1.9) return true
  }
  return false
}

export function islandAt(x: number, z: number): Island | null {
  for (const i of islands) {
    const dx = x - i.center[0], dz = z - i.center[1]
    if (dx * dx + dz * dz < (i.radius + 2) * (i.radius + 2)) return i
  }
  return null
}

export const SPAWN: [number, number] = [0, 4]
