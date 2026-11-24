import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'
import { Icon } from '../ui/shared'

type Level = 'easy' | 'medium' | 'hard'
interface Q { code: string; ask: string; options: [string, string, string]; answer: number; why: string }

const BANK: Record<Level, Q[]> = {
  easy: [
    { ask: 'sum(2, 3) returns -1. What is the fix?', code: 'function sum(a, b) {\n  return a - b;\n}', options: ['Change "-" to "+"', 'Rename the function to add', 'Mark the function async'], answer: 0, why: 'The operator subtracts. Addition needs "+".' },
    { ask: 'The loop logs an extra "undefined". Why?', code: 'const items = [1, 2, 3];\nfor (let i = 0; i <= items.length; i++) {\n  console.log(items[i]);\n}', options: ['Use "i < items.length"', 'Start i at 1', 'Use const instead of let'], answer: 0, why: 'Indexes stop at length - 1, so "<=" reads one past the end.' },
    { ask: 'Everyone becomes admin. What is wrong?', code: "if (user.role = 'admin') {\n  grantAccess();\n}", options: ['Add a semicolon', "Use === instead of =", 'Wrap in try/catch'], answer: 1, why: 'A single "=" assigns. Comparison needs "===".' },
    { ask: 'total should be 8 but is "53". Fix it.', code: "const qty = '5';\nconst total = qty + 3; // expected 8", options: ['Number(qty) + 3', 'qty.concat(3)', "qty + '3'"], answer: 0, why: 'A string plus a number concatenates. Convert to a number first.' },
  ],
  medium: [
    { ask: 'The component re-renders forever. Fix?', code: 'useEffect(() => {\n  setCount(count + 1);\n});', options: ['Remove useState', 'Add a dependency array that fits the intent, e.g. []', 'Call setCount twice'], answer: 1, why: 'Without a dependency array the effect runs after every render and updates state again.' },
    { ask: 'Changing copy also changes user. Why?', code: "const user = { name: 'Shreya' };\nconst copy = user;\ncopy.name = 'Ada';\nconsole.log(user.name); // 'Ada'", options: ['Objects are copied by reference. Use { ...user }', 'name is a reserved word', 'Use var instead of const'], answer: 0, why: 'Assigning an object copies the reference. Spread creates a new object.' },
    { ask: 'res.json is not a function. Fix?', code: "async function load() {\n  const res = fetch('/api/data');\n  const data = await res.json();\n}", options: ['Wrap res.json() in JSON.parse', 'Await the fetch call', 'Rename res to response'], answer: 1, why: 'fetch returns a Promise. It must be awaited before reading the response.' },
    { ask: 'Expected 0 1 2 but it logs 3 3 3. Fix?', code: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}', options: ['Use let for the loop variable', 'Increase the timeout', 'Use i-- instead of i++'], answer: 0, why: 'var is function scoped so every callback shares one i. let creates one per iteration.' },
  ],
  hard: [
    { ask: 'The list never updates on screen. Why?', code: 'function addItem(list, item) {\n  list.push(item);\n  return list;\n}\nsetItems(addItem(items, x));', options: ['Return a new array: [...list, item]', 'Call forceUpdate', 'Use unshift instead of push'], answer: 0, why: 'React compares references. Mutating and returning the same array looks unchanged.' },
    { ask: 'results.length is 0 when logged. Fix?', code: 'const results = [];\nids.forEach(async (id) => {\n  results.push(await getUser(id));\n});\nconsole.log(results.length);', options: ['Use a for loop with var', 'Use await Promise.all(ids.map(getUser))', 'Add a setTimeout before logging'], answer: 1, why: 'forEach does not await async callbacks. Promise.all waits for every promise.' },
    { ask: 'Expected [1, 9, 10] but got [1, 10, 9]. Fix?', code: 'const nums = [10, 9, 1];\nnums.sort(); // [1, 10, 9]', options: ['nums.reverse()', 'nums.sort((a, b) => a - b)', 'nums.sort(Number)'], answer: 1, why: 'Default sort compares strings. A numeric comparator is required.' },
    { ask: 'The counter stops at 1. Fix?', code: 'useEffect(() => {\n  const id = setInterval(() => {\n    setCount(count + 1);\n  }, 1000);\n  return () => clearInterval(id);\n}, []);', options: ['Remove the cleanup', 'Use setCount(c => c + 1)', 'Use a 0ms interval'], answer: 1, why: 'The closure captured count = 0 forever. The functional update reads the latest state.' },
  ],
}

const LEVELS: { id: Level; name: string; color: string; blurb: string }[] = [
  { id: 'easy', name: 'Apprentice', color: '#4ade80', blurb: 'Classic JavaScript slips' },
  { id: 'medium', name: 'Builder', color: '#f6c445', blurb: 'React and async traps' },
  { id: 'hard', name: 'Architect', color: '#e4572e', blurb: 'State, closures, promises' },
]

