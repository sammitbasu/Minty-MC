import * as THREE from 'three'

// A formation is a target shape for the voxel swarm. Every formation has exactly
// N slots so voxel i can travel from formation A to formation B. Unused slots
// get scale 0 and hide inside the shape.

export const N = 900

export type Formation = {
  pos: Float32Array // N*3, voxel units
  col: Float32Array // N*3, linear-ish rgb (values > 1 read as glowing)
  scl: Float32Array // N
  jitter: number // idle wobble amplitude
  glow: THREE.Color // halo colour behind the shape
}

type P = { x: number; y: number; z: number; c: THREE.Color; s?: number }

const C = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k)

export const PAL = {
  mint: C('#38d996'),
  mintDeep: C('#17905e'),
  mintPale: C('#a6f7d2'),
  cream: C('#f1fff7'),
  ink: C('#0b2a1e'),
  red: C('#ff5b6b'),
  redDeep: C('#b8243a'),
  portal: C('#b46bff', 1.35),
  portalHot: C('#e7b8ff', 1.5),
  obsidian: C('#1d1530'),
  grass: C('#4fbf52'),
  grassDark: C('#2f8a3b'),
  stone: C('#9aa7a0'),
  glass: C('#cffff0', 1.15),
  wood: C('#8a5a2b'),
  woodDark: C('#5e3a19'),
  gold: C('#ffd35a'),
  blush: C('#ff9db0'),
}

// Seeded RNG so formations are identical on every load.
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], r: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function pack(points: P[], seed: number, opts: { jitter?: number; glow: THREE.Color; rot?: THREE.Euler }): Formation {
  const r = rng(seed)
  let pts = shuffle(points.slice(), r)
  if (pts.length > N) pts = pts.slice(0, N)
  const pos = new Float32Array(N * 3)
  const col = new Float32Array(N * 3)
  const scl = new Float32Array(N)
  const v = new THREE.Vector3()
  const m = opts.rot ? new THREE.Matrix4().makeRotationFromEuler(opts.rot) : null
  for (let i = 0; i < N; i++) {
    const real = i < pts.length
    const p = real ? pts[i] : pts[Math.floor(r() * pts.length)]
    v.set(p.x, p.y, p.z)
    if (m) v.applyMatrix4(m)
    pos.set([v.x, v.y, v.z], i * 3)
    col.set([p.c.r, p.c.g, p.c.b], i * 3)
    scl[i] = real ? p.s ?? 1 : 0
  }
  return { pos, col, scl, jitter: opts.jitter ?? 0, glow: opts.glow }
}

// Extrude a character sprite. Rows are top→bottom. `depth` layers along z.
function sprite(rows: string[], palette: Record<string, THREE.Color>, depth: number | ((ch: string) => number[])) {
  const pts: P[] = []
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      const c = palette[ch]
      if (!c) return
      const zs = typeof depth === 'function' ? depth(ch) : Array.from({ length: depth }, (_, k) => k - (depth - 1) / 2)
      zs.forEach((z) => pts.push({ x: x - (w - 1) / 2, y: (h - 1) / 2 - y, z, c }))
    })
  })
  return pts
}

// ── 0 · The Mint ────────────────────────────────────────────────────────────
// A peppermint candy built from blocks: pinwheel stripes, lens-shaped profile.
export function mintPoints(R = 10): P[] {
  const pts: P[] = []
  for (let x = -R; x <= R; x++)
    for (let y = -R; y <= R; y++) {
      const d = Math.hypot(x, y)
      if (d > R + 0.35) continue
      const a = Math.atan2(y, x)
      const wedge = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8 + 0.5) % 2
      let c = wedge ? PAL.mint : PAL.cream
      if (d < R * 0.28) c = PAL.cream
      if (d > R - 0.75) c = PAL.mintDeep
      const half = d < R * 0.45 ? 2 : d < R * 0.72 ? 1 : 0
      for (let z = -half; z <= half; z++) {
        // faces keep the pattern, the hidden core goes pale to read as candy
        const core = Math.abs(z) < half && d < R - 1
        pts.push({ x, y, z, c: core ? PAL.mintPale : c })
      }
    }
  return pts
}

function mint() {
  return pack(mintPoints(10), 1, { glow: C('#2fe39a'), rot: new THREE.Euler(-0.32, 0.38, 0.12) })
}

// ── 1 · Anarchy+ — the mint, shattered ─────────────────────────────────────
function chaos() {
  const r = rng(7)
  const base = mintPoints(10)
  const pts: P[] = base.map((p) => {
    const u = r() * 2 - 1
    const th = r() * Math.PI * 2
    const rad = 3 + Math.cbrt(r()) * 9
    const s = Math.sqrt(1 - u * u)
    return { x: Math.cos(th) * s * rad, y: u * rad * 0.9, z: Math.sin(th) * s * rad, c: p.c, s: 0.45 + r() * 0.55 }
  })
  return pack(pts, 1, { jitter: 0.9, glow: C('#22c98a') })
}

