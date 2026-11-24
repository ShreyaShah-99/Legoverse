import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './store/game'
import { IntroOverlay, LoadingScreen } from './ui/Intro'
import HUD, { TravelWipe } from './ui/HUD'
import InfoPanel from './ui/InfoPanel'
import { ResumePanel, SettingsPanel } from './ui/ResumeSettings'
import Arcade from './ui/Arcade'
import Fallback2D from './ui/Fallback2D'
import { sfx } from './lib/audio'

const Intro3D = lazy(() => import('./three/Intro'))
const World = lazy(() => import('./world/World'))

function detectWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function Overlays({ allow3D }: { allow3D: boolean }) {
  const panel = useGame((s) => s.panel)
  return (
    <>
      <AnimatePresence mode="wait">
        {panel === 'info' && <InfoPanel key="info" />}
        {panel === 'resume' && <ResumePanel key="resume" />}
        {panel === 'settings' && <SettingsPanel key="settings" />}
      </AnimatePresence>
      <Arcade allow3D={allow3D} />
    </>
  )
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const force2D = useGame((s) => s.force2D)
  const reduced = useGame((s) => s.reducedMotion)
  const [introReady, setIntroReady] = useState(false)
  const webgl = useMemo(detectWebGL, [])
  const use2D = !webgl || force2D

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reduced)
  }, [reduced])

  // Weak devices start in low-graphics mode the first time they visit.
  useEffect(() => {
    if (localStorage.getItem('legoverse-v1')) return
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory
    if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (mem && mem <= 4)) useGame.getState().setSetting('lowGfx', true)
  }, [])

  useEffect(() => {
    const unlock = () => sfx.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const onReady = useCallback(() => setIntroReady(true), [])
  const toWorld = useCallback(() => setPhase('world'), [setPhase])

  if (use2D) {
    return (
      <>
        <Fallback2D canTry3D={webgl} />
        <Overlays allow3D={false} />
      </>
    )
  }

  return (
    <>
      <AnimatePresence>
        {phase === 'loading' && <LoadingScreen key="loading" onDone={() => setPhase('intro')} />}
      </AnimatePresence>

      {phase === 'intro' && (
        <>
          <div className="fixed inset-0">
            <Suspense fallback={null}><Intro3D onReady={onReady} /></Suspense>
          </div>
          <IntroOverlay ready={introReady} onEnter={toWorld} />
        </>
      )}

      {phase === 'world' && (
        <>
          <div className="fixed inset-0">
            <Suspense fallback={null}><World /></Suspense>
          </div>
          <HUD />
          <TravelWipe />
          <motion.div className="pointer-events-none fixed inset-0 z-[45] bg-[#05060a]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
        </>
      )}

      <Overlays allow3D />
    </>
  )
}
