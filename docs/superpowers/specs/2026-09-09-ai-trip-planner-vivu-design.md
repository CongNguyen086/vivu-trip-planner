# AI Trip Planner "Vivu" — Design Spec (Phase 1)

Ngày: 2026-09-09
Trạng thái: đã duyệt, sẵn sàng tách thành implementation plan

## 1. Mục tiêu

Web app demo lên kế hoạch du lịch, chạy tốt trên desktop và mobile. Người dùng mô tả
mong muốn bằng lời (có thể kèm vài lựa chọn chọn nhanh), AI gợi ý các địa điểm ở Việt
Nam dưới dạng lưới thẻ có ảnh thật. Bấm vào một thẻ để xem tóm tắt và dự báo thời tiết
theo ngày đi, rồi yêu cầu AI tạo lịch trình chia theo khung giờ (Sáng/Trưa/Chiều/Tối)
cho địa điểm đó.

Phạm vi giới hạn ở Phase 1. **Không** làm: đăng nhập, lưu tài khoản, thanh toán, bản
đồ, chia sẻ.

## 2. Quyết định đã chốt

| Chủ đề | Quyết định | Lý do |
|---|---|---|
| Design system | Vivu (import từ Claude Design project `19cabccc`) | Đã thiết kế đúng cho app này: 10 component + 7 token file + UI kit 3 màn hình |
| Stack client | Vite + React 18, JavaScript + JSX (không TS) | Component Vivu ship dưới dạng `.jsx` thuần → dùng thẳng, không convert |
| Server | Vite plugin middleware (`configureServer`) | Theo yêu cầu; không dùng framework backend riêng |
| Nguồn ảnh | Wikipedia REST + Wikimedia, không cần API key | Ảnh thật đúng địa danh, miễn phí, không đăng ký |
| Streaming | Không stream, đợi JSON đầy đủ (`stream:false`) | Dữ liệu cần là JSON có cấu trúc, không phải chat text; skeleton che thời gian chờ |
| API key | Coachio key thật trong `.env`, không mock data | Demo dùng AI thật |
| Phạm vi địa lý | Chỉ Việt Nam | Ảnh Wikipedia tiếng Việt phủ tốt, kết quả đồng đều |
| Ngôn ngữ UI | Tiếng Việt, xưng "bạn", sentence case, không emoji | Theo content fundamentals của Vivu |
| Ảnh resolve | Client lazy từng thẻ, song song | Thẻ hiện sớm, ảnh fill dần; 1 ảnh lỗi chỉ ảnh hưởng đúng thẻ đó |
| Lịch trình | Màn hình riêng (không nằm trong modal) | Mobile: cuộn 4 ngày × 4 slot trong modal không đọc nổi |

### Deviation có chủ ý so với spec Coachio

Spec Coachio trong yêu cầu có mục UX "show a streaming assistant response as chunks
arrive". Phase 1 **không** làm mục này: dữ liệu cần là JSON có cấu trúc (danh sách địa
điểm, lịch trình), không phải chat text. Server vẫn implement SSE parser đầy đủ để bật
`stream:true` sau này mà không phải viết lại.

Các mục còn lại của spec Coachio đều áp dụng: model cố định `google/gemini-3.1-flash-lite`,
key chỉ ở server, xử lý đủ 400/401/402/429/5xx, không log key và không log base64.

## 3. Design System — Vivu

Import toàn bộ project Claude Design vào `src/design-system/`, giữ nguyên cấu trúc:

```
src/design-system/
  styles.css              entry, @import tokens/*
  tokens/                 colors, typography, spacing, radius, shadows, motion, fonts
  components/core/        Icon.jsx (Lucide inline, ~24 glyph)
  components/actions/     Button.jsx, Chip.jsx
  components/forms/       PromptInput.jsx, DatePicker.jsx
  components/display/     PlaceCard.jsx, Tag.jsx, Skeleton.jsx (+ SkeletonCard)
  components/overlay/     Modal.jsx (dialog desktop + bottom sheet <640px)
  components/travel/      WeatherStrip.jsx, ItineraryTimeline.jsx
```

Dùng `components/**/*.jsx` (ES module thật, có `import`). **Không** dùng `_ds_bundle.js`
(global bundle, chỉ hợp cho click-thru HTML tĩnh).

### Component có sẵn và cách dùng (theo `.d.ts`)

- **Button** — `variant: primary|secondary|ghost|inverse`, `size: sm(36)|md(44)|lg(52)`,
  `iconLeft/iconRight`, `loading`, `fullWidth`. Radius 20 mọi variant.
