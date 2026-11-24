// Tiny particle pool for dust puffs (jump, landing, running).
export const MAX_DUST = 72

export const dust = {
  x: new Float32Array(MAX_DUST),
  y: new Float32Array(MAX_DUST),
  z: new Float32Array(MAX_DUST),
  vx: new Float32Array(MAX_DUST),
  vy: new Float32Array(MAX_DUST),
  vz: new Float32Array(MAX_DUST),
  age: new Float32Array(MAX_DUST).fill(9),
  life: new Float32Array(MAX_DUST).fill(1),
  size: new Float32Array(MAX_DUST),
  head: 0,
}

export function emitDust(x: number, y: number, z: number, count: number, spread = 1.4, up = 1.2, size = 0.22) {
  for (let i = 0; i < count; i++) {
    const k = dust.head
    dust.head = (dust.head + 1) % MAX_DUST
    const a = Math.random() * Math.PI * 2
    const s = (0.4 + Math.random() * 0.6) * spread
    dust.x[k] = x + Math.cos(a) * 0.3
    dust.y[k] = y + 0.08
    dust.z[k] = z + Math.sin(a) * 0.3
    dust.vx[k] = Math.cos(a) * s
    dust.vz[k] = Math.sin(a) * s
    dust.vy[k] = up * (0.5 + Math.random() * 0.8)
    dust.age[k] = 0
    dust.life[k] = 0.45 + Math.random() * 0.3
    dust.size[k] = size * (0.7 + Math.random() * 0.6)
  }
}
