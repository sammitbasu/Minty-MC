# MintyMC website

Website for the MintyMC Anarchy+ Minecraft server (`mintymc.xyz`), built with React, three.js (React Three Fiber), framer-motion and Lenis.

The whole site centres on one object: **the Mint**, a peppermint candy made of about 900 Minecraft-style blocks. As you scroll, it rebuilds itself into a shape for each section. Every section ends by pointing to the Mint Launcher download.

| Section | The mint becomes |
| --- | --- |
| Hero | the mint (hover pushes blocks away, click bursts them) |
| Anarchy+ | a shattered cloud |
| Bounties | a target |
| Telepads | a portal ring |
| Clans | three small mints |
| Protected spawn | a 200×200 plot under a glass dome |
| Villagers & gambling | a die |
| Rules | a pickaxe |
| Minty Client | the mascot |
| Launcher CTA | a download arrow |

## Pages

- `/`: the scroll story.
- `/launcher`: the Mint Launcher page. Hovering the download button turns the mint into an arrow, and clicking it downloads the installer and shows a checkmark.

## Develop

```bash
npm install
npm run dev        # Vite dev server
npm run typecheck
npm run build      # production build in dist/
npm run preview    # build, then serve dist/ on the Cloudflare runtime (wrangler dev)
```

## Deploy (Cloudflare Workers)

The site deploys as a static-assets Worker, configured in `wrangler.jsonc`:

- `dist/` is uploaded as static assets.
- `not_found_handling: single-page-application` makes routes like `/launcher` load the app.
- `public/_headers` sets caching (hashed `/assets` cache forever) and forces `/downloads/*` to download.

**From the CLI:**

```bash
npx wrangler login   # once
npm run deploy       # build + wrangler deploy
```

**On every push (recommended):** in the Cloudflare dashboard, go to Workers & Pages → Create → Import a repository, and pick this repo. Use build command `npm run build` and deploy command `npx wrangler deploy`. Node 22 comes from `.nvmrc`.

**Custom domain:** once `mintymc.xyz` is on Cloudflare, uncomment the `routes` entry in `wrangler.jsonc`, or add the domain under the Worker's Settings → Domains & Routes.

GitHub Pages is still available as a fallback (`npm run deploy:pages`, served under `/Minty-MC/`).

## Adding the launcher .exe

1. Put the installer in `public/downloads/`, e.g. `public/downloads/MintLauncher-Setup.exe`.
2. If the name is different, update `windows.file` and `windows.saveAs` in `src/config/launcher.ts`.

The button checks that the file exists before downloading. Until it does, the button opens the latest GitHub release instead, so it never hands out a broken file.

Browsers decide where downloads go (normally the Downloads folder). A website can't save a file to the Desktop directly, so after the download starts the page tells people to move it to their Desktop.

## Where things live

- `src/three/formations.ts`: every shape the mint can take.
- `src/three/VoxelSwarm.tsx`: the morphing, hover and click physics.
- `src/components/GlassNav.tsx`: the liquid-glass vertical nav. Real refraction works in Chromium browsers. Other browsers get a frosted-glass fallback.
- `src/data/server.ts`: all server copy (features, rules, client and launcher text), taken from the current site.

