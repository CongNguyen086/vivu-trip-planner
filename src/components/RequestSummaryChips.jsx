import { Chip } from '../design-system/index.js'
import { STYLES, BUDGETS, COMPANIONS } from './optionMeta.js'

const findLabel = (list, v) => list.find((x) => x.value === v)?.label

export function RequestSummaryChips({ value, align = 'center' }) {
  const chips = []
  chips.push(`${value.days} ngày`)
  if (value.area?.trim()) chips.push(value.area.trim())
  if (value.budget) chips.push(findLabel(BUDGETS, value.budget))
  if (value.companions) chips.push(findLabel(COMPANIONS, value.companions))
  value.styles.forEach((s) => chips.push(findLabel(STYLES, s)))
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: align === 'start' ? 'flex-start' : 'center', marginTop: 12 }}>
      {chips.map((c, i) => <Chip key={i} selected showCheck={false} style={{ cursor: 'default' }}>{c}</Chip>)}
    </div>
  )
}
