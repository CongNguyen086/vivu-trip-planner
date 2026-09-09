import { describe, it, expect } from 'vitest'
import { wmoToIcon, pickWeatherMode } from './weather.js'

describe('wmoToIcon', () => {
  const cases = [
    [0, 'sun'], [1, 'cloud-sun'], [2, 'cloud-sun'], [3, 'cloud'],
    [45, 'wind'], [48, 'wind'],
    [51, 'cloud-drizzle'], [55, 'cloud-drizzle'],
    [61, 'cloud-rain'], [65, 'cloud-rain'], [80, 'cloud-rain'], [82, 'cloud-rain'],
    [71, 'cloud'], [86, 'cloud'],
    [95, 'cloud-lightning'], [99, 'cloud-lightning'],
  ]
  it.each(cases)('code %i → %s', (code, icon) => {
    expect(wmoToIcon(code)).toBe(icon)
  })
  it('mã lạ → cloud', () => { expect(wmoToIcon(123)).toBe('cloud') })
})

describe('pickWeatherMode', () => {
  it('trong 16 ngày → forecast', () => {
    expect(pickWeatherMode('2026-09-20', '2026-09-09')).toBe('forecast')
  })
  it('đúng biên 16 ngày → forecast', () => {
    expect(pickWeatherMode('2026-09-25', '2026-09-09')).toBe('forecast')
  })
  it('quá 16 ngày → seasonal', () => {
    expect(pickWeatherMode('2026-11-01', '2026-09-09')).toBe('seasonal')
  })
  it('ngày quá khứ → seasonal', () => {
    expect(pickWeatherMode('2026-09-01', '2026-09-09')).toBe('seasonal')
  })
})
