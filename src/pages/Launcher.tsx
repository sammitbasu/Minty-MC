import { asset } from '../lib/base'
import { useEffect, useMemo, useRef, useState } from 'react'
import Scene from '../three/Scene'
import VoxelSwarm, { type Stage } from '../three/VoxelSwarm'
import { getFormations } from '../three/formations'
import { scrollState } from '../three/store'
import { CopyIp, Headline, Reveal, toast } from '../components/ui'
import PixelIcon from '../components/PixelIcon'
import { LAUNCHER } from '../config/launcher'
import { LAUNCHER_FEATURES, SERVER } from '../data/server'

const SHOTS = [
  { src: asset('/images/mint-launcher-screenshot.webp'), alt: 'An instance’s mod list with update buttons' },
  { src: asset('/images/mint-launcher-screenshot2.webp'), alt: 'Browse Mods window with Modrinth search results' },
  { src: asset('/images/mint-launcher-screenshot3.webp'), alt: 'Sign-in screen with Offline and Microsoft account options' },
  { src: asset('/images/mint-launcher-screenshot4.webp'), alt: 'Settings with background themes and transparency sliders' },
  { src: asset('/images/mint-launcher-screenshot5.webp'), alt: 'An instance running, with a Stop button and live status' },
]

type DlState = 'idle' | 'checking' | 'done' | 'fallback'

function detectOS(): 'windows' | 'mac' | 'linux' | 'other' {
  const ua = navigator.userAgent
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'mac'
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux'
  return 'other'
}

