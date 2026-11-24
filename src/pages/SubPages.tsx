import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Shell from '../components/Shell'
import { CopyIp, Reveal } from '../components/ui'
import { TLink } from '../components/Transition'
import PixelIcon from '../components/PixelIcon'
import { getFormations } from '../three/formations'
import { asset } from '../lib/base'
import { ABOUT_FULL, CLIENT, CLIENT_INSTALL, GALLERY, GUIDE, MODS, SERVER } from '../data/server'

const F = () => getFormations()

const LauncherCta = () => (
  <TLink to="/launcher" className="btn btn--gold">
    <PixelIcon name="download" size={16} /> Get Mint Launcher
  </TLink>
)

// ── Getting started ────────────────────────────────────────────────────────
export function GuidePage() {
  return (
    <Shell
      docTitle="Getting Started"
      kicker="The ultimate guide"
      title="Getting started."
      lede="Everything you need on day one, in two minutes of reading."
      formation={F().portal}
      actions={
        <>
          <CopyIp />
          <LauncherCta />
        </>
      }
    >
      <section className="guide">
        {GUIDE.map((g, i) => (
          <Reveal key={g.id} delay={(i % 3) * 0.06} className="gcard" as="article">
            <span className="gcard__n">{String(i + 1).padStart(2, '0')}</span>
            <h2 id={g.id}>{g.title}</h2>
            <p>{g.text}</p>
            {'cmd' in g && g.cmd && <code className="cmd">{g.cmd}</code>}
          </Reveal>
        ))}
      </section>
    </Shell>
  )
}

// ── Gallery ───────────────────────────────────────────────────────────────
export function GalleryPage() {
  const all = GALLERY.flatMap((g) => g.shots.map((s) => ({ src: asset(`/images/${s}.webp`), group: g.group })))
  const [open, setOpen] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('All')
  const list = filter === 'All' ? all : all.filter((s) => s.group === filter)

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + list.length) % list.length)), [list.length])
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step])

  return (
    <Shell
      docTitle="Gallery"
      kicker="Gallery"
      title="Seen on MintyMC."
      lede="Server builds, boss fights and the spawn, straight from the world."
      formation={F().spawn}
    >
      <div className="seg seg--center" role="tablist" aria-label="Filter gallery">
        {['All', ...GALLERY.map((g) => g.group)].map((k) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
            {k}
          </button>
        ))}
      </div>
      <section className="masonry">
        {list.map((s, i) => (
          <button key={s.src} className="shot" onClick={() => setOpen(i)} aria-label={`Open ${s.group} screenshot`}>
            <img src={s.src} alt={`${s.group} screenshot`} loading="lazy" width={1920} height={1057} />
            <span>{s.group}</span>
          </button>
        ))}
      </section>
      {open !== null &&
        createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot" onClick={() => setOpen(null)} data-no-burst>
          <img src={list[open].src} alt={`${list[open].group} screenshot`} onClick={(e) => e.stopPropagation()} />
          <button className="lightbox__nav lightbox__nav--prev" aria-label="Previous" onClick={(e) => (e.stopPropagation(), step(-1))}>
            ‹
          </button>
          <button className="lightbox__nav lightbox__nav--next" aria-label="Next" onClick={(e) => (e.stopPropagation(), step(1))}>
            ›
          </button>
          <p className="lightbox__cap">
            {list[open].group} · {open + 1}/{list.length} · Esc to close
          </p>
        </div>,
          document.body,
        )}
    </Shell>
  )
}

// ── Optional mods ─────────────────────────────────────────────────────────
export function ModsPage() {
  return (
    <Shell
      docTitle="Optional Mods"
      kicker="Optional mods"
      title="Smoother, not different."
      lede="Optimisation mods that boost performance without changing gameplay. Mint Launcher installs them from Modrinth in one click."
      formation={F().pickaxe}
      actions={<LauncherCta />}
    >
      <section className="modgrid">
        {MODS.map((m, i) => (
          <Reveal key={m.name} delay={(i % 3) * 0.06}>
            <a className="mod" href={m.url} target="_blank" rel="noopener noreferrer">
              <strong>{m.name}</strong>
              <span>{m.what}</span>
              <em>
                Modrinth <PixelIcon name="download" size={12} />
              </em>
            </a>
          </Reveal>
        ))}
      </section>
      <p className="fine fine--center">
        More in the optional-mods channel on our{' '}
        <a href={SERVER.discord} target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        .
      </p>
    </Shell>
  )
}

// ── About ─────────────────────────────────────────────────────────────────
export function AboutPage() {
  return (
    <Shell
      docTitle="About Us"
      kicker="About us"
      title="Built with the community."
      lede={ABOUT_FULL[0]}
      formation={F().clans}
      actions={
        <>
          <a className="btn btn--ghost" href={SERVER.discord} target="_blank" rel="noopener noreferrer">
            <PixelIcon name="discord" size={16} /> Join Discord
          </a>
          <a className="btn btn--gold" href={SERVER.donate} target="_blank" rel="noopener noreferrer">
            <PixelIcon name="heart" size={16} /> Buy us a coffee
          </a>
        </>
      }
    >
      <section className="prose">
        {ABOUT_FULL.slice(1).map((p, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <p>{p}</p>
          </Reveal>
        ))}
      </section>
    </Shell>
  )
}

// ── Minty Client ──────────────────────────────────────────────────────────
export function ClientPage() {
  const [i, setI] = useState(0)
  return (
    <Shell
      docTitle="Minty Client"
      kicker={
        <>
          <img src={asset('/images/mascot.png')} alt="" width={18} height={18} className="inline-mascot" /> Fabric · Minecraft 26.3
        </>
      }
      title="Minty Client."
      lede={CLIENT.blurb}
      formation={F().mascot}
      actions={
        <>
          <a className="btn btn--gold" href={CLIENT.download}>
            <PixelIcon name="download" size={16} /> Download .jar
          </a>
          <a className="btn btn--ghost" href="https://fabricmc.net/" target="_blank" rel="noopener noreferrer">
            Get Fabric
          </a>
        </>
      }
    >
      <section className="client">
        <Reveal className="client__art">
          <img src={asset('/images/mintclient2.png')} alt="Minty Client" width={679} height={307} />
        </Reveal>
        <div className="client__tabs">
          <div className="tabs__bar" role="tablist" aria-label="Minty Client features">
            {CLIENT.tabs.map((t, k) => (
              <button key={t.name} role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} onClick={() => setI(k)}>
                {t.name}
              </button>
            ))}
          </div>
          <p className="tabs__body" key={i}>
            {CLIENT.tabs[i].text}
          </p>
        </div>
        <ol className="install">
          {CLIENT_INSTALL.map((s, k) => (
            <li key={k}>
              <b>{k + 1}</b>
              {s}
            </li>
          ))}
        </ol>
        <p className="fine">Updating? Delete the old JAR first: two copies at once will crash the game.</p>
      </section>
    </Shell>
  )
}
