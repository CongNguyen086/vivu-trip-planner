# P4 — Modal chi tiết, Thời tiết & Lịch trình — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bấm thẻ mở modal (ảnh lớn + tóm tắt Wikipedia + thời tiết theo ngày) và nút "Tạo lịch trình" sinh lịch trình chia Sáng/Trưa/Chiều/Tối, mỗi khung giờ có ảnh.

**Architecture:** Thêm `server/weather.js` (geocode + forecast/seasonal + `wmoToIcon`), route `/api/place`, `/api/weather`, `/api/itinerary`. Client: `DetailModal`, `SlotTimeline` (mở rộng ItineraryTimeline với thumbnail), `ItineraryScreen`.

**Tech Stack:** Node 20 fetch, Open-Meteo (không key), Wikipedia, Vivu DS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-ai-trip-planner-vivu-design.md` (§5.3, §5.4, §5.5, §7.1)

**Phụ thuộc:** P1, P2 (coachio/generateJson/prompts, images, plugin/routes), P3 (App shell, SmartImage, useResolvedImage, ErrorBanner).

## Global Constraints

- Model Coachio cố định `google/gemini-3.1-flash-lite`, key chỉ ở server, timeout 45s.
- Không lấy lat/lon từ AI — lấy từ `/api/place` (Wikipedia) rồi fallback Open-Meteo geocoding.
- Weather response phải khớp shape `WeatherStrip.days` (`{label, icon, high, low, rain}`).
- Lịch trình đúng `days` ngày, mỗi ngày đúng 4 slot Sáng→Trưa→Chiều→Tối; mỗi slot có ảnh.
- UI tiếng Việt, chỉ token/component Vivu, không màn hình trắng.

---

### Task 1: `wmoToIcon()` + `pickWeatherMode()`

**Files:**
- Create: `server/weather.js` (bắt đầu bằng 2 hàm thuần), `server/weather.test.js`

**Interfaces:**
- Produces:
  - `wmoToIcon(code)` → tên glyph Lucide: sun|cloud-sun|cloud|wind|cloud-drizzle|cloud-rain|cloud-lightning.
  - `pickWeatherMode(startISO, todayISO)` → `'forecast'` nếu `start` cách `today` trong [0,16] ngày, ngược lại `'seasonal'` (kể cả quá khứ).

- [ ] **Step 1: Viết test `server/weather.test.js`**

```js
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
```

- [ ] **Step 2: Chạy — fail.**

- [ ] **Step 3: Viết 2 hàm trong `server/weather.js`**

```js
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
```

- [ ] **Step 4: Chạy — pass.**

- [ ] **Step 5: Commit**

```bash
git add server/weather.js server/weather.test.js
git commit -m "feat: wmoToIcon + pickWeatherMode"
```

---

### Task 2: `getWeather()` — geocode + forecast/seasonal

**Files:**
- Modify: `server/weather.js`

**Interfaces:**
- Produces: `async getWeather({ name, lat, lon, start, end }, { fetchImpl=fetch } = {})` → `{ mode, days:[{label,icon,high,low,rain}] }`. Nếu thiếu lat/lon → geocode theo `name` (countryCode VN). forecast dùng Open-Meteo forecast; seasonal dùng Archive API cùng khoảng ngày năm trước.

Không unit-test hàm mạng này (kiểm gián tiếp qua route + bằng tay). Dùng `wmoToIcon`, `pickWeatherMode`.

- [ ] **Step 1: Viết `getWeather` + helper trong `server/weather.js`**

```js
const MONTHS = ['','1','2','3','4','5','6','7','8','9','10','11','12']
function label(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  const wd = ['CN','T2','T3','T4','T5','T6','T7'][d.getUTCDay()]
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
```

- [ ] **Step 2: Commit**

```bash
git add server/weather.js
git commit -m "feat: getWeather forecast/seasonal"
```

---

### Task 3: `getPlace()` + route `/api/place`, `/api/weather`, `/api/itinerary`

**Files:**
- Modify: `server/images.js` (thêm `getPlace`) hoặc tạo `server/place.js`; `server/routes.js`

**Interfaces:**
- Produces:
  - `async getPlace(query, { fetchImpl=fetch } = {})` → `{ extract, imageUrl, lat, lon }` từ Wikipedia REST summary (`extract`, `thumbnail.source`, `coordinates`). Thử vi rồi en.
  - Route `GET /api/place?q=` → `getPlace` (cache).
  - Route `GET /api/weather?q=&lat=&lon=&start=&end=` → `getWeather` (cache theo lat|lon|start|end).
  - Route `POST /api/itinerary` → `buildItineraryPrompt` + `generateJson`, chuẩn hoá `Day[]`.

- [ ] **Step 1: Thêm `getPlace` vào `server/place.js`**

```js
async function summaryOf(host, title, fetchImpl) {
  const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const r = await fetchImpl(url)
    if (!r.ok) return null
    const d = await r.json()
    return {
      extract: d.extract || '',
      imageUrl: d?.thumbnail?.source ? d.thumbnail.source.replace(/\/(\d+)px-/, '/800px-') : null,
      lat: d?.coordinates?.lat ?? null,
      lon: d?.coordinates?.lon ?? null,
    }
  } catch { return null }
}

