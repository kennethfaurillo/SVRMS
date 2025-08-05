import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true
  },
  plugins: [
    preact(),
    tailwindcss(),
  ],
})
