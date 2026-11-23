import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Route changes play a Minecraft-style block wipe: tiles fill the screen
// diagonally, the route swaps underneath, then the tiles clear.

const COLS = 14
const ROWS = 8
const STEP = 22 // ms between diagonals
const COVER = (COLS + ROWS) * STEP + 260

type Ctx = { go: (to: string) => void; busy: boolean }
const TransitionCtx = createContext<Ctx>({ go: () => {}, busy: false })
export const useTransitionNav = () => useContext(TransitionCtx)

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<'idle' | 'cover' | 'reveal'>('idle')
  const busy = useRef(false)

  const go = useCallback(
    (to: string) => {
      const [path, hash] = to.split('#')
      if (path === location.pathname || (path === '' && hash)) {
        const el = hash ? document.getElementById(hash) : null
        window.dispatchEvent(new CustomEvent('minty:scrollto', { detail: el ?? 0 }))
        return
      }
      if (busy.current) return
      busy.current = true
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        navigate(to)
        busy.current = false
        return
      }
      setPhase('cover')
      window.setTimeout(() => {
        navigate(to)
        setPhase('reveal')
        window.setTimeout(() => {
          setPhase('idle')
          busy.current = false
        }, COVER + 60)
      }, COVER)
    },
    [navigate, location.pathname],
  )

  return (
    <TransitionCtx.Provider value={{ go, busy: phase !== 'idle' }}>
      {children}
      <div className={`wipe wipe-${phase}`} aria-hidden>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS
          const r = Math.floor(i / COLS)
          return <span key={i} style={{ animationDelay: `${(c + r) * STEP}ms` }} />
        })}
        {phase !== 'idle' && <div className="wipe-mark">mintymc</div>}
      </div>
    </TransitionCtx.Provider>
  )
}

export function TLink({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string; 'aria-label'?: string }) {
  const { go } = useTransitionNav()
  return (
    <a
      href={to}
      className={className}
      onClick={(e: MouseEvent) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return
        e.preventDefault()
        go(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
