import { wikiFetch } from './wiki.js'

async function summaryOf(host, title, fetchImpl) {
  const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const r = await fetchImpl(url)
    if (!r.ok) return null
    const d = await r.json()
    return {
      extract: d.extract || '',
      imageUrl: d?.thumbnail?.source || null,
      lat: d?.coordinates?.lat ?? null,
      lon: d?.coordinates?.lon ?? null,
    }
  } catch { return null }
}

export async function getPlace(query, { fetchImpl = wikiFetch } = {}) {
  const q = String(query || '').trim()
  const vi = await summaryOf('vi.wikipedia.org', q, fetchImpl)
  if (vi && vi.extract) return vi
  const en = await summaryOf('en.wikipedia.org', q, fetchImpl)
  if (en && en.extract) return en
  return vi || en || { extract: '', imageUrl: null, lat: null, lon: null }
}
