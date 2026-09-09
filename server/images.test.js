import { describe, it, expect } from 'vitest'
import { resolveImage } from './images.js'

function mockFetch(map) {
  return async (url) => {
    for (const [needle, payload] of map) {
      if (url.includes(needle)) return { ok: true, json: async () => payload }
    }
    return { ok: false, status: 404, json: async () => ({}) }
  }
}

describe('resolveImage', () => {
  it('lấy ảnh từ summary vi ngay bước 1', async () => {
    const f = mockFetch([
      ['vi.wikipedia.org/api/rest_v1/page/summary', { thumbnail: { source: 'https://img/vi.jpg' } }],
    ])
    const r = await resolveImage('Đà Lạt', 400, { fetchImpl: f })
    expect(r.url).toBe('https://img/vi.jpg')
    expect(r.source).toBe('wikipedia-vi')
  })

  it('miss summary vi → search vi → summary lại', async () => {
    let summaryCalls = 0
    const f = async (url) => {
      if (url.includes('/summary/')) {
        summaryCalls++
        if (summaryCalls === 1) return { ok: false, status: 404, json: async () => ({}) }
        return { ok: true, json: async () => ({ thumbnail: { source: 'https://img/vi2.jpg' } }) }
      }
      if (url.includes('list=search')) return { ok: true, json: async () => ({ query: { search: [{ title: 'Hồ Xuân Hương' }] } }) }
      return { ok: false, status: 404, json: async () => ({}) }
    }
    const r = await resolveImage('chỗ nào đó', 400, { fetchImpl: f })
    expect(r.url).toBe('https://img/vi2.jpg')
    expect(r.source).toBe('wikipedia-vi')
  })

  it('miss vi hoàn toàn → thử en', async () => {
    const f = async (url) => {
      if (url.includes('en.wikipedia.org') && url.includes('/summary/')) return { ok: true, json: async () => ({ thumbnail: { source: 'https://img/en.jpg' } }) }
      return { ok: false, status: 404, json: async () => ({}) }
    }
    const r = await resolveImage('Nowhere', 800, { fetchImpl: f })
    expect(r.url).toBe('https://img/en.jpg')
    expect(r.source).toBe('wikipedia-en')
  })

  it('miss tất cả → url null', async () => {
    const f = async () => ({ ok: false, status: 404, json: async () => ({}) })
    const r = await resolveImage('zzz', 400, { fetchImpl: f })
    expect(r).toEqual({ url: null, source: null })
  })
})
