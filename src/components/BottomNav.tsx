import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { BOTTOM, NAV } from './nav'
import { MoreMenu } from './MoreMenu'

export function BottomNav() {
  const t = useT()
  const [more, setMore] = useState(false)
  const main = NAV.filter(n => BOTTOM.includes(n.to))
  const rest = NAV.filter(n => !BOTTOM.includes(n.to))
  return (
    <>
      <nav className="bottom-nav" aria-label="main">
        {main.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}><span className="nav-icon">{n.icon}</span><span>{t(n.key)}</span></NavLink>
        ))}
        <button type="button" onClick={() => setMore(v => !v)} aria-expanded={more}><span className="nav-icon">☰</span><span>{t('nav.more')}</span></button>
      </nav>
      <MoreMenu items={rest} open={more} onClose={() => setMore(false)} sheet />
    </>
  )
}
