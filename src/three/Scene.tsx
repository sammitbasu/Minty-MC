import { useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pointer } from './store'

// Tiny mint-coloured blocks drifting upward, like particles off a beacon.
function Dust({ count = 220 }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const data = useMemo(() => {
    let s = 3
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 70,
      y: (r() - 0.5) * 40,
      z: -30 + r() * 40,
      v: 0.3 + r() * 0.9,
      s: 0.06 + r() * 0.16,
      p: r() * Math.PI * 2,
    }))
  }, [count])
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    data.forEach((d, i) => {
      d.y += d.v * Math.min(dt, 0.05)
      if (d.y > 22) d.y = -22
      e.set(t * d.v, t * d.v * 0.7, 0)
      q.setFromEuler(e)
      m.compose(new THREE.Vector3(d.x + Math.sin(t * 0.3 + d.p) * 0.8, d.y, d.z), q, new THREE.Vector3(d.s, d.s, d.s))
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial color="#fffaf0" transparent opacity={0.7} />
    </instancedMesh>
  )
}

function CameraRig() {
  useFrame(({ camera }, dt) => {
    camera.position.x += (pointer.nx * 1.4 - camera.position.x) * Math.min(1, dt * 2)
    camera.position.y += (pointer.ny * 0.9 - camera.position.y) * Math.min(1, dt * 2)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene({ children }: { children: ReactNode }) {
  return (
    <div className="scene" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 36], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#e4d3b4', 36, 72]} />
        <hemisphereLight args={['#fffaf0', '#8a6a44', 1.35]} />
        <directionalLight position={[10, 14, 16]} intensity={2.4} color="#fff4dc" />
        <directionalLight position={[-14, -4, 6]} intensity={0.45} color="#9fc9ff" />
        <CameraRig />
        <Dust />
        {children}
      </Canvas>
    </div>
  )
}
