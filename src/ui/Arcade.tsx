import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame, type GameId } from '../store/game'
import { goldenBricks } from '../world/layout'
import { sfx } from '../lib/audio'
import { Icon, Meter } from './shared'

const DebugMaster = lazy(() => import('../games/DebugMaster'))
const BuildProject = lazy(() => import('../games/BuildProject'))
const DeveloperRace = lazy(() => import('../games/DeveloperRace'))

interface Card { id: GameId; name: string; text: string; color: string; icon: string; needs3D?: boolean }
const CARDS: Card[] = [
  { id: 'hunter', name: 'Brick Hunter', text: 'Find 10 golden bricks hidden across the islands.', color: '#f6c445', icon: 'brick', needs3D: true },
  { id: 'debug', name: 'Debug Master', text: 'Find the bug in real code. Three difficulty levels.', color: '#4ade80', icon: 'check' },
  { id: 'build', name: 'Build My Project', text: 'Place matching bricks to reveal one of my projects.', color: '#4da6ff', icon: 'brick' },
  { id: 'race', name: 'Developer Race', text: 'Race a brick car, collect tech tiles, dodge walls.', color: '#e4572e', icon: 'game', needs3D: true },
]

function Hunter({ onClose }: { onClose: () => void }) {
  const bricks = useGame((s) => s.bricks)
  const next = goldenBricks.find((b) => !bricks.includes(b.id))
  return (
    <div className="mx-auto max-w-xl text-center">
      <h2 className="font-display text-3xl font-bold text-white">Brick Hunter</h2>
      <p className="mt-1 text-white/60">Ten golden bricks glow on the islands. Walk into one to collect it.</p>
      <div className="my-6 grid grid-cols-5 gap-2">
        {goldenBricks.map((b) => (
          <div key={b.id} className={`flex aspect-[5/3] items-center justify-center rounded-lg border ${bricks.includes(b.id) ? 'border-gold bg-gold shadow-[0_0_24px_#f6c44566]' : 'border-white/10 bg-white/5'}`}>
            {bricks.includes(b.id) ? <Icon name="check" size={20} /> : <span className="font-mono text-xs text-white/30">?</span>}
          </div>
        ))}
      </div>
      <Meter value={bricks.length} max={10} />
      <p className="mt-2 text-sm text-white/60">{bricks.length}/10 collected</p>
      {next ? <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">Hint: {next.hint}</p> : <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">Golden Builder unlocked! You found every brick.</p>}
      <button className="btn-primary mt-6" onClick={onClose}>{bricks.length >= 10 ? 'Back to exploring' : 'Start hunting'}</button>
    </div>
  )
}

export default function Arcade({ allow3D = true }: { allow3D?: boolean }) {
  const panel = useGame((s) => s.panel)
  const game = useGame((s) => s.activeGame)
  const startGame = useGame((s) => s.startGame)
  const openPanel = useGame((s) => s.openPanel)
  const closePanel = useGame((s) => s.closePanel)
  const open = panel === 'arcade' || !!game
  const bricks = useGame((s) => s.bricks.length)

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (game) { startGame(null); openPanel('arcade') } else closePanel() } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, game, startGame, openPanel, closePanel])

  const exit = () => { sfx.close(); startGame(null); closePanel() }
  const back = () => { sfx.click(); startGame(null); openPanel('arcade') }
  const cards = CARDS.filter((c) => allow3D || !c.needs3D)

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="arcade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="stud-bg fixed inset-0 z-40 overflow-y-auto bg-[#07080d]/95 backdrop-blur-md" role="dialog" aria-label="Brick Arcade">
          <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-5">
            <header className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-[#7c3aed] p-2 text-white"><Icon name="game" size={22} /></span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c4a1ff]">Brick Arcade</p>
                  <p className="font-display text-xl font-bold text-white">{game ? cards.find((c) => c.id === game)?.name : 'Choose a game'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {game && <button className="hud-btn" onClick={back}>Game menu</button>}
                <button className="hud-btn !border-gold/40 !text-gold" onClick={exit}><Icon name="home" /> Back to portfolio</button>
              </div>
            </header>

            <div className="flex flex-1 items-start justify-center">
              {!game && (
                <motion.div className="grid w-full gap-4 sm:grid-cols-2" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.08 } } }}>
                  {cards.map((c) => (
                    <motion.button
                      key={c.id}
                      variants={{ h: { opacity: 0, y: 24 }, s: { opacity: 1, y: 0 } }}
                      whileHover={{ y: -4 }}
                      onClick={() => { sfx.click(); if (c.id === 'hunter') { startGame('hunter') } else startGame(c.id) }}
                      className="glass group relative overflow-hidden rounded-3xl p-6 text-left"
                    >
                      <span className="absolute -right-6 -top-6 h-28 w-28 rounded-3xl opacity-20 transition group-hover:scale-125" style={{ background: c.color }} />
                      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-black" style={{ background: c.color }}><Icon name={c.icon} size={24} /></span>
                      <span className="block font-display text-xl font-bold text-white">{c.name}</span>
                      <span className="mt-1 block text-sm text-white/60">{c.text}</span>
                      {c.id === 'hunter' && <span className="mt-3 block font-mono text-xs text-gold">{bricks}/10 bricks</span>}
                    </motion.button>
                  ))}
                </motion.div>
              )}
              {game && (
                <Suspense fallback={<p className="text-white/60">Loading game…</p>}>
                  {game === 'hunter' && <Hunter onClose={exit} />}
                  {game === 'debug' && <DebugMaster />}
                  {game === 'build' && <BuildProject />}
                  {game === 'race' && <DeveloperRace />}
                </Suspense>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
