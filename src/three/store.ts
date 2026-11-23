// Tiny mutable stores shared between the DOM and the WebGL scene. Hot values
// (scroll, pointer) are read every frame without React re-renders. `section`
// is subscribable for UI that needs to re-render (the nav).

export const pointer = { nx: 0, ny: 0, burst: 0, hovering: false, lastClick: 0 }

export const scrollState = {
  f: 0, // continuous section index (2.5 = halfway from section 2 to 3)
  velocity: 0,
  progress: 0, // 0..1 page progress
}

type Listener = () => void
const listeners = new Set<Listener>()
let section = 0
export const sectionStore = {
  get: () => section,
  set(v: number) {
    if (v === section) return
    section = v
    listeners.forEach((l) => l())
  },
  subscribe(l: Listener) {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true },
  )
}
