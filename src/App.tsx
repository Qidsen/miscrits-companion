import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataProvider'
import { Layout } from './components/Layout'
import { NotFound } from './pages/NotFound'
import { TodayPage } from './pages/TodayPage'
import { DexPage } from './pages/DexPage'
import { MapPage } from './pages/MapPage'
import { MiscritRoute } from './pages/MiscritPage'
import { WeekPage } from './pages/WeekPage'
import { RelicsPage } from './pages/RelicsPage'
import { CollectionPage } from './pages/CollectionPage'
import { FriendCollectionPage } from './pages/FriendCollectionPage'
import { translate } from './i18n'
import { useSettings } from './store/settings'

export default function App() {
  const lang = useSettings(s => s.lang)
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return (
    <DataProvider
      fallback={<div className="container muted">{translate(lang, 'loading')}</div>}
      error={e => <div className="container" role="alert">{translate(lang, 'error.load', { msg: e.message })}</div>}
    >
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/dex" element={<DexPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/:region" element={<MapPage />} />
            <Route path="/m/:id" element={<MiscritRoute />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/relics" element={<RelicsPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/c/:code" element={<FriendCollectionPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}
