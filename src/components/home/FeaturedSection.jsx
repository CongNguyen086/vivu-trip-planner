import { useState } from 'react'
import { useResolvedImage } from '../useResolvedImage.js'
import { HIcon } from './icons.jsx'
import { FEATURED_PLACES, FEATURED_TABS } from './featuredPlaces.js'

// Ảnh Wikimedia (qua /api/image); lỗi thì rơi về SVG minh hoạ cục bộ, rồi tới khối "Chưa có ảnh".
function PlaceMedia({ place, children }) {
  const { url, loading } = useResolvedImage([place.wikiTitle, place.imageQuery], 600)
  const [broken, setBroken] = useState(false)
  const [fallbackBroken, setFallbackBroken] = useState(false)
  const src = url && !broken ? url : place.fallbackImage
  const state = loading ? 'loading' : (url && !broken) || !fallbackBroken ? 'loaded' : 'error'
  return (
    <div className="tp-media" data-state={state}>
      {!loading && (
        <img className="tp-media__img" src={src} alt={place.alt} loading="lazy"
          onError={() => (url && !broken ? setBroken(true) : setFallbackBroken(true))} />
      )}
      <div className="tp-media__fallback"><HIcon name="image" size="lg" />Chưa có ảnh</div>
      {children}
    </div>
  )
}

function SaveButton({ place, saved, onToggle, glass }) {
  return (
    <button type="button" className={`tp-icon-btn${glass ? ' tp-icon-btn--glass tp-place__save' : ''}${saved ? ' tp-icon-btn--saved' : ''}`}
      style={glass ? undefined : { borderColor: 'var(--border)' }}
      aria-label={saved ? `Bỏ lưu ${place.name}` : `Lưu ${place.name}`} aria-pressed={saved}
      onClick={(e) => { e.stopPropagation(); onToggle(place.id) }}>
      <HIcon name="heart" />
    </button>
  )
}

function PlaceTile({ place, saved, onToggleSave, onOpen }) {
  return (
    <div className="vv-cell">
      <div className="vv-rise">
        <article className="tp-place" tabIndex={0} role="button" aria-haspopup="dialog" aria-label={`${place.name}, ${place.province}`}
          onClick={() => onOpen(place)}
          onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(place) } }}>
          <PlaceMedia place={place}>
            <div className="tp-media__scrim" />
            <div className="tp-place__top">
              <span className="tp-tag tp-tag--glass">{place.category}</span>
              <SaveButton place={place} saved={saved} onToggle={onToggleSave} glass />
            </div>
            <h3 className="tp-place__name">{place.name}, {place.province}</h3>
          </PlaceMedia>
          <div className="tp-place__body">
            <p className="tp-place__desc">{place.whyFit}</p>
            <div className="tp-place__tags">
              {place.tags.slice(0, 2).map((t) => <span key={t} className="tp-tag">{t}</span>)}
              {place.tags.length > 2 && <span className="tp-tag">+{place.tags.length - 2}</span>}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

export function FeaturedSection({ onSelectPlace }) {
  const [tab, setTab] = useState('foryou')
  const [saved, setSaved] = useState({})
  const cur = FEATURED_TABS.find((t) => t.key === tab)
  const [feat, ...rest] = cur.ids.map((id) => FEATURED_PLACES[id])
  const toggleSave = (id) => setSaved((s) => ({ ...s, [id]: !s[id] }))

  return (
    <section id="vv-results" className="vv-results" aria-labelledby="vv-h2">
      <div className="tp-container">
        <div className="vv-sec-head">
          <div>
            <h2 id="vv-h2" className="vv-h2">Gợi ý cho bạn</h2>
            <p className="vv-meta" role="status">{cur.meta}</p>
          </div>
        </div>

        <div className="tp-chips tp-chips--scroll vv-tabs" role="radiogroup" aria-label="Nhóm gợi ý">
          {FEATURED_TABS.map((t) => (
            <button key={t.key} type="button" className="tp-chip tp-chip--single" role="radio" aria-checked={t.key === tab} onClick={() => setTab(t.key)}>
              {t.key === 'foryou' && <HIcon name="sparkle" size="sm" />}
              {t.label}
            </button>
          ))}
        </div>

        <div key={`${tab}-feat`} className="vv-rise vv-rise--block">
          <article className="vv-feature vv-feature--click" aria-label={feat.name} onClick={() => onSelectPlace(feat)}>
            <PlaceMedia place={feat}>
              <div className="tp-place__top">
                <span className="tp-tag tp-tag--glass"><HIcon name="sparkle" />Gợi ý hàng đầu</span>
              </div>
            </PlaceMedia>
            <div className="vv-feature__body">
              <span className="tp-tag tp-tag--primary" style={{ alignSelf: 'flex-start' }}>{feat.category}</span>
              <h3 className="vv-feature__name">{feat.name}, {feat.province}</h3>
              <p className="vv-feature__desc">{feat.whyFit}</p>
              <div className="vv-reasons">
                <p className="tp-label">Vì sao nên đi</p>
                <ul className="vv-reasons__list">
                  {feat.reasons.map((r) => <li key={r}><HIcon name="check" size="sm" />{r}</li>)}
                </ul>
              </div>
              <div className="vv-feature__actions">
                <button type="button" className="tp-btn tp-btn--primary" aria-haspopup="dialog" onClick={(e) => { e.stopPropagation(); onSelectPlace(feat) }}>
                  Xem chi tiết<HIcon name="arrow" />
                </button>
                <SaveButton place={feat} saved={!!saved[feat.id]} onToggle={toggleSave} />
              </div>
            </div>
          </article>
        </div>

        <div key={`${tab}-grid`} className="tp-grid">
          {rest.map((p) => (
            <PlaceTile key={p.id} place={p} saved={!!saved[p.id]} onToggleSave={toggleSave} onOpen={onSelectPlace} />
          ))}
        </div>
      </div>
    </section>
  )
}
