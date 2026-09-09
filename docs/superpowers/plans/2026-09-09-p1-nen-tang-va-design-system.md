# P1 — Nền tảng & Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng project Vite + React chạy được, import Design System "Vivu", có App shell state-machine 3 view, và Vite plugin middleware trả `/api/health`.

**Architecture:** Vite + React 18 (JSX, không TS). Design System vendor nguyên vào `src/design-system/`. Backend là một Vite plugin dùng `configureServer` mount tại `/api/*`. Không framework backend riêng.

**Tech Stack:** Vite 5, React 18, `@vitejs/plugin-react`, Vitest. Không thêm UI lib ngoài Vivu.

**Spec:** `docs/superpowers/specs/2026-09-09-ai-trip-planner-vivu-design.md`

## Global Constraints

- Ngôn ngữ code client: **JavaScript + JSX**, không TypeScript.
- Ngôn ngữ UI: **tiếng Việt**, xưng "bạn", sentence case, **không emoji** (icon Lucide qua `Icon`).
- Model Coachio cố định: `google/gemini-3.1-flash-lite`. Key **chỉ ở server** qua `process.env.COACHIO_API_KEY`. Biến env **không** có tiền tố `VITE_` (tránh nhúng vào bundle client).
- Chỉ dùng token + component của Vivu. **Không** thêm màu / radius / shadow / font mới. Coral `--color-primary` chỉ cho CTA + điểm nhấn.
- Không log API key, không log base64.
- Phạm vi Phase 1: không auth, không thanh toán, không bản đồ, không chia sẻ.
- Node 20, ESM (`"type":"module"`).

---

### Task 1: Scaffold project Vite + React

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `.env.example`, `.gitignore` (đã có, bổ sung nếu thiếu)

**Interfaces:**
- Produces: app boot được qua `npm run dev`; `App` là default export render placeholder.

- [ ] **Step 1: Tạo `package.json`**

```json
{
  "name": "vivu-trip-planner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Cài dependencies**

Run: `npm install`
Expected: tạo `node_modules/`, `package-lock.json`, không lỗi.

- [ ] **Step 3: Tạo `vite.config.js`** (plugin server thêm ở Task 5)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

- [ ] **Step 4: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vivu — Lên kế hoạch du lịch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Tạo `src/App.jsx` (placeholder)**

```jsx
export default function App() {
  return <div style={{ padding: 24 }}>Vivu — đang dựng…</div>
}
```

- [ ] **Step 6: Tạo `src/main.jsx`**

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: Tạo `.env.example`**

```
# Khóa Coachio LLM — CHỈ dùng phía server. KHÔNG thêm tiền tố VITE_.
COACHIO_API_KEY=
```

- [ ] **Step 8: Đảm bảo `.gitignore` có `.env`, `node_modules/`, `dist/`, `.DS_Store`** (đã tạo lúc init; kiểm tra, bổ sung nếu thiếu).

- [ ] **Step 9: Chạy dev thử**

Run: `npm run dev` (rồi Ctrl-C) hoặc `npm run build`
Expected: build thành công, không lỗi.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold vite + react"
```

---

### Task 2: Import Design System Vivu vào `src/design-system/`

**Files:**
- Create: toàn bộ cây `src/design-system/` (danh sách dưới)

**Interfaces:**
- Produces: `import './design-system/styles.css'`, và các component ES module:
  `Button`, `Chip`, `Icon`, `PlaceCard`, `Tag`, `Skeleton`/`SkeletonCard`,
  `Modal`, `PromptInput`, `DatePicker`, `WeatherStrip`, `ItineraryTimeline`.

**Cách lấy file:** Dùng tool **DesignSync** (`method: get_file`, `projectId: 19cabccc-3cf8-40bb-965a-a4536f981da6`) cho từng path trong danh sách, ghi **verbatim** nội dung sang `src/design-system/<đúng path tương đối>`. Nếu subagent không có design auth, hỏi session chính lấy hộ. **Không sửa nội dung file** — chỉ copy.

Danh sách path cần copy (giữ nguyên cây thư mục dưới `src/design-system/`):

```
styles.css
tokens/fonts.css
tokens/colors.css
tokens/typography.css
tokens/spacing.css
tokens/radius.css
tokens/shadows.css
tokens/motion.css
components/core/Icon.jsx
components/actions/Button.jsx
components/actions/Chip.jsx
components/forms/PromptInput.jsx
components/forms/DatePicker.jsx
components/display/PlaceCard.jsx
components/display/Tag.jsx
components/display/Skeleton.jsx
components/overlay/Modal.jsx
components/travel/WeatherStrip.jsx
components/travel/ItineraryTimeline.jsx
```

- [ ] **Step 1: Copy 8 file token + `styles.css`** (qua DesignSync get_file → Write). `styles.css` chứa `@import "tokens/...";`.

