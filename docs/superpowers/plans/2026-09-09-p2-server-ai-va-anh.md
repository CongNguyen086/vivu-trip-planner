# P2 — Server AI (Coachio) & Ảnh (Wikipedia) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend gọi Coachio LLM sinh gợi ý địa điểm (`/api/suggest`) và resolve ảnh thật từ Wikipedia (`/api/image`), có parse JSON chống lỗi, map lỗi tiếng Việt, cache, và client wrapper `src/lib/api.js`.

**Architecture:** Các module thuần trong `server/`: `coachio.js` (gọi LLM + parse + map lỗi), `prompts.js` (dựng prompt), `images.js` (chuỗi fallback Wikipedia). Route đăng ký vào plugin P1 qua `registerRoute`. Test bằng Vitest, mock `fetch`.

**Tech Stack:** Node 20 `fetch` toàn cục, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-ai-trip-planner-vivu-design.md` (§5.1, §5.2, §6)

**Phụ thuộc:** P1 xong (`server/plugin.js` có `registerRoute`, `sendJson`, `readJsonBody`, `cache`).

## Global Constraints

- Model cố định `google/gemini-3.1-flash-lite`, `stream:false`, `temperature:0.7`, `max_tokens:4096`.
- Header Coachio: `X-API-Key: process.env.COACHIO_API_KEY`, `Content-Type: application/json`.
- **Không log** key và **không log** base64. Timeout 45s mọi lời gọi Coachio.
- AI **chỉ** gợi ý địa điểm trong lãnh thổ **Việt Nam**.
- Không lấy lat/lon từ AI.
- UI/thông điệp tiếng Việt.

---

### Task 1: `mapError()` — chuẩn hoá lỗi

**Files:**
- Create: `server/coachio.js` (bắt đầu bằng phần lỗi), `server/coachio.test.js`

**Interfaces:**
- Produces:
  - `class AppError extends Error` với `{ code, httpStatus, userMessage }`
  - `mapError(status)` → `AppError` theo bảng spec §6. `status` là HTTP status từ Coachio (số) hoặc chuỗi đặc biệt `'TIMEOUT'` / `'PARSE_FAILED'`.

- [ ] **Step 1: Viết test `server/coachio.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { mapError, AppError } from './coachio.js'

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
```

- [ ] **Step 2: Chạy — fail**

Run: `npx vitest run server/coachio.test.js`
Expected: FAIL (không import được).

- [ ] **Step 3: Viết phần lỗi trong `server/coachio.js`**

```js
export class AppError extends Error {
  constructor(code, httpStatus, userMessage) {
    super(userMessage)
    this.code = code
    this.httpStatus = httpStatus
    this.userMessage = userMessage
  }
}

const MESSAGES = {
  INVALID_KEY: 'API key chưa hợp lệ. Kiểm tra COACHIO_API_KEY trong .env.',
  NO_CREDIT: 'Tài khoản đã hết credit.',
  RATE_LIMIT: 'Hệ thống đang bận, thử lại sau ít giây.',
  BAD_REQUEST: 'Yêu cầu không hợp lệ. Thử mô tả ngắn gọn hơn.',
  UPSTREAM: 'Không kết nối được máy chủ AI. Thử lại.',
  TIMEOUT: 'Quá thời gian chờ. Thử lại.',
  PARSE_FAILED: 'AI trả về dữ liệu không đọc được. Thử lại.',
}

