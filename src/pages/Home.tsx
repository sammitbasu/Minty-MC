import { asset } from '../lib/base'
import { useEffect, useMemo, useRef, useState } from 'react'
import Scene from '../three/Scene'
import VoxelSwarm, { type Stage } from '../three/VoxelSwarm'
import { getFormations } from '../three/formations'
import { scrollState, sectionStore } from '../three/store'
import { CopyIp, Headline, Reveal } from '../components/ui'
import { TLink } from '../components/Transition'
import PixelIcon from '../components/PixelIcon'
import { ABOUT, CLIENT, EXTRAS, FEATURES, RULES, SERVER, SPAWN } from '../data/server'

// Each section on the page has a matching shape for the mint. Scrolling
// between two sections morphs the swarm between their shapes.
function useStages(): Stage[] {
  return useMemo(() => {
    const F = getFormations()
    return [
      { formation: F.mint, x: 7.5, y: 0.5, scale: 1.05 }, // 0 hero
      { formation: F.chaos, x: 6.5, y: 0 }, // 1 anarchy+
      { formation: F.target, x: 7, y: 0 }, // 2 bounties
      { formation: F.portal, x: -4.5, y: 0 }, // 3 telepads
      { formation: F.clans, x: 7, y: 0 }, // 4 clans
      { formation: F.spawn, x: -5.5, y: -0.5, scale: 0.9 }, // 5 spawn
      { formation: F.dice, x: 7, y: 0, scale: 0.95 }, // 6 villagers & gambling
      { formation: F.pickaxe, x: -4.5, y: 0 }, // 7 rules
      { formation: F.mascot, x: 7, y: 0 }, // 8 client
      { formation: F.arrow, x: 0, y: 7.4, scale: 0.5 }, // 9 launcher cta
    ]
  }, [])
}