// ── 2 · Bounties — a target ────────────────────────────────────────────────
function target() {
  const pts: P[] = []
  for (let x = -11; x <= 11; x++)
    for (let y = -11; y <= 11; y++) {
      const d = Math.hypot(x, y)
      const ring = Math.round(d)
      const onRing = [0, 1, 4, 5, 8, 9].includes(ring) || (ring === 11 && d < 11.4)
      const cross = (x === 0 || y === 0) && d > 2 && d < 11.5 && d > 0
      if (!onRing && !cross) continue
      const c = cross && !onRing ? PAL.cream : ring % 8 < 2 || ring === 11 ? PAL.red : PAL.cream
      pts.push({ x, y, z: 0, c })
      if (ring <= 1 || ring === 11) pts.push({ x, y, z: -1, c: PAL.redDeep })
    }
  return pack(pts, 2, { glow: C('#ff4d6a'), rot: new THREE.Euler(-0.1, 0.45, 0) })
}

// ── 3 · Telepads — a portal ring ───────────────────────────────────────────
function portal() {
  const pts: P[] = []
  const r = rng(3)
  for (let x = -10; x <= 10; x++)
    for (let y = -10; y <= 10; y++) {
      const d = Math.hypot(x, y)
      if (d >= 7.2 && d <= 9.6) for (const z of [0, -1]) pts.push({ x, y: y + 1, z, c: d > 8.6 ? PAL.obsidian : PAL.portal })
    }
  for (let x = -6; x <= 6; x++) for (let z = -3; z <= 2; z++) pts.push({ x, y: -9.5, z, c: (x + z) % 2 ? PAL.obsidian : C('#2a1f45') })
  for (let i = 0; i < 160; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 6.6
    pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d + 1, z: (r() - 0.5) * 1.5, c: r() > 0.5 ? PAL.portalHot : PAL.portal, s: 0.35 + r() * 0.35 })
  }
  return pack(pts, 3, { jitter: 0.25, glow: C('#a35cff'), rot: new THREE.Euler(0.12, -0.42, 0) })
}

// ── 4 · Clans — three small mints ──────────────────────────────────────────
function clans() {
  const pts: P[] = []
  const spots = [
    [-7.5, -4.5, 0],
    [7.5, -4.5, -2],
    [0, 6.5, -1],
  ]
  for (const [ox, oy, oz] of spots)
    for (const p of mintPoints(5)) pts.push({ ...p, x: p.x + ox, y: p.y + oy, z: p.z + oz })
  return pack(pts, 4, { jitter: 0.15, glow: C('#36e0a0'), rot: new THREE.Euler(-0.18, 0.3, 0) })
}

// ── 5 · Protected spawn — a plot under a glass dome ────────────────────────
function spawn() {
  const pts: P[] = []
  const r = rng(5)
  const H = 9
  for (let x = -H; x <= H; x++)
    for (let z = -H; z <= H; z++) {
      const edge = Math.abs(x) === H || Math.abs(z) === H
      const centre = Math.abs(x) <= 1 && Math.abs(z) <= 1
      const c = edge ? PAL.stone : centre ? PAL.mint : r() > 0.5 ? PAL.grass : PAL.grassDark
      pts.push({ x, y: -5, z, c })
    }
  const domeN = 230
  for (let i = 0; i < domeN; i++) {
    const y = i / domeN
    const rad = Math.sqrt(1 - y * y)
    const th = i * 2.39996
    pts.push({ x: Math.cos(th) * rad * 9.5, y: -5 + y * 9.5 + 0.5, z: Math.sin(th) * rad * 9.5, c: PAL.glass, s: 0.5 })
  }
  return pack(pts, 5, { glow: C('#7ef7d2'), rot: new THREE.Euler(0.42, 0.6, 0) })
}

// ── 6 · Villagers & gambling — a die ──────────────────────────────────────
function dice() {
  const pts: P[] = []
  const S = 4
  const pips: Record<string, [number, number][]> = {
    z: [[-2, 2], [2, 2], [0, 0], [-2, -2], [2, -2]],
    x: [[-2, 2], [0, 0], [2, -2]],
    y: [[-2, -2], [2, 2]],
  }
  const isPip = (axis: 'x' | 'y' | 'z', a: number, b: number) => pips[axis].some(([u, v]) => u === a && v === b)
  for (let x = -S; x <= S; x++)
    for (let y = -S; y <= S; y++)
      for (let z = -S; z <= S; z++) {
        if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== S) continue
        let c = PAL.cream
        if (z === S && isPip('z', x, y)) c = PAL.mintDeep
        if (x === S && isPip('x', z, y)) c = PAL.mintDeep
        if (y === S && isPip('y', x, z)) c = PAL.mintDeep
        const corner = [x, y, z].filter((k) => Math.abs(k) === S).length >= 2
        if (corner && c === PAL.cream) c = PAL.mintPale
        pts.push({ x: x * 1.15, y: y * 1.15, z: z * 1.15, c })
      }
  return pack(pts, 6, { glow: C('#ffd35a'), rot: new THREE.Euler(0.55, 0.7, 0.1) })
}

