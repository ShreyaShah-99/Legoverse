import { lazy, Suspense } from 'react'
import { achievementList, awsServices, certifications, experienceAreas, profile, projects, techs } from '../data/content'
import { OUTFITS } from '../data/outfits'
import { sfx } from '../lib/audio'
import { useGame, type Hair, type Outfit } from '../store/game'
import { EmailCard, LinkButton, Panel, Section } from './shared'

const AvatarPreview = lazy(() => import('./AvatarPreview'))

export function ResumePanel() {
  const close = useGame((s) => s.closePanel)
  return (
    <Panel
      title={profile.name}
      kicker="Resume"
      onClose={close}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <a className="btn-primary !py-2" href={profile.resumeUrl} target="_blank" rel="noreferrer noopener" onClick={() => sfx.click()}>Open resume PDF</a>
          <button className="btn-ghost !py-2" onClick={() => window.print()}>Print</button>
          <LinkButton href={profile.linkedin} icon="link">LinkedIn</LinkButton>
        </div>
      }
    >
      <p className="font-display text-base text-white">{profile.role} · {profile.company}</p>
      <p className="mt-1 text-white/60">{profile.subtitle}</p>
      <div className="mt-3"><EmailCard email={profile.email} compact /></div>
      <Section title="Summary"><p>{profile.intro.slice(1).join(' ')}</p></Section>
      <Section title="Experience">
        <p className="font-semibold text-white">{profile.role}, {profile.company}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">{experienceAreas.slice(1).map((e) => <li key={e.id}>{e.name}</li>)}</ul>
      </Section>
      <Section title="Projects">
        <ul className="space-y-2">{projects.map((p) => <li key={p.id}><span className="font-semibold text-white">{p.name}</span>: {p.tagline}</li>)}</ul>
      </Section>
      <Section title="Skills"><div className="flex flex-wrap gap-2">{techs.map((t) => <span key={t.id} className="chip">{t.name}</span>)}</div></Section>
      <Section title="Cloud"><div className="flex flex-wrap gap-2">{awsServices.slice(0, 5).map((t) => <span key={t.id} className="chip">{t.name}</span>)}</div></Section>
      <Section title="Certifications"><p>{certifications[0].name}, {certifications[0].issuer}</p></Section>
    </Panel>
  )
}

export function SettingsPanel() {
  const s = useGame()
  const Toggle = ({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) => (
    <button onClick={() => { sfx.click(); set(!on) }} role="switch" aria-checked={on} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/30">
      <span><span className="block font-semibold text-white">{label}</span><span className="text-xs text-white/50">{hint}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-gold' : 'bg-white/20'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>
    </button>
  )
  const hairs: { id: Hair; name: string }[] = [{ id: 'ponytail', name: 'Ponytail' }, { id: 'bob', name: 'Bob' }, { id: 'long', name: 'Long' }]
  return (
    <Panel title="Settings" kicker="Preferences" onClose={s.closePanel}>
      <div className="space-y-2">
        <Toggle label="Sound" hint="Effects and ambient music" on={s.sound} set={(v) => s.setSetting('sound', v)} />
        <Toggle label="Low graphics mode" hint="No shadows or post effects, lower resolution" on={s.lowGfx} set={(v) => s.setSetting('lowGfx', v)} />
        <Toggle label="Reduced motion" hint="Skips cinematics and long animations" on={s.reducedMotion} set={(v) => s.setSetting('reducedMotion', v)} />
        <Toggle label="2D mode" hint="Switch to the lightweight page version" on={s.force2D} set={(v) => s.setSetting('force2D', v)} />
      </div>
      <Section title="Your avatar">
        <Suspense fallback={<div className="h-56 rounded-2xl bg-white/5" />}><AvatarPreview /></Suspense>
      </Section>
      <Section title="Hairstyle">
        <div className="grid grid-cols-3 gap-2">
          {hairs.map((h) => (
            <button key={h.id} onClick={() => { sfx.click(); s.setSetting('hair', h.id) }} aria-pressed={s.hair === h.id} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${s.hair === h.id ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'}`}>{h.name}</button>
          ))}
        </div>
      </Section>
      <Section title="Hoodie colour">
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(OUTFITS) as Outfit[]).map((id) => (
            <button key={id} onClick={() => { sfx.click(); s.setSetting('outfit', id) }} aria-pressed={s.outfit === id} aria-label={OUTFITS[id].name} className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-xs transition ${s.outfit === id ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'}`}>
              <span className="h-6 w-6 rounded-md shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]" style={{ background: OUTFITS[id].hoodie }} />
              {OUTFITS[id].name}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Accessories">
        <Toggle label="Glasses" hint="Round frames" on={s.glasses} set={(v) => s.setSetting('glasses', v)} />
      </Section>
      <Section title="Progress">
        <p className="mb-2 text-xs text-white/50">{s.bricks.length}/10 golden bricks · {s.achievements.length}/{achievementList.length} achievements · {s.visited.length}/6 islands</p>
        <button className="btn-ghost !py-2" onClick={() => { if (confirm('Reset all saved progress?')) s.resetProgress() }}>Reset progress</button>
      </Section>
    </Panel>
  )
}
