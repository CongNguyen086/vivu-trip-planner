import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'
import { ExploreScreen } from './components/ExploreScreen.jsx'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <ExploreScreen
          tripRequest={tripRequest} setTripRequest={setTripRequest}
          destinations={destinations} setDestinations={setDestinations}
          onSelectPlace={setSelectedPlace}
        />
      )}
      {view === VIEWS.ITINERARY && <div style={{ padding: 24 }}>Itinerary (P4)</div>}
      {/* DetailModal + chuyển view itinerary lắp ở P4, dùng selectedPlace/setView/setItinerary */}
    </div>
  )
}
