import React, { useReducer } from 'react'
import { VIEWS, defaultTripRequest } from './state.js'

const initialState = {
  view: VIEWS.EXPLORE,
  request: defaultTripRequest(),
  destination: null, // điểm đến đã chọn để dựng lịch trình
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_REQUEST':
      return { ...state, request: { ...state.request, ...action.patch } }
    case 'GO_ITINERARY':
      return { ...state, view: VIEWS.ITINERARY, destination: action.destination }
    case 'GO_EXPLORE':
      return { ...state, view: VIEWS.EXPLORE, destination: null }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      {state.view === VIEWS.EXPLORE && (
        <div style={{ padding: 24, maxWidth: 'var(--container-max)', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-primary)' }}>Vivu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Màn hình Explore — sẽ dựng ở P3.</p>
        </div>
      )}
      {state.view === VIEWS.ITINERARY && (
        <div style={{ padding: 24 }}>
          <p>Lịch trình — sẽ dựng ở P4.</p>
          <button type="button" onClick={() => dispatch({ type: 'GO_EXPLORE' })}>← Quay lại</button>
        </div>
      )}
    </div>
  )
}
