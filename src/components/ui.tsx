import { Fragment, useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'
import { motion } from 'framer-motion'
import PixelIcon from './PixelIcon'
import { SERVER } from '../data/server'

// strong ease-out: fast start, gentle settle
const ease = [0.23, 1, 0.32, 1] as const

export function Reveal({ children, delay = 0, y = 16, as = 'div', className }: { children: ReactNode; delay?: number; y?: number; as?: ElementType; className?: string }) {
  const M = motion[as as 'div']
  return (
    <M
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </M>
  )
}

// Splits a headline into words that rise in one after another.
export function Headline({ text, className, as: Tag = 'h2' }: { text: string; className?: string; as?: 'h1' | 'h2' }) {
  const words = text.split(' ')
  const M = motion[Tag]
  // The heading itself is observed: the words start clipped out of view, so
  // they could never trigger an intersection on their own.
  return (
    <M
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ show: { transition: { staggerChildren: 0.045 } } }}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="word" aria-hidden>
            <motion.span variants={{ hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.65, ease } } }}>{w}</motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </M>
  )
}

let toastFn: ((msg: string) => void) | null = null
export const toast = (msg: string) => toastFn?.(msg)

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number>(0)
  useEffect(() => {
    toastFn = (m) => {
      setMsg(m)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMsg(null), 2600)
    }
    return () => {
      toastFn = null
    }
  }, [])
  return (
    <div className={`toast ${msg ? 'is-on' : ''}`} role="status" aria-live="polite">
      {msg}
    </div>
  )
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export function CopyIp({ big = false }: { big?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className={`ip-chip ${big ? 'ip-chip--big' : ''} ${done ? 'is-done' : ''}`}
      onClick={async () => {
        if (await copyText(SERVER.ip)) {
          setDone(true)
          toast(`Copied ${SERVER.ip}. Paste it into Multiplayer → Add Server.`)
          window.setTimeout(() => setDone(false), 1800)
        }
      }}
    >
      <span className="ip-chip__label">Server IP</span>
      <span className="ip-chip__ip">{SERVER.ip}</span>
      <span className="ip-chip__icon">{done ? '✓' : <PixelIcon name="copy" size={14} />}</span>
    </button>
  )
}
