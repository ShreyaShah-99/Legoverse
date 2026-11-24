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
  const colors = ['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc']
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05060a]" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <div className="relative h-24 w-48">
        {colors.map((c, i) => (
          <span key={c} className="absolute h-8 w-20 rounded-md shadow-[inset_0_-5px_0_rgba(0,0,0,0.3)]" style={{ background: c, left: (i % 2) * 44 + 12, bottom: Math.floor(i / 2) * 34 + (i === 4 ? 0 : 0), animation: `brickDrop 0.6s ${i * 0.35}s both ease-out` }}>
            <i className="absolute -top-1.5 left-3 h-2.5 w-4 rounded-t-sm" style={{ background: c }} />
            <i className="absolute -top-1.5 right-3 h-2.5 w-4 rounded-t-sm" style={{ background: c }} />
          </span>
        ))}
      </div>
      <p className="mt-6 font-display text-2xl font-bold tracking-wide text-white">Shreya's <span className="text-gold">LEGOVERSE</span></p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Sorting bricks…</p>
      <div className="mt-6 h-1.5 w-60 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold transition-all duration-200" style={{ width: `${p}%` }} /></div>
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
