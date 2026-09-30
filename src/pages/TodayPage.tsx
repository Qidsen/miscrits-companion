import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { mapImageUrl } from '../data/images'
import { zoneLabel, regionLabel, useT, type I18nKey } from '../i18n'
import { useGameDay } from '../hooks/useGameDay'
import { useNow } from '../hooks/useNow'
import { formatDuration } from '../domain/schedule'
import { exclusiveToday, groupAvailable, miscritOfTheDay, rareAvailable } from '../domain/today'
import { zoneColor } from '../domain/zones'
import { useCollection } from '../store/collection'
import { DayPicker } from '../components/DayPicker'
import { MiscritCard } from '../components/MiscritCard'
import './TodayPage.css'

function BigCountdown({ reset }: { reset: Date }) {
  const t = useT()
  const now = useNow()
  const local = reset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="big-countdown">
      <div className="tiny muted upper">{t('reset.in')}</div>
      <div className="big-countdown-time">{formatDuration(reset.getTime() - now.getTime())}</div>
      <div className="small muted">{t('reset.at', { local })}</div>
    </div>
  )
}

export function TodayPage() {
  const t = useT()
  const { miscrits, regionByName, changelog, byId } = useData()
  const { day: today, nextReset } = useGameDay()
  const [picked, setPicked] = useState<number | null>(null)
  const day = picked ?? today
  useEffect(() => { setPicked(p => (p === today ? null : p)) }, [today]) // the picked day became today at reset
  const [hideCaught, setHideCaught] = useState(false)
  const caught = useCollection(s => s.caught)

  const visible = useMemo(() => (hideCaught ? miscrits.filter(m => !caught.includes(m.id)) : miscrits), [miscrits, caught, hideCaught])
  const groups = useMemo(() => groupAvailable(visible, day), [visible, day])
  const exclusive = useMemo(() => exclusiveToday(visible, day), [visible, day])
  const rare = useMemo(() => rareAvailable(visible, day), [visible, day])
  const weekNews = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000
    const ids = changelog.filter(e => !e.initial && Date.parse(e.date) >= since).flatMap(e => [...(e.added ?? []), ...(e.spawnChanged ?? [])])
    return [...new Set(ids)].map(id => byId.get(id)).filter((m): m is NonNullable<typeof m> => !!m)
  }, [changelog, byId])
  const total = new Set(groups.flatMap(g => g.zones.flatMap(z => z.miscrits.map(m => m.id)))).size
  // re-pick when the game day changes
  const motd = useMemo(() => miscritOfTheDay(miscrits, new Date()), [miscrits, today]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container today fade-in">
      <section className="card today-hero">
        <div className="today-hero-main">
          <div className="today-gameday" data-testid="game-day">{t('today.gameDay')}: <b>{t(`dayFull.${today}` as I18nKey)}</b></div>
          <h1>{t('today.title')}</h1>
          <BigCountdown reset={nextReset} />
          <div className="today-stats">
            <div><b>{total}</b><span>{t('today.statAvail')}</span></div>
            <div><b>{rare.length}</b><span>{t('today.statRare')}</span></div>
            <div><b>{exclusive.length}</b><span>{t('today.statOnly')}</span></div>
          </div>
        </div>
        <div className="today-motd">
          <div className="tiny muted upper">{t('today.ofTheDay')}</div>
          <MiscritCard m={motd} size="lg" showDays day={today} />
        </div>
      </section>

      <div className="row today-controls">
        <DayPicker value={day} today={today} onChange={d => setPicked(d === today ? null : d)} />
        <label className="chip"><input type="checkbox" checked={hideCaught} onChange={e => setHideCaught(e.target.checked)} /> {t('today.hideCaught')}</label>
        {picked !== null && <button className="btn" onClick={() => setPicked(null)}>{t('today.backToToday')}</button>}
      </div>

      {weekNews.length > 0 && (
        <section className="today-section news-week">
          <h2 className="section-title">📰 {t('news.week')} <span className="count">{weekNews.length}</span> <Link to="/news" className="small" style={{ marginLeft: 'auto', color: 'var(--accent)' }}>{t('news.all')}</Link></h2>
          <div className="grid-cards">{weekNews.map(m => <MiscritCard key={m.id} m={m} size="mini" showDays day={day} />)}</div>
        </section>
      )}

      {rare.length > 0 && (
        <section className="today-section" data-testid="rare-today">
          <h2 className="section-title">✨ {t('today.rareToday')} <span className="count">{rare.length}</span></h2>
          <div className="hscroll showcase">{rare.map(m => <MiscritCard key={m.id} m={m} size="lg" showDays day={day} />)}</div>
        </section>
      )}

      {exclusive.length > 0 && (
        <section className="today-section">
          <h2 className="section-title">⏳ {t('today.onlyToday')} <span className="count">{exclusive.length}</span></h2>
          <div className="grid-cards">{exclusive.map(m => <MiscritCard key={m.id} m={m} showDays day={day} />)}</div>
        </section>
      )}

      {groups.map(g => {
        const region = regionByName.get(g.region)
        return (
          <section key={g.region} className="card region-section">
            <Link to={`/map/${encodeURIComponent(g.region)}`} className="region-banner"
              style={region?.map ? { backgroundImage: `url(${mapImageUrl(region.map.file)})` } : undefined}>
              <h2>{regionLabel(t, g.region)}</h2>
              <span className="region-banner-go">🗺️ {t('nav.map')} →</span>
            </Link>
            <div className="region-zones">
              {g.zones.map(z => (
                <div key={z.zone} className="today-zone">
                  <h3 className="zone-title"><span className="zone-dot" style={{ background: region ? zoneColor(region, z.zone) : undefined }} />
                    {zoneLabel(t, region?.zones[z.zone] ?? `Zone ${z.zone}`)} <span className="count">{z.miscrits.length}</span></h3>
                  <div className="grid-cards">{z.miscrits.map(m => <MiscritCard key={m.id} m={m} showDays day={day} region={g.region} />)}</div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
