import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { mapImageUrl } from '../data/images'
import { dayShort, regionLabel, useT, type I18nKey } from '../i18n'
import { useGameDay } from '../hooks/useGameDay'
import { WEEK_ORDER } from '../domain/schedule'
import { weekMatrix } from '../domain/week'
import { MiscritCard } from '../components/MiscritCard'
import './WeekPage.css'

const RARE = ['Epic', 'Exotic', 'Legendary']

export function WeekPage() {
  const t = useT()
  const { miscrits, regions } = useData()
  const { day: today } = useGameDay()
  const [rareOnly, setRareOnly] = useState(false)
  const [phoneDay, setPhoneDay] = useState<number | null>(null)
  const matrix = useMemo(() => weekMatrix(rareOnly ? miscrits.filter(m => RARE.includes(m.rarity)) : miscrits), [miscrits, rareOnly])
  const rows = regions.filter(r => matrix.has(r.name))
  const pd = phoneDay ?? today

  return (
    <div className="container week fade-in">
      <div className="week-head">
        <div><h1>📅 {t('week.title')}</h1><p className="muted">{t('week.subtitle')}</p></div>
        <label className="chip"><input type="checkbox" checked={rareOnly} onChange={e => setRareOnly(e.target.checked)} /> {t('week.rareOnly')}</label>
      </div>

      <div className="card week-table-wrap">
        <table className="week-table">
          <thead>
            <tr><th>{t('week.region')}</th>{WEEK_ORDER.map(d => <th key={d} className={d === today ? 'today' : ''}>{t(`dayFull.${d}` as I18nKey)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name}>
                <th scope="row">
                  <Link to={`/map/${encodeURIComponent(r.name)}`} className="week-region" style={r.map ? { backgroundImage: `url(${mapImageUrl(r.map.file)})` } : undefined}>
                    <span>{regionLabel(t, r.name)}</span>
                  </Link>
                </th>
                {WEEK_ORDER.map(d => (
                  <td key={d} className={d === today ? 'today' : ''}>
                    <div className="week-cell">{(matrix.get(r.name)?.get(d) ?? []).map(m => <MiscritCard key={m.id} m={m} size="xs" />)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="week-phone">
        <div className="row" style={{ gap: 6 }}>
          {WEEK_ORDER.map(d => <button key={d} className="chip" aria-pressed={pd === d} onClick={() => setPhoneDay(d)}>{dayShort(t, d)}{d === today ? ' •' : ''}</button>)}
        </div>
        {rows.map(r => {
          const list = matrix.get(r.name)?.get(pd) ?? []
          if (!list.length) return null
          return (
            <section key={r.name} className="card week-phone-region">
              <h3>{regionLabel(t, r.name)}</h3>
              <div className="grid-cards">{list.map(m => <MiscritCard key={m.id} m={m} size="sm" />)}</div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
