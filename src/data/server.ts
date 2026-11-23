// Content sourced from the live site at mintymc.xyz.

export const SERVER = {
  name: 'MintyMC',
  full: 'MintyMC Anarchy+',
  ip: 'mintymc.xyz',
  tagline: 'Lightweight anarchy+ Minecraft server with a strong community and unique features.',
  discord: 'https://discord.gg/eruWYFhjMt',
  donate: 'https://www.buymeacoffee.com/mintymc',
}

export const ABOUT = [
  'MintyMC Anarchy+ is a community driven survival experience built for players who want freedom without the chaos of full anarchy.',
  'Our server is built around player choice, risk, and emergent gameplay. You can raid, loot, fight, explore, build, or scheme, as long as you follow the core rules that keep the server stable and fair for everyone.',
]

export type Feature = {
  id: string
  kicker: string
  title: string
  lede: string
  points: string[]
  command?: string[]
}

export const FEATURES: Feature[] = [
  {
    id: 'bounties',
    kicker: 'Feature 01 · Bounties',
    title: 'Put a price on their head.',
    lede: 'Place rewards on players to spark PvP and create natural conflict across the world. Bounties give players a reason to hunt, defend, and interact more.',
    points: ['Add items or money as the reward', 'Anyone can claim it by killing the target', 'Natural PvP hotspots, revenge, and server events'],
    command: ['/bounty'],
  },
  {
    id: 'telepads',
    kicker: 'Feature 02 · Telepads',
    title: 'Wander far. Blink home.',
    lede: 'Set teleport points to quickly return to your base or key locations. They make exploring safer and long-distance travel much easier.',
    points: ['1 free telepad when you join', 'Earn up to 10 telepads over time', 'Place them anywhere you want'],
    command: ['/teleset'],
  },
  {
    id: 'clans',
    kicker: 'Feature 03 · Clans',
    title: 'Stronger in a roll.',
    lede: 'Form groups, share bases, and coordinate fights with clan members. Clans make teamwork and organised gameplay possible in an otherwise chaotic world.',
    points: ['Clan members can teleport to each other', 'Clan bases are easier to defend', 'Private clan chat'],
    command: ['/clan create', '/clan invite'],
  },
]

export const SPAWN = {
  inside: ['No griefing', 'No PvP', 'No stealing', 'No breaking blocks'],
  outside: ['Full anarchy rules apply', 'Griefing allowed', 'PvP allowed', 'Raiding allowed', 'No protection on builds'],
}

export const EXTRAS = [
  {
    title: 'Custom Villagers',
    text: 'Special villagers with unique trades: rare items, custom gear, special utilities and rotating trades. They appear in certain structures and events, and sell things that are unobtainable in vanilla.',
    tags: ['Rare items', 'Custom gear', 'Rotating trades'],
  },
  {
    title: 'Gambling (in-game only)',
    text: 'Wager items or in-game currency for rewards. Purely for fun, and it adds excitement to gameplay.',
    tags: ['No real money', 'No purchases', 'No pay-to-win'],
  },
]

export type Rule = { label: string; verdict: 'allowed' | 'banned' | 'partial'; detail: string }

export const RULES: Rule[] = [
  { label: 'Griefing', verdict: 'allowed', detail: 'Allowed.' },
  { label: 'Looting', verdict: 'allowed', detail: 'Allowed.' },
  { label: 'PvP', verdict: 'partial', detail: 'Allowed outside of spawn.' },
  { label: 'Protection zones', verdict: 'partial', detail: 'Only spawn is protected.' },
  { label: 'QoL hacks', verdict: 'allowed', detail: 'X-ray, fullbright, basic movement allowed.' },
  { label: 'Combat hacks', verdict: 'banned', detail: 'Spearkill, macekill prohibited.' },
  { label: 'Extreme movement', verdict: 'banned', detail: 'Fly, speed prohibited.' },
  { label: 'Duping', verdict: 'banned', detail: 'Strictly prohibited.' },
  { label: 'Lag machines', verdict: 'banned', detail: 'Strictly prohibited.' },
  { label: 'Doxing', verdict: 'banned', detail: 'Zero tolerance: permanent hardware ban.' },
]

export const CLIENT = {
  download: 'https://github.com/mintymcflir/Minty-client/releases/latest/download/minty-client-public.jar',
  blurb:
    'The all-in-one Fabric client for Minecraft 26.3: nearly 200 modules, its own shaders, a cinema to watch with friends, and more ways to make it yours than any other client.',
  tabs: [
    {
      name: 'Hologram menu',
      text: 'Press Right Shift and the camera pulls back while the menu floats around you as holograms in your own world. Prefer a classic window? It’s one click away.',
    },
    {
      name: 'Minty Shaders',
      text: 'A built-in shader pack with no setup: Cinematic, PvP and Cozy presets, a ray-traced mode with bounced light, reflective water, light shafts, and aurora night skies.',
    },
    {
      name: 'Cinema',
      text: 'Put a screen up and watch together, in sync: your own videos, YouTube, or share your screen with sound. Cinema only works on MintyMC.',
    },
    {
      name: 'Customise',
      text: 'Over 20 themes, 37 animated wallpapers, 20 opening animations, mascots, cursor trails and a drag-and-drop HUD editor. Save any setup as a profile.',
    },
  ],
}

export const LAUNCHER_FEATURES = [
  { name: 'Instances', text: 'Each with its own mods, resource packs, saves and settings. Drag to reorder.' },
  { name: 'Modrinth built in', text: 'Search and install mods and resource packs, then check for and apply updates.' },
  { name: 'Accounts', text: 'Real Microsoft sign-in or offline play, multiple saved accounts, per-instance binding.' },
  { name: 'Import anything', text: 'Bring instances over from the official launcher, Prism/MultiMC/PolyMC, CurseForge or the Modrinth App.' },
  { name: 'Automatic Java', text: 'Detects the Java each release needs and downloads a matching runtime for you.' },
  { name: 'Live console', text: 'Streamed game output, one-click copy, and automatic crash hints for common failures.' },
  { name: 'Themes', text: 'Custom themes, backgrounds and transparency, so it looks the way you want.' },
  { name: 'Auto-updating', text: 'Installed and portable builds both check for and install updates.' },
]
