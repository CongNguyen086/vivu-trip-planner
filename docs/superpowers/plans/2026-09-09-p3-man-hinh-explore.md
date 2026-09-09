# P3 — Màn hình Explore (Composer + Lưới thẻ) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Màn hình nhập yêu cầu (composer nhiều dòng + chip chọn nhanh + OptionsSheet) và lưới thẻ gợi ý có ảnh thật, loading skeleton, xử lý lỗi nhẹ nhàng.

**Architecture:** Component mới trong `src/components/`, chỉ dùng token + component Vivu. Logic resolve ảnh chung là hook `useResolvedImage`. Thẻ dùng `PlaceCard` của DS (feed URL đã resolve). `ErrorBoundary` bọc `App`.

**Tech Stack:** React 18 JSX, Vivu DS, `src/lib/api.js` (P2).

**Spec:** `docs/superpowers/specs/2026-09-09-ai-trip-planner-vivu-design.md` (§3.1, §7.2, §7.3, §7.4, §8)

**Phụ thuộc:** P1 (DS import, App shell, state.js), P2 (`apiSuggest`, `apiImage`).

## Global Constraints

- JS + JSX. UI tiếng Việt, sentence case, không emoji (icon qua `Icon`).
- Chỉ token/component Vivu. Coral chỉ cho CTA. Không thêm màu/radius/shadow/font mới.
- Grid 1/2/3/4 cột tại `<640 / 640-1023 / 1024-1439 / ≥1440`, gap 16, container max 1200.
- **Không màn hình trắng:** skeleton suốt thời gian chờ; ảnh lỗi im lặng fallback; lỗi API → banner + "Thử lại", giữ nguyên input.

---

### Task 1: `ErrorBoundary` + `ErrorBanner`

**Files:**
- Create: `src/components/ErrorBoundary.jsx`, `src/components/ErrorBanner.jsx`
- Modify: `src/main.jsx` (bọc `<App/>`)

**Interfaces:**
- Produces:
  - `ErrorBoundary` (class component) bọc children; khi render lỗi hiện fallback tiếng Việt + nút "Tải lại trang" (`location.reload()`).
  - `ErrorBanner({ message, onRetry })` — khối inline dùng token error (`--color-error`, `--color-error-bg`), icon + message + `Button variant="secondary" size="sm"` "Thử lại".

- [ ] **Step 1: Viết `src/components/ErrorBanner.jsx`**

```jsx
import { Button, Icon } from '../design-system/index.js'

export function ErrorBanner({ message, onRetry }) {
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'var(--color-error-bg)', border: '1px solid var(--color-error)',
      borderRadius: 'var(--radius-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    }}>
      <Icon name="x" size={18} color="var(--color-error)" />
      <span style={{ flex: 1, fontSize: 14 }}>{message || 'Có lỗi xảy ra. Thử lại.'}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>}
    </div>
  )
}
```

- [ ] **Step 2: Viết `src/components/ErrorBoundary.jsx`**

```jsx
import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[Vivu] render error:', err?.message) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'var(--font-sans)', padding: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Có lỗi xảy ra</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ứng dụng gặp sự cố hiển thị. Hãy tải lại trang.</p>
          <button onClick={() => location.reload()} style={{
            height: 44, padding: '0 20px', borderRadius: 'var(--radius-button, 20px)', border: 'none',
            background: 'var(--color-primary)', color: 'var(--text-on-primary)', fontWeight: 700, cursor: 'pointer',
          }}>Tải lại trang</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 3: Bọc App trong `src/main.jsx`**

```jsx
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
// ...
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </React.StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ErrorBanner.jsx src/components/ErrorBoundary.jsx src/main.jsx
git commit -m "feat: error boundary + banner"
```

---

### Task 2: Hook `useResolvedImage` + component `SmartImage`

**Files:**
- Create: `src/components/useResolvedImage.js`, `src/components/SmartImage.jsx`

**Interfaces:**
- Produces:
  - `useResolvedImage(query, size)` → `{ url, loading, failed }`. Gọi `apiImage`, huỷ cập nhật nếu unmount/đổi query. `failed=true` khi lỗi hoặc `url===null`.
  - `SmartImage({ query, size, alt, radius, aspectRatio })` — dùng cho hero modal và slot thumbnail: shimmer khi loading → fade-in `<img>` → nếu failed thì gradient coral + `alt` chữ trắng. **Không bao giờ ô trống.**
  - Thẻ gợi ý KHÔNG dùng `SmartImage` (dùng `PlaceCard` với url từ hook), nhưng dùng chung `useResolvedImage`.

- [ ] **Step 1: Viết `src/components/useResolvedImage.js`**

```js
import { useEffect, useState } from 'react'
import { apiImage } from '../lib/api.js'

