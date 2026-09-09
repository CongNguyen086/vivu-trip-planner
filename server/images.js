function upsize(url, size) {
  return url.replace(/\/(\d+)px-/, `/${size}px-`)
}

async function summaryThumb(host, title, size, fetchImpl) {
  const rest = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const r = await fetchImpl(rest)
    if (r.ok) {
      const d = await r.json()
      if (d?.thumbnail?.source) return upsize(d.thumbnail.source, size)
    }
  } catch { /* bỏ qua */ }
  const api = `https://${host}/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=${size}&titles=${encodeURIComponent(title)}`
  try {
    const r = await fetchImpl(api)
    if (r.ok) {
      const d = await r.json()
      const pages = d?.query?.pages
      if (pages) {
        const first = Object.values(pages)[0]
        if (first?.thumbnail?.source) return first.thumbnail.source
      }
    }
  } catch { /* bỏ qua */ }
  return null
}

async function searchTitle(host, query, fetchImpl) {
  const api = `https://${host}/w/api.php?action=query&format=json&origin=*&list=search&srlimit=1&srsearch=${encodeURIComponent(query)}`
  try {
    const r = await fetchImpl(api)
    if (r.ok) {
      const d = await r.json()
      const hit = d?.query?.search?.[0]?.title
      if (hit) return hit
    }
  } catch { /* bỏ qua */ }
  return null
}

async function tryHost(host, query, size, fetchImpl) {
  let url = await summaryThumb(host, query, size, fetchImpl)
  if (url) return url
  const title = await searchTitle(host, query, fetchImpl)
  if (title && title !== query) {
    url = await summaryThumb(host, title, size, fetchImpl)
    if (url) return url
  }
  return null
}

export async function resolveImage(query, size = 400, { fetchImpl = fetch } = {}) {
  const q = String(query || '').trim()
  if (!q) return { url: null, source: null }
  const vi = await tryHost('vi.wikipedia.org', q, size, fetchImpl)
  if (vi) return { url: vi, source: 'wikipedia-vi' }
  const en = await tryHost('en.wikipedia.org', q, size, fetchImpl)
  if (en) return { url: en, source: 'wikipedia-en' }
  return { url: null, source: null }
}
