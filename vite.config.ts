import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the built dist/ folder also runs straight off the filesystem.
  base: './',
  build: {
    target: 'es2020',
    assetsInlineLimit: 8192,
  },
})