- **Chip** — `selected` (coral-soft bg + check), `icon`, `showCheck`. Dùng cho chọn
  nhanh sở thích và tab Ngày.
- **Icon** — Lucide, `name` + `size`, màu `currentColor`. Glyph có sẵn: x, chevron,
  arrow-right, search, plus, check, map-pin, calendar, clock, star, heart, camera,
  utensils, sparkles, sun, moon, cloud, cloud-sun, cloud-rain, cloud-drizzle,
  cloud-lightning, droplets, wind, thermometer, sunrise, sunset, coffee, bed.
- **PlaceCard** — `image`, `name`, `description` (clamp 2 dòng), `tags[]` (pill onImage),
  `rating`, `meta` (map-pin), `onClick` (hover lift). Ảnh 4:3, gradient phủ đáy, shimmer
  khi loading.
- **Tag** — `variant: neutral|primary|onImage|success|warning|error|info`, `icon`.
- **Skeleton** / **SkeletonCard** — shimmer; SkeletonCard mirror layout PlaceCard.
- **Modal** — `open`, `onClose` (scrim/Esc/X), `title`, `footer`, `width` (default 640),
  `imageTop` (X trắng nổi trên ảnh full-bleed thay header bar). Tự thành bottom sheet
  dưới 640px.
- **PromptInput** — sparkles icon, field 56px, nút gửi coral tròn. `value/onChange/onSubmit`,
  `loading`, `error`, `autoFocus`. (1 dòng — sẽ mở rộng, xem 3.1.)
- **DatePicker** — range picker `{start, end}`, popover lịch tiếng Việt Monday-first.
- **WeatherStrip** — `days: [{label, icon, high, low, rain}]`, `selected`, `onSelect`.
  Hàng tile cuộn ngang. **Server phải trả đúng shape này.**
- **ItineraryTimeline** — `slots: [{slot, time, items:[{title, note, duration, icon}]}]`,
  rail coral + icon Sáng→sunrise/Trưa→sun/Chiều→sunset/Tối→moon. (Item không có ảnh —
  sẽ mở rộng, xem 3.1.)

### 3.1 Ba mở rộng có chủ ý (viết file mới trong `src/components/`, KHÔNG sửa file DS gốc)

| Component mới | Dựa trên | Lý do |
|---|---|---|
| `Composer` | `PromptInput` | Brief cần ô tự do nhiều dòng (textarea 3→6 dòng tự giãn) + thanh chip chọn nhanh gắn dưới trong cùng khung. PromptInput gốc chỉ 1 dòng 56px. |
| `SmartImage` | `Skeleton` | Vòng đời chung cho card & slot: shimmer → fetch `/api/image` → fade-in → nếu `url:null` thì gradient coral + tên địa điểm chữ trắng. DS chỉ có Skeleton tĩnh. |
| `ItineraryTimeline` bản mở rộng, hoặc `SlotThumb` chèn vào `items` | `ItineraryTimeline` | Mỗi khung giờ phải có ảnh (brief). Thêm thumbnail 96px 4:3 (dùng `SmartImage`) bên trái mỗi item, giữ nguyên rail coral + icon khung giờ. |

Mọi mở rộng chỉ dùng CSS var của Vivu (`--color-primary`, `--radius-card`,
`--shadow-lifted`, `--duration-fast`, `--overlay-image-gradient`…). **Không** thêm màu,
radius, shadow, hay font mới ngoài token đã có.

### 3.2 Cầu nối ItineraryTimeline

Ưu tiên: bọc `ItineraryTimeline` gốc, truyền `items` trong đó `title`/`note` render bình
thường nhưng chèn thêm một thumbnail phía trước qua prop hoặc wrapper. Nếu API component
không cho chèn ảnh sạch sẽ, viết `SlotThumb` + layout riêng trong `src/components/` tái
dùng đúng rail/icon/spacing của bản gốc (đọc `ItineraryTimeline.jsx` để copy style rail).
Quyết định cụ thể chốt khi đọc source trong plan.

## 4. Kiến trúc

