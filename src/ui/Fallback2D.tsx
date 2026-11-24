import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { achievementList, awsServices, certifications, experienceAreas, journey, profile, projects, techs } from '../data/content'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'
import { Contact } from './InfoPanel'
import { Icon, LinkButton, Shot } from './shared'

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = useGame((s) => s.reducedMotion)
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

function Block({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-5xl scroll-mt-20 px-5 py-16">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">{kicker}</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-white md:text-4xl">{title}</h2>
      </Reveal>
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** Lightweight page version for devices without WebGL or when the user prefers it. */
export default function Fallback2D({ canTry3D }: { canTry3D: boolean }) {
  const openPanel = useGame((s) => s.openPanel)
  const setSetting = useGame((s) => s.setSetting)
  const [open, setOpen] = useState<string | null>(null)
  const links = [['story', 'Story'], ['tech', 'Tech'], ['projects', 'Projects'], ['aws', 'AWS'], ['career', 'Career'], ['contact', 'Contact']]
  return (
    <div className="scroll-y fixed inset-0 bg-[#07080d]" style={{ scrollBehavior: 'smooth' }}>
      <nav className="glass sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-display text-sm font-bold text-white">Shreya's <span className="text-gold">LEGOVERSE</span></span>
        <div className="hidden gap-4 text-sm text-white/70 md:flex">{links.map(([id, l]) => <a key={id} href={`#${id}`} className="hover:text-white">{l}</a>)}</div>
        <div className="flex gap-2">
          <button className="hud-btn !h-9" onClick={() => { sfx.click(); openPanel('arcade') }}><Icon name="game" /> Arcade</button>
          <button className="hud-btn !h-9" onClick={() => { sfx.click(); openPanel('resume') }}><Icon name="resume" /> Resume</button>
        </div>
      </nav>

      <header className="stud-bg relative flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 grid grid-cols-4 gap-1" aria-hidden>
          {['#e4572e', '#f6c445', '#4da6ff', '#4ade80', '#c084fc', '#f4f4f2', '#ff9a3c', '#2dd4bf'].map((c, i) => <motion.i key={i} className="h-6 w-10 rounded-md" style={{ background: c }} initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i, type: 'spring' }} />)}
        </motion.div>
        <h1 className="font-display text-5xl font-bold tracking-tight text-white md:text-7xl">{profile.name.toUpperCase()}</h1>
        <p className="mt-4 max-w-xl text-white/70">{profile.subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a className="btn-primary" href="#projects">See my work</a>
          <button className="btn-ghost" onClick={() => openPanel('resume')}>View resume</button>
          {canTry3D && <button className="btn-ghost" onClick={() => setSetting('force2D', false)}>Try the 3D world</button>}
        </div>
      </header>

      <Block id="story" kicker="My Story" title={profile.intro[0]}>
        <Reveal><p className="max-w-2xl text-lg text-white/75">{profile.intro.slice(1).join(' ')}</p></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {journey.map((j, i) => (
            <Reveal key={j.title} delay={i * 0.05}>
              <div className="glass h-full rounded-2xl p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-gold">{j.when}</p><p className="font-display text-lg font-semibold text-white">{j.title}</p><p className="text-xs text-white/50">{j.org}</p><p className="mt-2 text-sm text-white/70">{j.text}</p></div>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block id="tech" kicker="Developer City" title="Tools I build with">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {techs.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.05}>
              <div className="glass h-full rounded-2xl p-4" style={{ borderTop: `3px solid ${t.color}` }}>
                <p className="font-display font-semibold text-white">{t.name}</p>
                <p className="mt-1 text-sm text-white/65">{t.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block id="projects" kicker="Construction Island" title="Projects">
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <div className="glass h-full rounded-2xl p-5" style={{ borderTop: `3px solid ${p.color}` }}>
                <p className="font-display text-xl font-bold text-white">{p.name}</p>
                <p className="text-sm text-white/55">{p.tagline}</p>
                <p className="mt-3 text-sm text-white/75">{p.description}</p>
                {open === p.id && (
                  <div className="mt-3 space-y-3 text-sm text-white/75">
                    <ul className="list-disc pl-5">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                    <p><b className="text-white">My contribution:</b> {p.contribution}</p>
                    <div className="grid grid-cols-2 gap-2">{p.screenshots.map((s, k) => <Shot key={s} src={s} color={p.color} label={`${p.name} screenshot ${k + 1}`} />)}</div>
                    <div className="flex flex-wrap gap-2"><LinkButton href={p.github} icon="github">GitHub</LinkButton><LinkButton href={p.live} icon="link">Live project</LinkButton></div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">{p.tech.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                <button className="mt-4 text-sm font-semibold text-gold hover:underline" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Show less' : 'Show details'}</button>
              </div>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block id="aws" kicker="AWS Cloud Kingdom" title={certifications[0].name}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {awsServices.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.05}><div className="glass h-full rounded-2xl p-4" style={{ borderTop: `3px solid ${s.color}` }}><p className="font-display font-semibold text-white">{s.name}</p><p className="mt-1 text-sm text-white/65">{s.text}</p></div></Reveal>
          ))}
        </div>
      </Block>

      <Block id="career" kicker="Experience & Achievements" title={`${profile.role}, ${profile.company}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {experienceAreas.slice(1).map((e, i) => (
            <Reveal key={e.id} delay={(i % 2) * 0.05}><div className="glass h-full rounded-2xl p-4"><p className="font-display font-semibold text-white">{e.name}</p><p className="mt-1 text-sm text-white/65">{e.text}</p></div></Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-6 flex flex-wrap gap-2">{achievementList.map((a) => <span key={a.id} className="chip" title={a.text}>{a.name}</span>)}</div>
        </Reveal>
      </Block>

      <Block id="contact" kicker="Contact" title={profile.contactHeading}>
        <Reveal><div className="glass mx-auto max-w-lg rounded-3xl p-6"><Contact /></div></Reveal>
      </Block>
      <footer className="pb-10 text-center text-xs text-white/40">
        <a href={`mailto:${profile.email}`} className="font-mono text-white/70 hover:text-gold">{profile.email}</a>
        <p className="mt-2 text-white/30">Shreya Shah · Built with React, Three.js and a lot of bricks</p>
      </footer>
    </div>
  )
}
