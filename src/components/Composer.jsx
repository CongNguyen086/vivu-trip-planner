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
          <button key={i} type="button" onClick={onOpenOptions} style={quickChipStyle}>{c}</button>
        ))}
        <button type="button" onClick={onOpenOptions} style={{ ...quickChipStyle, position: 'relative' }}>
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
