import { useEffect, useRef } from 'react'
import { pointer } from '../three/store'

// Custom cursor for mouse/trackpad devices only (hover + fine pointer).
// The dot follows the pointer exactly, because a lagging cursor feels broken.
// Only the outer block frame trails behind, and it changes shape with context:
//  - links/buttons: the frame wraps them in a gold square
//  - over the mint: the frame shows "click"
//  - pressing: everything tightens to 0.9
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!fine.matches) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.classList.add('has-cursor')

    let x = -100
    let y = -100
    let rx = x
    let ry = y
    let raf = 0
    let state = ''
    let visible = false

    const setState = (s: string) => {
      if (s === state) return
      state = s
      ring.current!.dataset.state = s
      dot.current!.dataset.state = s
    }

    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!visible) {
        visible = true
        rx = x
        ry = y
        document.documentElement.classList.add('cursor-on')
      }
      dot.current!.style.transform = `translate3d(${x}px, ${y}px, 0)`
      const el = e.target as HTMLElement
      if (el.closest('a, button, [role="tab"]')) setState('link')
      else if (el.closest('p, li, h1, h2, h3, code')) setState('text')
      else if (pointer.hovering && document.querySelector('.scene')) setState('mint')
      else setState('')
    }
    const down = () => document.documentElement.classList.add('cursor-down')
    const up = () => document.documentElement.classList.remove('cursor-down')
    const leave = () => {
      visible = false
      document.documentElement.classList.remove('cursor-on')
    }

    const loop = () => {
      const k = reduce ? 1 : 0.22
      rx += (x - rx) * k
      ry += (y - ry) * k
      ring.current!.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.documentElement.classList.remove('has-cursor', 'cursor-on')
    }
  }, [])

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden>
        <i />
        <span>click</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden />
    </>
  )
}
