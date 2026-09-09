import { useRef, useEffect, useState } from 'react'
import { Button, Icon } from '../design-system/index.js'
import { countChanged, BUDGETS, COMPANIONS } from './optionMeta.js'

const findLabel = (list, v) => list.find((x) => x.value === v)?.label

function autoGrow(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 6 * 24 + 24) + 'px'
}

// Gợi ý nhanh — điền sẵn prompt để người dùng bắt đầu không cần nghĩ.
const QUICK_STARTS = [
  '3 ngày Đà Nẵng, thích biển và cà phê',
  'Cuối tuần Đà Lạt săn mây, đi cặp đôi',
  'Gia đình 4 ngày Phú Quốc nghỉ dưỡng',
]

export function Composer({ value, onChange, onOpenOptions, onSubmit, loading }) {
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)
  useEffect(() => { autoGrow(ref.current) }, [value.prompt])
  const changed = countChanged(value)
  const empty = value.prompt.trim().length === 0
  const canSubmit = !empty || changed > 0

  const chips = [
    { key: 'days', label: `${value.days} ngày`, icon: 'calendar', set: true },
    { key: 'budget', label: value.budget ? findLabel(BUDGETS, value.budget) : 'Ngân sách', set: !!value.budget },
    { key: 'companions', label: value.companions ? findLabel(COMPANIONS, value.companions) : 'Đi với ai', set: !!value.companions },
  ]

  const frameBg = focused
    ? 'linear-gradient(90deg,#F75940,#E23E57,#F5A623,#F75940)'
    : 'var(--border-default)'

  return (
    <div
      className={focused ? 'vivu-composer-frame--active' : undefined}
      style={{
        padding: 1.5,
        borderRadius: 20,
        background: frameBg,
        backgroundSize: focused ? '200% 100%' : '100% 100%',
        boxShadow: focused ? '0 10px 30px rgba(247,89,64,0.18)' : 'var(--shadow-raised)',
        transition: 'box-shadow var(--duration-base) var(--ease-standard)',
      }}
    >
      <div style={{
        background: 'var(--color-white)', borderRadius: 18.5, padding: 18, textAlign: 'left',
      }}>
        {/* Hàng nhập: badge AI + textarea */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 12, marginTop: 2,
            background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="sparkles" size={20} color="var(--color-primary)" />
          </div>
          <textarea
            ref={ref} rows={2} value={value.prompt}
            onChange={(e) => onChange({ ...value, prompt: e.target.value })}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canSubmit) onSubmit() }}
            placeholder="Bạn muốn đi đâu chơi? Kể cho Vivu nghe về chuyến đi mơ ước…"
            style={{
              flex: 1, minWidth: 0, border: 'none', outline: 'none', resize: 'none', background: 'transparent',
              fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.5, color: 'var(--text-primary)',
              boxSizing: 'border-box', minHeight: 52, paddingTop: 6,
            }}
          />
        </div>

        {/* Gợi ý nhanh — chỉ hiện khi chưa nhập gì */}
        {empty && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 2px', paddingLeft: 48 }}>
            {QUICK_STARTS.map((q) => (
              <button key={q} type="button" onClick={() => { onChange({ ...value, prompt: q }); ref.current?.focus() }}
                style={quickStartStyle}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-soft)'; e.currentTarget.style.borderColor = 'var(--color-primary-soft-border)'; e.currentTarget.style.color = 'var(--color-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-subtle)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                <Icon name="sparkles" size={13} /> {q}
              </button>
            ))}
          </div>
        )}

        {/* Đường kẻ mảnh */}
        <div style={{ height: 1, background: 'var(--border-divider)', margin: '14px 0' }} />

        {/* Thanh dưới: chip tuỳ chọn + nút CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((c) => (
            <button key={c.key} type="button" onClick={onOpenOptions} style={chipStyle(c.set)}>
              {c.icon && <Icon name={c.icon} size={14} color={c.set ? 'var(--color-primary)' : 'var(--text-secondary)'} />}
              {c.label}
            </button>
          ))}
          <button type="button" onClick={onOpenOptions} style={{ ...chipStyle(false), position: 'relative' }}>
            <Icon name="plus" size={14} color="var(--text-secondary)" /> Thêm tuỳ chọn
            {changed > 0 && <span style={badge}>{changed}</span>}
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              variant="primary" size="md" loading={loading} disabled={!canSubmit}
              iconLeft={<Icon name="sparkles" size={17} />}
              iconRight={<Icon name="arrow-right" size={17} />}
              onClick={onSubmit}
              style={canSubmit && !loading ? { boxShadow: '0 6px 18px rgba(247,89,64,0.35)' } : undefined}
            >Gợi ý</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const chipStyle = (set) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
  borderRadius: 'var(--radius-pill)', cursor: 'pointer',
  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
  background: set ? 'var(--color-primary-soft)' : 'var(--color-white)',
  border: set ? '1px solid var(--color-primary-soft-border)' : '1px dashed var(--border-default)',
  color: set ? 'var(--color-primary)' : 'var(--text-secondary)',
  transition: 'background var(--duration-fast) var(--ease-standard),border-color var(--duration-fast) var(--ease-standard)',
})

const quickStartStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px',
  borderRadius: 'var(--radius-pill)', border: '1px solid transparent', background: 'var(--surface-subtle)',
  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer',
  transition: 'background var(--duration-fast) var(--ease-standard),color var(--duration-fast) var(--ease-standard),border-color var(--duration-fast) var(--ease-standard)',
}

const badge = {
  position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
  borderRadius: 9, background: 'var(--color-primary)', color: '#fff', fontSize: 11, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
