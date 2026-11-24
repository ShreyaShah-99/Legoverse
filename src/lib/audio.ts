import { useGame } from '../store/game'

// Synthesised sound effects (no audio files needed).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let ambient: { stop: () => void } | null = null

function ensure() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12, delay = 0, slideTo?: number) {
  if (!useGame.getState().sound) return
  const c = ensure()
  if (!c || !master) return
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const sfx = {
  unlock: () => void ensure(),
  click: () => tone(520, 0.07, 'square', 0.07),
  hover: () => tone(880, 0.04, 'sine', 0.04),
  collect: () => {
    tone(784, 0.1, 'square', 0.1)
    tone(1175, 0.18, 'square', 0.1, 0.08)
    tone(1568, 0.25, 'triangle', 0.1, 0.16)
  },
  success: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.09)),
  fail: () => tone(220, 0.35, 'sawtooth', 0.1, 0, 90),
  open: () => tone(300, 0.25, 'triangle', 0.1, 0, 640),
  close: () => tone(640, 0.2, 'triangle', 0.08, 0, 280),
  jump: () => tone(260, 0.18, 'square', 0.06, 0, 520),
  land: () => tone(120, 0.08, 'triangle', 0.1),
  place: () => {
    tone(180, 0.06, 'square', 0.1)
    tone(360, 0.05, 'square', 0.06, 0.04)
  },
  step: () => tone(90 + Math.random() * 30, 0.04, 'triangle', 0.035),
  whoosh: () => tone(200, 0.6, 'sine', 0.05, 0, 900),
}

export function startAmbient() {
  if (ambient || !useGame.getState().sound) return
  const c = ensure()
  if (!c || !master) return
  const g = c.createGain()
  g.gain.value = 0.0001
  g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 3)
  g.connect(master)
  const oscs = [196, 246.94, 293.66, 392].map((f, i) => {
    const o = c.createOscillator()
    o.type = i % 2 ? 'sine' : 'triangle'
    o.frequency.value = f
    o.detune.value = (i - 1.5) * 4
    const lfo = c.createOscillator()
    const lg = c.createGain()
    lfo.frequency.value = 0.07 + i * 0.03
    lg.gain.value = 3
    lfo.connect(lg).connect(o.detune)
    lfo.start()
    o.connect(g)
    o.start()
    return { o, lfo }
  })
  ambient = {
    stop: () => {
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6)
      setTimeout(() => oscs.forEach(({ o, lfo }) => { o.stop(); lfo.stop() }), 700)
    },
  }
}

export function stopAmbient() {
  ambient?.stop()
  ambient = null
}

useGame.subscribe((s, prev) => {
  if (s.sound !== prev.sound) {
    if (s.sound) startAmbient()
    else stopAmbient()
  }
})
