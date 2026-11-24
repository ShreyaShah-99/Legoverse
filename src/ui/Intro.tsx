import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { profile } from '../data/content'
import { sfx, startAmbient } from '../lib/audio'
import { useGame } from '../store/game'

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let alive = true
    const min = new Promise((r) => setTimeout(r, 2200))
    // Warm the heavy chunks while the animation plays.
    const preload = Promise.all([
      import('../three/Intro'),
      import('../world/World'),
      // island chunks are fetched now so they mount without a network stall later
      import('../world/DevCity'),
      import('../world/ProjectsIsland'),
      import('../world/CloudKingdom'),
      import('../world/ExperienceIsland'),
      import('../world/ContactIsland'),
    ]).catch(() => undefined)
    const tick = setInterval(() => setP((v) => Math.min(v + 2.2, 92)), 60)
    Promise.all([min, preload]).then(() => {
      if (!alive) return
      clearInterval(tick)
      setP(100)
      setTimeout(() => alive && onDone(), 350)
    })
    return () => { alive = false; clearInterval(tick) }
  }, [onDone])
  // A small wall that builds itself, brick by brick, while assets load. [x, row, colour, studs]
  const wall: [number, number, string, number][] = [
    [0, 0, '#e4572e', 2], [64, 0, '#f6c445', 2], [128, 0, '#4da6ff', 2],
    [32, 1, '#4ade80', 2], [96, 1, '#c084fc', 2],
    [64, 2, '#f4f4f2', 2],
  ]
  const BW = 64, BH = 30
  const segments = 14
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,#1b1245_0%,#05060f_70%)]" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <div className="relative" style={{ width: 192, height: 104 }}>
        {wall.map(([x, row, c, n], i) => (
          <span
            key={i}
            className="absolute block rounded-[5px]"
            style={{
              width: BW - 3, height: BH - 3, left: x, bottom: row * BH,
              background: `linear-gradient(180deg, ${c} 0%, ${c} 70%, rgba(0,0,0,0.18) 100%)`,
              boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.28), inset 0 2px 0 rgba(255,255,255,0.35), 0 8px 18px rgba(0,0,0,0.5)',
              animation: `brickDrop 0.55s ${0.15 + i * 0.32}s both cubic-bezier(.3,1.5,.5,1)`,
            }}
          >
            {Array.from({ length: n }).map((_, k) => (
              <i key={k} className="absolute -top-[7px] h-[8px] w-[18px] rounded-t-[4px]" style={{ left: 8 + k * 30, background: c, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)' }} />
            ))}
          </span>
        ))}
        {/* baseplate */}
        <span className="absolute -bottom-3 left-[-10px] block h-3 rounded-sm bg-[#2f6f45]" style={{ width: 212, boxShadow: '0 10px 24px rgba(0,0,0,0.6)' }} />
      </div>
      <p className="mt-10 font-display text-2xl font-bold tracking-wide text-white">Shreya's <span className="text-gold">LEGOVERSE</span></p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Snapping bricks together…</p>
      {/* progress made of bricks */}
      <div className="mt-6 flex gap-1" aria-label={`Loading ${Math.round(p)}%`}>
        {Array.from({ length: segments }).map((_, i) => {
          const on = p >= ((i + 1) / segments) * 100 - 1
          return (
            <span key={i} className="relative block h-4 w-4 rounded-[3px] transition-all duration-200" style={{ background: on ? ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc'][i % 5] : 'rgba(255,255,255,0.08)', transform: on ? 'translateY(0)' : 'translateY(2px)', boxShadow: on ? 'inset 0 -3px 0 rgba(0,0,0,0.3)' : 'none' }}>
              {on && <i className="absolute -top-[3px] left-1/2 h-[3px] w-2 -translate-x-1/2 rounded-t-[2px] bg-inherit" />}
            </span>
          )
        })}
      </div>
    </motion.div>
  )
}

export function IntroOverlay({ ready, onEnter }: { ready: boolean; onEnter: () => void }) {
  const openPanel = useGame((s) => s.openPanel)
  const setSetting = useGame((s) => s.setSetting)
  const sound = useGame((s) => s.sound)
  const [leaving, setLeaving] = useState(false)

  const enter = () => {
    if (leaving) return
    sfx.unlock()
    sfx.click()
    startAmbient()
    setLeaving(true)
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' || (ready && e.key === 'Enter')) enter() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, leaving])

  return (
    <>
      {/* role tag snaps in like a brick once the name is built */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[25vh] z-10 flex justify-center px-4 max-md:bottom-[30vh]">
        <motion.div
          initial={{ opacity: 0, y: -60, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 5.6, type: 'spring', stiffness: 260, damping: 14 }}
          className="relative rounded-md bg-gold px-6 py-2 font-display text-sm font-extrabold uppercase tracking-[0.4em] text-[#1a1405] shadow-[inset_0_-5px_0_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.5)] md:text-xl"
        >
          <i className="absolute -top-1.5 left-4 h-2 w-5 rounded-t-[3px] bg-gold" />
          <i className="absolute -top-1.5 right-4 h-2 w-5 rounded-t-[3px] bg-gold" />
          Developer
        </motion.div>
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-end pb-[8vh] text-center">
        <AnimatePresence>
          {ready && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="px-4">
              <p className="mx-auto max-w-[90vw] font-display text-sm font-medium tracking-[0.12em] text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] md:text-lg">{profile.subtitle}</p>
              <div className="pointer-events-auto mt-6 flex flex-wrap justify-center gap-3">
                <button className="btn-primary" onClick={enter}>ENTER MY WORLD</button>
                <button className="btn-ghost" onClick={() => { sfx.unlock(); sfx.click(); openPanel('resume') }}>VIEW RESUME</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed left-4 top-4 z-10 flex items-center gap-2 md:left-6 md:top-6">
        <span className="font-display text-sm font-bold text-white/90">Shreya's <span className="text-gold">LEGOVERSE</span></span>
      </div>
      <div className="fixed right-4 top-4 z-10 flex gap-2 md:right-6 md:top-6">
        <button className="hud-btn" onClick={() => { sfx.unlock(); setSetting('sound', !sound) }} aria-label="Toggle sound">{sound ? 'Sound on' : 'Sound off'}</button>
        <button className="hud-btn" onClick={enter}>Skip intro</button>
      </div>

      <AnimatePresence>
        {leaving && (
          <motion.div className="fixed inset-0 z-40 bg-[#05060a]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} onAnimationComplete={onEnter} />
        )}
      </AnimatePresence>
    </>
  )
}