export async function getPlace(query, { fetchImpl = fetch } = {}) {
  const q = String(query || '').trim()
  const vi = await summaryOf('vi.wikipedia.org', q, fetchImpl)
  if (vi && vi.extract) return vi
  const en = await summaryOf('en.wikipedia.org', q, fetchImpl)
  if (en && en.extract) return en
  return vi || en || { extract: '', imageUrl: null, lat: null, lon: null }
}
```

- [ ] **Step 2: Thêm 3 route vào `server/routes.js`**

```js
import { getWeather } from './weather.js'
import { getPlace } from './place.js'
import { buildItineraryPrompt } from './prompts.js'

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
```

Lưu ý: `server/routes.js` đã `import { generateJson } from './coachio.js'` ở P2 — tái dùng, không import lặp.

- [ ] **Step 3: Kiểm tra bằng tay**

Run: `npm run dev` rồi:
`curl -s "http://localhost:5173/api/place?q=%C4%90%C3%A0%20L%E1%BA%A1t"` → có `extract` + `lat/lon`.
`curl -s "http://localhost:5173/api/weather?lat=11.94&lon=108.44&start=2026-09-20&end=2026-09-22"` → `{mode:"forecast",days:[...]}`.
`curl` `/api/itinerary` với body `{destination:{name:"Đà Lạt",province:"Lâm Đồng"},days:2,startDate:"2026-09-20",request:{prompt:""}}` → array 2 ngày × 4 slot.

- [ ] **Step 4: Commit**

```bash
git add server/place.js server/routes.js
git commit -m "feat: /api/place + /api/weather + /api/itinerary"
```

---

### Task 4: `DetailModal` — ảnh + Wikipedia + thời tiết

**Files:**
- Create: `src/components/DetailModal.jsx`

**Interfaces:**
- Consumes: `Modal`, `WeatherStrip`, `Button`, `Icon`, `Tag` (DS), `SmartImage`, `Skeleton`, `apiPlace`, `apiWeather`, `ErrorBanner`.
- Produces: `DetailModal({ place, tripRequest, onClose, onCreateItinerary })` — khi `place` truthy: `apiPlace(place.wikiTitle)` lấy extract+toạ độ → `apiWeather` (truyền lat/lon). Hero dùng `SmartImage` 16:9. Nút "Tạo lịch trình" gọi `onCreateItinerary`. Thời tiết lỗi → khối "Chưa lấy được dự báo" + thử lại; nút tạo lịch trình vẫn bấm được.

- [ ] **Step 1: Viết `src/components/DetailModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Modal, WeatherStrip, Button, Icon, Skeleton } from '../design-system/index.js'
import { SmartImage } from './SmartImage.jsx'
import { apiPlace, apiWeather } from '../lib/api.js'
import { isoPlusDays } from '../state.js'

