import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import GlassNav from './components/GlassNav'
import { TransitionProvider } from './components/Transition'
import { Toaster } from './components/ui'
import Home from './pages/Home'
import LauncherPage from './pages/Launcher'
import { scrollState } from './three/store'

export default function App() {
  const location = useLocation()

  // Smooth, weighted scrolling. Scroll velocity also spins the mint.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = reduce ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    let raf = 0
    const loop = (time: number) => {
      lenis?.raf(time)
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollState.progress = max > 0 ? window.scrollY / max : 0
      scrollState.velocity = lenis ? lenis.velocity : 0
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onTo = (e: Event) => {
      const target = (e as CustomEvent).detail as HTMLElement | number
      if (lenis) lenis.scrollTo(target, { duration: 1.6 })
      else if (typeof target === 'number') window.scrollTo({ top: target })
      else target.scrollIntoView()
    }
    window.addEventListener('minty:scrollto', onTo)
    ;(window as unknown as { __lenis?: Lenis | null }).__lenis = lenis
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('minty:scrollto', onTo)
      lenis?.destroy()
    }
  }, [])

  // New route: start at the top, or at the requested section.
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis | null }).__lenis
    const id = location.hash.slice(1)
    window.scrollTo(0, 0)
    lenis?.scrollTo(0, { immediate: true })
    if (id) {
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) window.dispatchEvent(new CustomEvent('minty:scrollto', { detail: el }))
      })
    }
  }, [location.pathname, location.hash])

  return (
    <TransitionProvider>
      <div className="bg" aria-hidden>
        <div className="bg__glow bg__glow--a" />
        <div className="bg__glow bg__glow--b" />
        <div className="bg__grid" />
      </div>
      <GlassNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/launcher" element={<LauncherPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Toaster />
      <div className="grain" aria-hidden />
    </TransitionProvider>
  )
}
