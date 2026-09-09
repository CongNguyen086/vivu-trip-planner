import { useEffect, useState } from 'react'
import { Modal, WeatherStrip, Button, Icon, Skeleton } from '../design-system/index.js'
import { SmartImage } from './SmartImage.jsx'
import { apiPlace, apiWeather } from '../lib/api.js'
import { isoPlusDays } from '../state.js'

export function DetailModal({ place, tripRequest, onClose, onCreateItinerary }) {
  const open = !!place
  const [extract, setExtract] = useState('')
  const [placeLoading, setPlaceLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [wxLoading, setWxLoading] = useState(false)
  const [wxError, setWxError] = useState(false)

  const loadWeather = (lat, lon) => {
    setWxLoading(true); setWxError(false)
    const start = tripRequest.startDate
    const end = isoPlusDays(start, tripRequest.days - 1)
    apiWeather({ name: place.name, lat, lon, start, end })
      .then((w) => setWeather(w))
      .catch(() => setWxError(true))
      .finally(() => setWxLoading(false))
  }

  useEffect(() => {
    if (!place) return
    setExtract(''); setWeather(null); setWxError(false); setPlaceLoading(true)
    let alive = true
    apiPlace(place.wikiTitle || place.name)
      .then((p) => {
        if (!alive) return
        setExtract(p.extract || '')
        loadWeather(p.lat, p.lon)
      })
      .catch(() => { if (alive) loadWeather(null, null) })
      .finally(() => { if (alive) setPlaceLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place])

  if (!open) return null

  const footer = (
    <Button variant="primary" size="md" iconLeft={<Icon name="sparkles" size={18} />} onClick={onCreateItinerary}>
      Tạo lịch trình
    </Button>
  )

  return (
    <Modal open={open} onClose={onClose} imageTop footer={footer} width={640}>
      <div style={{ padding: 16 }}>
        <div style={{ margin: '-16px -16px 0' }}>
          <SmartImage query={place.wikiTitle || place.name} size={800} alt={place.name} radius={0} aspectRatio="16/9" />
        </div>
        <h2 style={{ margin: '16px 0 4px', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{place.name}</h2>
        {place.province && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14 }}><Icon name="map-pin" size={16} />{place.province}</div>}

        <div style={{ marginTop: 12 }}>
          {placeLoading ? <Skeleton variant="text" width="100%" height={16} /> :
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--text-tertiary)' }}>{extract || place.whyFit}</p>}
        </div>

        <h3 style={{ margin: '20px 0 8px', fontSize: 16, fontWeight: 700 }}>Thời tiết {tripRequest.days} ngày</h3>
        {wxLoading && <div style={{ display: 'flex', gap: 8 }}>{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} variant="rect" width={92} height={112} />)}</div>}
        {!wxLoading && weather && (
          <>
            <WeatherStrip days={weather.days} />
            {weather.mode === 'seasonal' && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Trung bình cùng kỳ năm ngoái, chưa có dự báo.</p>}
          </>
        )}
        {!wxLoading && wxError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
            <span>Chưa lấy được dự báo.</span>
            <Button variant="ghost" size="sm" onClick={() => loadWeather(null, null)}>Thử lại</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
