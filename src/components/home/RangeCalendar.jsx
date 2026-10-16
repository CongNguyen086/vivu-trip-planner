import { useState } from 'react'
import { HIcon } from './icons.jsx'
import { ed, isoToEd, edToIso, todayEd, rangeLabel, dmLabel, MAX_DAYS } from './dates.js'

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Lịch inline chọn khoảng ngày: không chọn ngày quá khứ, tối đa MAX_DAYS ngày.
export function RangeCalendar({ startDate, days, onApply }) {
  const today = todayEd()
  const initStart = Math.max(isoToEd(startDate), today)
  const [start, setStart] = useState(initStart)
  const [end, setEnd] = useState(initStart + days - 1)
  const first = new Date(initStart * 86400000)
  const [view, setView] = useState({ y: first.getUTCFullYear(), m: first.getUTCMonth() })

  const pick = (n) => {
    if (start == null || end != null) { setStart(n); setEnd(null); return }
    if (n < start) { setStart(n); return }
    setEnd(Math.min(n, start + MAX_DAYS - 1))
  }
  const move = (delta) => setView(({ y, m }) => {
    const t = m + delta
    return t < 0 ? { y: y - 1, m: 11 } : t > 11 ? { y: y + 1, m: 0 } : { y, m: t }
  })

  const lead = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7
  const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate()
  const todayDate = new Date(today * 86400000)
  const prevDisabled = view.y < todayDate.getUTCFullYear() || (view.y === todayDate.getUTCFullYear() && view.m <= todayDate.getUTCMonth())
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(<div key={`b${i}`} className="tp-cal__day" />)
  for (let d = 1; d <= dim; d++) {
    const n = ed(view.y, view.m, d)
    const last = end != null ? end : start
    const isStart = n === start, isEnd = last != null && n === last
    const inRange = end != null && n > start && n < end
    const disabled = n < today
    const cls = ['tp-cal__day', n === today && 'is-today', inRange && 'is-in-range', isStart && 'is-start', isEnd && 'is-end', disabled && 'is-disabled'].filter(Boolean).join(' ')
    cells.push(
      <div key={d} className={cls}>
        <button type="button" className="tp-cal__btn" aria-label={`${d} tháng ${view.m + 1} năm ${view.y}`} aria-pressed={isStart || isEnd || inRange} disabled={disabled} onClick={() => pick(n)}>{d}</button>
      </div>
    )
  }
  const sum = start == null ? 'Chọn ngày đi'
    : end == null ? `${dmLabel(start)} · chọn ngày về`
    : `${rangeLabel(start, end)} · ${end - start + 1} ngày`

  return (
    <div className="vv-adv__full vv-cal-wrap">
      <div className="tp-cal tp-cal--inline" role="group" aria-label="Chọn ngày đi và ngày về">
        <div className="tp-cal__head">
          <button type="button" className="tp-icon-btn" aria-label="Tháng trước" disabled={prevDisabled} onClick={() => move(-1)}><HIcon name="left" /></button>
          <div className="tp-cal__title" aria-live="polite">Tháng {view.m + 1}, {view.y}</div>
          <button type="button" className="tp-icon-btn" aria-label="Tháng sau" onClick={() => move(1)}><HIcon name="right" /></button>
        </div>
        <div className="tp-cal__grid">
          {DOW.map((d) => <div key={d} className="tp-cal__dow">{d}</div>)}
          {cells}
        </div>
        <div className="tp-cal__foot">
          <span className="tp-cal__sum">{sum}</span>
          <button type="button" className="tp-btn tp-btn--primary tp-btn--sm" disabled={end == null}
            onClick={() => onApply({ startDate: edToIso(start), days: end - start + 1 })}>Áp dụng</button>
        </div>
      </div>
    </div>
  )
}
