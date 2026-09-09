import { useEffect, useState } from 'react'
import { Chip, Button, Icon } from '../design-system/index.js'
import { SlotTimeline } from './SlotTimeline.jsx'
import { ErrorBanner } from './ErrorBanner.jsx'
import { apiItinerary } from '../lib/api.js'

export function ItineraryScreen({ place, tripRequest, itinerary, setItinerary, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [day, setDay] = useState(0)

  const run = () => {
    setLoading(true); setError(null)
    apiItinerary({ destination: place, days: tripRequest.days, startDate: tripRequest.startDate, request: tripRequest })
      .then((days) => { setItinerary(days); setDay(0) })
      .catch((e) => setError(e.userMessage || 'Không tạo được lịch trình. Thử lại.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (!itinerary) run() /* eslint-disable-next-line */ }, [])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
      <Button variant="ghost" size="sm" iconLeft={<Icon name="chevron-left" size={16} />} onClick={onBack}>Quay lại gợi ý</Button>
      <h1 style={{ margin: '12px 0 4px', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {place.name} · {tripRequest.days} ngày
      </h1>
      {place.province && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{place.province}</p>}

      {error && <div style={{ margin: '16px 0' }}><ErrorBanner message={error} onRetry={run} /></div>}

      {loading && (
        <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ height: 96, borderRadius: 12, background: 'var(--surface-subtle)' }} />
          ))}
        </div>
      )}

      {!loading && itinerary && (
        <>
          <div style={{ display: 'flex', gap: 8, margin: '20px 0 16px', flexWrap: 'wrap' }}>
            {itinerary.map((d, i) => (
              <Chip key={i} selected={day === i} showCheck={false} onClick={() => setDay(i)}>Ngày {d.dayIndex}</Chip>
            ))}
          </div>
          <SlotTimeline slots={itinerary[day]?.slots || []} />
        </>
      )}
    </div>
  )
}