// Maps scroll position to a continuous section index. The value holds still
// while a section is centred and only moves in the gap between sections, so
// each shape gets time on screen.
function useSectionTracker(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const root = ref.current
      if (root) {
        const secs = Array.from(root.querySelectorAll<HTMLElement>('[data-stage]'))
        const mid = window.innerHeight / 2
        const centers = secs.map((s) => {
          const r = s.getBoundingClientRect()
          return r.top + r.height / 2
        })
        let f = 0
        if (mid <= centers[0]) f = 0
        else if (mid >= centers[centers.length - 1]) f = centers.length - 1
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

function Hint() {
  return (
    <div className="hint">
      <span className="hint__dot" /> Hover the mint. Click it.
    </div>
  )
}

function RulesBoard() {
  const [filter, setFilter] = useState<'all' | 'allowed' | 'banned'>('all')
  const list = RULES.filter((r) => filter === 'all' || (filter === 'allowed' ? r.verdict !== 'banned' : r.verdict === 'banned'))
  return (
    <div className="rules">
      <div className="seg" role="tablist" aria-label="Filter rules">
        {(['all', 'allowed', 'banned'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
            {k === 'all' ? 'All rules' : k === 'allowed' ? 'Allowed' : 'Banned'}
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

function ClientTabs() {
  const [i, setI] = useState(0)
  const tab = CLIENT.tabs[i]
  return (
    <div className="tabs">
      <div className="tabs__bar" role="tablist" aria-label="Minty Client features">
        {CLIENT.tabs.map((t, k) => (
          <button key={t.name} role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} onClick={() => setI(k)}>
            {t.name}
          </button>
        ))}
      </div>
      <p className="tabs__body" key={tab.name}>
        {tab.text}
      </p>
    </div>
  )
}

export default function Home() {
  const stages = useStages()
  const root = useRef<HTMLElement>(null)
  useSectionTracker(root as React.RefObject<HTMLElement>)

  useEffect(() => {
    document.title = 'MintyMC Anarchy+ · Anarchy, served fresh'
    return () => sectionStore.set(0)
  }, [])

  return (
    <>
      <Scene>
        <VoxelSwarm stages={stages} getTarget={() => scrollState.f} getSpin={() => scrollState.velocity} />
      </Scene>

      <main ref={root} className="page">
        {/* 0 · Hero */}
        <section id="top" data-stage className="panel panel--hero">
          <div className="copy">
            <Reveal>
              <p className="eyebrow">
                <span className="pill">Java Edition</span> Anarchy+ · No whitelist · No mods required
              </p>
            </Reveal>
            <Headline as="h1" className="display" text="Anarchy, served fresh." />
            <Reveal delay={0.25}>
              <p className="lede">{SERVER.tagline}</p>
            </Reveal>
            <Reveal delay={0.4} className="actions">
              <CopyIp big />
              <TLink to="/launcher" className="btn btn--gold">
                <PixelIcon name="download" size={16} /> Get Mint Launcher
              </TLink>
              <a className="btn btn--ghost" href={SERVER.discord} target="_blank" rel="noopener noreferrer">
                <PixelIcon name="discord" size={16} /> Discord
              </a>
            </Reveal>
          </div>
          <Hint />
          <div className="scroll-cue" aria-hidden>
            <span>Scroll</span>
            <i />
          </div>
        </section>

        {/* 1 · Anarchy+ */}
        <section id="anarchy" data-stage className="panel">
          <div className="copy">
            <Reveal>
              <p className="kicker">Anarchy+ explained</p>
            </Reveal>
            <Headline className="title" text="Not full chaos. Chaos, plus." />
            <Reveal delay={0.15}>
              <p className="body">{ABOUT[0]}</p>
            </Reveal>
            <Reveal delay={0.25} className="equation">
              <span>Vanilla</span>
              <b>+</b>
              <span>Anarchy rules</span>
              <b>+</b>
              <span className="mintword">Minty extras</span>
            </Reveal>
            <Reveal delay={0.35} className="stats">
              <div>
                <strong>200×200</strong>
                <span>protected spawn</span>
              </div>
              <div>
                <strong>10</strong>
                <span>telepads to earn</span>
              </div>
              <div>
                <strong>0</strong>
                <span>pay-to-win</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 2–4 · Features */}
        {FEATURES.map((f, i) => (
          <section key={f.id} id={f.id} data-stage className={`panel ${i === 1 ? 'panel--right' : ''}`}>
            <div className="copy">
              <Reveal>
                <p className="kicker">{f.kicker}</p>
              </Reveal>
              <Headline className="title" text={f.title} />
              <Reveal delay={0.15}>
                <p className="body">{f.lede}</p>
              </Reveal>
              <Reveal delay={0.25}>
                <ul className="ticks">
                  {f.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Reveal>
              {f.command && (
                <Reveal delay={0.35} className="cmds">
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

        {/* 5 · Spawn */}
        <section id="spawn" data-stage className="panel panel--right">
          <div className="copy">
            <Reveal>
              <p className="kicker">Protected spawn</p>
            </Reveal>
            <Headline className="title" text="200 × 200 blocks of calm." />
            <Reveal delay={0.15}>
              <p className="body">A safe zone where new players can gather supplies without PvP or griefing. Spawn is safe. The world outside is not.</p>
            </Reveal>
            <Reveal delay={0.25} className="split">
              <div className="split__col split__col--in">
                <h3>Inside</h3>
                <ul>
                  {SPAWN.inside.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="split__col split__col--out">
                <h3>Outside</h3>
                <ul>
                  {SPAWN.outside.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 6 · Villagers & gambling */}
        <section id="extras" data-stage className="panel">
          <div className="copy">
            <Reveal>
              <p className="kicker">Feature 04 · 05</p>
            </Reveal>
            <Headline className="title" text="Rare trades. Risky rolls." />
            <div className="cards">
              {EXTRAS.map((e, i) => (
                <Reveal key={e.title} delay={0.15 + i * 0.12} className="card">
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                  <div className="tags">
                    {e.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · Rules */}
        <section id="rules" data-stage className="panel panel--right">
          <div className="copy copy--wide">
            <Reveal>
              <p className="kicker">The rules</p>
            </Reveal>
            <Headline className="title" text="Few rules. Sharp ones." />
            <Reveal delay={0.15}>
              <RulesBoard />
            </Reveal>
          </div>
        </section>

        {/* 8 · Minty Client */}
        <section id="client" data-stage className="panel">
          <div className="copy">
            <Reveal>
              <p className="kicker">
                <img src={asset('/images/mascot.png')} alt="" width={18} height={18} className="inline-mascot" /> Minty Client · Fabric 26.3
              </p>
            </Reveal>
            <Headline className="title" text="Your client, minted." />
            <Reveal delay={0.15}>
              <p className="body">{CLIENT.blurb}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <ClientTabs />
            </Reveal>
            <Reveal delay={0.35} className="actions">
              <a className="btn btn--ghost" href={CLIENT.download}>
                <PixelIcon name="download" size={16} /> Minty Client .jar
              </a>
              <span className="fine">Needs Fabric Loader 0.17+ and Java 25. Press Right Shift in game.</span>
            </Reveal>
          </div>
        </section>

        {/* 9 · Launcher CTA: everything leads here */}
        <section id="get" data-stage className="panel panel--cta">
          <div className="cta">
            <Headline className="title title--xl" text="Every road leads to the launcher." />
            <Reveal delay={0.2}>
              <p className="body body--center">
                Mint Launcher is fast, clean and open source. It sorts out Java, installs mods from Modrinth and gets you onto {SERVER.ip} in a couple of clicks.
              </p>
            </Reveal>
            <Reveal delay={0.3} className="actions actions--center">
              <TLink to="/launcher" className="btn btn--gold btn--xl">
                <PixelIcon name="download" size={18} /> Get Mint Launcher
              </TLink>
              <CopyIp />
            </Reveal>
            <Reveal delay={0.4}>
              <ol className="steps">
                <li>
                  <b>1</b> Download Mint Launcher
                </li>
                <li>
                  <b>2</b> Multiplayer → Add Server
                </li>
                <li>
                  <b>3</b> Join <code>{SERVER.ip}</code>
                </li>
              </ol>
            </Reveal>
          </div>
          <footer className="footer">
            <span>MintyMC Anarchy+ · Built with the community, for the community.</span>
            <span className="footer__links">
              <a href={SERVER.discord} target="_blank" rel="noopener noreferrer">
                Discord
              </a>
              <a href={SERVER.donate} target="_blank" rel="noopener noreferrer">
                Donate
              </a>
              <TLink to="/launcher">Launcher</TLink>
            </span>
          </footer>
        </section>
      </main>
    </>
  )
}