export function DetailModal({ place, tripRequest, onClose, onCreateItinerary }) {
  const open = !!place
  const [extract, setExtract] = useState('')
  const [placeLoading, setPlaceLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [wxLoading, setWxLoading] = useState(false)
  const [wxError, setWxError] = useState(false)

  const loadWeather = (lat, lon) => {
    setWxLoading(true); setWxError(false)
    const start = tripRequest.startDate
    const end = isoPlusDays(start, tripRequest.days - 1)
    apiWeather({ name: place.name, lat, lon, start, end })
      .then((w) => setWeather(w))
      .catch(() => setWxError(true))
      .finally(() => setWxLoading(false))
  }

  useEffect(() => {
    if (!place) return
    setExtract(''); setWeather(null); setWxError(false); setPlaceLoading(true)
    let alive = true
    apiPlace(place.wikiTitle || place.name)
      .then((p) => {
        if (!alive) return
        setExtract(p.extract || '')
        loadWeather(p.lat, p.lon)
      })
      .catch(() => { if (alive) loadWeather(null, null) })
      .finally(() => { if (alive) setPlaceLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place])

  if (!open) return null

  const footer = (
    <Button variant="primary" size="md" iconLeft={<Icon name="sparkles" size={18} />} onClick={onCreateItinerary}>
      Tạo lịch trình
    </Button>
  )

  return (
    <Modal open={open} onClose={onClose} imageTop footer={footer} width={640}>
      <div style={{ margin: '-16px -16px 0' }}>
        <SmartImage query={place.wikiTitle || place.name} size={800} alt={place.name} radius={0} aspectRatio="16/9" />
      </div>
      <h2 style={{ margin: '16px 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{place.name}</h2>
      {place.province && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14 }}><Icon name="map-pin" size={16} />{place.province}</div>}

      <div style={{ marginTop: 12 }}>
        {placeLoading ? <Skeleton variant="text" width="100%" /> :
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-tertiary)' }}>{extract || place.whyFit}</p>}
      </div>

      <h3 style={{ margin: '20px 0 8px', fontSize: 16, fontWeight: 700 }}>Thời tiết {tripRequest.days} ngày</h3>
      {wxLoading && <div style={{ display: 'flex', gap: 8 }}>{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} variant="rect" width={92} height={112} />)}</div>}
      {!wxLoading && weather && (
        <>
          <WeatherStrip days={weather.days} />
          {weather.mode === 'seasonal' && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Trung bình cùng kỳ năm ngoái, chưa có dự báo.</p>}
        </>
      )}
      {!wxLoading && wxError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
          <span>Chưa lấy được dự báo.</span>
          <Button variant="ghost" size="sm" onClick={() => loadWeather(null, null)}>Thử lại</Button>
        </div>
      )}
    </Modal>
  )
}
```

- [ ] **Step 2: Nối DetailModal vào `App.jsx`.** Thêm import + render sau ExploreScreen, dùng `selectedPlace`. "Tạo lịch trình" → set view itinerary (lắp đầy đủ ở Task 6):

```jsx
import { DetailModal } from './components/DetailModal.jsx'
// trong return, sau các view:
{selectedPlace && (
  <DetailModal
    place={selectedPlace}
    tripRequest={tripRequest}
    onClose={() => setSelectedPlace(null)}
    onCreateItinerary={() => { setView(VIEWS.ITINERARY); setSelectedPlace(null) }}
  />
)}
```

- [ ] **Step 3: Thử** — bấm 1 thẻ → modal mở, hero ảnh lớn, extract Wikipedia thật, WeatherStrip theo đúng số ngày. Trên mobile 375px → modal thành bottom sheet.

- [ ] **Step 4: Commit**

```bash
git add src/components/DetailModal.jsx src/App.jsx
git commit -m "feat: detail modal with wikipedia + weather"
```

---

### Task 5: `SlotTimeline` — ItineraryTimeline có thumbnail ảnh

**Files:**
- Create: `src/components/SlotTimeline.jsx`

**Interfaces:**
- Consumes: `Icon` (DS), `SmartImage`.
- Produces: `SlotTimeline({ slots })` — tái tạo rail coral + icon khung giờ của `ItineraryTimeline` (đọc `src/design-system/components/travel/ItineraryTimeline.jsx` để copy đúng style rail), nhưng mỗi item render kèm `SmartImage` thumbnail 4:3 (`size=200`) bên trái. `slots` = mảng `{ period, time?, placeName, description, duration?, icon?, wikiTitle, imageQuery }`.

Lý do viết mới thay vì dùng `ItineraryTimeline`: `Item` trong DS là nội bộ, không nhận ảnh. `SlotTimeline` giữ nguyên vocabulary (rail 2px `--border-default`, node 36px `--color-primary-soft`, icon `sunrise/sun/sunset/moon`) — chỉ thêm ô ảnh.

- [ ] **Step 1: Viết `src/components/SlotTimeline.jsx`**

```jsx
import { Icon } from '../design-system/index.js'
import { SmartImage } from './SmartImage.jsx'

