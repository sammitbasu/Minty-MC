import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { N, type Formation } from './formations'
import { pointer } from './store'

export type Stage = { formation: Formation; x: number; y: number; scale?: number }

type Props = {
  stages: Stage[]
  /** continuous stage index, read every frame */
  getTarget: () => number
  /** extra spin impulse source (e.g. scroll velocity) */
  getSpin?: () => number
  intro?: boolean
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// A 16×16 block texture: noisy face with a darker rim, so every cube reads as a
// Minecraft block once tinted by its instance colour.
function blockTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 16
  const g = c.getContext('2d')!
  let s = 42
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const rim = x === 0 || y === 0 || x === 15 || y === 15
      const v = rim ? 170 + r() * 20 : 215 + r() * 40
      g.fillStyle = `rgb(${v},${v},${v})`
      g.fillRect(x, y, 1, 1)
    }
  const t = new THREE.CanvasTexture(c)
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function haloTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grd.addColorStop(0, 'rgba(255,255,255,0.85)')
  grd.addColorStop(0.35, 'rgba(255,255,255,0.28)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

export default function VoxelSwarm({ stages, getTarget, getSpin, intro = true }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const group = useRef<THREE.Group>(null!)
  const halo = useRef<THREE.Mesh>(null!)
  const { camera, size } = useThree()

  const tex = useMemo(blockTexture, [])
  const haloTex = useMemo(haloTexture, [])

  const sim = useMemo(() => {
    let s = 9
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const delay = new Float32Array(N)
    const seed = new Float32Array(N)
    const swirl = new Float32Array(N * 3)
    const start = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      delay[i] = r()
      seed[i] = r() * Math.PI * 2
      const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize()
      swirl.set([v.x, v.y, v.z], i * 3)
      const d = 30 + r() * 30
      start.set([v.x * d, v.y * d + 10, v.z * d - 10], i * 3)
    }
    return {
      delay,
      seed,
      swirl,
      start,
      disp: new Float32Array(N * 3),
      smooth: getTarget(),
      spin: 0,
      spinVel: 0,
      introT: intro ? 0 : 1,
      burst: 0,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
      c: new THREE.Color(),
      ray: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      hit: new THREE.Vector3(),
      local: new THREE.Vector3(),
      glow: new THREE.Color(),
      ndc: new THREE.Vector2(),
    }),
    [],
  )

  // Click the mint to make it pop.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('a,button,input,[data-no-burst]')) return
      if (pointer.hovering) sim.burst = 1
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [sim])

  useEffect(() => {
    const m = mesh.current
    for (let i = 0; i < N; i++) m.setColorAt(i, tmp.c.setRGB(1, 1, 1))
  }, [tmp])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const t = state.clock.elapsedTime
    const K = stages.length
    const target = THREE.MathUtils.clamp(getTarget(), 0, K - 1)
    sim.smooth += (target - sim.smooth) * Math.min(1, Math.min(rawDt, 0.1) * 3.2)
    if (Math.abs(target - sim.smooth) < 1e-4) sim.smooth = target
    const a = Math.min(Math.floor(sim.smooth), K - 1)
    const b = Math.min(a + 1, K - 1)
    const tt = sim.smooth - a
    const A = stages[a]
    const B = stages[b]
    const FA = A.formation
    const FB = B.formation

    // wall-clock based so slow devices don't get a slow-motion intro
    if (sim.introT < 1) sim.introT = Math.min(1, sim.introT + Math.min(rawDt, 0.25) / 2.4)

    // group placement, responsive: centre the object on narrow screens
    const narrow = size.width < 900
    const aspect = size.width / size.height
    const g = group.current
    const ox = narrow ? (size.width < 640 ? 0.9 : 1.2) : THREE.MathUtils.lerp(A.x, B.x, easeInOut(tt))
    const oy = narrow ? 3.6 : THREE.MathUtils.lerp(A.y, B.y, easeInOut(tt))
    // portrait screens are narrow in world units, so shrink to fit the width
    const fit = narrow ? Math.min(0.6, aspect * 0.55) : 0.7
    const sc = THREE.MathUtils.lerp(A.scale ?? 1, B.scale ?? 1, easeInOut(tt)) * fit
    const realDt = Math.min(rawDt, 0.1)
    g.position.x += (ox - g.position.x) * Math.min(1, realDt * 4)
    g.position.y += (oy - g.position.y) * Math.min(1, realDt * 4)
    g.scale.setScalar(sc)

    const spinIn = getSpin ? getSpin() : 0
    sim.spinVel += spinIn * 0.0009
    sim.spinVel *= Math.pow(0.04, dt)
    sim.spin += sim.spinVel
    sim.spin *= Math.pow(0.6, dt)
    g.rotation.y = Math.sin(t * 0.35) * 0.32 + pointer.nx * 0.38 + sim.spin
    g.rotation.x = Math.sin(t * 0.27) * 0.08 - pointer.ny * 0.22
    g.position.z = Math.sin(t * 0.8) * 0.4

    // pointer in group-local space
    tmp.ndc.set(pointer.nx, pointer.ny)
    tmp.ray.setFromCamera(tmp.ndc, camera)
    tmp.ray.ray.intersectPlane(tmp.plane, tmp.hit)
    tmp.local.copy(tmp.hit)
    g.worldToLocal(tmp.local)
    const lx = tmp.local.x
    const ly = tmp.local.y
    pointer.hovering = Math.hypot(lx, ly) < 12
    sim.burst *= Math.pow(0.08, dt)

    const jit = THREE.MathUtils.lerp(FA.jitter, FB.jitter, tt)
    const R = 5.5
    const m = mesh.current
    for (let i = 0; i < N; i++) {
      const i3 = i * 3
      let ti = THREE.MathUtils.clamp((tt - sim.delay[i] * 0.4) / 0.6, 0, 1)
      ti = easeInOut(ti)
      const sw = Math.sin(Math.PI * ti) * 3.2
      let x = FA.pos[i3] + (FB.pos[i3] - FA.pos[i3]) * ti + sim.swirl[i3] * sw
      let y = FA.pos[i3 + 1] + (FB.pos[i3 + 1] - FA.pos[i3 + 1]) * ti + sim.swirl[i3 + 1] * sw
      let z = FA.pos[i3 + 2] + (FB.pos[i3 + 2] - FA.pos[i3 + 2]) * ti + sim.swirl[i3 + 2] * sw
      const sd = sim.seed[i]
      x += Math.sin(t * 0.7 + sd) * jit
      y += Math.cos(t * 0.6 + sd * 1.3) * jit
      z += Math.sin(t * 0.5 + sd * 0.7) * jit

      // intro: voxels rain in from far away
      if (sim.introT < 1) {
        const k = easeOut(THREE.MathUtils.clamp((sim.introT - sim.delay[i] * 0.45) / 0.55, 0, 1))
        x = sim.start[i3] + (x - sim.start[i3]) * k
        y = sim.start[i3 + 1] + (y - sim.start[i3 + 1]) * k
        z = sim.start[i3 + 2] + (z - sim.start[i3 + 2]) * k
      }

      // pointer repel + click burst
      const dx = x - lx
      const dy = y - ly
      const d = Math.hypot(dx, dy) + 1e-4
      let tx = 0
      let ty = 0
      let tz = 0
      if (d < R) {
        const f = Math.pow((R - d) / R, 2) * 3.2
        tx = (dx / d) * f
        ty = (dy / d) * f
        tz = f * 1.4
      }
      if (sim.burst > 0.01) {
        const f = sim.burst * 9 * Math.exp(-d / 14)
        tx += (dx / d) * f + sim.swirl[i3] * f * 0.6
        ty += (dy / d) * f + sim.swirl[i3 + 1] * f * 0.6
        tz += sim.swirl[i3 + 2] * f
      }
      const disp = sim.disp
      disp[i3] += (tx - disp[i3]) * Math.min(1, dt * 7)
      disp[i3 + 1] += (ty - disp[i3 + 1]) * Math.min(1, dt * 7)
      disp[i3 + 2] += (tz - disp[i3 + 2]) * Math.min(1, dt * 7)

      tmp.p.set(x + disp[i3], y + disp[i3 + 1], z + disp[i3 + 2])
      const s = FA.scl[i] + (FB.scl[i] - FA.scl[i]) * ti
      tmp.s.setScalar(s * 0.92)
      tmp.q.setFromAxisAngle(tmp.local.set(sim.swirl[i3], sim.swirl[i3 + 1], sim.swirl[i3 + 2]), Math.sin(Math.PI * ti) * 1.6)
      tmp.m.compose(tmp.p, tmp.q, tmp.s)
      m.setMatrixAt(i, tmp.m)

      tmp.c.setRGB(
        FA.col[i3] + (FB.col[i3] - FA.col[i3]) * ti,
        FA.col[i3 + 1] + (FB.col[i3 + 1] - FA.col[i3 + 1]) * ti,
        FA.col[i3 + 2] + (FB.col[i3 + 2] - FA.col[i3 + 2]) * ti,
      )
      m.setColorAt(i, tmp.c)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true

    tmp.glow.copy(FA.glow).lerp(FB.glow, tt)
    const hm = halo.current.material as THREE.MeshBasicMaterial
    hm.color.copy(tmp.glow)
    hm.opacity = 0.32 + Math.sin(t * 1.2) * 0.04 + sim.burst * 0.3
    halo.current.position.set(g.position.x, g.position.y, -8)
    halo.current.scale.setScalar(sc * 34 * (1 + sim.burst * 0.25))
  })

  return (
    <>
      <mesh ref={halo}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <group ref={group}>
        <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial map={tex} roughness={0.55} metalness={0.05} />
        </instancedMesh>
      </group>
    </>
  )
}
