import { useEffect, type ReactNode } from 'react'
import Scene from '../three/Scene'
import VoxelSwarm from '../three/VoxelSwarm'
import { type Formation } from '../three/formations'
import { scrollState } from '../three/store'
import { Headline, Reveal } from './ui'
import { TLink } from './Transition'
import { asset } from '../lib/base'
import { SERVER } from '../data/server'

export function Logo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <TLink to="/" className={`logo logo--${size}`} aria-label="MintyMC Anarchy+ home">
      <img src={asset('/images/mintymc-logo.webp')} alt="MintyMC Anarchy+" width={912} height={440} />
    </TLink>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <Logo size="sm" />
      <nav className="footer__links" aria-label="Footer">
        <TLink to="/guide">Guide</TLink>
        <TLink to="/gallery">Gallery</TLink>
        <TLink to="/client">Minty Client</TLink>
        <TLink to="/mods">Mods</TLink>
        <TLink to="/about">About</TLink>
        <TLink to="/launcher">Launcher</TLink>
        <a href={SERVER.discord} target="_blank" rel="noopener noreferrer">
          Discord
        </a>
      </nav>
      <span className="footer__note">MintyMC Anarchy+ · Built with the community, for the community.</span>
    </footer>
  )
}

/** Fades the 3D layer back once the reader scrolls past the page header. */
export function useHeroFade() {
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = document.querySelector<HTMLElement>('.scene')
      if (el) el.style.opacity = String(Math.max(0.1, 1 - window.scrollY / (window.innerHeight * 0.6)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
}

type ShellProps = {
  title: string
  docTitle: string
  kicker: ReactNode
  lede: string
  formation: Formation
  actions?: ReactNode
  children: ReactNode
}

// Shared layout for the smaller pages: a short header with its own voxel
// shape on the right, then content, then the footer.
export default function Shell({ title, docTitle, kicker, lede, formation, actions, children }: ShellProps) {
  useHeroFade()
  useEffect(() => {
    document.title = `${docTitle} · MintyMC`
  }, [docTitle])
  return (
    <>
      <Scene>
        <VoxelSwarm stages={[{ formation, x: 8, y: 0.5, scale: 0.78 }]} getTarget={() => 0} getSpin={() => scrollState.velocity} />
      </Scene>
      <main className="page page--sub">
        <header className="subhero">
          <div className="copy">
            <Reveal>
              <p className="kicker">{kicker}</p>
            </Reveal>
            <Headline as="h1" className="display display--sub" text={title} />
            <Reveal delay={0.15}>
              <p className="lede">{lede}</p>
            </Reveal>
            {actions && (
              <Reveal delay={0.25} className="actions">
                {actions}
              </Reveal>
            )}
          </div>
        </header>
        {children}
        <Footer />
      </main>
    </>
  )
}