export function useResolvedImage(query, size = 400) {
  const [state, setState] = useState({ url: null, loading: true, failed: false })
  useEffect(() => {
    let alive = true
    setState({ url: null, loading: true, failed: false })
    if (!query) { setState({ url: null, loading: false, failed: true }); return }
    apiImage(query, size)
      .then((r) => { if (alive) setState({ url: r.url, loading: false, failed: !r.url }) })
      .catch(() => { if (alive) setState({ url: null, loading: false, failed: true }) })
    return () => { alive = false }
  }, [query, size])
  return state
}
```

- [ ] **Step 2: Viết `src/components/SmartImage.jsx`**

```jsx
import { useState } from 'react'
import { Icon } from '../design-system/index.js'
import { useResolvedImage } from './useResolvedImage.js'

const SHIMMER = {
  background: 'linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%)',
  backgroundSize: '200% 100%', animation: 'vivu-shimmer var(--duration-shimmer) linear infinite',
}

export function SmartImage({ query, size = 800, alt = '', radius = 12, aspectRatio = '16/9' }) {
  const { url, loading, failed } = useResolvedImage(query, size)
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio, borderRadius: radius, overflow: 'hidden', background: 'var(--surface-muted)' }}>
      {loading && <div style={{ ...SHIMMER, position: 'absolute', inset: 0 }} />}
      {url && (
        <img src={url} alt={alt} onLoad={() => setLoaded(true)} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: loaded ? 1 : 0, transition: 'opacity var(--duration-base) var(--ease-standard)',
        }} />
      )}
      {!loading && failed && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 12,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14 }}>
            <Icon name="camera" size={16} color="#fff" />{alt}
          </span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/useResolvedImage.js src/components/SmartImage.jsx
git commit -m "feat: useResolvedImage hook + SmartImage"
```

---

### Task 3: `DestinationCard` + `CardGrid` (skeleton)

**Files:**
- Create: `src/components/DestinationCard.jsx`, `src/components/CardGrid.jsx`

**Interfaces:**
- Consumes: `PlaceCard`, `SkeletonCard` (DS), `useResolvedImage`.
- Produces:
  - `DestinationCard({ destination, onClick })` — resolve ảnh (`wikiTitle` ưu tiên, fallback `imageQuery`, size 400), render `PlaceCard` với `image=url`, `name`, `description=whyFit`, `tags`, `meta=province`, `onClick`.
  - `CardGrid({ destinations, loading, onSelect })` — grid responsive; `loading` → 8 `SkeletonCard`; ngược lại map `DestinationCard`. Container `aria-busy` + `aria-live`.

- [ ] **Step 1: Viết `src/components/DestinationCard.jsx`**

```jsx
import { PlaceCard } from '../design-system/index.js'
import { useResolvedImage } from './useResolvedImage.js'

export function DestinationCard({ destination, onClick }) {
  const q = destination.wikiTitle || destination.imageQuery || destination.name
  const { url } = useResolvedImage(q, 400)
  return (
    <PlaceCard
      image={url || undefined}
      name={destination.name}
      description={destination.whyFit}
      tags={destination.tags}
      meta={destination.province}
      onClick={onClick}
    />
  )
}
```

Ghi chú: khi `url` null, `PlaceCard` tự hiện placeholder camera trên nền `--surface-muted` (đã có sẵn trong DS) → không bao giờ ô trống. Đây là trạng thái no-image do DS quy định.

- [ ] **Step 2: Viết `src/components/CardGrid.jsx`**

```jsx
import { SkeletonCard } from '../design-system/index.js'
import { DestinationCard } from './DestinationCard.jsx'

const GRID = {
  display: 'grid', gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
}

