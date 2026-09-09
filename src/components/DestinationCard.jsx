import { PlaceCard } from '../design-system/index.js'
import { useResolvedImage } from './useResolvedImage.js'

export function DestinationCard({ destination, onClick }) {
  const q = destination.wikiTitle || destination.imageQuery || destination.name
  const { url } = useResolvedImage(q, 400)
  return (
    <PlaceCard
      image={url || undefined}
      name={destination.name}
      description={destination.whyFit}
      tags={destination.tags}
      meta={destination.province}
      onClick={onClick}
    />
  )
}
