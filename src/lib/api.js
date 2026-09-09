async function call(path, options) {
  let resp
  try {
    resp = await fetch(path, options)
  } catch {
    const e = new Error('network'); e.userMessage = 'Mất kết nối mạng. Thử lại.'; throw e
  }
  let data
  try { data = await resp.json() } catch { data = null }
  if (!resp.ok || (data && data.error)) {
    const e = new Error(data?.error?.code || 'ERROR')
    e.userMessage = data?.error?.message || 'Có lỗi xảy ra. Thử lại.'
    e.code = data?.error?.code
    throw e
  }
  return data
}

export function apiSuggest(tripRequest) {
  return call('/api/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripRequest),
  })
}

export function apiImage(query, size = 400) {
  return call(`/api/image?q=${encodeURIComponent(query)}&size=${size}`)
}

export function apiPlace(query) {
  return call(`/api/place?q=${encodeURIComponent(query)}`)
}

export function apiWeather({ name, lat, lon, start, end }) {
  const p = new URLSearchParams({ start, end })
  if (name) p.set('q', name)
  if (lat != null) p.set('lat', String(lat))
  if (lon != null) p.set('lon', String(lon))
  return call(`/api/weather?${p.toString()}`)
}

export function apiItinerary(payload) {
  return call('/api/itinerary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