export function CardGrid({ destinations, loading, onSelect }) {
  return (
    <div style={GRID} aria-busy={loading ? 'true' : 'false'} aria-live="polite">
      {loading
        ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        : (destinations || []).map((d) => (
            <DestinationCard key={d.id} destination={d} onClick={() => onSelect(d)} />
          ))}
    </div>
  )
}
```

Ghi chú: `auto-fill minmax(260px,1fr)` tự cho 1/2/3/4 cột theo bề rộng — khớp yêu cầu responsive mà không cần media query. Container ngoài (ExploreScreen) đặt `max-width` 1200 + padding.

- [ ] **Step 3: Xác minh render skeleton** — tạm trong `App.jsx` render `<CardGrid loading />`, chạy dev, thấy 8 khung shimmer. Hoàn tác sau khi xem.

- [ ] **Step 4: Commit**

```bash
git add src/components/DestinationCard.jsx src/components/CardGrid.jsx
git commit -m "feat: destination card + responsive grid"
```

---

### Task 4: `OptionsSheet` (Modal bọc bộ lọc đầy đủ)

**Files:**
- Create: `src/components/OptionsSheet.jsx`, `src/components/optionMeta.js`

**Interfaces:**
- Consumes: `Modal`, `Chip`, `Button`, `DatePicker`, `Icon` (DS), `isoPlusDays` (state.js).
- Produces:
  - `optionMeta.js` export mảng `STYLES`, `BUDGETS`, `COMPANIONS` (`{value,label,icon?}`) và `countChanged(tripRequest)` → số tuỳ chọn khác mặc định.
  - `OptionsSheet({ open, value, onChange, onClose })` — `Modal` chứa: Khu vực (input), DatePicker range (→ tự tính `days = clamp(end-start+1, 1, 7)` set vào value), Ngân sách (Chip single), Phong cách (Chip multi), Đi với ai (Chip single), nút "Đặt lại" + "Xong".

- [ ] **Step 1: Viết `src/components/optionMeta.js`**

```js
export const STYLES = [
  { value: 'bien', label: 'Biển' }, { value: 'nui', label: 'Núi' },
  { value: 'am-thuc', label: 'Ẩm thực' }, { value: 'lich-su', label: 'Lịch sử' },
  { value: 'nghi-duong', label: 'Nghỉ dưỡng' }, { value: 'soi-dong', label: 'Sôi động' },
  { value: 'thien-nhien', label: 'Thiên nhiên' }, { value: 'chup-anh', label: 'Chụp ảnh' },
]
export const BUDGETS = [
  { value: 'tiet-kiem', label: 'Tiết kiệm' }, { value: 'vua', label: 'Vừa' }, { value: 'cao-cap', label: 'Cao cấp' },
]
export const COMPANIONS = [
  { value: 'mot-minh', label: 'Một mình' }, { value: 'cap-doi', label: 'Cặp đôi' },
  { value: 'gia-dinh', label: 'Gia đình' }, { value: 'nhom-ban', label: 'Nhóm bạn' },
]

// Đếm số nhóm tuỳ chọn đã đổi khỏi mặc định (không tính prompt).
export function countChanged(r) {
  let n = 0
  if (r.area?.trim()) n++
  if (r.budget) n++
  if (r.styles?.length) n++
  if (r.companions) n++
  if (r.days !== 3) n++
  return n
}
```

- [ ] **Step 2: Viết `src/components/OptionsSheet.jsx`**

```jsx
import { Modal, Chip, Button } from '../design-system/index.js'
import { STYLES, BUDGETS, COMPANIONS } from './optionMeta.js'
import { isoPlusDays } from '../state.js'

const label = { display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }
const group = { marginBottom: 20 }
const row = { display: 'flex', gap: 8, flexWrap: 'wrap' }

function toDate(iso) { return iso ? new Date(iso) : null }
function clampDays(n) { return Math.max(1, Math.min(7, n)) }

