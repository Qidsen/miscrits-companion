import type { I18nKey } from '../i18n'

export interface NavItem { to: string; key: I18nKey; icon: string; primary: boolean; end?: boolean }

export const NAV: NavItem[] = [
  { to: '/', key: 'nav.today', icon: '☀️', primary: true, end: true },
  { to: '/map', key: 'nav.map', icon: '🗺️', primary: true },
  { to: '/dex', key: 'nav.dex', icon: '📖', primary: true },
  { to: '/week', key: 'nav.week', icon: '📅', primary: true },
  { to: '/team', key: 'nav.team', icon: '⚔️', primary: true },
  { to: '/games', key: 'nav.games', icon: '🎮', primary: true },
  { to: '/hunt', key: 'nav.hunt', icon: '🎯', primary: false },
  { to: '/collection', key: 'nav.collection', icon: '🏆', primary: false },
  { to: '/relics', key: 'nav.relics', icon: '💎', primary: false },
  { to: '/elements', key: 'nav.elements', icon: '🔥', primary: false },
  { to: '/calc', key: 'nav.calc', icon: '🧮', primary: false },
  { to: '/compare', key: 'nav.compare', icon: '⚖️', primary: false },
]

/** Phone bottom bar: 4 most used + "More". */
export const BOTTOM = ['/', '/map', '/dex', '/games']
