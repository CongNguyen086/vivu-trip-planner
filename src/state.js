export const VIEWS = { EXPLORE: 'explore', ITINERARY: 'itinerary' }

export function isoPlusDays(base, n) {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function defaultTripRequest() {
  const today = new Date()
  return {
    prompt: '',
    area: '',
    days: 3,
    startDate: isoPlusDays(today, 7),
    budget: null,
    styles: [],
    companions: null,
  }
}