export function mapError(status) {
  if (status === 'TIMEOUT') return new AppError('TIMEOUT', 504, MESSAGES.TIMEOUT)
  if (status === 'PARSE_FAILED') return new AppError('PARSE_FAILED', 502, MESSAGES.PARSE_FAILED)
  if (status === 401) return new AppError('INVALID_KEY', 401, MESSAGES.INVALID_KEY)
  if (status === 402) return new AppError('NO_CREDIT', 402, MESSAGES.NO_CREDIT)
  if (status === 429) return new AppError('RATE_LIMIT', 429, MESSAGES.RATE_LIMIT)
  if (status === 400) return new AppError('BAD_REQUEST', 400, MESSAGES.BAD_REQUEST)
  return new AppError('UPSTREAM', 502, MESSAGES.UPSTREAM)
}
```

- [ ] **Step 4: Chạy — pass**

Run: `npx vitest run server/coachio.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/coachio.js server/coachio.test.js
git commit -m "feat: coachio error mapping"
```

---

### Task 2: `parseJson()` — bóc code fence + retry semantics

**Files:**
- Modify: `server/coachio.js`, `server/coachio.test.js`

**Interfaces:**
- Produces: `parseJson(text)` → object/array đã parse. Bóc ` ```json ... ``` ` hoặc ` ``` ... ``` `. Nếu parse hỏng → ném `AppError('PARSE_FAILED', ...)`. (Vòng retry gọi-lại-model nằm ở Task 4, không nằm trong hàm này.)

- [ ] **Step 1: Thêm test parseJson**

```js
import { parseJson } from './coachio.js'

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
```

- [ ] **Step 2: Chạy — fail** (`parseJson` chưa có).

- [ ] **Step 3: Viết `parseJson` trong `server/coachio.js`**

```js
export function parseJson(text) {
  let s = String(text || '').trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  try {
    return JSON.parse(s)
  } catch {
    // thử cắt từ dấu mở mảng/đối tượng đầu tới dấu đóng cuối
    const first = s.search(/[[{]/)
    const last = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'))
    if (first !== -1 && last > first) {
      try { return JSON.parse(s.slice(first, last + 1)) } catch { /* rơi xuống */ }
    }
    throw mapError('PARSE_FAILED')
  }
}
```

- [ ] **Step 4: Chạy — pass.**

- [ ] **Step 5: Commit**

```bash
git add server/coachio.js server/coachio.test.js
git commit -m "feat: parseJson with code-fence stripping"
```

---

### Task 3: `chatCompletion()` — gọi Coachio với timeout

**Files:**
- Modify: `server/coachio.js`

**Interfaces:**
- Consumes: `mapError`.
- Produces: `async chatCompletion(messages, { maxTokens=4096, temperature=0.7, timeoutMs=45000 })` → chuỗi text `choices[0].message.content`. Ném `AppError` khi lỗi HTTP/timeout. Đọc key từ `process.env.COACHIO_API_KEY`.

Không viết unit test riêng cho hàm này (phụ thuộc mạng); được kiểm gián tiếp qua route ở Task 4/integration. **Không** log key, **không** log body.

- [ ] **Step 1: Viết `chatCompletion` trong `server/coachio.js`**

```js
const COACHIO_URL = 'https://api.coachio.ai/api/v1/llm/chat/completions'
const MODEL = 'google/gemini-3.1-flash-lite'

export async function chatCompletion(messages, { maxTokens = 4096, temperature = 0.7, timeoutMs = 45000 } = {}) {
  const key = process.env.COACHIO_API_KEY
  if (!key) throw mapError(401)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let resp
  try {
    resp = await fetch(COACHIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({ model: MODEL, messages, stream: false, temperature, max_tokens: maxTokens }),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw mapError('TIMEOUT')
    throw mapError('UPSTREAM')
  }
  clearTimeout(timer)
  if (!resp.ok) throw mapError(resp.status)
  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw mapError('PARSE_FAILED')
  return content
}
```

- [ ] **Step 2: Kiểm tra biên bằng tay:** tạm bỏ trống `COACHIO_API_KEY` → chatCompletion phải ném `INVALID_KEY`. (Sẽ được test end-to-end qua route sau.) Không commit code test tạm.

- [ ] **Step 3: Commit**

```bash
git add server/coachio.js
git commit -m "feat: coachio chatCompletion with timeout"
```

---

### Task 4: Prompt builder + `generateJson()` với retry 1 lần

**Files:**
- Create: `server/prompts.js`
- Modify: `server/coachio.js`

**Interfaces:**
- Produces:
  - `buildSuggestPrompt(tripRequest)` → `messages[]` (system + user) ép JSON array `Destination[]`, ép lãnh thổ VN.
  - `buildItineraryPrompt({ destination, days, startDate, request })` → `messages[]` (dùng ở P4 nhưng viết luôn ở đây).
  - `async generateJson(messages)` → object/array. Gọi `chatCompletion` → `parseJson`; nếu `PARSE_FAILED`, gọi lại **1 lần** với message thêm ("chỉ trả JSON thuần, không giải thích") rồi parse; fail lần 2 → ném `AppError('PARSE_FAILED')`.

- [ ] **Step 1: Viết `server/prompts.js`**

```js
const STYLE_LABELS = {
  'bien': 'biển', 'nui': 'núi', 'am-thuc': 'ẩm thực', 'lich-su': 'lịch sử',
  'nghi-duong': 'nghỉ dưỡng', 'soi-dong': 'sôi động', 'thien-nhien': 'thiên nhiên', 'chup-anh': 'chụp ảnh',
}
const BUDGET_LABELS = { 'tiet-kiem': 'tiết kiệm', 'vua': 'vừa phải', 'cao-cap': 'cao cấp' }
const COMPANION_LABELS = { 'mot-minh': 'một mình', 'cap-doi': 'cặp đôi', 'gia-dinh': 'gia đình', 'nhom-ban': 'nhóm bạn' }

function describeRequest(r) {
  const parts = []
  if (r.prompt?.trim()) parts.push(`Mong muốn: "${r.prompt.trim()}"`)
  if (r.area?.trim()) parts.push(`Khu vực mong muốn: ${r.area.trim()}`)
  parts.push(`Số ngày: ${r.days}`)
  parts.push(`Ngày đi: ${r.startDate}`)
  if (r.budget) parts.push(`Ngân sách: ${BUDGET_LABELS[r.budget] || r.budget}`)
  if (r.styles?.length) parts.push(`Phong cách: ${r.styles.map((s) => STYLE_LABELS[s] || s).join(', ')}`)
  if (r.companions) parts.push(`Đi cùng: ${COMPANION_LABELS[r.companions] || r.companions}`)
  return parts.join('\n')
}

export function buildSuggestPrompt(r) {
  const system = [
    'Bạn là chuyên gia du lịch Việt Nam.',
    'CHỈ gợi ý địa điểm nằm trong lãnh thổ Việt Nam.',
    'Trả về DUY NHẤT một JSON array, không văn bản kèm theo, không code fence.',
    'Mỗi phần tử: { "name": string, "province": string, "whyFit": string, "tags": string[3..4], "wikiTitle": string, "imageQuery": string }.',
    '"whyFit" (1-2 câu) phải tham chiếu CỤ THỂ vào mong muốn người dùng, không viết chung chung.',
    '"wikiTitle" là tiêu đề tra trên Wikipedia tiếng Việt (ví dụ "Đà Lạt").',
    '"imageQuery" là từ khoá ảnh dự phòng (ví dụ "Đà Lạt hồ Xuân Hương").',
    'Trả về 6 đến 8 phần tử.',
  ].join(' ')
  const user = `Gợi ý địa điểm phù hợp cho chuyến đi sau:\n${describeRequest(r)}`
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function buildItineraryPrompt({ destination, days, startDate, request }) {
  const system = [
    'Bạn là chuyên gia du lịch Việt Nam, lập lịch trình chi tiết.',
    'Trả về DUY NHẤT một JSON array, không văn bản kèm theo, không code fence.',
    `Array có đúng ${days} phần tử (mỗi phần tử là một ngày).`,
    'Mỗi ngày: { "dayIndex": number(1-based), "date": "YYYY-MM-DD", "slots": [...] }.',
    '"slots" có ĐÚNG 4 phần tử theo thứ tự period = "Sáng","Trưa","Chiều","Tối".',
    'Mỗi slot: { "period": string, "placeName": string, "description": string(1-2 câu), "duration": string, "icon": string, "wikiTitle": string, "imageQuery": string }.',
    '"placeName" là địa điểm CỤ THỂ có tên riêng (nhà hàng, chùa, hồ, chợ...), không viết chung chung.',
    '"icon" chọn trong: utensils, coffee, camera, bed, map-pin.',
    'Tất cả địa điểm phải nằm trong/quanh khu vực đã cho, thuộc Việt Nam.',
  ].join(' ')
  const user = [
    `Địa điểm: ${destination.name}${destination.province ? ' (' + destination.province + ')' : ''}.`,
    `Bắt đầu: ${startDate}, ${days} ngày.`,
    request?.prompt?.trim() ? `Mong muốn thêm: "${request.prompt.trim()}".` : '',
  ].filter(Boolean).join('\n')
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
```

- [ ] **Step 2: Viết `generateJson` trong `server/coachio.js`**

```js
export async function generateJson(messages) {
  const raw = await chatCompletion(messages)
  try {
    return parseJson(raw)
  } catch (e) {
    if (e.code !== 'PARSE_FAILED') throw e
    const retry = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: 'Câu trả lời trên không phải JSON hợp lệ. Chỉ trả JSON thuần, không giải thích, không code fence.' },
    ]
    const raw2 = await chatCompletion(retry)
    return parseJson(raw2) // fail ở đây tự ném PARSE_FAILED
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/prompts.js server/coachio.js
git commit -m "feat: prompt builders + generateJson retry"
```

---

### Task 5: Chuỗi fallback ảnh Wikipedia — `resolveImage()`

**Files:**
- Create: `server/images.js`, `server/images.test.js`

**Interfaces:**
- Produces: `async resolveImage(query, size, { fetchImpl=fetch } = {})` → `{ url: string|null, source: 'wikipedia-vi'|'wikipedia-en'|null }`. `size` ∈ {200,400,800}. `fetchImpl` tiêm được để test.

Chuỗi (dừng ở bước đầu có ảnh): (1) summary vi.wikipedia → thumbnail; (2) miss → search vi → title đầu → summary lại; (3) miss → en.wikipedia (2 bước như trên); (4) miss → `{url:null}`. Kích thước lấy qua `prop=pageimages&pithumbsize=<size>`.

- [ ] **Step 1: Viết test `server/images.test.js`** (mock fetch theo URL)

```js
import { describe, it, expect } from 'vitest'
import { resolveImage } from './images.js'

function mockFetch(map) {
  return async (url) => {
    for (const [needle, payload] of map) {
      if (url.includes(needle)) {
        return { ok: true, json: async () => payload }
      }
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
```

- [ ] **Step 2: Chạy — fail.**

- [ ] **Step 3: Viết `server/images.js`**

```js
async function summaryThumb(host, title, size, fetchImpl) {
  // Bước A: REST summary cho ảnh nhanh
  const rest = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const r = await fetchImpl(rest)
    if (r.ok) {
      const d = await r.json()
      if (d?.thumbnail?.source) {
        // nâng kích thước nếu là ảnh có pattern /thumb/.../<px>px-
        return upsize(d.thumbnail.source, size)
      }
    }
  } catch { /* bỏ qua */ }
  // Bước B: pageimages với pithumbsize chuẩn xác kích thước
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

function upsize(url, size) {
  // đổi ".../<n>px-Name.jpg" sang size mong muốn nếu match
  return url.replace(/\/(\d+)px-/, `/${size}px-`)
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
```

- [ ] **Step 4: Chạy — pass 4/4.**

- [ ] **Step 5: Commit**

```bash
git add server/images.js server/images.test.js
git commit -m "feat: wikipedia image fallback chain"
```

---

### Task 6: Route `POST /api/suggest` + `GET /api/image`

**Files:**
- Create: `server/routes.js`
- Modify: `server/plugin.js` (import routes để đăng ký)

**Interfaces:**
- Consumes: `generateJson`, `buildSuggestPrompt`, `resolveImage`, `cache` (từ ctx), `AppError`.
- Produces: đăng ký 2 route. `/api/suggest` trả `Destination[]` (đã gắn `id`). `/api/image?q=&size=` trả `{url, source}` (cache theo `q|size`).

- [ ] **Step 1: Viết `server/routes.js`**

```js
import { registerRoute, sendJson } from './plugin.js'
import { generateJson } from './coachio.js'
import { buildSuggestPrompt } from './prompts.js'
import { resolveImage } from './images.js'

registerRoute({
  method: 'POST',
  match: (p) => p === '/api/suggest',
  handler: async ({ req, res, readJsonBody }) => {
    const body = await readJsonBody(req)
    const messages = buildSuggestPrompt(body || {})
    const data = await generateJson(messages) // ném AppError nếu lỗi → plugin bắt
    const list = Array.isArray(data) ? data : data?.destinations || []
    const out = list.slice(0, 8).map((d, i) => ({
      id: `dest-${i}`,
      name: d.name || '',
      province: d.province || '',
      whyFit: d.whyFit || '',
      tags: Array.isArray(d.tags) ? d.tags.slice(0, 4) : [],
      wikiTitle: d.wikiTitle || d.name || '',
      imageQuery: d.imageQuery || d.name || '',
    }))
    sendJson(res, 200, out)
  },
})

registerRoute({
  method: 'GET',
  match: (p) => p === '/api/image',
  handler: async ({ res, query, cache }) => {
    const q = query.get('q') || ''
    const size = Number(query.get('size')) || 400
    const key = `img|${size}|${q}`
    const cached = cache.get(key)
    if (cached) return sendJson(res, 200, cached)
    const result = await resolveImage(q, size)
    cache.set(key, result)
    sendJson(res, 200, result)
  },
})
```

- [ ] **Step 2: Import routes trong `server/plugin.js`.** Ở cuối file, sau khi định nghĩa `registerRoute` và trước `tripPlannerPlugin`, thêm import side-effect **nhưng** tránh circular: `routes.js` import từ `plugin.js`. Giải pháp: trong `tripPlannerPlugin()`'s `configureServer`, `await import('./routes.js')` một lần trước khi gắn middleware.

Sửa `configureServer` trong `server/plugin.js`:

```js
    async configureServer(server) {
      await import('./routes.js') // đăng ký route (side-effect), tránh circular top-level
      server.middlewares.use(async (req, res, next) => {
        // ... như cũ
      })
    },
```

- [ ] **Step 3: Kiểm tra `/api/image` bằng tay** (không cần key)

Run: `npm run dev` rồi `curl -s "http://localhost:5173/api/image?q=%C4%90%C3%A0%20L%E1%BA%A1t&size=400"`
Expected: `{"url":"https://...jpg","source":"wikipedia-vi"}` (ảnh Đà Lạt thật).

- [ ] **Step 4: Kiểm tra `/api/suggest` bằng tay** (cần `COACHIO_API_KEY` trong `.env`)

Run: `curl -s -X POST http://localhost:5173/api/suggest -H 'Content-Type: application/json' -d '{"prompt":"3 ngày biển, thích hải sản","days":3,"startDate":"2026-09-20"}'`
Expected: JSON array 6-8 địa điểm VN, mỗi phần tử có `name/province/whyFit/tags/wikiTitle/imageQuery/id`.
Nếu `.env` chưa có key → trả `{"error":{"code":"INVALID_KEY",...}}` (đúng hành vi).

- [ ] **Step 5: Commit**

```bash
git add server/routes.js server/plugin.js
git commit -m "feat: /api/suggest + /api/image routes"
```

---

### Task 7: Client API wrapper `src/lib/api.js`

**Files:**
- Create: `src/lib/api.js`

**Interfaces:**
- Produces:
  - `apiSuggest(tripRequest)` → `Promise<Destination[]>`
  - `apiImage(query, size)` → `Promise<{url, source}>`
  - `apiPlace(query)` / `apiWeather(params)` / `apiItinerary(payload)` — khai báo sẵn (P4 dùng)
  - Mọi hàm ném `Error` với `.userMessage` (tiếng Việt) khi response có `error`, để `ErrorBanner` (P3) hiển thị.

- [ ] **Step 1: Viết `src/lib/api.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.js
git commit -m "feat: client api wrapper"
```

---

## Self-Review (P2)

- **Spec coverage:** §5.1 suggest (Task 6), §5.2 image + fallback (Task 5, 6), §6 Coachio/parse/mapError/security (Task 1-4), client wrapper (Task 7). `/api/place`, `/api/weather`, `/api/itinerary` khai báo wrapper sẵn, route thật ở P4.
- **Placeholder scan:** Không có TBD. Task 3 cố ý không unit-test hàm mạng — đã nêu lý do + cách kiểm bằng tay, không phải placeholder.
- **Type consistency:** `Destination` fields (`id,name,province,whyFit,tags,wikiTitle,imageQuery`) khớp spec §5.1 và khớp cách P3 tiêu thụ. `resolveImage` trả `{url,source}` khớp `/api/image` và `apiImage`. `AppError.userMessage` khớp cách plugin (`err.userMessage`) và client (`data.error.message`) đọc.

## Điều kiện hoàn thành P2

`npx vitest run` xanh (cache + coachio + images). `curl /api/image?q=Đà Lạt` trả ảnh vi.wikipedia thật. Với `.env` có key: `curl /api/suggest` trả 6-8 địa điểm VN. Không key nào lộ ra client, không log key/base64.
