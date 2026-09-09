import { registerRoute, sendJson } from './plugin.js'
import { generateJson } from './coachio.js'
import { buildSuggestPrompt, buildItineraryPrompt } from './prompts.js'
import { resolveImage } from './images.js'
import { getWeather } from './weather.js'
import { getPlace } from './place.js'

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

registerRoute({
  method: 'GET',
  match: (p) => p === '/api/place',
  handler: async ({ res, query, cache }) => {
    const q = query.get('q') || ''
    const key = `place|${q}`
    const cached = cache.get(key)
    if (cached) return sendJson(res, 200, cached)
    const data = await getPlace(q)
    cache.set(key, data)
    sendJson(res, 200, data)
  },
})

registerRoute({
  method: 'GET',
  match: (p) => p === '/api/weather',
  handler: async ({ res, query, cache }) => {
    const name = query.get('q') || ''
    const lat = query.get('lat') != null ? Number(query.get('lat')) : null
    const lon = query.get('lon') != null ? Number(query.get('lon')) : null
    const start = query.get('start'); const end = query.get('end')
    const key = `wx|${lat}|${lon}|${name}|${start}|${end}`
    const cached = cache.get(key)
    if (cached) return sendJson(res, 200, cached)
    const data = await getWeather({ name, lat, lon, start, end })
    cache.set(key, data)
    sendJson(res, 200, data)
  },
})

registerRoute({
  method: 'POST',
  match: (p) => p === '/api/itinerary',
  handler: async ({ req, res, readJsonBody }) => {
    const body = await readJsonBody(req)
    const messages = buildItineraryPrompt(body)
    const data = await generateJson(messages)
    const list = Array.isArray(data) ? data : data?.days || []
    const order = ['Sáng', 'Trưa', 'Chiều', 'Tối']
    const days = list.map((d, i) => ({
      dayIndex: d.dayIndex || i + 1,
      date: d.date || '',
      slots: order.map((period) => {
        const s = (d.slots || []).find((x) => x.period === period) || {}
        return {
          period,
          placeName: s.placeName || '',
          description: s.description || '',
          duration: s.duration || '',
          icon: s.icon || 'map-pin',
          wikiTitle: s.wikiTitle || s.placeName || '',
          imageQuery: s.imageQuery || s.placeName || '',
        }
      }),
    }))
    sendJson(res, 200, days)
  },
})
