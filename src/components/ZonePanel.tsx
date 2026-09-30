import type { CSSProperties } from 'react'
import type { Miscrit, Region } from '../data/types'
import { useT } from '../i18n'
import { zoneColor } from '../domain/zones'
import { MiscritCard } from './MiscritCard'

export interface ZoneGroup { zone: string; miscrits: Miscrit[] }

interface Props {
  region: Region; groups: ZoneGroup[]; day?: number; hoveredZone?: string | null; hoveredMiscrit?: number | null
  onHoverZone: (z: string | null) => void; onHoverMiscrit: (id: number | null) => void
  /** returns true when the miscrit was found on the map (navigation is then suppressed) */
  onPick: (m: Miscrit) => boolean
}

export function ZonePanel({ region, groups, day, hoveredZone, hoveredMiscrit, onHoverZone, onHoverMiscrit, onPick }: Props) {
  const t = useT()
  if (groups.length === 0) return <div className="muted zone-empty">{t('map.noneToday')}</div>
  return (
    <div className="zone-panel">
      {groups.map(g => {
        const color = zoneColor(region, g.zone)
        return (
          <section key={g.zone} className={`zone-block${hoveredZone === g.zone ? ' on' : ''}`} style={{ '--zc': color } as CSSProperties}
            onMouseEnter={() => onHoverZone(g.zone)} onMouseLeave={() => onHoverZone(null)} data-testid="zone-block">
            <header className="zone-head">
              <span className="zone-dot" />
              <h3>{region.zones[g.zone] ?? g.zone}</h3>
              <span className="count">{g.miscrits.length}</span>
            </header>
            <div className="zone-cards">
              {g.miscrits.map(m => (
                <MiscritCard key={m.id} m={m} size="mini" showDays day={day} region={region.name} highlighted={hoveredMiscrit === m.id}
                  onHover={onHoverMiscrit} onClick={e => { if (onPick(m)) e.preventDefault() }} />
              ))}
            </div>
          </section>
        )
      })}
      <p className="tiny muted zone-hint">{t('map.flyHint')}</p>
    </div>
  )
}
