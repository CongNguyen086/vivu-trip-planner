import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { tripPlannerPlugin } from './server/plugin.js'

export default defineConfig(({ mode }) => {
  // Nạp .env vào process.env cho phía server (key KHÔNG có tiền tố VITE_ nên không lộ ra client).
  const env = loadEnv(mode, process.cwd(), '')
  if (env.COACHIO_API_KEY) process.env.COACHIO_API_KEY = env.COACHIO_API_KEY
  return {
    plugins: [react(), tripPlannerPlugin()],
    server: { port: 5173 },
  }
})
