import { describe, it, expect } from 'vitest'
import { createCache } from './cache.js'

describe('createCache', () => {
  it('trả undefined khi miss', () => {
    const c = createCache()
    expect(c.get('x')).toBeUndefined()
  })
  it('get lại giá trị đã set', () => {
    const c = createCache()
    c.set('x', 42)
    expect(c.get('x')).toBe(42)
  })
  it('hết hạn theo ttl', () => {
    const c = createCache({ ttlMs: 10 })
    c.set('x', 1)
    const now = Date.now()
    while (Date.now() - now < 15) {}
    expect(c.get('x')).toBeUndefined()
  })
  it('evict phần tử cũ nhất khi vượt max', () => {
    const c = createCache({ max: 2 })
    c.set('a', 1); c.set('b', 2); c.set('c', 3)
    expect(c.get('a')).toBeUndefined()
    expect(c.get('b')).toBe(2)
    expect(c.get('c')).toBe(3)
  })
})
