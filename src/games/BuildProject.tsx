import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { projects } from '../data/content'
import { useGame } from '../store/game'
import { sfx } from '../lib/audio'

const COLORS: Record<string, { hex: string; name: string }> = {
  r: { hex: '#e4572e', name: 'Red' },
  b: { hex: '#4da6ff', name: 'Blue' },
  y: { hex: '#f6c445', name: 'Yellow' },
  g: { hex: '#4ade80', name: 'Green' },
  w: { hex: '#f4f4f2', name: 'White' },
  k: { hex: '#394150', name: 'Slate' },
  p: { hex: '#c084fc', name: 'Purple' },
  o: { hex: '#ff9a3c', name: 'Orange' },
}

const PATTERNS: Record<string, string[]> = {
  'third-eye': ['..kkkk..', 'kkkkkkkk', 'kwwbbwwk', 'kwbbbbwk', 'kwwbbwwk', 'kkkkkkkk', '..yyyy..'],
  iocl: ['oooooooo', 'owwwwwwo', 'owbbgyoo', 'owbbgyyo', 'owwwwwwo', 'okkkkkko', 'okkwwkko'],
  'cert-gen': ['gggggggg', 'gwwwwwwg', 'gwyyyywg', 'gwwwwwwg', 'gwwppwwg', 'gwwppwwg', 'gggggggg'],
  chatbots: ['.pppppp.', 'pwwwwwwp', 'pwkwkwkp', 'pwwwwwwp', '.pppppp.', '..pp....', '...p....'],
}

const isMissing = (x: number, y: number) => (x * 3 + y * 5) % 4 === 1

function Cell({ color, state, onClick, hint }: { color: string; state: 'filled' | 'missing' | 'placed' | 'empty'; onClick?: () => void; hint?: string }) {
  if (state === 'empty') return <div className="h-9 w-9 md:h-11 md:w-11" />
  const base = 'relative h-9 w-9 rounded-[6px] md:h-11 md:w-11'
  if (state === 'missing') {
    return (
      <button onClick={onClick} aria-label={`Empty slot, needs ${hint}`} className={`${base} border-2 border-dashed transition hover:scale-105`} style={{ borderColor: color + '99', background: color + '1f' }} />
    )
  }
  return (
    <div className={`${base} shadow-[inset_0_-4px_0_rgba(0,0,0,0.25)]`} style={{ background: color, animation: state === 'placed' ? 'brickDrop 0.45s ease-out' : undefined }}>
      <i className="absolute left-1/2 top-[18%] h-[34%] w-[34%] -translate-x-1/2 rounded-full bg-white/30" />
    </div>
  )
}

