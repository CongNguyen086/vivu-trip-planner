import { createCache } from './cache.js'

const routes = [] // { method, match(pathname), handler(ctx) }

export function registerRoute(route) {
  routes.push(route)
}

export function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      if (!raw) return resolve({})
      try { resolve(JSON.parse(raw)) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

export function tripPlannerPlugin() {
  const cache = createCache()
  return {
    name: 'vivu-trip-planner',
    async configureServer(server) {
      await import('./routes.js') // side-effect: đăng ký route, tránh circular top-level
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const pathname = url.pathname
        try {
          if (pathname === '/api/health') {
            return sendJson(res, 200, { ok: true, ts: Date.now() })
          }
          const route = routes.find(
            (r) => r.method === req.method && r.match(pathname)
          )
          if (!route) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Không tìm thấy endpoint.' } })
          await route.handler({ req, res, query: url.searchParams, cache, readJsonBody })
        } catch (err) {
          const status = err?.httpStatus || 500
          const code = err?.code || 'INTERNAL'
          const message = err?.userMessage || 'Có lỗi máy chủ. Thử lại.'
          sendJson(res, status, { error: { code, message } })
        }
      })
    },
  }
}
