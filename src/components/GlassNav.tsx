import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { asset, route } from '../lib/base'
import PixelIcon, { type IconName } from './PixelIcon'
import { useTransitionNav } from './Transition'
import { scrollState } from '../three/store'

type Item = { label: string; icon: IconName; to: string }

// One entry per page from mintymc.xyz. The launcher lives in the gold button.
const ITEMS: Item[] = [
  { label: 'Home', icon: 'home', to: '/' },
  { label: 'Getting Started', icon: 'book', to: '/guide' },
  { label: 'Gallery', icon: 'image', to: '/gallery' },
  { label: 'Minty Client', icon: 'drop', to: '/client' },
  { label: 'Optional Mods', icon: 'wrench', to: '/mods' },
  { label: 'About Us', icon: 'heart', to: '/about' },
]

const ITEM_H = 52

// Chromium can feed an SVG displacement filter into backdrop-filter, which is
// what makes the glass actually bend what's behind it. Elsewhere we fall back
// to a frosted blur with the same highlights.
const supportsLiquid = typeof navigator !== 'undefined' && /Chrome|Chromium|Edg\//.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent)

export default function GlassNav() {
  const { pathname } = useLocation()
  const { go } = useTransitionNav()
  const navRef = useRef<HTMLElement>(null)
  const progRef = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const onLauncher = pathname.startsWith('/launcher')
  const found = ITEMS.findIndex((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)))
  const activeIdx = found === -1 ? ITEMS.length : found

  // specular highlight follows the cursor across the glass
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    let raf = 0
    const move = (e: PointerEvent) => {
      const r = nav.getBoundingClientRect()
      nav.style.setProperty('--mx', `${e.clientX - r.left}px`)
      nav.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const loop = () => {
      if (progRef.current) progRef.current.style.transform = `scaleY(${scrollState.progress})`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2.5" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="38" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <nav ref={navRef} className={`glass-nav ${supportsLiquid ? 'is-liquid' : ''}`} aria-label="Primary">
        <div className="glass-nav__refract" aria-hidden />
        <div className="glass-nav__shine" aria-hidden />

        <button className="glass-nav__logo" onClick={() => go('/')} aria-label="MintyMC home">
          <img src={asset('/images/mascot.png')} alt="" width={34} height={34} />
        </button>

        <div className="glass-nav__track">
          <div className="glass-nav__blob" style={{ transform: `translateY(${activeIdx * ITEM_H}px)`, opacity: activeIdx < ITEMS.length ? 1 : 0 }} aria-hidden />
          {ITEMS.map((item, i) => (
            <a
              key={item.label}
              href={route(item.to)}
              className={`glass-nav__item ${i === activeIdx ? 'is-active' : ''}`}
              aria-current={i === activeIdx ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault()
                go(item.to)
              }}
              onPointerEnter={() => setHoverIdx(i)}
              onPointerLeave={() => setHoverIdx(null)}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            >
              <PixelIcon name={item.icon} size={18} />
              <span className="sr-only">{item.label}</span>
            </a>
          ))}
          {hoverIdx !== null && (
            <div className="glass-nav__tip" style={{ transform: `translateY(${hoverIdx * ITEM_H + ITEM_H / 2}px)` }} aria-hidden>
              {ITEMS[hoverIdx].label}
            </div>
          )}
        </div>

        <div className="glass-nav__progress" aria-hidden>
          <div ref={progRef} />
        </div>

        <a
          href={route('/launcher')}
          className={`glass-nav__cta ${onLauncher ? 'is-active' : ''}`}
          onClick={(e) => {
            e.preventDefault()
            go('/launcher')
          }}
          onPointerEnter={() => setHoverIdx(null)}
        >
          <PixelIcon name="download" size={18} />
          <span className="glass-nav__cta-label">Launcher</span>
        </a>
      </nav>
    </>
  )
}
