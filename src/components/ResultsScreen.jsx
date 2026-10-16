import { useEffect, useRef, useState } from 'react'
import { Button, Icon } from '../design-system/index.js'
import { RequestSummaryChips } from './RequestSummaryChips.jsx'
import { CardGrid } from './CardGrid.jsx'
import { ErrorBanner } from './ErrorBanner.jsx'
import { apiSuggest } from '../lib/api.js'

export function ResultsScreen({ tripRequest, destinations, setDestinations, onSelectPlace, onBack }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const started = useRef(false)

  const run = async () => {
    setLoading(true); setError(null); setDestinations(null)
    try {
      setDestinations(await apiSuggest(tripRequest))
    } catch (e) {
      setError(e.userMessage || 'Không lấy được gợi ý. Thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Ref chặn StrictMode (dev) chạy effect 2 lần → gọi AI 2 lần.
  useEffect(() => {
    if (started.current || destinations) return
    started.current = true
    run()
    // eslint-disable-next-line
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 48px' }}>
      <Button variant="ghost" size="sm" iconLeft={<Icon name="chevron-left" size={16} />} onClick={onBack}>Sửa yêu cầu</Button>
      {tripRequest.prompt.trim() && (
        <p style={{ margin: '12px 0 0', fontSize: 16, color: 'var(--text-secondary)' }}>“{tripRequest.prompt.trim()}”</p>
      )}
      <div style={{ marginBottom: 20 }}><RequestSummaryChips value={tripRequest} align="start" /></div>

      {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} onRetry={run} /></div>}
      {(loading || destinations) && (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 16px', color: 'var(--text-primary)' }}>
            {loading ? 'Đang tìm những nơi hợp với bạn…' : 'Gợi ý cho bạn'}
          </h1>
          <CardGrid destinations={destinations} loading={loading} onSelect={onSelectPlace} />
        </>
      )}
    </div>
  )
}
