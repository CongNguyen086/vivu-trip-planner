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
