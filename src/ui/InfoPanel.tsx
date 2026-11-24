import { useState, type FormEvent } from 'react'
import { achievementList, awsServices, certifications, experienceAreas, journey, profile, projects, techs } from '../data/content'
import { sfx } from '../lib/audio'
import { useGame } from '../store/game'
import { interactableById } from '../world/layout'
import { EmailCard, Icon, LinkButton, Meter, Panel, Section, Shot } from './shared'

function Story() {
  const openPanel = useGame((s) => s.openPanel)
  return (
    <>
      <div className="space-y-3 text-[15px] text-white/85">
        {profile.intro.map((t, i) => <p key={i} className={i === 0 ? 'font-display text-lg font-semibold text-white' : ''}>{t}</p>)}
      </div>
      <Section title="Professional journey">
        <ol className="relative space-y-4 border-l border-white/15 pl-5">
          {journey.map((j) => (
            <li key={j.title} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-sm bg-gold" />
              <p className="font-display text-sm font-semibold text-white">{j.title} <span className="font-normal text-white/50">· {j.org}</span></p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold/80">{j.when}</p>
              <p className="mt-1 text-white/70">{j.text}</p>
            </li>
          ))}
        </ol>
      </Section>
      <div className="mt-6 flex gap-2">
        <button className="btn-primary" onClick={() => openPanel('resume')}>View resume</button>
      </div>
    </>
  )
}

function Tech({ id }: { id: string }) {
  const t = techs.find((x) => x.id === id)!
  const used = projects.filter((p) => p.tech.includes(t.name))
  return (
    <>
      <p className="text-[15px] text-white/85">{t.blurb}</p>
      <Section title="Practical experience">
        <ul className="space-y-2">
          {t.uses.map((u) => <li key={u} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: t.color }} />{u}</li>)}
        </ul>
      </Section>
      {used.length > 0 && (
        <Section title="Used in">
          <div className="flex flex-wrap gap-2">{used.map((p) => <span key={p.id} className="chip">{p.name}</span>)}</div>
        </Section>
      )}
    </>
  )
}

function Project({ id }: { id: string }) {
  const p = projects.find((x) => x.id === id)!
  return (
    <>
      <p className="text-[15px] text-white/85">{p.description}</p>
      <Section title="Features"><ul className="space-y-1.5">{p.features.map((f) => <li key={f} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />{f}</li>)}</ul></Section>
      <Section title="Technologies"><div className="flex flex-wrap gap-2">{p.tech.map((t) => <span key={t} className="chip">{t}</span>)}</div></Section>
      <Section title="My contribution"><p>{p.contribution}</p></Section>
      <Section title="Screenshots">
        <div className="grid grid-cols-2 gap-2">{p.screenshots.map((s, i) => <Shot key={s} src={s} color={p.color} label={`${p.name} screenshot ${i + 1}`} />)}</div>
      </Section>
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={p.github} icon="github">GitHub</LinkButton>
        <LinkButton href={p.live} icon="link">Live project</LinkButton>
      </div>
    </>
  )
}

function Aws({ id }: { id: string }) {
  const s = awsServices.find((x) => x.id === id)!
  return <p className="text-[15px] text-white/85">{s.text}</p>
}