// ── 7 · Rules — a pickaxe ─────────────────────────────────────────────────
function pickaxe() {
  const pts: P[] = []
  for (let x = 0; x < 18; x++)
    for (let y = 0; y < 18; y++) {
      const d = Math.hypot(x - 1, y - 16)
      let c: THREE.Color | null = null
      if (d >= 11.2 && d <= 14 && x >= 2 && y <= 14 && x + y >= 11) c = d > 13.1 ? PAL.mintDeep : d < 11.9 ? PAL.mintPale : PAL.mint
      const onHandle = x >= 1 && x <= 10 && (x + y === 17 || x + y === 18)
      if (onHandle && !c) c = x + y === 17 ? PAL.wood : PAL.woodDark
      if (!c) continue
      for (const z of [0, -1]) pts.push({ x: x - 8.5, y: 8.5 - y, z, c })
    }
  return pack(pts, 7, { glow: C('#5af0b8'), rot: new THREE.Euler(0, 0.35, 0.05) })
}

// ── 8 · Minty Client — the mascot ─────────────────────────────────────────
const MASCOT = [
  '........D........',
  '.......DLD.......',
  '.......DLD.......',
  '......DLLLD......',
  '......DLLLD......',
  '.....DLLLLLD.....',
  '.....DLLLLLD.....',
  '....DLHLLLLLD....',
  '...DLHLLLLLLLD...',
  '..DLHLWKLLLWKLD..',
  '..DLLLKKLLLKKLD..',
  '..DLLLLLLLLLLLD..',
  '..DLPPLLKKLLPPD..',
  '..DLLLLLLLLLLLD..',
  '...DLLLLLLLLLD...',
  '....DDLLLLLDD....',
  '......DDDDD......',
]

function mascot() {
  const pal = { D: PAL.mintDeep, L: PAL.mint, H: PAL.mintPale, W: PAL.cream, K: PAL.ink, P: PAL.blush }
  const pts = sprite(MASCOT, pal, (ch) => (ch === 'D' ? [-1, 0, 1] : ch === 'L' || ch === 'H' ? [-1, 0, 1] : [1, 0, -1]))
  return pack(
    pts.map((p) => ({ ...p, x: p.x * 1.15, y: p.y * 1.15 + 0.5 })),
    8,
    { jitter: 0.05, glow: C('#43f0a5'), rot: new THREE.Euler(0, -0.25, 0) },
  )
}

// ── 9 · Launcher — a download glyph ───────────────────────────────────────
const ARROW = [
  '.......SSSSS.......',
  '.......SLLLS.......',
  '.......SLLLS.......',
  '.......SLLLS.......',
  '.......SLLLS.......',
  '.......SLLLS.......',
  '..SSSSSSLLLSSSSSS..',
  '...SLLLLLLLLLLLS...',
  '....SLLLLLLLLLS....',
  '.....SLLLLLLLS.....',
  '......SLLLLLS......',
  '.......SLLLS.......',
  '........SLS........',
  '.........S.........',
  '...................',
  'TT...............TT',
  'TT...............TT',
  'TTTTTTTTTTTTTTTTTTT',
]

function arrow() {
  const pts = sprite(ARROW, { S: PAL.mintDeep, L: C('#5dffb9', 1.2), T: PAL.cream }, (ch) => (ch === 'T' ? [-1, 0, 1] : [-1, 0]))
  return pack(pts, 9, { glow: C('#3dffad'), rot: new THREE.Euler(-0.12, 0.3, 0) })
}

const CHECK = [
  '..............LL',
  '.............LLL',
  '............LLL.',
  '...........LLL..',
  'LL........LLL...',
  'LLL......LLL....',
  '.LLL....LLL.....',
  '..LLL..LLL......',
  '...LLLLLL.......',
  '....LLLL........',
  '.....LL.........',
]

function check() {
  const pts = sprite(CHECK, { L: C('#6dffc2', 1.25) }, 3)
  return pack(
    pts.map((p) => ({ ...p, x: p.x * 1.2, y: p.y * 1.2 })),
    10,
    { glow: C('#3dffad') },
  )
}

let cache: Record<string, Formation> | null = null
export function getFormations() {
  if (!cache)
    cache = {
      mint: mint(),
      chaos: chaos(),
      target: target(),
      portal: portal(),
      clans: clans(),
      spawn: spawn(),
      dice: dice(),
      pickaxe: pickaxe(),
      mascot: mascot(),
      arrow: arrow(),
      check: check(),
    }
  return cache
}
export type FormationName = keyof ReturnType<typeof getFormations>
