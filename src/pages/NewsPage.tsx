import { Link } from 'react-router-dom'
import type { ChangeEntry, Miscrit } from '../data/types'
import { useData } from '../data/DataProvider'
import { regionLabel, useT } from '../i18n'
import { useSettings } from '../store/settings'
import { MiscritCard } from '../components/MiscritCard'
import { MiscritAvatar } from '../components/MiscritAvatar'
import { Panel } from '../components/Panel'
import './NewsPage.css'

function Cards({ ids }: { ids: number[] }) {
  const { byId } = useData()
  const list = ids.map(id => byId.get(id)).filter((m): m is Miscrit => !!m)
  return <div className="grid-cards">{list.map(m => <MiscritCard key={m.id} m={m} size="mini" showDays />)}</div>
}

export function NewsEntry({ e }: { e: ChangeEntry }) {
  const t = useT()
  const { byId, relics } = useData()
  if (e.initial) return <p className="muted">{t('news.initial')}</p>
  return (
    <div className="news-sections">
      {!!e.added?.length && <section><h3>✨ {t('news.added')} <span className="count">{e.added.length}</span></h3><Cards ids={e.added} /></section>}
      {!!e.spawnChanged?.length && <section><h3>📍 {t('news.spawn')} <span className="count">{e.spawnChanged.length}</span></h3><Cards ids={e.spawnChanged} /></section>}
      {!!e.markersAdded?.length && <section><h3>🗺️ {t('news.markers')}</h3>
        {e.markersAdded.map(x => (
          <Link key={x.region} to={`/map/${encodeURIComponent(x.region)}`} className="news-markers">
            <b>{regionLabel(t, x.region)}</b> +{x.count}
            <span className="row" style={{ gap: 3 }}>{x.miscritIds.map(id => byId.get(id)).filter(Boolean).map(m => <MiscritAvatar key={m!.id} name={m!.names[0]} size={28} />)}</span>
          </Link>
        ))}</section>}
      {!!e.removed?.length && <section><h3>🗑️ {t('news.removed')}</h3><p className="muted">{e.removed.map(r => r.name).join(', ')}</p></section>}
      {!!(e.relicsAdded?.length || e.relicsChanged?.length) && <section><h3>💎 {t('news.relicsAdded')} / {t('news.relicsChanged')}</h3>
        <div className="row">{[...(e.relicsAdded ?? []), ...(e.relicsChanged ?? [])].map(id => relics.get(id)).filter(Boolean).map(r => (
          <span key={r!.id} className="chip"><img src={r!.imageUrl} alt="" width={20} height={20} />{r!.name}</span>))}</div></section>}
    </div>
  )
}

export function NewsPage() {
  const t = useT()
  const { changelog } = useData()
  const lang = useSettings(s => s.lang)
  const fmt = (d: string) => new Date(d).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' })
  return (
    <div className="container fade-in news">
      <div className="tool-head"><div><h1>📰 {t('news.title')}</h1><p className="muted">{t('news.subtitle')}</p></div></div>
      {changelog.length === 0 ? <Panel><div className="muted">{t('news.empty')}</div></Panel> : (
        <div className="news-timeline">
          {changelog.map(e => (
            <Panel key={e.date} title={<span className="news-date">{fmt(e.date)}</span>} className="news-item">
              <NewsEntry e={e} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
