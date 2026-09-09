import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tripPlannerPlugin } from './server/plugin.js'

export default defineConfig({
  plugins: [react(), tripPlannerPlugin()],
  server: { port: 5173 },
})
