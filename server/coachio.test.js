import { describe, it, expect } from 'vitest'
import { mapError, AppError, parseJson } from './coachio.js'

describe('mapError', () => {
  const cases = [
    [401, 'INVALID_KEY'],
    [402, 'NO_CREDIT'],
    [429, 'RATE_LIMIT'],
    [400, 'BAD_REQUEST'],
    [500, 'UPSTREAM'],
    [503, 'UPSTREAM'],
    ['TIMEOUT', 'TIMEOUT'],
    ['PARSE_FAILED', 'PARSE_FAILED'],
  ]
  it.each(cases)('status %s → code %s', (status, code) => {
    const e = mapError(status)
    expect(e).toBeInstanceOf(AppError)
    expect(e.code).toBe(code)
    expect(typeof e.userMessage).toBe('string')
    expect(e.userMessage.length).toBeGreaterThan(0)
  })
})

describe('parseJson', () => {
  it('parse JSON thuần', () => {
    expect(parseJson('[{"a":1}]')).toEqual([{ a: 1 }])
  })
  it('bóc code fence ```json', () => {
    const t = '```json\n{"x": 2}\n```'
    expect(parseJson(t)).toEqual({ x: 2 })
  })
  it('bóc code fence ``` trơn', () => {
    const t = '```\n{"y": 3}\n```'
    expect(parseJson(t)).toEqual({ y: 3 })
  })
  it('bỏ text thừa quanh JSON array', () => {
    const t = 'Đây là kết quả:\n[1,2,3]\nHết.'
    expect(parseJson(t)).toEqual([1, 2, 3])
  })
  it('ném PARSE_FAILED khi hỏng', () => {
    expect(() => parseJson('không phải json')).toThrowError(/không đọc được/)
  })
})
