import { HIcon } from './icons.jsx'
import { PromptBox, SuggestionChips } from './PromptBox.jsx'
import { AdvancedPanel } from './AdvancedPanel.jsx'
import { FeaturedSection } from './FeaturedSection.jsx'

export function HomeScreen({ tripRequest, setTripRequest, onSubmit, onSelectPlace, onReset }) {
  return (
    <div className="vv-app" id="top">
      <header className="vv-header">
        <div className="tp-container vv-header__in">
          <a className="vv-logo" href="/" aria-label="Vivu, về trang chủ" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }) }}>
            <span className="vv-logo__mark"><HIcon name="pin" /></span>
            Vivu
          </a>
          <button type="button" className="tp-btn tp-btn--ghost tp-btn--sm" onClick={onReset}>
            <HIcon name="plus" size="sm" />
            Chuyến đi mới
          </button>
        </div>
      </header>

      <main>
        <section className="vv-hero" aria-labelledby="vv-h1">
          <div className="vv-deco vv-deco--l" aria-hidden="true"><img src="/images/dalat.svg" alt="" /></div>
          <div className="vv-deco vv-deco--r" aria-hidden="true"><img src="/images/sapa.svg" alt="" /></div>
          <div className="tp-container">
            <div className="vv-hero__in">
              <div className="vv-hero__head">
                <span className="tp-tag tp-tag--primary"><HIcon name="sparkle" />Gợi ý bằng AI</span>
                <h1 id="vv-h1" className="vv-title">Bạn muốn đi đâu?</h1>
                <p className="vv-lead">Kể cho Vivu nghe chuyến đi bạn mong đợi, mình sẽ gợi ý những nơi hợp với bạn.</p>
              </div>
              <PromptBox value={tripRequest} onChange={setTripRequest} onSubmit={onSubmit} />
              <AdvancedPanel value={tripRequest} onChange={setTripRequest} />
              <SuggestionChips value={tripRequest} onChange={setTripRequest} />
            </div>
          </div>
        </section>

        <FeaturedSection onSelectPlace={onSelectPlace} />
      </main>
    </div>
  )
}
