import { useEffect, useState } from 'react'
import { apiImage } from '../lib/api.js'

export function useResolvedImage(query, size = 400) {
  const [state, setState] = useState({ url: null, loading: true, failed: false })
  useEffect(() => {
    let alive = true
    setState({ url: null, loading: true, failed: false })
    if (!query) { setState({ url: null, loading: false, failed: true }); return }
    apiImage(query, size)
      .then((r) => { if (alive) setState({ url: r.url, loading: false, failed: !r.url }) })
      .catch(() => { if (alive) setState({ url: null, loading: false, failed: true }) })
    return () => { alive = false }
  }, [query, size])
  return state
}
