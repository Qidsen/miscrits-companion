import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Region } from '../data/types'
import { mapImageUrl } from '../data/images'
import { regionLabel, useT } from '../i18n'

export function RegionStrip({ regions, active, counts }: { regions: Region[]; active?: string; counts: Record<string, number> }) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.region-thumb.active')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [active])
  return (
    <nav ref={ref} className="region-strip hscroll" aria-label={t('map.regions')}>
      {regions.map(r => (
        <Link key={r.name} to={`/map/${encodeURIComponent(r.name)}`} className={`region-thumb${r.name === active ? ' active' : ''}`}
          style={r.map ? { backgroundImage: `url(${mapImageUrl(r.map.file)})` } : undefined} aria-current={r.name === active ? 'page' : undefined}>
          <span className="region-thumb-name">{regionLabel(t, r.name)}</span>
          <span className="region-thumb-count">{counts[r.name] ?? 0}</span>
        </Link>
      ))}
    </nav>
  )
}
