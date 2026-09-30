import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { zoneLabel, dayShort, regionLabel, useT } from '../i18n'
import { useGameDay } from '../hooks/useGameDay'
import { huntToday, huntWeek } from '../domain/hunt'
import { useCollection } from '../store/collection'
import { useHunt } from '../store/hunt'
import { MiscritCard } from '../components/MiscritCard'
import { MiscritAvatar } from '../components/MiscritAvatar'
import { RarityBadge } from '../components/RarityBadge'
import { Panel } from '../components/Panel'
import { BOT_USERNAME } from '../config'
import { encodeIds } from '../domain/collection'
import './tools.css'

export function HuntPage() {
  const t = useT()
  const { byId, regionByName } = useData()
  const { day } = useGameDay()
  const { ids, remove, clear } = useHunt()
  const caught = useCollection(s => s.caught)
  const route = useMemo(() => huntToday(ids, byId, day), [ids, byId, day])
  const week = useMemo(() => huntWeek(ids, byId, new Date()), [ids, byId, day]) // eslint-disable-line react-hooks/exhaustive-deps
  const caughtHunted = ids.filter(id => caught.includes(id))
  const [copied, setCopied] = useState(false)
  const command = `/hunt ${encodeIds(ids)}`

  return (
    <div className="container fade-in">
      <div className="tool-head">
        <h1>🎯 {t('hunt.title')}</h1>
        <div className="row">
          {caughtHunted.length > 0 && <button className="btn" onClick={() => remove(caughtHunted)}>✓ {t('hunt.removeCaught')} ({caughtHunted.length})</button>}
          {ids.length > 0 && <button className="btn" onClick={clear}>{t('hunt.clear')}</button>}
        </div>
      </div>
      {BOT_USERNAME && ids.length > 0 && (
        <Panel title={`📨 ${t('tg.title')}`} style={{ marginBottom: 16 }} testId="tg-panel">
          <p className="small muted" style={{ marginTop: 0 }}>{t('tg.hint')}</p>
          <div className="row">
            <a className="btn btn-primary" href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer">{t('tg.step1')} @{BOT_USERNAME}</a>
            <span className="small">{t('tg.step2')}:</span>
            <input className="input" readOnly value={command} onFocus={e => e.target.select()} style={{ flex: 1, minWidth: 180 }} />
            <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }}>{copied ? t('col.copied') : t('col.copy')}</button>
          </div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>{t('tg.note')}</p>
        </Panel>
      )}
      {ids.length === 0 ? <Panel><div className="muted">{t('hunt.empty')}</div></Panel> : (
        <div className="hunt-layout">
          <Panel title={t('hunt.today')}>
            {route.length === 0 ? <div className="muted">{t('hunt.nothingToday')}</div> : (
              <div className="hunt-route">
                {route.map((g, i) => (
                  <div key={g.region} className="hunt-step">
                    <span className="hunt-num">{i + 1}</span>
                    <div>
                      <h3><Link to={`/map/${encodeURIComponent(g.region)}`}>{regionLabel(t, g.region)} →</Link></h3>
                      {g.zones.map(z => (
                        <div key={z.zone} style={{ marginBottom: 10 }}>
                          <div className="small muted">📍 {zoneLabel(t, regionByName.get(g.region)?.zones[z.zone] ?? `Zone ${z.zone}`)}</div>
                          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                            {z.miscrits.map(m => <MiscritCard key={m.id} m={m} size="sm" showDays day={day} region={g.region} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title={t('hunt.week')}>
            <div className="hunt-week">
              {week.map(({ m, next }) => (
                <Link key={m.id} to={`/m/${m.id}`} className={`hunt-row rarity-${m.rarity}`}>
                  <MiscritAvatar name={m.names[0]} size={40} />
                  <div className="grow"><b>{m.names[0]}</b> {caught.includes(m.id) && <span style={{ color: 'var(--ok)' }}>✓</span>}<div><RarityBadge rarity={m.rarity} /></div></div>
                  <span className={`hunt-when${next?.inDays === 0 ? ' now' : ''}`}>
                    {next ? `${dayShort(t, next.day)} · ${next.inDays === 0 ? t('day.today') : t('day.inDays', { n: next.inDays })}` : t('hunt.never')}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