const SLOT_ICON = { 'Sáng': 'sunrise', 'Trưa': 'sun', 'Chiều': 'sunset', 'Tối': 'moon' }

export function SlotTimeline({ slots = [] }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {slots.map((s, i) => {
        const last = i === slots.length - 1
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', columnGap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={SLOT_ICON[s.period] || 'clock'} size={18} />
              </span>
              {!last && <span style={{ width: 2, flex: 1, background: 'var(--border-default)', margin: '4px 0' }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : 24, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.period}</span>
                {s.duration && <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} />{s.duration}</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, padding: 10, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12 }}>
                <div style={{ width: 96, flexShrink: 0 }}>
                  <SmartImage query={s.wikiTitle || s.imageQuery || s.placeName} size={200} alt={s.placeName} radius={8} aspectRatio="4/3" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Icon name={s.icon || 'map-pin'} size={16} />{s.placeName}
                  </div>
                  {s.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{s.description}</div>}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SlotTimeline.jsx
git commit -m "feat: slot timeline with image thumbnails"
```

---

### Task 6: `ItineraryScreen` + nối `/api/itinerary`

**Files:**
- Create: `src/components/ItineraryScreen.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `Chip`, `Button`, `Icon` (DS), `SlotTimeline`, `ErrorBanner`, `apiItinerary`, `isoPlusDays`.
- Produces: `ItineraryScreen({ place, tripRequest, itinerary, setItinerary, onBack })` — khi mount và `itinerary===null` → gọi `apiItinerary({ destination:place, days, startDate, request:tripRequest })`; skeleton theo số ngày khi chờ; tab Ngày (Chip); render `SlotTimeline` cho ngày chọn; lỗi → ErrorBanner + thử lại; nút quay lại lưới.

- [ ] **Step 1: Viết `src/components/ItineraryScreen.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Chip, Button, Icon } from '../design-system/index.js'
import { SlotTimeline } from './SlotTimeline.jsx'
import { ErrorBanner } from './ErrorBanner.jsx'
import { apiItinerary } from '../lib/api.js'

export function ItineraryScreen({ place, tripRequest, itinerary, setItinerary, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [day, setDay] = useState(0)

  const run = () => {
    setLoading(true); setError(null)
    apiItinerary({ destination: place, days: tripRequest.days, startDate: tripRequest.startDate, request: tripRequest })
      .then((days) => { setItinerary(days); setDay(0) })
      .catch((e) => setError(e.userMessage || 'Không tạo được lịch trình. Thử lại.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (!itinerary) run() /* eslint-disable-next-line */ }, [])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
      <Button variant="ghost" size="sm" iconLeft={<Icon name="chevron-left" size={16} />} onClick={onBack}>Quay lại gợi ý</Button>
      <h1 style={{ margin: '12px 0 4px', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {place.name} {tripRequest.days} ngày
      </h1>
      {place.province && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{place.province}</p>}

      {error && <div style={{ margin: '16px 0' }}><ErrorBanner message={error} onRetry={run} /></div>}

      {loading && (
        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 96, borderRadius: 12, background: 'var(--surface-subtle)' }} />
          ))}
        </div>
      )}

      {!loading && itinerary && (
        <>
          <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px', flexWrap: 'wrap' }}>
            {itinerary.map((d, i) => (
              <Chip key={i} selected={day === i} showCheck={false} onClick={() => setDay(i)}>Ngày {d.dayIndex}</Chip>
            ))}
          </div>
          <SlotTimeline slots={itinerary[day]?.slots || []} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Nối vào `App.jsx`** — thay placeholder itinerary; reset itinerary khi tạo mới từ modal.

```jsx
import { ItineraryScreen } from './components/ItineraryScreen.jsx'

// onCreateItinerary trong DetailModal đổi thành:
onCreateItinerary={() => { setItinerary(null); setView(VIEWS.ITINERARY); setSelectedPlace(null) }}

// view itinerary:
{view === VIEWS.ITINERARY && selectedPlaceOrLast && (
  <ItineraryScreen
    place={itineraryPlace}
    tripRequest={tripRequest}
    itinerary={itinerary} setItinerary={setItinerary}
    onBack={() => setView(VIEWS.EXPLORE)}
  />
)}
```

Ghi chú state: `selectedPlace` bị clear khi mở itinerary. Lưu place cho itinerary bằng biến riêng: thêm `const [itineraryPlace, setItineraryPlace] = useState(null)`; trong `onCreateItinerary` set `setItineraryPlace(selectedPlace)` trước khi clear. Render dùng `itineraryPlace`. Sửa điều kiện view thành `view === VIEWS.ITINERARY && itineraryPlace`.

- [ ] **Step 3: Cập nhật `App.jsx` đầy đủ** cho khớp ghi chú trên

```jsx
import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'
import { ExploreScreen } from './components/ExploreScreen.jsx'
import { DetailModal } from './components/DetailModal.jsx'
import { ItineraryScreen } from './components/ItineraryScreen.jsx'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itineraryPlace, setItineraryPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)

  const createItinerary = () => {
    setItineraryPlace(selectedPlace); setItinerary(null)
    setView(VIEWS.ITINERARY); setSelectedPlace(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <ExploreScreen
          tripRequest={tripRequest} setTripRequest={setTripRequest}
          destinations={destinations} setDestinations={setDestinations}
          onSelectPlace={setSelectedPlace}
        />
      )}
      {view === VIEWS.ITINERARY && itineraryPlace && (
        <ItineraryScreen
          place={itineraryPlace} tripRequest={tripRequest}
          itinerary={itinerary} setItinerary={setItinerary}
          onBack={() => setView(VIEWS.EXPLORE)}
        />
      )}
      {selectedPlace && (
        <DetailModal
          place={selectedPlace} tripRequest={tripRequest}
          onClose={() => setSelectedPlace(null)} onCreateItinerary={createItinerary}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Thử luồng đầy đủ** — thẻ → modal → Tạo lịch trình → màn lịch trình: skeleton đúng số ngày → tab Ngày 1..n → mỗi khung giờ Sáng/Trưa/Chiều/Tối có ảnh + mô tả. Quay lại được.

- [ ] **Step 5: Commit**

```bash
git add src/components/ItineraryScreen.jsx src/App.jsx
git commit -m "feat: itinerary screen wired to /api/itinerary"
```

---

### Task 7: QA cuối + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Chạy toàn bộ test**

Run: `npx vitest run`
Expected: xanh (cache, coachio, images, weather).

- [ ] **Step 2: QA thủ công qua `/browse`** ở desktop 1440 và mobile 375, chạy hết luồng explore → gợi ý → modal → thời tiết → lịch trình. Chụp màn hình từng bước. Kiểm checklist nghiệm thu spec §11:
  1. 6-8 thẻ có ảnh/tên/whyFit/tag
  2. không ô ảnh trống ở mọi trạng thái (kể cả địa danh lạ → gradient coral)
  3. skeleton suốt thời gian chờ, không màn hình trắng
  4. modal: ảnh lớn + extract thật + thời tiết đúng ngày
  5. lịch trình đúng số ngày × 4 khung giờ, mỗi khung có ảnh + mô tả
  6. lỗi API → banner tiếng Việt + thử lại, không crash
  7. đúng ở 1440 và 375
  8. `COACHIO_API_KEY` không có trong bundle: `npm run build` rồi `grep -r COACHIO dist/ || echo OK` → OK (không thấy).

- [ ] **Step 3: Viết `README.md`**

```markdown
# Vivu — AI Trip Planner (Phase 1)

Web app demo lên kế hoạch du lịch bằng AI. Mô tả chuyến đi → AI gợi ý địa điểm (ảnh thật
Wikipedia) → xem chi tiết + thời tiết → tạo lịch trình chia Sáng/Trưa/Chiều/Tối.

## Chạy

1. `npm install`
2. Sao chép `.env.example` → `.env`, điền `COACHIO_API_KEY`
3. `npm run dev` → mở http://localhost:5173

## Kiến trúc

- Client: Vite + React 18 (JSX). Design System "Vivu" trong `src/design-system/`.
- Server: Vite plugin middleware (`server/`), mount `/api/*`. Key chỉ ở server.
- AI: Coachio LLM `google/gemini-3.1-flash-lite`. Ảnh: Wikipedia REST. Thời tiết: Open-Meteo.

## Test

`npm run test` (Vitest — các hàm thuần phía server).
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: readme + qa pass"
```

---

## Self-Review (P4)

- **Spec coverage:** §5.3 place (Task 3), §5.4 weather forecast/seasonal + WMO icon (Task 1-3), §5.5 itinerary (Task 3, 6), DetailModal §7.1 (Task 4), SlotTimeline ảnh mỗi khung giờ §3.1 (Task 5), flow modal→itinerary §7.1 (Task 6), QA + bảo mật bundle §11 (Task 7).
- **Placeholder scan:** Không có TBD. Task 5 nêu rõ đọc file DS để copy style rail — hành động cụ thể. Task 6 có ghi chú state chi tiết + Step 3 viết lại App đầy đủ (không "tương tự Task N").
- **Type consistency:** `getWeather` trả `{mode,days:[{label,icon,high,low,rain}]}` khớp `WeatherStrip.days` (DS) và `apiWeather`. `Day.slots[]` fields (`period,placeName,description,duration,icon,wikiTitle,imageQuery`) khớp giữa route (Task 3), `SlotTimeline` (Task 5), `ItineraryScreen` (Task 6) và spec §5.5. `getPlace` trả `{extract,imageUrl,lat,lon}` khớp `apiPlace` và DetailModal. `isoPlusDays` dùng nhất quán (P1).

## Điều kiện hoàn thành P4

Toàn bộ luồng chạy end-to-end với AI + ảnh + thời tiết thật; lịch trình đúng số ngày × 4 khung giờ, mỗi khung có ảnh; mọi lỗi hiển thị nhẹ nhàng; `npx vitest run` xanh; `COACHIO_API_KEY` không lộ trong `dist/`; chạy đúng 1440px và 375px.