```
Browser (React + JSX)             Vite middleware (server)          External
─────────────────────             ────────────────────────          ────────
Composer + OptionsSheet
  └─ POST /api/suggest ──────────► buildSuggestPrompt()  ──────────► Coachio LLM
                                   parseJson() + repair 1 lần         (stream:false)
     ◄──────── Destination[] (chưa có ảnh)

CardGrid (SkeletonCard → PlaceCard)
  └─ GET /api/image?q=... ───────► resolveImage() + LRU cache ─────► Wikipedia REST
     ◄──────── {url, source}                                         (+ search fallback)

DetailModal (imageTop)
  ├─ GET /api/place?q=... ───────► summary extract + toạ độ ───────► Wikipedia REST
  └─ GET /api/weather ───────────► forecast | seasonal ────────────► Open-Meteo
     ◄──────── WeatherStrip.days[]

ItineraryScreen
  └─ POST /api/itinerary ────────► buildItineraryPrompt() ─────────► Coachio LLM
     ◄──────── Day[] { Sáng|Trưa|Chiều|Tối → slot }
        └─ mỗi slot GET /api/image (dùng chung cache + SmartImage với card)
```

### Nguyên tắc

- **Ảnh resolve phía client, lazy theo từng thẻ.** `/api/suggest` trả text ngay (~4s),
  mỗi thẻ tự gọi `/api/image` song song. Thẻ hiện sớm, ảnh fill dần vào khung shimmer.
- **Toạ độ lấy từ `/api/place` (Wikipedia) rồi fallback Open-Meteo geocoding, KHÔNG lấy
  từ AI.** Tránh model hallucinate lat/lon làm dự báo thời tiết sai thành phố.
- **Cache LRU in-memory ở server** cho image/place/weather, TTL 30 phút.
- **Key chỉ tồn tại ở server** qua `process.env.COACHIO_API_KEY`.

## 5. Server API

Tất cả nằm trong Vite plugin, mount tại `/api/*`.

### 5.1 `POST /api/suggest`

Request:

```
type TripRequest = {
  prompt: string            // mô tả tự do, có thể rỗng nếu đã chọn tuỳ chọn
  area?: string             // khu vực mong muốn, để trống = AI tự chọn
  days: number              // 1..7
  startDate: string         // YYYY-MM-DD
  budget?: 'tiet-kiem' | 'vua' | 'cao-cap'
  styles?: string[]         // biển, núi, ẩm thực, lịch sử, nghỉ dưỡng, sôi động, thiên nhiên, chụp ảnh
  companions?: 'mot-minh' | 'cap-doi' | 'gia-dinh' | 'nhom-ban'
}
```

Response: `Destination[]`, 6–8 phần tử.

```
type Destination = {
  id: string
  name: string          // "Đà Lạt"
  province: string      // "Lâm Đồng"
  whyFit: string        // 1-2 câu "vì sao hợp với bạn", tham chiếu cụ thể mong muốn
  tags: string[]        // 3-4 tag
  wikiTitle: string     // tiêu đề tra Wikipedia tiếng Việt
  imageQuery: string    // từ khoá dự phòng nếu wikiTitle miss
}
```

Prompt ép model chỉ trả JSON array, chỉ gợi ý địa điểm trong lãnh thổ Việt Nam. `whyFit`
phải tham chiếu cụ thể vào mong muốn người dùng, không viết chung chung.

### 5.2 `GET /api/image?q=<query>&size=<400|800|200>`

Chuỗi fallback, dừng ở bước đầu tiên có ảnh:

1. `GET https://vi.wikipedia.org/api/rest_v1/page/summary/<q>` → `thumbnail.source`
2. Nếu miss: `action=query&list=search&srsearch=<q>` → lấy `title` đầu tiên → lặp bước 1
3. Nếu vẫn miss: thử `en.wikipedia.org` với cùng 2 bước
4. Nếu vẫn miss: trả `{ url: null }`

Response: `{ url: string | null, source: 'wikipedia-vi' | 'wikipedia-en' | null }`

Kích thước: dùng `action=query&prop=pageimages&piprop=thumbnail&pithumbsize=<size>`.
`800` cho hero modal, `400` cho card, `200` cho slot thumbnail. Không dùng thumbnail
mặc định 330px cho hero (vỡ nét).

Khi `url: null`, client render gradient coral kèm tên chữ trắng. **Không có đường nào
dẫn tới ô ảnh trống.**

### 5.3 `GET /api/place?q=<query>`

Response: `{ extract: string, imageUrl: string | null, lat: number | null, lon: number | null }`

`extract` là tóm tắt **thật** từ Wikipedia (2-3 câu đầu), không phải AI sinh ra.
`lat`/`lon` lấy từ `coordinates` của trang Wikipedia nếu có.

### 5.4 `GET /api/weather?q=<name>&start=<date>&end=<date>&lat=&lon=`

