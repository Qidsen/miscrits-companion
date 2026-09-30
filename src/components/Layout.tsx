import { useLayoutEffect, useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { SearchPalette } from './SearchPalette'
import { BottomNav } from './BottomNav'
import { useTelegramSync } from '../hooks/useTelegramSync'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

export function Layout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  useTelegramSync()
  // layout effect: hotkeys are live before the first paint, so a visible UI always responds
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
      else if (e.key === '/' && !isTyping(e.target)) { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <>
      <Header onSearch={() => setSearchOpen(true)} />
      <main>{children}</main>
      <Footer />
      <BottomNav />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
