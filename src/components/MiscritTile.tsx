import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Miscrit } from '../data/types'
import { useCollection } from '../store/collection'
import { ElementIcons } from './ElementIcons'
import { MiscritAvatar } from './MiscritAvatar'
import './MiscritTile.css'

export function MiscritTile({ m, extra }: { m: Miscrit; extra?: ReactNode }) {
  const caught = useCollection(s => s.caught.includes(m.id))
  return (
    <Link to={`/m/${m.id}`} className={`tile rarity-${m.rarity}${caught ? ' tile-caught' : ''}`} data-testid="miscrit-tile">
      <MiscritAvatar name={m.names[0]} />
      <div className="tile-name">{m.names[0]}</div>
      <div className="tile-meta"><ElementIcons element={m.element} size={16} />{caught && <span className="tile-check">✓</span>}</div>
      {extra}
    </Link>
  )
}
