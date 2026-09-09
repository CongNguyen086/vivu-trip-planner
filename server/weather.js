export function wmoToIcon(code) {
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'cloud-sun'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'wind'
  if (code >= 51 && code <= 57) return 'cloud-drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'cloud-rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'cloud'
  if (code >= 95 && code <= 99) return 'cloud-lightning'
  return 'cloud'
}

export function pickWeatherMode(startISO, todayISO = new Date().toISOString().slice(0, 10)) {
  const start = new Date(startISO + 'T00:00:00Z')
  const today = new Date(todayISO + 'T00:00:00Z')
  const diffDays = Math.round((start - today) / 86400000)
  return diffDays >= 0 && diffDays <= 16 ? 'forecast' : 'seasonal'
}

const MONTHS = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
function label(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getUTCDay()]
  return `${wd} ${d.getUTCDate()}/${MONTHS[d.getUTCMonth() + 1]}`
}
function shiftYear(iso, delta) {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCFullYear(d.getUTCFullYear() + delta)
  return d.toISOString().slice(0, 10)
}

async function geocode(name, fetchImpl) {
  const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=vi&countryCode=VN`
  const r = await fetchImpl(u)
  if (!r.ok) return null
  const d = await r.json()
  const hit = d?.results?.[0]
  return hit ? { lat: hit.latitude, lon: hit.longitude } : null
}

function toDays(json, mode) {
  const t = json?.daily?.time || []
  const hi = json?.daily?.temperature_2m_max || []
  const lo = json?.daily?.temperature_2m_min || []
  const code = json?.daily?.weather_code || []
  const rain = json?.daily?.precipitation_probability_max || []
  return t.map((date, i) => ({
    label: label(date),
    icon: wmoToIcon(code[i] ?? -1),
    high: Math.round(hi[i]),
    low: Math.round(lo[i]),
    rain: mode === 'forecast' && rain[i] != null ? Math.round(rain[i]) : undefined,
  }))
}

export async function getWeather({ name, lat, lon, start, end }, { fetchImpl = fetch } = {}) {
  if (lat == null || lon == null) {
    const g = name ? await geocode(name, fetchImpl) : null
    if (!g) throw Object.assign(new Error('geocode'), { code: 'UPSTREAM', httpStatus: 502, userMessage: 'Không xác định được vị trí để lấy thời tiết.' })
    lat = g.lat; lon = g.lon
  }
  const mode = pickWeatherMode(start)
  let url
  if (mode === 'forecast') {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Asia/Bangkok&start_date=${start}&end_date=${end}`
  } else {
    const s = shiftYear(start, -1), e = shiftYear(end, -1)
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Bangkok&start_date=${s}&end_date=${e}`
  }
  const r = await fetchImpl(url)
  if (!r.ok) throw Object.assign(new Error('weather'), { code: 'UPSTREAM', httpStatus: 502, userMessage: 'Chưa lấy được dự báo.' })
  const json = await r.json()
  return { mode, days: toDays(json, mode) }
}
