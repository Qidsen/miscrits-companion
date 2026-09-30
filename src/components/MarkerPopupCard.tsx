import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Marker, Miscrit } from '../data/types'
import { useT } from '../i18n'
import { spawnDays } from '../domain/schedule'
import { elementGradient } from '../styles/elements'
import { ElementIcons } from './ElementIcons'
import { RarityBadge } from './RarityBadge'
import { Sprite } from './Sprite'
import { DayDots } from './DayDots'

export function MarkerPopupCard({ marker, miscrit, zoneName, day }: { marker: Marker; miscrit?: Miscrit; zoneName?: string; day?: number }) {
  const t = useT()
  const name = miscrit?.names[0] ?? marker.name
  const element = miscrit?.element ?? marker.element
  const days = miscrit ? spawnDays(miscrit.spawns.filter(s => s.region === marker.region)) : null
  return (
    <div className={`popup-card rarity-${miscrit?.rarity ?? marker.rarity}`} style={{ '--el': elementGradient(element) } as CSSProperties}>
      <div className="popup-art"><Sprite name={name} size={110} eager /></div>
      <div className="popup-body">
        <div className="popup-name">{name}</div>
        <div className="row" style={{ gap: 8 }}><RarityBadge rarity={miscrit?.rarity ?? marker.rarity} /><ElementIcons element={element} size={16} /></div>
        {zoneName && <div className="small muted">📍 {zoneName}</div>}
        {days && <DayDots days={days} today={day} />}
        {marker.exactImg && <img src={marker.exactImg} alt="" className="popup-exact" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        {miscrit ? <Link className="btn btn-primary popup-btn" to={`/m/${miscrit.id}`}>{t('map.details')} →</Link> : <div className="small muted">{t('map.unknown')}</div>}
      </div>
    </div>
  )
}