`lat`/`lon` optional. `DetailModal` gọi `/api/place` trước và truyền toạ độ nhận được
sang; khi đó bước geocode bị bỏ qua. Nếu thiếu toạ độ thì mới geocode theo tên.

1. Geocode (chỉ khi thiếu `lat`/`lon`):
   `https://geocoding-api.open-meteo.com/v1/search?name=<name>&count=1&language=vi&countryCode=VN`
2. Chọn mode theo khoảng cách ngày:
   - `start` cách hôm nay ≤ 16 ngày → **forecast**:
     `.../v1/forecast?...&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Asia/Bangkok`
   - Xa hơn → **seasonal**: Archive API lấy cùng khoảng ngày năm trước, đánh dấu `mode:'seasonal'`

Response (đúng shape `WeatherStrip.days` cần):

```
type WeatherResult = {
  mode: 'forecast' | 'seasonal'
  days: Array<{ label: string; icon: string; high: number; low: number; rain?: number }>
}
```

`label` dạng "T7 14/6". `icon` map từ WMO weather code sang tên glyph Lucide của DS:

| WMO code | icon |
|---|---|
| 0 | sun |
| 1, 2 | cloud-sun |
| 3 | cloud |
| 45, 48 | wind |
| 51-57 | cloud-drizzle |
| 61-67, 80-82 | cloud-rain |
| 71-77, 85-86 | cloud |
| 95-99 | cloud-lightning |

Khi `mode:'seasonal'`, UI ghi rõ "Trung bình cùng kỳ năm ngoái, chưa có dự báo".

### 5.5 `POST /api/itinerary`

Request: `{ destination: Destination, days: number, startDate: string, request: TripRequest }`

Response:

```
type Day = {
  dayIndex: number      // 1-based
  date: string
  slots: Array<{
    period: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối'
    placeName: string   // địa điểm cụ thể trong khu vực
    description: string // 1-2 câu
    duration?: string   // "1,5 giờ"
    icon?: string       // gợi ý icon Lucide (utensils, coffee, camera, bed, map-pin)
    wikiTitle: string
    imageQuery: string
  }>
}
```

Đúng `days` phần tử, mỗi phần tử đúng 4 slot theo thứ tự Sáng → Trưa → Chiều → Tối.
Prompt yêu cầu địa điểm cụ thể có tên riêng (nhà hàng, chùa, hồ, chợ), không viết chung
chung kiểu "ăn trưa ở quán địa phương".

Client map `Day.slots` sang shape `ItineraryTimeline` cần, kèm thumbnail `SmartImage`
lấy từ `/api/image?q=<wikiTitle|imageQuery>&size=200`.

## 6. Tích hợp Coachio

- Endpoint: `POST https://api.coachio.ai/api/v1/llm/chat/completions`
- Header: `X-API-Key: process.env.COACHIO_API_KEY`, `Content-Type: application/json`
- Model cố định: `google/gemini-3.1-flash-lite`
- `stream: false`, `temperature: 0.7`, `max_tokens: 4096`

### Parse JSON

1. Bóc code fence nếu model trả trong ```` ```json ````
2. `JSON.parse`
3. Fail → gọi lại 1 lần với message bổ sung: chuỗi lỗi + yêu cầu chỉ trả JSON thuần
4. Fail lần 2 → ném `AppError` với `code: 'PARSE_FAILED'`

### Map lỗi → thông điệp tiếng Việt

| HTTP | code | Thông điệp UI |
|---|---|---|
| 401 | `INVALID_KEY` | "API key chưa hợp lệ. Kiểm tra COACHIO_API_KEY trong .env." |
| 402 | `NO_CREDIT` | "Tài khoản đã hết credit." |
| 429 | `RATE_LIMIT` | "Hệ thống đang bận, thử lại sau ít giây." |
| 400 | `BAD_REQUEST` | "Yêu cầu không hợp lệ. Thử mô tả ngắn gọn hơn." |
| 5xx | `UPSTREAM` | "Không kết nối được máy chủ AI. Thử lại." |
| — | `TIMEOUT` | "Quá thời gian chờ. Thử lại." |
| — | `PARSE_FAILED` | "AI trả về dữ liệu không đọc được. Thử lại." |

Timeout client-side 45s cho mọi lời gọi Coachio.

### Bảo mật

- Không log `X-API-Key`, không log body ảnh base64
- Không key nào xuất hiện trong bundle client (biến không có tiền tố `VITE_`)
- `.env` trong `.gitignore`; kèm `.env.example` chỉ có tên biến

## 7. UI & điều hướng

Một trang, ba view + modal overlay, không router:

```
'explore' ──Gợi ý──► card grid ──chọn thẻ──► [DetailModal] ──Tạo lịch trình──► 'itinerary'
    ▲                                              │                               │
    └────────────── Sửa yêu cầu ───────────────────┴───────── quay về lưới ─────────┘
