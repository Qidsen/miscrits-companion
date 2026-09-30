import { NavLink } from 'react-router-dom'
import { useT } from '../i18n'
import { LangToggle } from './LangToggle'
import { ResetCountdown } from './ResetCountdown'
import './Header.css'

export function Header({ onSearch }: { onSearch: () => void }) {
  const t = useT()
  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/" className="logo">Miscrits<span>Companion</span></NavLink>
        <nav className="nav">
          <NavLink to="/" end>{t('nav.today')}</NavLink>
          <NavLink to="/map">{t('nav.map')}</NavLink>
          <NavLink to="/dex">{t('nav.dex')}</NavLink>
        </nav>
        <div className="header-right">
          <button className="btn search-btn" onClick={onSearch} aria-label={t('nav.search')}>⌕ <kbd>Ctrl K</kbd></button>
          <ResetCountdown />
          <LangToggle />
        </div>
      </div>
    </header>
  )
}
