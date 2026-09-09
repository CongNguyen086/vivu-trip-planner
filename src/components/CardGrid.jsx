import { SkeletonCard } from '../design-system/index.js'
import { DestinationCard } from './DestinationCard.jsx'

const GRID = {
  display: 'grid', gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
}

export function CardGrid({ destinations, loading, onSelect }) {
  return (
    <div style={GRID} aria-busy={loading ? 'true' : 'false'} aria-live="polite">
      {loading
        ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        : (destinations || []).map((d) => (
            <DestinationCard key={d.id} destination={d} onClick={() => onSelect(d)} />
          ))}
    </div>
  )
}