```

### 7.1 Cây component

```
App (state machine: view + tripRequest + destinations + selectedPlace + itinerary)
├─ ExploreScreen
│  ├─ Composer                 textarea + thanh chip chọn nhanh + nút Gợi ý
│  ├─ OptionsSheet             Modal (popover desktop / bottom sheet mobile)
│  ├─ RequestSummaryChips      chip đã set, hiện dưới composer sau khi thu sheet
│  └─ CardGrid → PlaceCard × 6-8 / SkeletonCard × 8
│                 └─ SmartImage ◄──────────┐
├─ DetailModal (imageTop)                  │ dùng chung
│  ├─ SmartImage (hero 800px)              │
│  ├─ ExtractBlock (Wikipedia)             │
│  ├─ WeatherStrip → days × n              │
│  └─ Button "Tạo lịch trình"              │
├─ ItineraryScreen                         │
│  ├─ Chip tab Ngày × n                    │
│  ├─ WeatherStrip                         │
│  └─ ItineraryTimeline (mở rộng) ─────────┘  slot × 4 kèm SmartImage thumbnail
├─ ErrorBanner
└─ ErrorBoundary (bọc App)
```

### 7.2 Composer

```
┌─ Composer ────────────────────────────────────┐
│  Bạn muốn đi đâu chơi? (textarea 3→6 dòng)     │
├───────────────────────────────────────────────┤
│  [3 ngày ▾][Ngân sách ▾][Đi với ai ▾]          │
│  ⚙ Thêm tuỳ chọn ③              [ Gợi ý → ]   │
└───────────────────────────────────────────────┘
```

- 3 chip quan trọng nhất hiện ngay: số ngày, ngân sách, đi với ai.
- Badge trên "Thêm tuỳ chọn" đếm số tuỳ chọn đã đổi khỏi mặc định. Chưa đụng thì ẩn.
- Nút "Gợi ý" disabled khi `prompt` rỗng **và** không tuỳ chọn nào được đổi.

### 7.3 OptionsSheet

Dùng `Modal` của DS (tự thành bottom sheet dưới 640px, popover-like trên desktop).

```
┌─ Tuỳ chọn ────────────────────  ✕ ─┐
│ Khu vực     [ để trống = AI tự chọn ]│
│ Ngày đi     [ DatePicker range ]     │
│             → 3 ngày (tự tính)       │
│ Ngân sách   (tiết kiệm)(vừa)(cao cấp)│
│ Phong cách  ✓biển ✓ẩm thực núi ...   │  ← Chip multi-select
│ Đi với ai   một mình (cặp đôi) ...   │
├──────────────────────────────────────┤
│ Đặt lại                    [ Xong ]  │
└──────────────────────────────────────┘
```

- Số ngày **tự tính từ DatePicker range** (`end - start + 1`), cap 1–7. Không có
  stepper số ngày riêng — range là nguồn duy nhất.
- Mặc định: 3 ngày (start = hôm nay + 7, end = +2 ngày), ngân sách / phong cách /
  đi-với-ai để trống (AI tự suy từ mô tả). Bấm "Gợi ý" ngay được không cần mở sheet.

### 7.4 Responsive (theo Vivu README)

| Breakpoint | Grid thẻ | Modal | Container |
|---|---|---|---|
| < 640px | 1 cột | bottom sheet full-width | padding 16 |
| 640–1023px | 2 cột | dialog giữa, max 640 | padding 24 |
| 1024–1439px | 3 cột | dialog giữa | padding 32 |
| ≥ 1440px | 4 cột | dialog giữa | container max 1200 |

Trên mobile, `ItineraryTimeline` render mỗi ngày thành timeline dọc, slot xếp chồng.

## 8. Loading và lỗi — không có màn hình trắng ở bất kỳ đâu

### Loading

- Bấm "Gợi ý" → hiện ngay 8 `SkeletonCard` shimmer; heading đổi thành "Đang tìm những
  nơi hợp với bạn…"
- Ảnh → shimmer bên trong khung có `aspect-ratio` cố định (4:3 card, 16:9 hero, 4:3
  thumbnail) → layout không nhảy khi ảnh về
- Mở modal → hero shimmer + 3 tile thời tiết skeleton
- Bấm "Tạo lịch trình" → skeleton theo ngày, đúng số ngày người dùng đã chọn

### Lỗi — nhẹ nhàng, app vẫn chạy tiếp

- `ErrorBanner` inline (dùng `Tag variant=error` hoặc khối cùng token), **không** toast
  tự biến mất. Mọi banner có nút "Thử lại" và **giữ nguyên input người dùng đã nhập**.
- Ảnh lỗi → im lặng fallback gradient coral, không hiện banner.
- Thời tiết lỗi → modal vẫn mở bình thường; riêng khu thời tiết hiện "Chưa lấy được dự
  báo" + nút thử lại nhỏ. Nút "Tạo lịch trình" vẫn bấm được.
- Lịch trình lỗi → giữ nguyên view, banner + thử lại.
- `ErrorBoundary` bọc `App` để lỗi render không làm trắng màn hình.

### Accessibility

- Modal của DS đã có focus trap, đóng bằng Esc, X. Đảm bảo trả focus về thẻ vừa bấm.
- Mọi control tương tác có focus ring `2px #3F52E3` + ring (token DS đã có).
- `SmartImage` có `alt` là tên địa điểm.
- Skeleton container `aria-busy="true"`, `aria-live="polite"` khi kết quả về.

