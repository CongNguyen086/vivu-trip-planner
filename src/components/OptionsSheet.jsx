import { Modal, Chip, Button, DatePicker } from '../design-system/index.js'
import { STYLES, BUDGETS, COMPANIONS } from './optionMeta.js'
import { isoPlusDays } from '../state.js'

const labelStyle = { display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }
const group = { marginBottom: 20 }
const row = { display: 'flex', gap: 8, flexWrap: 'wrap' }

function toDate(iso) { return iso ? new Date(iso) : null }
function clampDays(n) { return Math.max(1, Math.min(7, n)) }

function DateRange({ value, onRange }) {
  return (
    <DatePicker
      value={{ start: toDate(value.startDate), end: toDate(isoPlusDays(value.startDate, value.days - 1)) }}
      onChange={onRange}
      style={{ width: '100%' }}
    />
  )
}

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
      <div style={{ padding: 20 }}>
        <div style={group}>
          <label style={labelStyle}>Khu vực</label>
          <input
            value={value.area} onChange={(e) => set({ area: e.target.value })}
            placeholder="Để trống = AI tự chọn"
            style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 'var(--radius-input)', border: '1px solid var(--border-default)', fontFamily: 'var(--font-sans)', fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>
        <div style={group}>
          <label style={labelStyle}>Ngày đi</label>
          <DateRange value={value} onRange={onRange} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>→ {value.days} ngày (tự tính từ ngày đi – về)</div>
        </div>
        <div style={group}>
          <label style={labelStyle}>Ngân sách</label>
          <div style={row}>
            {BUDGETS.map((b) => (
              <Chip key={b.value} selected={value.budget === b.value} showCheck={false}
                onClick={() => set({ budget: value.budget === b.value ? null : b.value })}>{b.label}</Chip>
            ))}
          </div>
        </div>
        <div style={group}>
          <label style={labelStyle}>Phong cách</label>
          <div style={row}>
            {STYLES.map((s) => (
              <Chip key={s.value} selected={value.styles.includes(s.value)} onClick={() => toggleStyle(s.value)}>{s.label}</Chip>
            ))}
          </div>
        </div>
        <div style={{ ...group, marginBottom: 4 }}>
          <label style={labelStyle}>Đi với ai</label>
          <div style={row}>
            {COMPANIONS.map((c) => (
              <Chip key={c.value} selected={value.companions === c.value} showCheck={false}
                onClick={() => set({ companions: value.companions === c.value ? null : c.value })}>{c.label}</Chip>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
