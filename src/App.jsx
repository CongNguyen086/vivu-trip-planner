import { useState } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'
import { HomeScreen } from './components/home/HomeScreen.jsx'
import { ResultsScreen } from './components/ResultsScreen.jsx'
import { DetailModal } from './components/DetailModal.jsx'
import { ItineraryScreen } from './components/ItineraryScreen.jsx'

export default function App() {
  const [view, setView] = useState(VIEWS.EXPLORE)
  const [tripRequest, setTripRequest] = useState(defaultTripRequest)
  const [destinations, setDestinations] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [itineraryPlace, setItineraryPlace] = useState(null)
  const [itinerary, setItinerary] = useState(null)
  // Trang đã mở modal / lịch trình: quay lại đúng trang đó (trang chủ hoặc kết quả).
  const [returnView, setReturnView] = useState(VIEWS.EXPLORE)

  const search = () => { setDestinations(null); setView(VIEWS.RESULTS) }
  const createItinerary = () => {
    setReturnView(view === VIEWS.ITINERARY ? VIEWS.EXPLORE : view)
    setItineraryPlace(selectedPlace); setItinerary(null)
    setView(VIEWS.ITINERARY); setSelectedPlace(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {view === VIEWS.EXPLORE && (
        <HomeScreen
          tripRequest={tripRequest} setTripRequest={setTripRequest}
          onSubmit={search} onSelectPlace={setSelectedPlace}
          onReset={() => { setTripRequest(defaultTripRequest()); setDestinations(null) }}
        />
      )}
      {view === VIEWS.RESULTS && (
        <ResultsScreen
          tripRequest={tripRequest} destinations={destinations} setDestinations={setDestinations}
          onSelectPlace={setSelectedPlace} onBack={() => setView(VIEWS.EXPLORE)}
        />
      )}
      {view === VIEWS.ITINERARY && itineraryPlace && (
        <ItineraryScreen
          place={itineraryPlace} tripRequest={tripRequest}
          itinerary={itinerary} setItinerary={setItinerary}
          onBack={() => setView(returnView)}
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
