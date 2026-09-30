import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { regionLabel, useT } from '../i18n'
import { searchMiscrits } from '../domain/search'
import { MiscritAvatar } from './MiscritAvatar'
import { RarityBadge } from './RarityBadge'
import './SearchPalette.css'

type Item = { key: string; to: string; label: string; sub?: string; avatar?: string; rarity?: string }

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const nav = useNavigate()
  const { miscrits, regions } = useData()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)

  const items = useMemo<Item[]>(() => {
    const ql = q.trim().toLowerCase()
    const regionItems = ql ? regions.filter(r => r.name.toLowerCase().includes(ql) || regionLabel(t, r.name).toLowerCase().includes(ql))
      .map(r => ({ key: `r-${r.name}`, to: `/map/${encodeURIComponent(r.name)}`, label: regionLabel(t, r.name), sub: t('nav.map') })) : []
    const mItems = searchMiscrits(miscrits, q).map(({ m, matched }) => ({
      key: `m-${m.id}`, to: `/m/${m.id}`, label: m.names[0], sub: matched !== m.names[0] ? matched : undefined, avatar: m.names[0], rarity: m.rarity,
    }))
    return [...mItems, ...regionItems].slice(0, 10)
  }, [q, miscrits, regions, t])

  useEffect(() => { if (open) { setQ(''); setSel(0) } }, [open])
  useEffect(() => { setSel(0) }, [q])
  if (!open) return null

  const go = (it: Item) => { nav(it.to); onClose() }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && items[sel]) go(items[sel])
  }

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette card" onClick={e => e.stopPropagation()} role="dialog" aria-label={t('nav.search')}>
        <input className="input" autoFocus placeholder={t('search.placeholder')} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} data-testid="palette-input" />
        <ul className="palette-list">
          {items.map((it, i) => (
            <li key={it.key} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onClick={() => go(it)}>
              {it.avatar && <MiscritAvatar name={it.avatar} size={32} />}
              <span>{it.label}{it.sub && <span className="muted small"> · {it.sub}</span>}</span>
              {it.rarity && <RarityBadge rarity={it.rarity} />}
            </li>
          ))}
          {q.trim() && items.length === 0 && <li className="muted">{t('search.none')}</li>}
        </ul>
        <div className="small muted">{t('search.hint')}</div>
      </div>
    </div>
  )
}
