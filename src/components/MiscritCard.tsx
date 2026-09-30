import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Miscrit } from '../data/types'
import { useT, type I18nKey } from '../i18n'
import { spawnDays } from '../domain/schedule'
import { elementGradient } from '../styles/elements'
import { useCollection } from '../store/collection'
import { useHunt } from '../store/hunt'
import { ElementIcons } from './ElementIcons'
import { MiscritAvatar } from './MiscritAvatar'
import { Sprite } from './Sprite'
import { DayDots } from './DayDots'
import './MiscritCard.css'

export type CardSize = 'xs' | 'sm' | 'mini' | 'md' | 'lg'
const SPRITE: Record<CardSize, number> = { xs: 40, sm: 56, mini: 76, md: 96, lg: 150 }

interface Props {
  m: Miscrit; size?: CardSize; showDays?: boolean; day?: number; region?: string
  highlighted?: boolean; quickMark?: boolean; onHover?: (id: number | null) => void
  onClick?: MouseEventHandler<HTMLAnchorElement>; extra?: ReactNode
}

export function MiscritCard({ m, size = 'md', showDays, day, region, highlighted, quickMark, onHover, onClick, extra }: Props) {
  const t = useT()
  const caught = useCollection(s => s.caught.includes(m.id))
  const toggleCaught = useCollection(s => s.toggleCaught)
  const hunted = useHunt(s => s.ids.includes(m.id))
  const toggleHunt = useHunt(s => s.toggle)
  const days = spawnDays(region ? m.spawns.filter(s => s.region === region) : m.spawns)
  const cls = `mcard mcard-${size} rarity-${m.rarity}${caught ? ' is-caught' : ''}${highlighted ? ' is-hl' : ''}${quickMark ? ' is-quick' : ''}`
  const style = { '--el': elementGradient(m.element) } as CSSProperties
  const hover = onHover ? { onMouseEnter: () => onHover(m.id), onMouseLeave: () => onHover(null) } : {}

  const body = size === 'xs'
    ? <MiscritAvatar name={m.names[0]} size={SPRITE.xs} />
    : <>
      <div className="mcard-art">{size === 'sm' ? <MiscritAvatar name={m.names[0]} size={SPRITE.sm} /> : <Sprite name={m.names[0]} size={SPRITE[size]} />}</div>
      <div className="mcard-body">
        <div className="mcard-name">{m.names[0]}</div>
        <div className="mcard-meta">
          <ElementIcons element={m.element} size={size === 'lg' ? 18 : 15} />
          <span className="mcard-rarity">{t(`rarity.${m.rarity}` as I18nKey)}</span>
        </div>
        {showDays && m.spawns.length > 0 && <DayDots days={days} today={day} compact={size !== 'lg'} />}
        {extra}
      </div>
    </>

  const badge = caught && <span className="mcard-caught" title={t('card.caught')}>✓</span>

  if (quickMark) {
    return (
      <button type="button" className={cls} style={style} onClick={() => toggleCaught(m.id)} aria-pressed={caught}
        title={t('card.mark')} data-testid="miscrit-tile" {...hover}>
        {body}{badge}
      </button>
    )
  }
  const star = size !== 'xs' && (
    <button type="button" className={`mcard-hunt${hunted ? ' on' : ''}`} title={t(hunted ? 'hunt.added' : 'hunt.add')} aria-label={t(hunted ? 'hunt.added' : 'hunt.add')}
      aria-pressed={hunted} onClick={() => toggleHunt(m.id)}>{hunted ? '★' : '☆'}</button>
  )
  // the link and the hunt button are siblings: no interactive element nested inside a link
  return (
    <div className={cls} style={style} {...hover}>
      <Link to={`/m/${m.id}`} className="mcard-link" title={m.names[0]} data-testid="miscrit-tile" onClick={onClick}>{body}</Link>
      {badge}{star}
    </div>
  )
}
