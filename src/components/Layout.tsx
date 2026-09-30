import { useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout({ children }: { children: ReactNode }) {
  const [, setSearchOpen] = useState(false)
  return (
    <>
      <Header onSearch={() => setSearchOpen(true)} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
