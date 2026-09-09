import { Icon } from '../design-system/index.js'
import { SmartImage } from './SmartImage.jsx'

const SLOT_ICON = { 'Sáng': 'sunrise', 'Trưa': 'sun', 'Chiều': 'sunset', 'Tối': 'moon' }

export function SlotTimeline({ slots = [] }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {slots.map((s, i) => {
        const last = i === slots.length - 1
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr', columnGap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={SLOT_ICON[s.period] || 'clock'} size={18} />
              </span>
              {!last && <span style={{ width: 2, flex: 1, background: 'var(--border-default)', margin: '4px 0' }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : 24, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.period}</span>
                {s.duration && <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={12} />{s.duration}</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, padding: 10, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12 }}>
                <div style={{ width: 96, flexShrink: 0 }}>
                  <SmartImage query={s.wikiTitle || s.imageQuery || s.placeName} size={200} alt={s.placeName} radius={8} aspectRatio="4/3" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Icon name={s.icon || 'map-pin'} size={16} />{s.placeName}
                  </div>
                  {s.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{s.description}</div>}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
