import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'
import { ExploreScreen } from './components/ExploreScreen.jsx'
import { DetailModal } from './components/DetailModal.jsx'
import { ItineraryScreen } from './components/ItineraryScreen.jsx'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itineraryPlace, setItineraryPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)

  const createItinerary = () => {
    setItineraryPlace(selectedPlace); setItinerary(null)
    setView(VIEWS.ITINERARY); setSelectedPlace(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <ExploreScreen
          tripRequest={tripRequest} setTripRequest={setTripRequest}
          destinations={destinations} setDestinations={setDestinations}
          onSelectPlace={setSelectedPlace}
        />
      )}
      {view === VIEWS.ITINERARY && itineraryPlace && (
        <ItineraryScreen
          place={itineraryPlace} tripRequest={tripRequest}
          itinerary={itinerary} setItinerary={setItinerary}
          onBack={() => setView(VIEWS.EXPLORE)}
        />
      )}
      {selectedPlace && (
        <DetailModal
          place={selectedPlace} tripRequest={tripRequest}
          onClose={() => setSelectedPlace(null)} onCreateItinerary={createItinerary}
        />
      )}
    </div>
  )
}
