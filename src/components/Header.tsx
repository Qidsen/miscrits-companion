import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { LangToggle } from './LangToggle'
import { ResetCountdown } from './ResetCountdown'
import { MoreMenu } from './MoreMenu'
import { NAV } from './nav'
import './Header.css'

export function Header({ onSearch }: { onSearch: () => void }) {
  const t = useT()
  const [more, setMore] = useState(false)
  const primary = NAV.filter(n => n.primary)
  const secondary = NAV.filter(n => !n.primary)
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo"><span className="logo-mark">✦</span><span className="logo-text">Miscrits<b>Companion</b></span></NavLink>
        <nav className="nav" aria-label="main">
          {primary.map(n => <NavLink key={n.to} to={n.to} end={n.end}><span className="nav-icon">{n.icon}</span>{t(n.key)}</NavLink>)}
          <div className="nav-more">
            <button type="button" className={more ? 'active' : ''} onClick={() => setMore(v => !v)} aria-expanded={more}>{t('nav.more')} ▾</button>
            <MoreMenu items={secondary} open={more} onClose={() => setMore(false)} />
          </div>
        </nav>
        <div className="header-right">
          <button className="btn search-btn" onClick={onSearch} aria-label={t('nav.search')}>🔍 <kbd>Ctrl K</kbd></button>
          <ResetCountdown />
          <LangToggle />
        </div>
      </div>
    </header>
  )
}
