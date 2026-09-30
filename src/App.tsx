import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataProvider'
import { Layout } from './components/Layout'
import { NotFound } from './pages/NotFound'
import { TodayPage } from './pages/TodayPage'
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DataProvider>
  )
}
