import { createCache } from './cache.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function tripPlannerPlugin() {
  const cache = createCache()
  return {
    name: 'vivu-trip-planner',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        try {
          if (url.pathname === '/api/health') {
            return json(res, 200, { ok: true, ts: Date.now() })
          }
          return json(res, 404, { error: 'not_found' })
        } catch (err) {
          return json(res, 500, { error: 'internal', message: String(err?.message || err) })
        }
      })
    },
  }
}
