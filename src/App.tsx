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
import { ElementsPage } from './pages/ElementsPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { TeamPage } from './pages/TeamPage'
import { ComparePage } from './pages/ComparePage'
import { HuntPage } from './pages/HuntPage'
import { GamesHub } from './pages/games/GamesHub'
import { SilhouetteGame } from './pages/games/SilhouetteGame'
import { MemoryGame } from './pages/games/MemoryGame'
import { EvolutionGame } from './pages/games/EvolutionGame'
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
            <Route path="/elements" element={<ElementsPage />} />
            <Route path="/calc" element={<CalculatorPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/hunt" element={<HuntPage />} />
            <Route path="/games" element={<GamesHub />} />
            <Route path="/games/silhouette" element={<SilhouetteGame />} />
            <Route path="/games/memory" element={<MemoryGame />} />
            <Route path="/games/evolution" element={<EvolutionGame />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}
