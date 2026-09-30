import { useId, useMemo, useState } from 'react'
import type { Miscrit } from '../data/types'
import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { searchMiscrits } from '../domain/search'
import { MiscritAvatar } from './MiscritAvatar'
import { RarityBadge } from './RarityBadge'

/** Search-as-you-type miscrit selector (used by calculator, team builder, compare). */
export function MiscritPicker({ onPick, exclude = [], autoFocus }: { onPick: (m: Miscrit) => void; exclude?: number[]; autoFocus?: boolean }) {
  const t = useT()
  const { miscrits } = useData()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const listId = useId()
  const results = useMemo(() => searchMiscrits(miscrits.filter(m => !exclude.includes(m.id)), q, 8), [miscrits, q, exclude])
  const pick = (m: Miscrit) => { onPick(m); setQ(''); setSel(0) }
  return (
    <div className="picker">
      <input className="input" value={q} placeholder={t('pick.placeholder')} autoFocus={autoFocus} role="combobox" aria-expanded={results.length > 0}
        aria-controls={listId} aria-autocomplete="list" aria-activedescendant={results[sel] ? `${listId}-${results[sel].m.id}` : undefined}
        onChange={e => { setQ(e.target.value); setSel(0) }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
          else if (e.key === 'Enter' && results[sel]) pick(results[sel].m)
        }} />
      {results.length > 0 && (
        <ul className="picker-list card" id={listId} role="listbox">
          {results.map(({ m, matched }, i) => (
            <li key={m.id} id={`${listId}-${m.id}`} role="option" aria-selected={i === sel} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onMouseDown={e => { e.preventDefault(); pick(m) }}>
              <MiscritAvatar name={m.names[0]} size={30} /><span>{m.names[0]}{matched !== m.names[0] && <span className="muted small"> · {matched}</span>}</span><RarityBadge rarity={m.rarity} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