export function OptionsSheet({ open, value, onChange, onClose }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const toggleStyle = (v) => {
    const has = value.styles.includes(v)
    set({ styles: has ? value.styles.filter((s) => s !== v) : [...value.styles, v] })
  }
  const onRange = (range) => {
    if (range.start && range.end) {
      const ms = range.end - range.start
      const days = clampDays(Math.round(ms / 86400000) + 1)
      const startDate = range.start.toISOString().slice(0, 10)
      set({ startDate, days })
    } else if (range.start) {
      set({ startDate: range.start.toISOString().slice(0, 10) })
    }
  }
  const reset = () => onChange({
    ...value, area: '', budget: null, styles: [], companions: null,
    days: 3, startDate: isoPlusDays(new Date(), 7),
  })

  const footer = (
    <>
      <Button variant="ghost" size="sm" onClick={reset}>Đặt lại</Button>
      <Button variant="primary" size="sm" onClick={onClose}>Xong</Button>
    </>
  )

  return (
    <Modal open={open} onClose={onClose} title="Tuỳ chọn" footer={footer} width={460}>
      <div style={group}>
        <label style={label}>Khu vực</label>
        <input
          value={value.area} onChange={(e) => set({ area: e.target.value })}
          placeholder="Để trống = AI tự chọn"
          style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 'var(--radius-input)', border: '1px solid var(--border-default)', fontFamily: 'var(--font-sans)', fontSize: 15, boxSizing: 'border-box' }}
        />
      </div>
      <div style={group}>
        <label style={label}>Ngày đi</label>
        <DateRange value={value} onRange={onRange} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>→ {value.days} ngày (tự tính từ ngày đi – về)</div>
      </div>
      <div style={group}>
        <label style={label}>Ngân sách</label>
        <div style={row}>
          {BUDGETS.map((b) => (
            <Chip key={b.value} selected={value.budget === b.value} showCheck={false}
              onClick={() => set({ budget: value.budget === b.value ? null : b.value })}>{b.label}</Chip>
          ))}
        </div>
      </div>
      <div style={group}>
        <label style={label}>Phong cách</label>
        <div style={row}>
          {STYLES.map((s) => (
            <Chip key={s.value} selected={value.styles.includes(s.value)} onClick={() => toggleStyle(s.value)}>{s.label}</Chip>
          ))}
        </div>
      </div>
      <div style={group}>
        <label style={label}>Đi với ai</label>
        <div style={row}>
          {COMPANIONS.map((c) => (
            <Chip key={c.value} selected={value.companions === c.value} showCheck={false}
              onClick={() => set({ companions: value.companions === c.value ? null : c.value })}>{c.label}</Chip>
          ))}
        </div>
      </div>
    </Modal>
  )
}

// Bọc DatePicker của DS; nếu API khác, xem ghi chú Step 3.
import { DatePicker } from '../design-system/index.js'
function DateRange({ value, onRange }) {
  return (
    <DatePicker
      value={{ start: toDate(value.startDate), end: toDate(isoPlusDays(value.startDate, value.days - 1)) }}
      onChange={onRange}
    />
  )
}
```

- [ ] **Step 3: Xác minh `DatePicker` API.** Mở `src/design-system/components/forms/DatePicker.jsx`. Xác nhận nó nhận `value={{start,end}}` (Date) và gọi `onChange({start,end})`. Nếu tên prop lệch, sửa `DateRange` cho khớp. `DatePicker.d.ts` mô tả đúng shape này.

- [ ] **Step 4: Xác minh render** — tạm mở `OptionsSheet open` trong App, chỉnh vài chip, xem days đổi theo range. Hoàn tác sau.

- [ ] **Step 5: Commit**

```bash
git add src/components/OptionsSheet.jsx src/components/optionMeta.js
git commit -m "feat: options sheet with full filters"
```

---

### Task 5: `Composer` + `RequestSummaryChips`

**Files:**
- Create: `src/components/Composer.jsx`, `src/components/RequestSummaryChips.jsx`

**Interfaces:**
- Consumes: `Button`, `Chip`, `Icon` (DS), `countChanged`, `STYLES/BUDGETS/COMPANIONS`.
- Produces:
  - `Composer({ value, onChange, onOpenOptions, onSubmit, loading })` — khung giống PromptInput (viền, radius input, shadow), bên trong: `<textarea>` 3→6 dòng tự giãn; thanh dưới: 3 chip tóm tắt nhanh (số ngày, ngân sách, đi với ai — bấm mở OptionsSheet), nút "Thêm tuỳ chọn" + badge `countChanged`, nút "Gợi ý →" coral (disabled khi prompt rỗng và countChanged===0).
  - `RequestSummaryChips({ value })` — hiện dưới composer các chip đã set (đọc-only), dùng label từ optionMeta.

- [ ] **Step 1: Viết `src/components/RequestSummaryChips.jsx`**

```jsx
import { Chip } from '../design-system/index.js'
import { STYLES, BUDGETS, COMPANIONS } from './optionMeta.js'

