import { useState } from 'react'
import { Icon } from '../design-system/index.js'
import { useResolvedImage } from './useResolvedImage.js'

const SHIMMER = {
  background: 'linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%)',
  backgroundSize: '200% 100%', animation: 'vivu-shimmer var(--duration-shimmer) linear infinite',
}

export function SmartImage({ query, size = 800, alt = '', radius = 12, aspectRatio = '16/9' }) {
  const { url, loading, failed } = useResolvedImage(query, size)
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio, borderRadius: radius, overflow: 'hidden', background: 'var(--surface-muted)' }}>
      {loading && <div style={{ ...SHIMMER, position: 'absolute', inset: 0 }} />}
      {url && (
        <img src={url} alt={alt} onLoad={() => setLoaded(true)} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: loaded ? 1 : 0, transition: 'opacity var(--duration-base) var(--ease-standard)',
        }} />
      )}
      {!loading && failed && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 12,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14 }}>
            <Icon name="camera" size={16} color="#fff" />{alt}
          </span>
        </div>
      )}
    </div>
  )
}