function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr]
  let s = seed + 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function DebugMaster() {
  const unlock = useGame((s) => s.unlock)
  const [level, setLevel] = useState<Level | null>(null)
  const [idx, setIdx] = useState(0)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [shakeKey, setShakeKey] = useState(0)

  const qs = level ? BANK[level] : []
  const q = qs[idx]
  const order = useMemo(() => (q ? shuffle([0, 1, 2], idx * 7 + (level === 'easy' ? 1 : level === 'medium' ? 2 : 3)) : []), [q, idx, level])
  const finished = !!level && (idx >= qs.length || (lives <= 0 && picked === null))

  const start = (l: Level) => {
    sfx.click()
    setLevel(l); setIdx(0); setLives(3); setScore(0); setStreak(0); setCorrectCount(0); setPicked(null)
  }

  const pick = (optIndex: number) => {
    if (picked !== null || !q) return
    setPicked(optIndex)
    if (optIndex === q.answer) {
      sfx.success()
      setScore((s) => s + 100 + streak * 25)
      setStreak((s) => s + 1)
      setCorrectCount((c) => c + 1)
    } else {
      sfx.fail()
      setLives((l) => l - 1)
      setStreak(0)
      setShakeKey((k) => k + 1)
    }
  }

  const next = () => {
    sfx.click()
    const done = idx + 1 >= qs.length
    if (done && correctCount >= 3) unlock('bug-squasher')
    setPicked(null)
    setIdx((i) => i + 1)
  }

  if (!level) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-white">Debug Master</h2>
        <p className="mt-1 text-white/60">Spot the bug, pick the fix. Three lives per level.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {LEVELS.map((l) => (
            <button key={l.id} onClick={() => start(l.id)} className="glass group rounded-2xl p-5 text-left transition hover:-translate-y-1 hover:border-white/40">
              <span className="mb-3 block h-1.5 w-12 rounded-full" style={{ background: l.color }} />
              <span className="block font-display text-xl font-bold text-white">{l.name}</span>
              <span className="text-sm capitalize text-white/50">{l.id} · {l.blurb}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (finished) {
    const won = correctCount >= 3 && lives > 0
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto max-w-md text-center">
        <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${won ? 'bg-emerald-400 text-black' : 'bg-red-500 text-white'}`}><Icon name={won ? 'check' : 'close'} size={40} /></div>
        <h2 className="font-display text-3xl font-bold text-white">{won ? 'Level cleared!' : 'Out of lives'}</h2>
        <p className="mt-2 text-white/60">{correctCount}/{qs.length} bugs squashed · {score} points</p>
        {won && <p className="mt-1 text-sm text-gold">Achievement: Bug Squasher</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-primary" onClick={() => start(level)}>Play again</button>
          <button className="btn-ghost" onClick={() => setLevel(null)}>Choose level</button>
        </div>
      </motion.div>
    )
  }

  const answered = picked !== null
  const good = answered && picked === q.answer
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-mono uppercase tracking-widest text-white/50">{level} · {idx + 1}/{qs.length}</span>
        <span className="flex items-center gap-4 text-white/80">
          <span>Score <b className="text-gold">{score}</b></span>
          <span>Streak <b className="text-white">{streak}</b></span>
          <span className="flex gap-1" aria-label={`${lives} lives left`}>{[0, 1, 2].map((i) => <span key={i} className={`h-3.5 w-3.5 rounded-sm ${i < lives ? 'bg-red-500' : 'bg-white/15'}`} />)}</span>
        </span>
      </div>

      <div key={shakeKey} className={answered && !good ? 'shake' : ''}>
        <div className={`overflow-hidden rounded-2xl border transition-colors ${answered ? (good ? 'border-emerald-400' : 'border-red-500') : 'border-white/10'} bg-[#0a0c12]`}>
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2"><i className="h-2.5 w-2.5 rounded-full bg-red-400" /><i className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><i className="h-2.5 w-2.5 rounded-full bg-green-400" /><span className="ml-3 font-mono text-xs text-white/40">bug.js</span></div>
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-emerald-200/90" style={{ userSelect: 'text' }}>
            {q.code.split('\n').map((line, i) => (<div key={i}><span className="mr-4 inline-block w-4 text-right text-white/25">{i + 1}</span>{line}</div>))}
          </pre>
        </div>
      </div>

      <p className="mt-4 font-display text-lg font-semibold text-white">{q.ask}</p>
      <div className="mt-3 grid gap-2">
        {order.map((oi) => {
          const isPicked = picked === oi
          const isAnswer = q.answer === oi
          const cls = !answered ? 'border-white/10 bg-white/5 hover:border-gold hover:bg-white/10' : isAnswer ? 'border-emerald-400 bg-emerald-400/15' : isPicked ? 'border-red-500 bg-red-500/15' : 'border-white/10 bg-white/5 opacity-50'
          return (
            <button key={oi} disabled={answered} onClick={() => pick(oi)} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left font-mono text-sm text-white transition ${cls}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs">{String.fromCharCode(65 + order.indexOf(oi))}</span>
              {q.options[oi]}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${good ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-red-500/50 bg-red-500/10'}`}>
            <p className="max-w-lg text-sm text-white/90"><b>{good ? 'Bug squashed! ' : 'Not quite. '}</b>{q.why}</p>
            <button className="btn-primary !py-2" onClick={next}>{idx + 1 >= qs.length || lives <= 0 ? 'See results' : 'Next bug'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
