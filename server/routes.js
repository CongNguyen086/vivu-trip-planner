import { registerRoute, sendJson } from './plugin.js'
import { generateJson } from './coachio.js'
import { buildSuggestPrompt } from './prompts.js'
import { resolveImage } from './images.js'

registerRoute({
  method: 'POST',
  match: (p) => p === '/api/suggest',
  handler: async ({ req, res, readJsonBody }) => {
    const body = await readJsonBody(req)
    const messages = buildSuggestPrompt(body || {})
    const data = await generateJson(messages)
    const list = Array.isArray(data) ? data : data?.destinations || []
    const out = list.slice(0, 8).map((d, i) => ({
      id: `dest-${i}`,
      name: d.name || '',
      province: d.province || '',
      whyFit: d.whyFit || '',
      tags: Array.isArray(d.tags) ? d.tags.slice(0, 4) : [],
      wikiTitle: d.wikiTitle || d.name || '',
      imageQuery: d.imageQuery || d.name || '',
    }))
    sendJson(res, 200, out)
  },
})

registerRoute({
  method: 'GET',
  match: (p) => p === '/api/image',
  handler: async ({ res, query, cache }) => {
    const q = query.get('q') || ''
    const size = Number(query.get('size')) || 400
    const key = `img|${size}|${q}`
    const cached = cache.get(key)
    if (cached) return sendJson(res, 200, cached)
    const result = await resolveImage(q, size)
    cache.set(key, result)
    sendJson(res, 200, result)
  },
})
