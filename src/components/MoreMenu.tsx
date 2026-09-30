import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import type { NavItem } from './nav'

/** Dropdown (desktop) or bottom sheet (phone) with secondary navigation. */
export function MoreMenu({ items, open, onClose, sheet }: { items: NavItem[]; open: boolean; onClose: () => void; sheet?: boolean }) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    // defer so the click that opened the menu does not close it immediately
    const id = setTimeout(() => document.addEventListener('click', onDoc))
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(id); document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={sheet ? 'more-sheet-backdrop' : ''}>
      <div ref={ref} className={`card ${sheet ? 'more-sheet' : 'more-menu'}`} role="menu">
        {items.map(i => (
          <NavLink key={i.to} to={i.to} end={i.end} className="more-item" role="menuitem" onClick={onClose}>
            <span className="nav-icon">{i.icon}</span>{t(i.key)}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