const findLabel = (list, v) => list.find((x) => x.value === v)?.label

export function RequestSummaryChips({ value }) {
  const chips = []
  chips.push(`${value.days} ngày`)
  if (value.area?.trim()) chips.push(value.area.trim())
  if (value.budget) chips.push(findLabel(BUDGETS, value.budget))
  if (value.companions) chips.push(findLabel(COMPANIONS, value.companions))
  value.styles.forEach((s) => chips.push(findLabel(STYLES, s)))
  if (chips.length === 1) return null // chỉ có "3 ngày" mặc định → ẩn
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
      {chips.map((c, i) => <Chip key={i} selected showCheck={false} style={{ cursor: 'default' }}>{c}</Chip>)}
    </div>
  )
}
```

- [ ] **Step 2: Viết `src/components/Composer.jsx`**

```jsx
import { useRef, useEffect } from 'react'
import { Button, Icon } from '../design-system/index.js'
import { countChanged, BUDGETS, COMPANIONS } from './optionMeta.js'

const findLabel = (list, v) => list.find((x) => x.value === v)?.label

function autoGrow(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 6 * 24 + 24) + 'px'
}

export function Composer({ value, onChange, onOpenOptions, onSubmit, loading }) {
  const ref = useRef(null)
  useEffect(() => { autoGrow(ref.current) }, [value.prompt])
  const changed = countChanged(value)
  const canSubmit = value.prompt.trim().length > 0 || changed > 0

  const quickChips = [
    `${value.days} ngày`,
    value.budget ? findLabel(BUDGETS, value.budget) : 'Ngân sách',
    value.companions ? findLabel(COMPANIONS, value.companions) : 'Đi với ai',
  ]

  return (
    <div style={{
      background: 'var(--color-white)', border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-raised)', padding: 16, textAlign: 'left',
    }}>
      <textarea
        ref={ref} rows={3} value={value.prompt}
        onChange={(e) => onChange({ ...value, prompt: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) onSubmit() }}
        placeholder="Bạn muốn đi đâu chơi? Ví dụ: 3 ngày ở Đà Nẵng, thích biển và cà phê…"
        style={{
          width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.5, color: 'var(--text-primary)',
          boxSizing: 'border-box', minHeight: 72,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {quickChips.map((c, i) => (
          <button key={i} onClick={onOpenOptions} style={quickChipStyle}>{c}</button>
        ))}
        <button onClick={onOpenOptions} style={{ ...quickChipStyle, position: 'relative' }}>
          <Icon name="plus" size={14} /> Thêm tuỳ chọn
          {changed > 0 && <span style={badge}>{changed}</span>}
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="primary" size="md" loading={loading} disabled={!canSubmit}
            iconRight={<Icon name="arrow-right" size={18} />} onClick={onSubmit}>Gợi ý</Button>
        </div>
      </div>
    </div>
  )
}

const quickChipStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px',
  borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', background: 'var(--color-white)',
  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
}
const badge = {
  position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
  borderRadius: 9, background: 'var(--color-primary)', color: '#fff', fontSize: 11, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Composer.jsx src/components/RequestSummaryChips.jsx
git commit -m "feat: composer + request summary chips"
```

---

### Task 6: `ExploreScreen` + nối `/api/suggest`

**Files:**
- Create: `src/components/ExploreScreen.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `Composer`, `OptionsSheet`, `RequestSummaryChips`, `CardGrid`, `ErrorBanner`, `apiSuggest`.
- Produces: `ExploreScreen({ tripRequest, setTripRequest, destinations, setDestinations, onSelectPlace })` — quản lý `loading`, `error`, `optionsOpen`; bấm Gợi ý → `apiSuggest` → set destinations; lỗi → ErrorBanner giữ input.

- [ ] **Step 1: Viết `src/components/ExploreScreen.jsx`**

```jsx
import { useState } from 'react'
import { Composer } from './Composer.jsx'
import { OptionsSheet } from './OptionsSheet.jsx'
import { RequestSummaryChips } from './RequestSummaryChips.jsx'
import { CardGrid } from './CardGrid.jsx'
import { ErrorBanner } from './ErrorBanner.jsx'
import { apiSuggest } from '../lib/api.js'

export function ExploreScreen({ tripRequest, setTripRequest, destinations, setDestinations, onSelectPlace }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [optionsOpen, setOptionsOpen] = useState(false)

  const run = async () => {
    setLoading(true); setError(null); setDestinations(null)
    try {
      const list = await apiSuggest(tripRequest)
      setDestinations(list)
    } catch (e) {
      setError(e.userMessage || 'Không lấy được gợi ý. Thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(24px,5vw,56px) 16px 24px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,4vw,2.25rem)', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>Bạn muốn đi đâu chơi?</h1>
        <p style={{ margin: '8px 0 24px', fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Mô tả chuyến đi mơ ước — Vivu gợi ý địa điểm và xếp lịch trình cho bạn.</p>
        <Composer value={tripRequest} onChange={setTripRequest} onOpenOptions={() => setOptionsOpen(true)} onSubmit={run} loading={loading} />
        <RequestSummaryChips value={tripRequest} />
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 48px' }}>
        {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} onRetry={run} /></div>}
        {(loading || destinations) && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              {loading ? 'Đang tìm những nơi hợp với bạn…' : 'Gợi ý cho bạn'}
            </h2>
            <CardGrid destinations={destinations} loading={loading} onSelect={onSelectPlace} />
          </>
        )}
      </section>

      <OptionsSheet open={optionsOpen} value={tripRequest} onChange={setTripRequest} onClose={() => setOptionsOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Nối vào `src/App.jsx`** (thay placeholder explore)

```jsx
import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'
import { ExploreScreen } from './components/ExploreScreen.jsx'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <ExploreScreen
          tripRequest={tripRequest} setTripRequest={setTripRequest}
          destinations={destinations} setDestinations={setDestinations}
          onSelectPlace={setSelectedPlace}
        />
      )}
      {view === VIEWS.ITINERARY && <div style={{ padding: 24 }}>Itinerary (P4)</div>}
      {/* DetailModal + chuyển view itinerary lắp ở P4, dùng selectedPlace/setView/setItinerary */}
    </div>
  )
}
```

- [ ] **Step 3: Thử luồng thật** (cần `.env` có key)

Run: `npm run dev` → mở `http://localhost:5173` → nhập "3 ngày Đà Nẵng thích biển và cà phê" → bấm Gợi ý.
Expected: 8 skeleton shimmer hiện ngay → thay bằng 6-8 thẻ có ảnh thật, tên, whyFit, tag. Bấm "Thêm tuỳ chọn" mở sheet; chọn chip → summary chip hiện dưới composer.