function Badge() {
  const [bad, setBad] = useState(false)
  const c = certifications[0]
  return (
    <>
      <div className="flex justify-center py-2">
        {bad ? (
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-[#ff9900] bg-[#232f3e] text-center shadow-[0_0_40px_#ff990055]">
            <span className="font-display text-2xl font-bold text-[#ff9900]">AWS</span>
            <span className="px-4 text-[10px] uppercase tracking-wider text-white/80">Certified Developer Associate</span>
          </div>
        ) : (
          <img src={c.badge} alt="AWS Certified Developer Associate badge" onError={() => setBad(true)} className="h-40 w-40 object-contain" />
        )}
      </div>
      <h3 className="text-center font-display text-lg font-semibold text-white">{c.name}</h3>
      <p className="text-center text-white/60">{c.issuer}</p>
      <Section title="What it covers">
        <p>Building, deploying and debugging cloud applications on AWS using services such as Lambda, API Gateway, S3, Cognito and RDS.</p>
      </Section>
      <p className="mt-4 text-xs text-white/40">Place the official badge image at <code className="text-white/60">public/aws-badge.png</code> to show it here and on the monument.</p>
    </>
  )
}

function Exp({ id }: { id: string }) {
  const e = experienceAreas.find((x) => x.id === id)!
  return (
    <>
      <p className="text-[15px] text-white/85">{e.text}</p>
      {id === 'role' && (
        <Section title="Current role">
          <p className="font-display text-base font-semibold text-white">{profile.role}, {profile.company}</p>
          <ul className="mt-2 space-y-1">{experienceAreas.slice(1).map((x) => <li key={x.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm bg-gold" />{x.name}</li>)}</ul>
        </Section>
      )}
    </>
  )
}

function Achievements() {
  const unlocked = useGame((s) => s.achievements)
  const bricks = useGame((s) => s.bricks.length)
  return (
    <>
      <Section title="Certifications"><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff9900] font-display font-bold text-[#232f3e]">AWS</span><div><p className="font-semibold text-white">{certifications[0].name}</p><p className="text-xs text-white/50">{certifications[0].issuer}</p></div></div></Section>
      <Section title="Professional milestones">
        <ul className="space-y-1.5">
          <li className="flex gap-2"><span className="mt-1.5 h-2 w-2 rounded-sm bg-gold" />{profile.role}, {profile.company}</li>
          {projects.map((p) => <li key={p.id} className="flex gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />Delivered {p.name}</li>)}
        </ul>
      </Section>
      <Section title={`Game achievements (${unlocked.length}/${achievementList.length})`}>
        <ul className="space-y-2">
          {achievementList.map((a) => {
            const on = unlocked.includes(a.id)
            return (
              <li key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${on ? 'border-gold/50 bg-gold/10' : 'border-white/10 opacity-60'}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${on ? 'bg-gold text-black' : 'bg-white/10'}`}><Icon name={on ? 'check' : 'brick'} size={16} /></span>
                <span><span className="block font-semibold text-white">{a.name}</span><span className="text-xs text-white/60">{a.text}</span></span>
              </li>
            )
          })}
        </ul>
        <div className="mt-3"><p className="mb-1 text-xs text-white/50">Golden bricks {bricks}/10</p><Meter value={bricks} max={10} /></div>
      </Section>
    </>
  )
}

function Contact() {
  const [state, setState] = useState<'idle' | 'sent' | 'noemail'>('idle')
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (!profile.email) { setState('noemail'); return }
    const subject = encodeURIComponent(`Portfolio message from ${f.get('name')}`)
    const body = encodeURIComponent(`${f.get('message')}\n\n${f.get('name')} (${f.get('email')})`)
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
    sfx.success()
    setState('sent')
  }
  const input = 'w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-gold'
  return (
    <>
      <p className="font-display text-lg font-semibold leading-snug text-white">{profile.contactHeading}</p>
      <div className="mt-4"><EmailCard email={profile.email} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <LinkButton href={profile.email ? `mailto:${profile.email}` : ''} icon="mail">Email</LinkButton>
        <LinkButton href={profile.linkedin} icon="link">LinkedIn</LinkButton>
        <LinkButton href={profile.github} icon="github">GitHub</LinkButton>
      </div>
      <form onSubmit={submit} className="mt-5 space-y-3" style={{ userSelect: 'text' }}>
        <input name="name" required placeholder="Your name" className={input} aria-label="Your name" />
        <input name="email" type="email" required placeholder="Your email" className={input} aria-label="Your email" />
        <textarea name="message" required rows={4} placeholder="Tell me about your idea" className={input} aria-label="Message" />
        <button className="btn-primary w-full" type="submit">Send message</button>
        {state === 'sent' && <p className="text-xs text-emerald-300">Opening your email app. Thanks for reaching out!</p>}
        {state === 'noemail' && <p className="text-xs text-amber-300">Contact email is not configured yet. Set it in src/data/content.ts.</p>}
      </form>
    </>
  )
}

export default function InfoPanel() {
  const id = useGame((s) => s.activeId)
  const close = useGame((s) => s.closePanel)
  const it = id ? interactableById[id] : null
  if (!it) return null
  const meta: Record<string, { title: string; kicker: string }> = {
    story: { title: 'Hey! I\'m Shreya Shah.', kicker: 'My Story Island' },
    tech: { title: it.label, kicker: 'Developer City' },
    project: { title: it.label, kicker: 'Project Construction Island' },
    aws: { title: it.label, kicker: 'AWS Cloud Kingdom' },
    cert: { title: 'AWS Certified Developer', kicker: 'AWS Cloud Kingdom' },
    exp: { title: it.label, kicker: 'Experience' },
    achievements: { title: 'Achievement Room', kicker: 'Experience & Achievements' },
    contact: { title: 'Contact World', kicker: 'Communication Station' },
  }
  const m = meta[it.kind] ?? { title: it.label, kicker: '' }
  return (
    <Panel key={it.id} title={m.title} kicker={m.kicker} color={it.color} onClose={close} wide={it.kind === 'project' || it.kind === 'story'}>
      {it.kind === 'story' && <Story />}
      {it.kind === 'tech' && <Tech id={it.ref} />}
      {it.kind === 'project' && <Project id={it.ref} />}
      {it.kind === 'aws' && <Aws id={it.ref} />}
      {it.kind === 'cert' && <Badge />}
      {it.kind === 'exp' && <Exp id={it.ref} />}
      {it.kind === 'achievements' && <Achievements />}
      {it.kind === 'contact' && <Contact />}
    </Panel>
  )
}

export { Achievements, Aws, Badge, Contact, Exp, Project, Story, Tech }