export default function BuildProject() {
  const unlock = useGame((s) => s.unlock)
  const buildSite = useGame((s) => s.buildSite)
  const builtSites = useGame((s) => s.builtSites)
  const startGame = useGame((s) => s.startGame)
  const openInfo = useGame((s) => s.openInfo)
  const [pid, setPid] = useState<string | null>(null)
  const [placed, setPlaced] = useState<Set<string>>(new Set())
  const [picked, setPicked] = useState<string | null>(null)
  const [wrong, setWrong] = useState(0)
  const [wrongKey, setWrongKey] = useState(0)

  const project = projects.find((p) => p.id === pid)
  const grid = pid ? PATTERNS[pid] : []
  const missing = useMemo(() => {
    const m: { x: number; y: number; c: string }[] = []
    grid.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.' && isMissing(x, y)) m.push({ x, y, c }) }))
    return m
  }, [grid])
  const complete = !!pid && missing.length > 0 && missing.every((m) => placed.has(`${m.x},${m.y}`))
  const trayColors = useMemo(() => [...new Set(missing.map((m) => m.c))], [missing])

  const begin = (id: string) => {
    sfx.click()
    setPid(id); setPlaced(new Set()); setPicked(null); setWrong(0)
  }

  const place = (x: number, y: number, c: string) => {
    if (!picked) { sfx.hover(); return }
    if (picked !== c) {
      sfx.fail(); setWrong((w) => w + 1); setWrongKey((k) => k + 1)
      return
    }
    sfx.place()
    const next = new Set(placed)
    next.add(`${x},${y}`)
    setPlaced(next)
    if (missing.every((m) => next.has(`${m.x},${m.y}`))) {
      setTimeout(() => {
        sfx.success()
        unlock('architect')
        if (pid) buildSite(pid)
      }, 350)
    }
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-white">Build My Project</h2>
        <p className="mt-1 text-white/60">Each building is missing bricks. Match the colours to finish it and reveal a real project.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <button key={p.id} onClick={() => begin(p.id)} className="glass relative rounded-2xl p-5 text-left transition hover:-translate-y-1 hover:border-white/40">
              <span className="mb-3 block h-1.5 w-12 rounded-full" style={{ background: p.color }} />
              <span className="block font-display text-lg font-bold text-white">{builtSites.includes(p.id) ? p.name : 'Mystery building'}</span>
              <span className="text-sm text-white/50">{builtSites.includes(p.id) ? 'Completed' : 'Incomplete · 3 to 6 bricks missing'}</span>
              <div className="mt-3 flex flex-wrap gap-0.5">{[...PATTERNS[p.id][2]].slice(0, 8).map((c, i) => <i key={i} className="h-3 w-3 rounded-sm" style={{ background: COLORS[c]?.hex ?? 'transparent', opacity: builtSites.includes(p.id) ? 1 : 0.35 }} />)}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">{complete ? project.name : 'Mystery building'}</h2>
        <button className="btn-ghost !px-3 !py-2" onClick={() => setPid(null)}>All buildings</button>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div key={wrongKey} className={`relative flex justify-center rounded-2xl border border-white/10 bg-[#0a0c12] p-6 stud-bg ${wrongKey ? 'shake' : ''}`}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))` }}>
            {grid.flatMap((row, y) => [...row].map((c, x) => {
              if (c === '.') return <Cell key={`${x}${y}`} color="#000" state="empty" />
              const col = COLORS[c].hex
              if (!isMissing(x, y)) return <Cell key={`${x}${y}`} color={col} state="filled" />
              const done = placed.has(`${x},${y}`)
              return <Cell key={`${x}${y}`} color={col} state={done ? 'placed' : 'missing'} hint={COLORS[c].name} onClick={() => place(x, y, c)} />
            }))}
          </div>
          <AnimatePresence>
            {complete && Array.from({ length: 18 }).map((_, i) => (
              <motion.i key={i} className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-4 rounded-sm" style={{ background: Object.values(COLORS)[i % 8].hex }} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: (Math.cos(i) * 180) | 0, y: (Math.sin(i * 1.7) * 160) | 0, opacity: 0, rotate: i * 60 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            ))}
          </AnimatePresence>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/40">Brick tray</p>
          <div className="grid grid-cols-2 gap-2">
            {trayColors.map((c) => {
              const left = missing.filter((m) => m.c === c && !placed.has(`${m.x},${m.y}`)).length
              const sel = picked === c
              return (
                <button key={c} disabled={left === 0} onClick={() => { sfx.click(); setPicked(c) }} aria-pressed={sel} className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs transition disabled:opacity-30 ${sel ? 'border-gold bg-gold/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                  <i className="h-6 w-6 rounded-md shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]" style={{ background: COLORS[c].hex }} />
                  <span className="text-white/80">{COLORS[c].name}<br /><b className="text-white">×{left}</b></span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-white/50">Pick a colour, then click a matching dashed slot. Misplaced bricks: {wrong}</p>
        </div>
      </div>

      <AnimatePresence>
        {complete && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border p-5" style={{ borderColor: project.color + '99', background: project.color + '18' }}>
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: project.color }}>Project revealed</p>
            <h3 className="font-display text-2xl font-bold text-white">{project.name}</h3>
            <p className="text-white/70">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => { startGame(null); openInfo(`project-${project.id}`) }}>View in the world</button>
              <button className="btn-ghost" onClick={() => setPid(null)}>Build another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