- [ ] **Step 4: Thử trạng thái lỗi** — tạm đổi `COACHIO_API_KEY` sai trong `.env`, chạy lại → ErrorBanner "API key chưa hợp lệ…" + nút Thử lại; prompt vẫn còn nguyên. Khôi phục key.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExploreScreen.jsx src/App.jsx
git commit -m "feat: explore screen wired to /api/suggest"
```

---

## Self-Review (P3)

- **Spec coverage:** §7.2 Composer (Task 5), §7.3 OptionsSheet + days-from-range (Task 4), summary chips (Task 5), §3.1 SmartImage + shared image logic (Task 2), lưới thẻ + skeleton §8 (Task 3, 6), ErrorBanner/ErrorBoundary §8 (Task 1), responsive grid §7.4 (Task 3).
- **Placeholder scan:** Không có TBD. Task 4 Step 3 và Task 3 Step 3 là bước xác minh runtime có hành động cụ thể (đọc file/hoàn tác), không phải placeholder.
- **Type consistency:** `tripRequest` fields khớp `defaultTripRequest` (P1) và `TripRequest` (spec §5.1). `Destination` tiêu thụ trong DestinationCard khớp P2 output. `apiSuggest`/`apiImage` khớp P2. `countChanged`/`optionMeta` dùng nhất quán giữa Composer, OptionsSheet, RequestSummaryChips.

## Điều kiện hoàn thành P3

Nhập mô tả → 8 skeleton → 6-8 thẻ ảnh thật; OptionsSheet đổi được ngày/phong cách/ngân sách/đi-với-ai, days tự tính từ range; summary chip hiện đúng; lỗi API → banner + thử lại, giữ input; không màn hình trắng ở bất kỳ trạng thái nào; chạy đúng ở 375px và 1440px.
