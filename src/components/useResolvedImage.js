import { useEffect, useState } from 'react'
import { apiImage } from '../lib/api.js'

// query có thể là chuỗi hoặc mảng ứng viên: thử lần lượt tới khi có ảnh.
// Nhờ vậy nếu wikiTitle do AI trả không khớp, vẫn fallback imageQuery/name.
export function useResolvedImage(query, size = 400) {
  const candidates = (Array.isArray(query) ? query : [query])
    .map((q) => (q == null ? '' : String(q).trim()))
    .filter(Boolean)
  const key = candidates.join('|')
  const [state, setState] = useState({ url: null, loading: true, failed: false })
  useEffect(() => {
    let alive = true
    setState({ url: null, loading: true, failed: false })
    if (candidates.length === 0) { setState({ url: null, loading: false, failed: true }); return }
    ;(async () => {
      for (const q of candidates) {
        try {
          const r = await apiImage(q, size)
          if (!alive) return
          if (r.url) { setState({ url: r.url, loading: false, failed: false }); return }
        } catch { /* thử ứng viên kế tiếp */ }
      }
      if (alive) setState({ url: null, loading: false, failed: true })
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size])
  return state
}