- [ ] **Step 2: Copy 11 file component `.jsx`** (Icon trước vì các component khác `import {Icon} from '../core/Icon.jsx'`).

- [ ] **Step 3: Tạo `src/design-system/index.js` re-export gọn**

```js
export { Icon } from './components/core/Icon.jsx'
export { Button } from './components/actions/Button.jsx'
export { Chip } from './components/actions/Chip.jsx'
export { PromptInput } from './components/forms/PromptInput.jsx'
export { DatePicker } from './components/forms/DatePicker.jsx'
export { PlaceCard } from './components/display/PlaceCard.jsx'
export { Tag } from './components/display/Tag.jsx'
export { Skeleton, SkeletonCard } from './components/display/Skeleton.jsx'
export { Modal } from './components/overlay/Modal.jsx'
export { WeatherStrip } from './components/travel/WeatherStrip.jsx'
export { ItineraryTimeline } from './components/travel/ItineraryTimeline.jsx'
```

Lưu ý: kiểm tra tên export thật của `Skeleton.jsx` (có thể là `Skeleton` và/hoặc `SkeletonCard`). Sửa dòng re-export cho khớp export thật của file vừa copy.

- [ ] **Step 4: Import CSS trong `src/main.jsx`**

Thêm dòng đầu file, trước render:

```jsx
import './design-system/styles.css'
```

- [ ] **Step 5: Kiểm tra Google Font.** Mở `src/design-system/tokens/fonts.css`. Nếu nó dựa vào Source Sans 3 mà **không** tự `@import` từ Google Fonts, thêm vào `index.html` trong `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap&subset=vietnamese" rel="stylesheet" />
```

(Nếu `fonts.css` đã tự import thì bỏ qua bước này để không lặp.)

- [ ] **Step 6: Render thử một component để xác minh DS hoạt động.** Sửa tạm `src/App.jsx`:

```jsx
import { Button, PlaceCard } from './design-system/index.js'

export default function App() {
  return (
    <div style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 320 }}>
      <Button>Gợi ý</Button>
      <PlaceCard name="Đà Lạt" description="Thử render" tags={['Núi', 'Cà phê']} rating={4.8} meta="Lâm Đồng" />
    </div>
  )
}
```

- [ ] **Step 7: Chạy dev, mở browser xác minh** nút coral pill + card render đúng (font Source Sans 3, radius 16, shadow raised).

Run: `npm run dev`
Expected: nút coral bo tròn, card có khung ảnh camera-placeholder + tag + rating.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: import vivu design system"
```

---

### Task 3: App shell — state machine 3 view

**Files:**
- Modify: `src/App.jsx`
- Create: `src/state.js` (hằng số view + trạng thái mặc định TripRequest)

**Interfaces:**
- Produces:
  - `VIEWS = { EXPLORE:'explore', ITINERARY:'itinerary' }`
  - `defaultTripRequest()` → `{ prompt:'', area:'', days:3, startDate:'<hôm nay+7 YYYY-MM-DD>', budget:null, styles:[], companions:null }`
  - `App` giữ state: `view`, `tripRequest`, `destinations`, `selectedPlace`, `itinerary`; và các setter truyền xuống các screen (screen thật lắp ở P3/P4).

- [ ] **Step 1: Tạo `src/state.js`**

```js
export const VIEWS = { EXPLORE: 'explore', ITINERARY: 'itinerary' }

