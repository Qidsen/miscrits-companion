import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataProvider'
import { Layout } from './components/Layout'
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary'
import { NotFound } from './pages/NotFound'
import { TodayPage } from './pages/TodayPage'
import { translate } from './i18n'
import { useSettings } from './store/settings'

const DexPage = lazy(() => import('./pages/DexPage').then(m => ({ default: m.DexPage })))
const MapPage = lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })))
const MiscritRoute = lazy(() => import('./pages/MiscritPage').then(m => ({ default: m.MiscritRoute })))
const WeekPage = lazy(() => import('./pages/WeekPage').then(m => ({ default: m.WeekPage })))
const RelicsPage = lazy(() => import('./pages/RelicsPage').then(m => ({ default: m.RelicsPage })))
const CollectionPage = lazy(() => import('./pages/CollectionPage').then(m => ({ default: m.CollectionPage })))
const FriendCollectionPage = lazy(() => import('./pages/FriendCollectionPage').then(m => ({ default: m.FriendCollectionPage })))
const ElementsPage = lazy(() => import('./pages/ElementsPage').then(m => ({ default: m.ElementsPage })))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const TeamPage = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })))
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })))
const TournamentPage = lazy(() => import('./pages/TournamentPage').then(m => ({ default: m.TournamentPage })))
const ResultPage = lazy(() => import('./pages/ResultPage').then(m => ({ default: m.ResultPage })))
const ChallengeGame = lazy(() => import('./pages/games/ChallengeGame').then(m => ({ default: m.ChallengeGame })))
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })))
const HuntPage = lazy(() => import('./pages/HuntPage').then(m => ({ default: m.HuntPage })))
const GamesHub = lazy(() => import('./pages/games/GamesHub').then(m => ({ default: m.GamesHub })))
const SilhouetteGame = lazy(() => import('./pages/games/SilhouetteGame').then(m => ({ default: m.SilhouetteGame })))
const MemoryGame = lazy(() => import('./pages/games/MemoryGame').then(m => ({ default: m.MemoryGame })))
const EvolutionGame = lazy(() => import('./pages/games/EvolutionGame').then(m => ({ default: m.EvolutionGame })))

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
          <ChunkErrorBoundary lang={lang}>
          <Suspense fallback={<div className="container muted">{translate(lang, 'loading')}</div>}>
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
            <Route path="/news" element={<NewsPage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/tournament/play" element={<ChallengeGame />} />
            <Route path="/r/:code" element={<ResultPage />} />
            <Route path="/games" element={<GamesHub />} />
            <Route path="/games/silhouette" element={<SilhouetteGame />} />
            <Route path="/games/memory" element={<MemoryGame />} />
            <Route path="/games/evolution" element={<EvolutionGame />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ChunkErrorBoundary>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}
