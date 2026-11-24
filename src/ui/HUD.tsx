import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { achievementList, profile } from '../data/content'
import { sfx } from '../lib/audio'
import { input, isTouch, playerState } from '../lib/input'
import { explorationProgress, useGame } from '../store/game'
import { interactableById, islandById, islands, RING, type IslandId } from '../world/layout'
import { Icon, Meter } from './shared'

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null)
  const SIZE = isTouch ? 110 : 150
  useEffect(() => {
    const c = ref.current!
    const g = c.getContext('2d')!
    const scale = (SIZE / 2 - 6) / (RING + 20)
    let raf = 0
    let last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 33) return // ~30 fps keeps the arrow smooth without costing much
      last = now
      g.clearRect(0, 0, SIZE, SIZE)
      g.save()
      g.translate(SIZE / 2, SIZE / 2)
      // bridges
      g.strokeStyle = 'rgba(255,255,255,0.35)'
      g.lineWidth = 3
      islands.forEach((i) => {
        if (i.angle === null) return
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(i.center[0] * scale, i.center[1] * scale)
        g.stroke()
      })
      islands.forEach((i) => {
        g.beginPath()
        g.arc(i.center[0] * scale, i.center[1] * scale, i.radius * scale, 0, Math.PI * 2)
        g.fillStyle = i.color + 'cc'
        g.fill()
        g.strokeStyle = 'rgba(255,255,255,0.4)'
        g.lineWidth = 1
        g.stroke()
      })
      // player
      g.translate(playerState.x * scale, playerState.z * scale)
      g.rotate(-playerState.facing + Math.PI)
      g.fillStyle = '#f6c445'
      g.strokeStyle = '#000'
      g.lineWidth = 1.5
      g.beginPath()
      g.moveTo(0, -6)
      g.lineTo(4.5, 5)
      g.lineTo(-4.5, 5)
      g.closePath()
      g.fill()
      g.stroke()
      g.restore()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [SIZE])
  return (
    <div className="glass pointer-events-none rounded-2xl p-1.5">
      <canvas ref={ref} width={SIZE} height={SIZE} style={{ width: SIZE, height: SIZE }} aria-label="Mini-map" />
    </div>
  )
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const active = useRef<number | null>(null)
  const move = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId || !base.current) return
    const r = base.current.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const max = r.width / 2 - 10
    const d = Math.hypot(dx, dy)
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max }
    setKnob({ x: dx, y: dy })
    input.joy.x = dx / max
    input.joy.y = dy / max
  }
  const end = (e: React.PointerEvent) => {
    if (active.current !== e.pointerId) return
    active.current = null
    setKnob({ x: 0, y: 0 })
    input.joy.x = 0
    input.joy.y = 0
  }
  return (
    <div
      ref={base}
      className="glass pointer-events-auto relative h-32 w-32 touch-none rounded-full"
      onPointerDown={(e) => { active.current = e.pointerId; (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Movement joystick"
    >
      <div className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-gold/80 shadow-lg" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  )
}

function TouchButtons() {
  const nearby = useGame((s) => s.nearby)
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-3">
      <button className={`glass flex h-16 w-16 items-center justify-center rounded-full font-display text-lg font-bold transition active:scale-90 ${nearby ? 'border-gold text-gold' : 'text-white/60'}`} onPointerDown={() => { input.interact = true }} aria-label="Interact">E</button>
      <button className="glass flex h-16 w-16 items-center justify-center rounded-full text-white active:scale-90" onPointerDown={() => { input.jump = true }} aria-label="Jump"><Icon name="up" size={26} /></button>
    </div>
  )
}

function NavMenu({ onClose }: { onClose: () => void }) {
  const travelTo = useGame((s) => s.travelTo)
  const visited = useGame((s) => s.visited)
  const location = useGame((s) => s.location)
  return (
    <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="glass pointer-events-auto absolute right-0 top-12 z-30 w-64 rounded-2xl p-2">
      <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Fast travel</p>
      {islands.map((i) => (
        <button
          key={i.id}
          onClick={() => { sfx.click(); travelTo(i.id); onClose() }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/10 ${location === i.id ? 'text-gold' : 'text-white/90'}`}
        >
          <span className="h-3 w-3 rounded-sm" style={{ background: i.color }} />
          <span className="flex-1">{i.name}</span>
          {visited.includes(i.id) && <span className="text-emerald-300"><Icon name="check" size={14} /></span>}
        </button>
      ))}
    </motion.div>
  )
}

function Stats() {
  const location = useGame((s) => s.location)
  const bricks = useGame((s) => s.bricks.length)
  const ach = useGame((s) => s.achievements.length)
  const visited = useGame((s) => s.visited)
  const allBricks = useGame((s) => s.bricks)
  const allAch = useGame((s) => s.achievements)
  const pct = explorationProgress(visited, allBricks, allAch)
  return (
    <div className="glass pointer-events-none w-56 rounded-2xl p-3 max-sm:w-44">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Location</p>
      <p className="font-display text-sm font-semibold text-white">{islandById[location].name}</p>
      <div className="mt-3 space-y-2.5 text-xs">
        <div>
          <div className="mb-1 flex justify-between text-white/70"><span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-3.5 rounded-[3px] bg-gold" />Golden bricks</span><b className="text-white">{bricks}/10</b></div>
          <Meter value={bricks} max={10} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-white/70"><span>Achievements</span><b className="text-white">{ach}/{achievementList.length}</b></div>
          <Meter value={ach} max={achievementList.length} color="#4da6ff" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-white/70"><span>Exploration</span><b className="text-white">{pct}%</b></div>
          <Meter value={pct} max={100} color="#4ade80" />
        </div>
      </div>
    </div>
  )
}

function Prompt() {
  const nearby = useGame((s) => s.nearby)
  const panel = useGame((s) => s.panel)
  const it = nearby ? interactableById[nearby] : null
  return (
    <AnimatePresence>
      {it && !panel && (
        <motion.button
          key={it.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={() => { input.interact = true }}
          className="glass pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-2.5"
        >
          <kbd className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold font-display font-bold text-black shadow-[0_3px_0_#b88a10]">E</kbd>
          <span className="text-left"><span className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Interact</span><span className="font-display text-sm font-semibold text-white">{it.label}</span></span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

function Toast() {
  const toast = useGame((s) => s.toast)
  const [shown, setShown] = useState<typeof toast>(null)
  useEffect(() => {
    if (!toast) return
    setShown(toast)
    const t = setTimeout(() => setShown(null), 2800)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <AnimatePresence>
      {shown && (
        <motion.div key={shown.id} initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="glass pointer-events-none flex items-center gap-2 rounded-2xl border-gold/40 px-4 py-2.5 font-display text-sm font-semibold capitalize text-gold">
          <Icon name="brick" /> {shown.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function TravelWipe() {
  const travel = useGame((s) => s.travel)
  return (
    <AnimatePresence>
      {travel && (
        <motion.div className="pointer-events-none fixed inset-0 z-50 flex" initial={{ opacity: 1 }} exit={{ opacity: 1, transition: { delay: 0.5 } }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} className="h-full flex-1" style={{ background: ['#e4572e', '#f6c445', '#4da6ff', '#4ade80'][i % 4], originY: i % 2 ? 0 : 1 }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} exit={{ scaleY: 0 }} transition={{ duration: 0.45, delay: i * 0.035, ease: [0.76, 0, 0.24, 1] }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold tracking-widest text-white mix-blend-difference">{islandById[travel as IslandId]?.name}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function HUD() {
  const sound = useGame((s) => s.sound)
  const setSetting = useGame((s) => s.setSetting)
  const openPanel = useGame((s) => s.openPanel)
  const panel = useGame((s) => s.panel)
  const closePanel = useGame((s) => s.closePanel)
  const [nav, setNav] = useState(false)
  const act = (fn: () => void) => () => { sfx.click(); fn() }
  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none">
      {/* top left */}
      <div className="absolute left-3 top-3 flex flex-col gap-3 md:left-5 md:top-5">
        <div className="glass pointer-events-auto flex items-center gap-3 rounded-2xl py-2 pl-2 pr-4">
          <span className="grid grid-cols-2 gap-0.5 rounded-lg bg-gold p-1.5" aria-hidden>
            <i className="h-2 w-2 rounded-full bg-black/25" /><i className="h-2 w-2 rounded-full bg-black/25" />
            <i className="col-span-2 h-2.5 rounded-sm bg-black/15" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold text-white md:text-base">Shreya's <span className="text-gold">LEGOVERSE</span></p>
            <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 md:block">Interactive portfolio</p>
          </div>
        </div>
        <Stats />
      </div>

      {/* top right */}
      <div className="absolute right-3 top-3 flex items-center gap-2 md:right-5 md:top-5">
        <div className="relative pointer-events-none">
          <button className="hud-btn pointer-events-auto" onClick={act(() => setNav((v) => !v))} aria-expanded={nav} aria-label="Portfolio navigation"><Icon name="map" /><span className="hidden md:inline">Navigate</span></button>
          <AnimatePresence>{nav && <NavMenu onClose={() => setNav(false)} />}</AnimatePresence>
        </div>
        <button className="hud-btn pointer-events-auto" onClick={act(() => openPanel('arcade'))} aria-label="Open arcade"><Icon name="game" /><span className="hidden md:inline">Arcade</span></button>
        <button className="hud-btn pointer-events-auto" onClick={act(() => setSetting('sound', !sound))} aria-label={sound ? 'Mute sound' : 'Unmute sound'}><Icon name={sound ? 'sound' : 'mute'} /></button>
        <button className="hud-btn pointer-events-auto" onClick={act(() => (panel === 'settings' ? closePanel() : openPanel('settings')))} aria-label="Settings"><Icon name="settings" /></button>
        <a className="hud-btn pointer-events-auto" href={`mailto:${profile.email}`} onClick={() => sfx.click()} aria-label={`Email ${profile.email}`} title={profile.email}><Icon name="mail" /><span className="hidden xl:inline font-mono text-xs">{profile.email}</span></a>
        <button className="hud-btn pointer-events-auto" onClick={act(() => openPanel('resume'))} aria-label="View resume"><Icon name="resume" /><span className="hidden md:inline">Resume</span></button>
      </div>

      {/* top center toast */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2 max-md:top-16"><Toast /></div>

      {/* bottom center prompt */}
      <div className="absolute inset-x-0 bottom-6 flex justify-center max-md:bottom-40"><Prompt /></div>

      {/* bottom left */}
      <div className="absolute bottom-4 left-3 md:bottom-5 md:left-5">
        {isTouch ? <Joystick /> : (
          <div className="glass hidden rounded-2xl p-3 text-xs text-white/70 md:block">
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5">
              <span className="flex gap-1">{['W', 'A', 'S', 'D'].map((k) => <kbd key={k} className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">{k}</kbd>)}</span><span>Move</span>
              <kbd className="w-fit rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">Shift</kbd><span>Run</span>
              <kbd className="w-fit rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">Space</kbd><span>Jump</span>
              <kbd className="w-fit rounded bg-gold px-1.5 py-0.5 font-mono text-[10px] text-black">E</kbd><span>Interact</span>
              <kbd className="w-fit rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white">Drag</kbd><span>Look around · scroll to zoom</span>
            </div>
          </div>
        )}
      </div>

      {/* bottom right */}
      <div className="absolute bottom-4 right-3 flex flex-col items-end gap-3 md:bottom-5 md:right-5">
        {isTouch && <TouchButtons />}
        <Minimap />
      </div>
    </div>
  )
}
