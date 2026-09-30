import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { useT, type I18nKey } from '../i18n'
import { filterRelics, relicUsage } from '../domain/relics'
import { MiscritAvatar } from '../components/MiscritAvatar'
import './RelicsPage.css'

const LEVELS = [10, 20, 30, 35]
const STATS = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']

export function RelicsPage() {
  const t = useT()
  const { relics, miscrits, byId } = useData()
  const [levels, setLevels] = useState<number[]>([])
  const [stat, setStat] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const usage = useMemo(() => relicUsage(miscrits), [miscrits])
  const list = useMemo(() => filterRelics([...relics.values()], { levels, stat, q }), [relics, levels, stat, q])

  return (
    <div className="container relics-page fade-in">
      <h1>💎 {t('relics.title')}</h1>
      <div className="card relics-filters">
        <input className="input" placeholder={t('relics.search')} value={q} onChange={e => setQ(e.target.value)} />
        <div className="row" style={{ gap: 6 }}>
          <span className="small muted">{t('relics.level')}:</span>
          {LEVELS.map(l => <button key={l} className="chip" aria-pressed={levels.includes(l)} onClick={() => setLevels(ls => ls.includes(l) ? ls.filter(x => x !== l) : [...ls, l])}>{l}</button>)}
          <span className="small muted" style={{ marginLeft: 8 }}>{t('m.stats')}:</span>
          <button className="chip" aria-pressed={stat === null} onClick={() => setStat(null)}>{t('relics.anyStat')}</button>
          {STATS.map(s => <button key={s} className="chip" aria-pressed={stat === s} onClick={() => setStat(s)}>{t(`stat.${s}` as I18nKey)}</button>)}
        </div>
      </div>
      <div className="muted small" style={{ margin: '10px 2px' }}>{t('relics.count', { n: list.length })}</div>
      <div className="relic-grid">
        {list.map(r => {
          const users = usage.get(r.id) ?? []
          return (
            <article key={r.id} className="card relic-card">
              <div className="relic-card-head">
                <img src={r.imageUrl} alt="" width={56} height={56} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
                <div><div className="tiny muted upper">{t('m.lvl', { n: r.level })}</div><h3>{r.name}</h3></div>
              </div>
              <p className="small muted">{r.desc}</p>
              <div className="relic-effects">
                {Object.entries(r.effect).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
                  <span key={k} className={(v as number) >= 0 ? 'pos' : 'neg'}>{k.toUpperCase()} {(v as number) > 0 ? '+' : ''}{v as number}</span>))}
              </div>
              {r.special && <div className="small relic-special">✦ {r.special}</div>}
              {users.length > 0 && (
                <div className="relic-users">
                  <span className="tiny muted upper">{t('relics.usedBy')}</span>
                  <div className="row" style={{ gap: 4 }}>
                    {users.slice(0, 8).map(id => { const m = byId.get(id); return m && <Link key={id} to={`/m/${id}`} title={m.names[0]} className={`rarity-${m.rarity}`}><MiscritAvatar name={m.names[0]} size={30} /></Link> })}
                    {users.length > 8 && <span className="small muted">+{users.length - 8}</span>}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
