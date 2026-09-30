import { useMemo, useState } from 'react'
import { useData } from '../data/DataProvider'
import { regionLabel, useT } from '../i18n'
import { useNow } from '../hooks/useNow'
import { gameDay } from '../domain/schedule'
import { exclusiveToday, groupAvailable, miscritOfTheDay } from '../domain/today'
import { useCollection } from '../store/collection'
import { DayPicker } from '../components/DayPicker'
import { MiscritTile } from '../components/MiscritTile'
import { MiscritAvatar } from '../components/MiscritAvatar'
import { RarityBadge } from '../components/RarityBadge'
import { Link } from 'react-router-dom'
import './TodayPage.css'

export function TodayPage() {
  const t = useT()
  const { miscrits, regionByName } = useData()
  const now = useNow(30_000)
  const today = gameDay(now)
  const [picked, setPicked] = useState<number | null>(null)
  const day = picked ?? today
  const [hideCaught, setHideCaught] = useState(false)
  const caught = useCollection(s => s.caught)

  const visible = useMemo(() => (hideCaught ? miscrits.filter(m => !caught.includes(m.id)) : miscrits), [miscrits, caught, hideCaught])
  const groups = useMemo(() => groupAvailable(visible, day), [visible, day])
  const exclusive = useMemo(() => exclusiveToday(visible, day), [visible, day])
  const total = new Set(groups.flatMap(g => g.zones.flatMap(z => z.miscrits.map(m => m.id)))).size
  const motd = miscritOfTheDay(miscrits, now)

  return (
    <div className="container today">
      <div className="today-head">
        <div>
          <h1>{t('today.title')}</h1>
          <div className="muted">{t('today.count', { n: total })}</div>
        </div>
        <Link to={`/m/${motd.id}`} className={`card motd rarity-${motd.rarity}`}>
          <MiscritAvatar name={motd.names[0]} size={48} />
          <div><div className="small muted">{t('today.ofTheDay')}</div><b>{motd.names[0]}</b> <RarityBadge rarity={motd.rarity} /></div>
        </Link>
      </div>

      <div className="row today-controls">
        <DayPicker value={day} today={today} onChange={d => setPicked(d === today ? null : d)} />
        <label className="chip"><input type="checkbox" checked={hideCaught} onChange={e => setHideCaught(e.target.checked)} /> {t('today.hideCaught')}</label>
      </div>

      {exclusive.length > 0 && (
        <section className="card today-section highlight">
          <h2>{t('today.onlyToday')}</h2>
          <div className="grid-tiles">{exclusive.map(m => <MiscritTile key={m.id} m={m} />)}</div>
        </section>
      )}

      {groups.map(g => (
        <section key={g.region} className="card today-section">
          <h2><Link to={`/map/${encodeURIComponent(g.region)}`}>{regionLabel(t, g.region)}</Link></h2>
          {g.zones.map(z => (
            <div key={z.zone} className="today-zone">
              <h3 className="muted">{regionByName.get(g.region)?.zones[z.zone] ?? z.zone}</h3>
              <div className="grid-tiles">{z.miscrits.map(m => <MiscritTile key={m.id} m={m} />)}</div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
