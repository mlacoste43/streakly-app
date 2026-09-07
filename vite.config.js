import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // allow ngrok/cloudflare tunnel hosts to reach the dev server
    allowedHosts: true,
  },
})