export function isoPlusDays(base, n) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function defaultTripRequest() {
  const today = new Date()
  return {
    prompt: '',
    area: '',
    days: 3,
    startDate: isoPlusDays(today, 7),
    budget: null,
    styles: [],
    companions: null,
  }
}
```

- [ ] **Step 2: Viết App shell** (`src/App.jsx`) — placeholder screen, sẽ thay bằng screen thật ở P3/P4

```jsx
import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null) // null = chưa gợi ý
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <div style={{ padding: 24 }}>
          Explore (P3) — days: {tripRequest.days}, destinations: {destinations?.length ?? 0}
        </div>
      )}
      {view === VIEWS.ITINERARY && (
        <div style={{ padding: 24 }}>Itinerary (P4)</div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Chạy dev xác minh** view mặc định là explore, hiển thị `days: 3`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: app shell state machine"
```

---

### Task 4: Cache LRU + TTL cho server

**Files:**
- Create: `server/cache.js`, `server/cache.test.js`

**Interfaces:**
- Produces: `createCache({ max=200, ttlMs=30*60*1000 })` → `{ get(key), set(key, value), size }`. `get` trả `undefined` nếu miss hoặc hết hạn.

- [ ] **Step 1: Viết test `server/cache.test.js`**

```js
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
    while (Date.now() - now < 15) {} // busy-wait 15ms
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
```

- [ ] **Step 2: Chạy test — xác minh fail**

Run: `npx vitest run server/cache.test.js`
Expected: FAIL ("createCache is not defined" / không import được).

- [ ] **Step 3: Viết `server/cache.js`**

```js
export function createCache({ max = 200, ttlMs = 30 * 60 * 1000 } = {}) {
  const store = new Map() // key -> { value, expires }
  return {
    get(key) {
      const e = store.get(key)
      if (!e) return undefined
      if (Date.now() > e.expires) { store.delete(key); return undefined }
      // refresh recency
      store.delete(key); store.set(key, e)
      return e.value
    },
    set(key, value) {
      if (store.has(key)) store.delete(key)
      store.set(key, { value, expires: Date.now() + ttlMs })
      while (store.size > max) {
        const oldest = store.keys().next().value
        store.delete(oldest)
      }
    },
    get size() { return store.size },
  }
}
```

- [ ] **Step 4: Chạy test — xác minh pass**

Run: `npx vitest run server/cache.test.js`
Expected: PASS 4/4.

- [ ] **Step 5: Commit**

```bash
git add server/cache.js server/cache.test.js
git commit -m "feat: server LRU+TTL cache"
```

---

### Task 5: Vite plugin middleware + `/api/health`

**Files:**
- Create: `server/plugin.js`
- Modify: `vite.config.js`

**Interfaces:**
- Consumes: `createCache` (Task 4).
- Produces: `tripPlannerPlugin()` — Vite plugin có `configureServer(server)` gắn middleware xử lý mọi request bắt đầu `/api/`. Có sẵn helper `sendJson(res, status, obj)`, `readJsonBody(req)`, và một `cache` dùng chung cho các route sau. Route `GET /api/health` trả `{ ok: true }`.

- [ ] **Step 1: Viết `server/plugin.js`** (khung router; các route thật thêm ở P2/P4)

```js
import { createCache } from './cache.js'

const cache = createCache()

export function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(body)
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => { data += c; if (data.length > 1e6) reject(new Error('body too large')) })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

// Bảng route: mảng { method, pattern (RegExp trên pathname), handler(ctx) }
// ctx = { req, res, url, params, query, cache, sendJson, readJsonBody }
const routes = []
export function registerRoute(route) { routes.push(route) }

registerRoute({
  method: 'GET',
  match: (p) => p === '/api/health',
  handler: ({ res }) => sendJson(res, 200, { ok: true }),
})

export function tripPlannerPlugin() {
  return {
    name: 'trip-planner-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const pathname = url.pathname
        const route = routes.find((r) => r.method === req.method && r.match(pathname))
        if (!route) return sendJson(res, 404, { error: { code: 'NOT_FOUND', message: 'Không tìm thấy endpoint.' } })
        try {
          await route.handler({ req, res, url, query: url.searchParams, cache, sendJson, readJsonBody })
        } catch (err) {
          const code = err?.code || 'UPSTREAM'
          const message = err?.userMessage || 'Có lỗi xảy ra. Thử lại.'
          const status = err?.httpStatus || 500
          sendJson(res, status, { error: { code, message } })
        }
      })
    },
  }
}
```

- [ ] **Step 2: Gắn plugin vào `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tripPlannerPlugin } from './server/plugin.js'

export default defineConfig({
  plugins: [react(), tripPlannerPlugin()],
  server: { port: 5173 },
})
```

- [ ] **Step 3: Chạy dev, kiểm tra health**

Run: `npm run dev` rồi ở terminal khác `curl -s http://localhost:5173/api/health`
Expected: `{"ok":true}`

- [ ] **Step 4: Commit**

```bash
git add server/plugin.js vite.config.js
git commit -m "feat: vite api middleware + health route"
```

---

## Self-Review (P1)

- **Spec coverage:** Scaffold (§2, §10), import DS (§3), state machine (§7.1), Vite middleware (§2, §4), cache LRU (§4). Endpoint thật (suggest/image/place/weather/itinerary) thuộc P2 và P4 — có chỗ trong plan sau.
- **Placeholder scan:** Không có TBD/TODO; mọi step có code thật. Task 2 có một điểm cần xác minh runtime (tên export của `Skeleton.jsx`, và fonts.css có tự import Google Font không) — đã ghi cách xử lý cụ thể, không phải placeholder.
- **Type consistency:** `createCache`, `sendJson`, `readJsonBody`, `registerRoute`, `defaultTripRequest`, `VIEWS`, `isoPlusDays` — dùng nhất quán, được P2/P3/P4 tham chiếu đúng tên.

## Điều kiện hoàn thành P1

`npm run dev` chạy; DS render đúng (nút coral, card, font Source Sans 3); `App` ở view explore mặc định; `curl /api/health` → `{ok:true}`; `npx vitest run` xanh (cache test).
