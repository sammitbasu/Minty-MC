import { useEffect, useMemo, useRef, useState } from 'react'
import Scene from '../three/Scene'
import VoxelSwarm, { type Stage } from '../three/VoxelSwarm'
import { getFormations } from '../three/formations'
import { scrollState, sectionStore } from '../three/store'
import { CopyIp, Headline, Reveal } from '../components/ui'
import { TLink } from '../components/Transition'
import { Footer } from '../components/Shell'
import PixelIcon from '../components/PixelIcon'
import { asset } from '../lib/base'
import { FEATURES, RULES, SERVER } from '../data/server'

// One section, one shape. Scrolling between sections morphs the mint.
function useStages(): Stage[] {
  return useMemo(() => {
    const F = getFormations()
    return [
      { formation: F.mint, x: 7.5, y: 0, scale: 1.05 }, // hero
      { formation: F.chaos, x: 6.5, y: 0 }, // anarchy+
      { formation: F.target, x: 7, y: 0 }, // bounties
      { formation: F.portal, x: -4.5, y: 0 }, // telepads
      { formation: F.clans, x: 7, y: 0 }, // clans
      { formation: F.spawn, x: -5.5, y: -0.5, scale: 0.9 }, // spawn
      { formation: F.pickaxe, x: -4.5, y: 0 }, // rules
      { formation: F.arrow, x: 0, y: 7.4, scale: 0.5 }, // launcher
    ]
  }, [])
}

// Continuous section index from scroll. Holds still while a section is
// centred so each shape gets screen time, then morphs in the gap.
function useSectionTracker(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const root = ref.current
      if (root) {
        const mid = window.innerHeight / 2
        const centers = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]')).map((s) => {
          const r = s.getBoundingClientRect()
          return r.top + r.height / 2
        })
        let f = 0
        if (mid >= centers[centers.length - 1]) f = centers.length - 1
        else
          for (let i = 0; i < centers.length - 1; i++)
            if (mid >= centers[i] && mid < centers[i + 1]) {
              const raw = (mid - centers[i]) / (centers[i + 1] - centers[i])
              const k = Math.min(1, Math.max(0, (raw - 0.22) / 0.56))
              f = i + k * k * (3 - 2 * k)
              break
            }
        scrollState.f = f
        sectionStore.set(Math.round(f))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ref])
}

function RulesBoard() {
  const [filter, setFilter] = useState<'all' | 'allowed' | 'banned'>('all')
  const list = RULES.filter((r) => filter === 'all' || (filter === 'allowed' ? r.verdict !== 'banned' : r.verdict === 'banned'))
  return (
    <div className="rules">
      <div className="seg" role="tablist" aria-label="Filter rules">
        {(['all', 'allowed', 'banned'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
            {k === 'all' ? 'All' : k === 'allowed' ? 'Allowed' : 'Banned'}
          </button>
        ))}
      </div>
      <ul className="rules__list">
        {list.map((r) => (
          <li key={r.label} className={`rule rule--${r.verdict}`}>
            <span className="rule__badge">{r.verdict === 'banned' ? 'Banned' : r.verdict === 'partial' ? 'Limited' : 'Allowed'}</span>
            <span className="rule__label">{r.label}</span>
            <span className="rule__detail">{r.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Home() {
  const stages = useStages()
  const root = useRef<HTMLElement>(null)
  useSectionTracker(root as React.RefObject<HTMLElement>)

  useEffect(() => {
    document.title = 'MintyMC Anarchy+ · Anarchy, served fresh'
    const el = document.querySelector<HTMLElement>('.scene')
    if (el) el.style.opacity = '1'
    return () => sectionStore.set(0)
  }, [])

  return (
    <>
      <Scene>
        <VoxelSwarm stages={stages} getTarget={() => scrollState.f} getSpin={() => scrollState.velocity} />
      </Scene>

      <main ref={root} className="page">
        <section id="top" data-stage className="panel panel--hero">
          <div className="copy">
            <Reveal y={10}>
              <h1 className="hero-logo">
                <img src={asset('/images/mintymc-logo.webp')} alt="MintyMC Anarchy+" width={912} height={440} />
              </h1>
            </Reveal>
            <Headline as="h2" className="title title--hero" text="Anarchy, served fresh." />
            <Reveal delay={0.2}>
              <p className="lede">{SERVER.tagline}</p>
            </Reveal>
            <Reveal delay={0.3} className="actions">
              <CopyIp big />
              <TLink to="/launcher" className="btn btn--gold">
                <PixelIcon name="download" size={16} /> Get Mint Launcher
              </TLink>
            </Reveal>
          </div>
          <div className="hint">
            <span className="hint__dot" /> Hover the mint. Click it.
          </div>
        </section>

        <section id="anarchy" data-stage className="panel">
          <div className="copy">
            <p className="kicker">Anarchy+</p>
            <Headline className="title" text="Chaos, plus a little extra." />
            <Reveal className="equation">
              <span>Vanilla</span>
              <b>+</b>
              <span>Anarchy rules</span>
              <b>+</b>
              <span className="mintword">Minty extras</span>
            </Reveal>
            <Reveal delay={0.1}>
              <TLink to="/guide" className="more">
                Read the guide <PixelIcon name="book" size={14} />
              </TLink>
            </Reveal>
          </div>
        </section>

        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} data-stage className={`panel ${i === 1 ? 'panel--right' : ''}`}>
            <div className="copy">
              <p className="kicker">{f.kicker}</p>
              <Headline className="title" text={f.title} />
              <Reveal>
                <p className="body">{f.lede}</p>
              </Reveal>
              {f.command && (
                <Reveal delay={0.1} className="cmds">
                  {f.command.map((c) => (
                    <code key={c} className="cmd">
                      {c}
                    </code>
                  ))}
                </Reveal>
              )}
            </div>
          </section>
        ))}

        <section id="spawn" data-stage className="panel panel--right">
          <div className="copy">
            <p className="kicker">Protected spawn</p>
            <Headline className="title" text="200 × 200 blocks of calm." />
            <Reveal>
              <p className="body">No PvP, no griefing inside. Step outside and anything goes.</p>
            </Reveal>
          </div>
        </section>

        <section id="rules" data-stage className="panel panel--right">
          <div className="copy copy--wide">
            <p className="kicker">Rules</p>
            <Headline className="title" text="Few rules. Sharp ones." />
            <Reveal>
              <RulesBoard />
            </Reveal>
          </div>
        </section>

        <section id="get" data-stage className="panel panel--cta">
          <div className="cta">
            <Headline className="title title--xl" text="Every road leads to the launcher." />
            <Reveal delay={0.1} className="actions actions--center">
              <TLink to="/launcher" className="btn btn--gold btn--xl">
                <PixelIcon name="download" size={18} /> Get Mint Launcher
              </TLink>
              <CopyIp />
            </Reveal>
          </div>
          <Footer />
        </section>
      </main>
    </>
  )
}
