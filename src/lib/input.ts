// Mutable input + player state shared outside React for per-frame reads.
export const input = {
  keys: new Set<string>(),
  joy: { x: 0, y: 0 }, // virtual joystick, y negative = forward
  jump: false,
  interact: false,
  lookDX: 0,
}

export const playerState = {
  x: 0,
  z: 4,
  vx: 0,
  vz: 0,
  speed: 0,
  yaw: 0, // camera yaw
  facing: 0,
  moving: false,
}

export const isTouch = typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false)

let bound = false
export function bindKeyboard() {
  if (bound) return
  bound = true
  const tag = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
  }
  window.addEventListener('keydown', (e) => {
    if (tag(e)) return
    const k = e.key.toLowerCase()
    input.keys.add(k)
    if (k === ' ') {
      if (!e.repeat) input.jump = true
      e.preventDefault()
    }
    if (k === 'e' && !e.repeat) input.interact = true
  })
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase())
  })
  window.addEventListener('blur', () => input.keys.clear())
}