// Only download the file if it is really there. A missing file on most static
// hosts returns the SPA's index.html, which would save as a broken .exe.
async function fileExists(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    const type = r.headers.get('content-type') ?? ''
    return r.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

function useLatestVersion() {
  const [v, setV] = useState(LAUNCHER.version)
  useEffect(() => {
    if (LAUNCHER.version) return
    const ctrl = new AbortController()
    fetch(`https://api.github.com/repos/${LAUNCHER.githubRepo}/releases/latest`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const tag: string | undefined = j?.tag_name
        const m = tag?.match(/v?\d+(\.\d+)+.*$/)
        if (tag) setV(m ? (m[0].startsWith('v') ? m[0] : `v${m[0]}`) : tag)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])
  return v
}

function Gallery() {
  const [i, setI] = useState(0)
  const frame = useRef<HTMLDivElement>(null)
  return (
    <div className="gallery">
      <div
        ref={frame}
        className="gallery__frame"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          e.currentTarget.style.setProperty('--rx', `${-y * 8}deg`)
          e.currentTarget.style.setProperty('--ry', `${x * 10}deg`)
          e.currentTarget.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
          e.currentTarget.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty('--rx', '0deg')
          e.currentTarget.style.setProperty('--ry', '0deg')
        }}
      >
        <div className="gallery__window">
          <div className="gallery__chrome">
            <i />
            <i />
            <i />
            <span>Mint Launcher</span>
          </div>
          <img key={SHOTS[i].src} src={SHOTS[i].src} alt={SHOTS[i].alt} width={1801} height={1243} />
        </div>
      </div>
      <div className="gallery__thumbs" role="tablist" aria-label="Screenshots">
        {SHOTS.map((s, k) => (
          <button key={s.src} role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={s.alt}>
            <img src={s.src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="gallery__caption">{SHOTS[i].alt}</p>
    </div>
  )
}

export default function LauncherPage() {
  const F = getFormations()
  const stages: Stage[] = useMemo(
    () => [
      { formation: F.mint, x: 7, y: 0.5, scale: 1 },
      { formation: F.arrow, x: 7, y: 0.3, scale: 0.95 },
      { formation: F.check, x: 7, y: 0.5, scale: 1.1 },
    ],
    [F],
  )
  const target = useRef(0)
  const [dl, setDl] = useState<DlState>('idle')
  const [os] = useState(detectOS)
  const version = useLatestVersion()

  useEffect(() => {
    document.title = 'Mint Launcher · MintyMC'
    // The mint belongs to the hero here: fade it back once you scroll past.
    let raf = 0
    const loop = () => {
      const el = document.querySelector<HTMLElement>('.scene')
      if (el) el.style.opacity = String(Math.max(0.12, 1 - window.scrollY / (window.innerHeight * 0.7)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const download = async () => {
    if (dl === 'checking') return
    setDl('checking')
    target.current = 1
    const ok = await fileExists(LAUNCHER.windows.file)
    if (ok) {
      const a = document.createElement('a')
      a.href = LAUNCHER.windows.file
      a.download = LAUNCHER.windows.saveAs
      document.body.appendChild(a)
      a.click()
      a.remove()
      setDl('done')
    } else {
      window.open(LAUNCHER.releasesUrl, '_blank', 'noopener')
      setDl('fallback')
      toast('Opened the latest release on GitHub.')
    }
    window.setTimeout(() => (target.current = 2), 650)
  }

  const label = dl === 'checking' ? 'Preparing…' : dl === 'done' ? 'Download started' : dl === 'fallback' ? 'Opened on GitHub' : 'Download for Windows'

  return (
    <>
      <Scene>
        <VoxelSwarm stages={stages} getTarget={() => target.current} getSpin={() => scrollState.velocity} />
      </Scene>

      <main className="page page--launcher">
        <section className="panel panel--hero lhero">
          <div className="copy">
            <Reveal>
              <p className="eyebrow">
                <img src={asset('/images/mint-launcher-icon.png')} alt="" width={22} height={22} /> Mint Launcher
                {version && <span className="pill">{version}</span>}
                <span className="pill pill--soft">Open source</span>
              </p>
            </Reveal>
            <Headline as="h1" className="display" text="One click from the server." />
            <Reveal delay={0.2}>
              <p className="lede">
                A fast, clean Minecraft launcher. Manage instances, install mods and resource packs from Modrinth, sign in with Microsoft or play offline, and bring your existing setup with you.
              </p>
            </Reveal>
            <Reveal delay={0.35} className="dl">
              <button
                className={`btn btn--gold btn--xl dl__btn is-${dl}`}
                onClick={download}
                onPointerEnter={() => dl === 'idle' && (target.current = 1)}
                onPointerLeave={() => dl === 'idle' && (target.current = 0)}
                onFocus={() => dl === 'idle' && (target.current = 1)}
                onBlur={() => dl === 'idle' && (target.current = 0)}
              >
                <span className="dl__fill" aria-hidden />
                <PixelIcon name={dl === 'done' ? 'heart' : 'download'} size={18} />
                <span>{label}</span>
                <small>.exe</small>
              </button>
              <p className="fine">
                Windows 10+ · Java handled for you ·{' '}
                <a href={LAUNCHER.releasesUrl} target="_blank" rel="noopener noreferrer">
                  {os === 'windows' ? 'Other formats' : `Get it for ${os === 'mac' ? 'macOS' : os === 'linux' ? 'Linux' : 'your OS'}`}
                </a>
              </p>
            </Reveal>
            {dl === 'done' && (
              <Reveal className="saved">
                <PixelIcon name="download" size={14} /> Saved to your Downloads folder. Drag it to your Desktop, then run it.
              </Reveal>
            )}
          </div>
        </section>

        <section className="block">
          <Reveal>
            <p className="kicker kicker--center">Have a look around</p>
          </Reveal>
          <Headline className="title title--center" text="Built to stay out of your way." />
          <Reveal delay={0.15}>
            <Gallery />
          </Reveal>
        </section>

        <section className="block">
          <Headline className="title title--center" text="Everything a launcher should do." />
          <div className="fgrid">
            {LAUNCHER_FEATURES.map((f, i) => (
              <Reveal key={f.name} delay={(i % 4) * 0.08} className="fcard">
                <span className="fcard__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{f.name}</h3>
                <p>{f.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="block block--steps">
          <Headline className="title title--center" text="From download to spawn." />
          <ol className="bigsteps">
            {[
              ['Download', 'Grab MintLauncher-Setup.exe with the button above.'],
              ['Run it', 'The launcher isn’t code-signed yet. If Windows shows “Windows protected your PC”, click More info → Run anyway.'],
              ['Sign in', 'Use your Microsoft account, or play offline.'],
              ['Join', `Multiplayer → Add Server → ${SERVER.ip}`],
            ].map(([h, p], i) => (
              <Reveal as="li" key={h} delay={i * 0.1}>
                <b>{i + 1}</b>
                <h3>{h}</h3>
                <p>{p}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal className="actions actions--center">
            <button className="btn btn--gold btn--xl" onClick={() => window.dispatchEvent(new CustomEvent('minty:scrollto', { detail: 0 }))}>
              <PixelIcon name="download" size={18} /> Back to download
            </button>
            <CopyIp />
          </Reveal>
          <Reveal className="platforms">
            {LAUNCHER.otherPlatforms.map((p) => (
              <a key={p.os} href={LAUNCHER.releasesUrl} target="_blank" rel="noopener noreferrer">
                <strong>{p.os}</strong>
                <span>{p.label}</span>
              </a>
            ))}
          </Reveal>
          <footer className="footer">
            <span>Requires Windows 10+, macOS 11+, or a reasonably modern Linux distro.</span>
            <span className="footer__links">
              <a href={LAUNCHER.releasesUrl} target="_blank" rel="noopener noreferrer">
                Release notes
              </a>
              <a href={SERVER.discord} target="_blank" rel="noopener noreferrer">
                Discord
              </a>
            </span>
          </footer>
        </section>
      </main>
    </>
  )
}
