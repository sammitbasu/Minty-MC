// The site may be served from a sub-path (GitHub Pages: /Minty-MC/).
const BASE = import.meta.env.BASE_URL

/** URL for a file in /public */
export const asset = (p: string) => BASE + p.replace(/^\//, '')

/** href for an in-app route, e.g. '/launcher' or '/#rules' */
export const route = (to: string) => BASE.replace(/\/$/, '') + to