## 9. Test

Demo — không viết E2E.

Vitest cho các hàm thuần phía server:

- `parseJson()` — bóc code fence, parse hỏng, đường retry
- `resolveImage()` — từng nhánh chuỗi fallback, trường hợp trả `null`
- `pickWeatherMode()` — biên 16 ngày, ngày quá khứ, khoảng ngày vượt tháng
- `wmoToIcon()` — mọi mã WMO dùng đến
- `mapError()` — mỗi mã HTTP ra đúng `code` và thông điệp

QA thủ công theo checklist qua `/browse`: desktop 1440 và mobile 375, chạy hết luồng
explore → gợi ý → modal → lịch trình, chụp màn hình từng bước.

## 10. File layout

```
server/plugin.js            configureServer, routing /api/*
server/coachio.js           gọi LLM, parseJson, mapError (SSE parser viết sẵn, chưa bật)
server/prompts.js           buildSuggestPrompt, buildItineraryPrompt
server/images.js            chuỗi fallback Wikipedia
server/weather.js           geocode + forecast/seasonal + wmoToIcon
server/cache.js             LRU + TTL
src/design-system/          ← import nguyên từ Claude Design (tokens, components, styles.css)
src/components/             Composer, OptionsSheet, RequestSummaryChips, ExploreScreen,
                            CardGrid, SmartImage, DetailModal, ItineraryScreen,
                            SlotThumb (nếu cần), ErrorBanner, ErrorBoundary
src/lib/api.js              wrapper fetch tới /api/*, timeout, map lỗi
src/App.jsx                 state machine 3 view
src/main.jsx                mount + import design-system/styles.css
index.html
vite.config.js              + tripPlannerPlugin
.env.example                COACHIO_API_KEY=
.gitignore                  bỏ qua .env, node_modules, dist
```

## 11. Điều kiện nghiệm thu

1. Nhập mô tả tự do, bấm "Gợi ý" → 6–8 thẻ hiện ra, mỗi thẻ có ảnh, tên, lý do hợp, tag
2. Không thẻ nào có ô ảnh trống trong mọi trường hợp
3. Skeleton shimmer hiện suốt thời gian chờ AI và chờ ảnh, không có màn hình trắng
4. Bấm thẻ → modal hiện ảnh lớn, tóm tắt thật từ Wikipedia, thời tiết đúng các ngày đã chọn
5. Bấm "Tạo lịch trình" → lịch trình đúng số ngày, mỗi ngày 4 khung giờ, mỗi khung giờ
   là một địa điểm cụ thể có ảnh và mô tả
6. Mọi lỗi API hiện banner tiếng Việt kèm nút thử lại, app không crash và không trắng màn hình
7. Chạy đúng trên desktop 1440px và mobile 375px
8. `COACHIO_API_KEY` không xuất hiện trong bundle client hay trong log
9. Giao diện dùng đúng token và component Vivu (coral chỉ cho CTA, Source Sans 3, radius
   card 16 / input 8 / button pill, shadow 3 cấp)
