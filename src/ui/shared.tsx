import { motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'

const paths: Record<string, string> = {
  sound: 'M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12',
  mute: 'M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2-1.2L14.6 3h-4l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7.400 7.400 0 0 0 0 2.400l-2 1.500 2 3.400 2.300-.900a7.600 7.600 0 0 0 2 1.200l.4 2.600h4l.4-2.600a7.600 7.600 0 0 0 2-1.200l2.300.900 2-3.400-2-1.500c.1-.4.100-.8.100-1.200Z',
  resume: 'M7 3h8l4 4v14H7V3Zm8 0v4h4M10 12h6M10 16h6',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  game: 'M6 9h12a3 3 0 0 1 3 3v3a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-3a3 3 0 0 1 3-3Zm2 2v4m-2-2h4m6-1h.01m2 2h.01',
  close: 'M6 6l12 12M18 6 6 18',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z',
  brick: 'M3 10h18v9H3v-9Zm3-4h4v4H6V6Zm8 0h4v4h-4V6Z',
  github: 'M12 2a10 10 0 0 0-3.2 19.500c.5.100.700-.200.700-.500v-1.800c-2.800.600-3.400-1.200-3.400-1.200-.500-1.200-1.100-1.500-1.100-1.500-.900-.600.100-.600.100-.600 1 .100 1.500 1 1.500 1 .900 1.500 2.300 1.100 2.900.800.100-.600.300-1.100.600-1.300-2.200-.300-4.500-1.100-4.500-5 0-1.100.400-2 1-2.700-.100-.300-.400-1.300.100-2.700 0 0 .800-.300 2.700 1a9.400 9.400 0 0 1 5 0c1.900-1.300 2.700-1 2.700-1 .500 1.400.200 2.400.100 2.700.600.700 1 1.600 1 2.700 0 3.900-2.300 4.700-4.600 5 .400.300.700.900.700 1.800v2.700c0 .300.200.600.700.500A10 10 0 0 0 12 2Z',
  mail: 'M3 6h18v12H3V6Zm0 0 9 7 9-7',
  link: 'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
  up: 'M12 19V5m-6 6 6-6 6 6',
  hand: 'M8 12V6a1.500 1.500 0 0 1 3 0v5m0-6a1.500 1.500 0 0 1 3 0v6m0-4a1.500 1.500 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.500 1.500 0 0 1 2.500-1.500L8 14',
  check: 'm5 13 4 4 10-10',
  car: 'M5 16v-5l2-4h10l2 4v5M3 16h18M7.500 19a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3Zm9 0a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3ZM5 11h14',
  bike: 'M6 18a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7Zm12 0a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7ZM6 14.500 10 7.500h5l3 7M10 7.500l3 7H6M9 6h3',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 5v14l11-7L7 5Z',
  stop: 'M6 6h12v12H6V6Z',
}

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name] ?? paths.brick} />
    </svg>
  )
}

export function Panel({ title, kicker, color = '#f6c445', onClose, children, wide, footer }: { title: string; kicker?: string; color?: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <motion.aside
      role="dialog"
      aria-label={title}
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      className={`glass pointer-events-auto fixed z-40 flex max-h-[78vh] flex-col overflow-hidden rounded-3xl max-md:inset-x-2 max-md:bottom-2 md:bottom-6 md:right-6 md:top-20 md:max-h-none ${wide ? 'md:w-[520px]' : 'md:w-[440px]'}`}
    >
      <div className="h-1.5 w-full" style={{ background: color }} />
      <header className="flex items-start justify-between gap-3 px-6 pb-3 pt-5">
        <div>
          {kicker && <p className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color }}>{kicker}</p>}
          <h2 className="font-display text-2xl font-bold leading-tight text-white">{title}</h2>
        </div>
        <button className="hud-btn !h-9 !w-9 justify-center !px-0" onClick={() => { sfx.close(); onClose() }} aria-label="Close panel"><Icon name="close" /></button>
      </header>
      <div className="scroll-y flex-1 px-6 pb-6 text-sm leading-relaxed text-white/80">{children}</div>
      {footer && <footer className="border-t border-white/10 px-6 py-3">{footer}</footer>}
    </motion.aside>
  )
}

/** Email address with open-mail and copy actions. */
export function EmailCard({ email, compact }: { email: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    sfx.click()
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const t = document.createElement('textarea')
      t.value = email
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 ${compact ? 'p-2.5' : 'p-3.5'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-black"><Icon name="mail" size={18} /></span>
      <a href={`mailto:${email}`} onClick={() => sfx.click()} className="min-w-0 flex-1 truncate font-mono text-[13px] font-semibold text-white hover:text-gold" style={{ userSelect: 'text' }}>{email}</a>
      <button onClick={copy} className="shrink-0 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-gold hover:bg-white/10" aria-live="polite">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">{title}</h3>
      {children}
    </section>
  )
}

export function LinkButton({ href, icon, children }: { href: string; icon: string; children: ReactNode }) {
  if (!href) {
    return (
      <span title="Link not added yet" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2 text-xs text-white/40">
        <Icon name={icon} size={15} /> {children} <span className="text-[10px]">soon</span>
      </span>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" onClick={() => sfx.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-gold hover:bg-white/10">
      <Icon name={icon} size={15} /> {children}
    </a>
  )
}

/** Image with a branded placeholder if the asset is not provided. */
export function Shot({ src, label, color }: { src: string; label: string; color: string }) {
  const [bad, setBad] = useState(false)
  if (bad) {
    return (
      <div className="stud-bg flex aspect-video items-end rounded-xl border border-white/10 p-3 text-[11px] text-white/60" style={{ background: `linear-gradient(135deg, ${color}55, #10131c)` }}>
        {label}
      </div>
    )
  }
  return <img src={src} alt={label} loading="lazy" onError={() => setBad(true)} className="aspect-video w-full rounded-xl border border-white/10 object-cover" />
}

export function Meter({ value, max, color = '#f6c445' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  )
}

export function useReduced() {
  return useGame((s) => s.reducedMotion)
}
