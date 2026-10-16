import { useState } from 'react'
import { STYLES } from '../optionMeta.js'
import { defaultTripRequest } from '../../state.js'
import { HIcon } from './icons.jsx'
import { RangeCalendar } from './RangeCalendar.jsx'
import { isoToEd, rangeLabel } from './dates.js'

// Nút "Thêm tuỳ chọn", chip tóm tắt và panel tuỳ chọn inline.
export function AdvancedPanel({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
  const set = (patch) => onChange({ ...value, ...patch })
  const def = defaultTripRequest()
  const dateLabel = rangeLabel(isoToEd(value.startDate), isoToEd(value.startDate) + value.days - 1)
  const dateChanged = value.startDate !== def.startDate || value.days !== def.days

  const summary = []
  if (value.area.trim()) summary.push({ label: value.area.trim(), aria: `Bỏ điểm đến ${value.area.trim()}`, remove: () => set({ area: '' }) })
  if (dateChanged) summary.push({ label: dateLabel, aria: 'Bỏ ngày đi', remove: () => set({ startDate: def.startDate, days: def.days }) })
  value.styles.forEach((s) => {
    const label = STYLES.find((x) => x.value === s)?.label || s
    summary.push({ label, aria: `Bỏ phong cách ${label}`, remove: () => set({ styles: value.styles.filter((x) => x !== s) }) })
  })
  const toggleStyle = (v) => set({ styles: value.styles.includes(v) ? value.styles.filter((x) => x !== v) : [...value.styles, v] })
  const reset = () => { onChange({ ...value, area: '', budget: null, styles: [], companions: null, days: def.days, startDate: def.startDate }); setCalOpen(false) }

  return (
    <>
      <div className="vv-more">
        <button type="button" className="tp-btn tp-btn--secondary tp-btn--sm" aria-expanded={open} aria-controls="vv-adv" onClick={() => setOpen(!open)}>
          <HIcon name="sliders" size="sm" />
          {open ? 'Thu gọn tuỳ chọn' : 'Thêm tuỳ chọn'}
          <HIcon name="chevDown" size="sm" className="vv-chev" />
        </button>
        {summary.map((s) => (
          <button key={s.aria} type="button" className="tp-chip tp-chip--multi" aria-pressed="true" aria-label={s.aria} onClick={s.remove}>
            <HIcon name="check" size="sm" className="tp-chip__check" />
            {s.label}
          </button>
        ))}
      </div>

      {open && (
        <div id="vv-adv" className="vv-adv" role="group" aria-label="Tuỳ chọn chuyến đi">
          <div className="vv-adv__grid">
            <div className="tp-field">
              <label className="tp-label" htmlFor="vv-dest">Điểm đến</label>
              <div className="tp-input-wrap">
                <HIcon name="search" />
                <input id="vv-dest" className="tp-input" placeholder="Để trống nếu chưa biết" value={value.area} onChange={(e) => set({ area: e.target.value })} />
              </div>
            </div>
            <div className="tp-field">
              <span className="tp-label" id="vv-date-label">Thời gian đi</span>
              <button type="button" className="tp-input" aria-labelledby="vv-date-label vv-date-val" aria-haspopup="dialog" aria-expanded={calOpen} onClick={() => setCalOpen(!calOpen)}>
                <HIcon name="calendar" />
                <span id="vv-date-val">{dateLabel} · {value.days} ngày</span>
              </button>
            </div>

            {calOpen && (
              <RangeCalendar key={`${value.startDate}-${value.days}`} startDate={value.startDate} days={value.days}
                onApply={(p) => { set(p); setCalOpen(false) }} />
            )}

            <fieldset className="vv-adv__group vv-adv__full">
              <legend className="tp-label">Phong cách</legend>
              <div className="tp-chips" role="group" aria-label="Phong cách chuyến đi">
                {STYLES.map((s) => (
                  <button key={s.value} type="button" className="tp-chip tp-chip--multi" aria-pressed={value.styles.includes(s.value)} onClick={() => toggleStyle(s.value)}>
                    <HIcon name="check" size="sm" className="tp-chip__check" />
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="vv-adv__foot">
            <button type="button" className="tp-btn tp-btn--ghost tp-btn--sm" onClick={reset}>Đặt lại tuỳ chọn</button>
            <button type="button" className="tp-btn tp-btn--secondary tp-btn--sm" onClick={() => setOpen(false)}>Thu gọn</button>
          </div>
        </div>
      )}
    </>
  )
}
