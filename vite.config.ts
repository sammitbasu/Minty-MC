import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE=/Minty-MC/ for GitHub Pages (project site). Defaults to / for a custom domain.
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1400 },
})
