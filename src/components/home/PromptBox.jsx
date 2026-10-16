import { useState } from 'react'
import { BUDGETS, COMPANIONS } from '../optionMeta.js'
import { HIcon } from './icons.jsx'

const DAY_OPTIONS = [2, 3, 4, 5, 7]
const MIN_LEN = 8
const MAX_LEN = 500
const SUGGESTIONS = [
  { label: 'Đà Lạt 3 ngày, cà phê và săn mây', text: 'Đà Lạt 3 ngày, thích cà phê và săn mây' },
  { label: 'Biển yên tĩnh cho gia đình có trẻ nhỏ', text: 'Biển yên tĩnh cho gia đình có trẻ nhỏ, ngân sách vừa phải' },
  { label: 'Leo núi, cắm trại cuối tuần', text: 'Cuối tuần leo núi, cắm trại và ngắm hoàng hôn cùng bạn bè' },
]

function QuickPop({ icon, label, menuLabel, items, open, onToggle, onClose, end }) {
  return (
    <div className={`vv-pop${end ? ' vv-pop--end' : ''}`} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <button type="button" className="tp-chip" aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <HIcon name={icon} size="sm" />
        {label}
        <HIcon name="chevDown" size="sm" className="vv-chev" />
      </button>
      {open && (
        <div className="vv-pop__menu" role="menu" aria-label={menuLabel}>
          {items.map((it) => (
            <button key={it.label} type="button" className="vv-pop__item" role="menuitemradio" aria-checked={it.checked} onClick={it.onChoose}>
              {it.label}
              {it.checked && <HIcon name="check" size="sm" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function PromptBox({ value, onChange, onSubmit }) {
  const [menu, setMenu] = useState(null)
  const [invalid, setInvalid] = useState(false)
  const len = value.prompt.trim().length
  const showError = invalid && len < MIN_LEN
  const set = (patch) => onChange({ ...value, ...patch })
  const toggle = (key) => setMenu((m) => (m === key ? null : key))
  const close = () => setMenu(null)
  const submit = () => {
    if (len === 0) return
    if (len < MIN_LEN) { setInvalid(true); return }
    setInvalid(false); onSubmit()
  }
  const pickable = (list, current, field) => list.map((o) => ({
    label: o.label, checked: current === o.value,
    onChoose: () => { set({ [field]: current === o.value ? null : o.value }); close() },
  }))
  const label = (list, v, fallback) => list.find((o) => o.value === v)?.label || fallback

  return (
    <div className="vv-composer">
      {menu && <button type="button" className="vv-pop__scrim" tabIndex={-1} aria-hidden="true" onClick={close} />}
      <div className="tp-prompt" data-invalid={showError}>
        <label className="tp-sr-only" htmlFor="vv-prompt">Mô tả chuyến đi</label>
        <textarea
          id="vv-prompt" className="tp-prompt__text vv-ta" maxLength={MAX_LEN} value={value.prompt}
          placeholder="Bạn muốn đi đâu và làm gì?"
          onChange={(e) => { set({ prompt: e.target.value }); if (invalid) setInvalid(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
        />
        <div className="tp-prompt__bar">
          <div className="tp-prompt__tools">
            <QuickPop
              icon="calendar" label={`${value.days} ngày`} menuLabel="Số ngày" open={menu === 'days'}
              onToggle={() => toggle('days')} onClose={close}
              items={DAY_OPTIONS.map((n) => ({ label: `${n} ngày`, checked: value.days === n, onChoose: () => { set({ days: n }); close() } }))}
            />
            <QuickPop
              icon="wallet" label={label(BUDGETS, value.budget, 'Ngân sách')} menuLabel="Ngân sách" open={menu === 'budget'}
              onToggle={() => toggle('budget')} onClose={close} items={pickable(BUDGETS, value.budget, 'budget')}
            />
            <QuickPop
              icon="people" label={label(COMPANIONS, value.companions, 'Đi cùng ai')} menuLabel="Đi cùng ai" open={menu === 'who'} end
              onToggle={() => toggle('who')} onClose={close} items={pickable(COMPANIONS, value.companions, 'companions')}
            />
          </div>
          <div className="tp-prompt__end">
            <span className="tp-prompt__count">{value.prompt.length}/{MAX_LEN}</span>
            <button type="button" className="tp-btn tp-btn--primary tp-prompt__send" disabled={len === 0} aria-label="Gợi ý địa điểm" onClick={submit}>
              <HIcon name="sparkle" />
              <span className="tp-prompt__send-label">Gợi ý địa điểm</span>
            </button>
          </div>
        </div>
      </div>
      {showError && (
        <span className="tp-help tp-help--error" role="alert">
          <HIcon name="warn" size="sm" />Hãy mô tả thêm điểm đến hoặc sở thích của bạn.
        </span>
      )}
    </div>
  )
}

export function SuggestionChips({ value, onChange }) {
  const pick = (text) => {
    onChange({ ...value, prompt: text })
    const ta = document.getElementById('vv-prompt')
    if (ta) { ta.focus(); requestAnimationFrame(() => ta.setSelectionRange(text.length, text.length)) }
  }
  return (
    <div className="vv-sugg" role="group" aria-label="Gợi ý mô tả chuyến đi">
      <span className="vv-sugg__label">Thử nhanh:</span>
      {SUGGESTIONS.map((x) => (
        <button key={x.label} type="button" className="vv-sugg__chip" onClick={() => pick(x.text)}>
          <HIcon name="sparkle" size="sm" />{x.label}
        </button>
      ))}
    </div>
  )
}
