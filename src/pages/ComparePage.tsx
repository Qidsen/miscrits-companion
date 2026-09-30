import { useMemo, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { StatKey } from '../data/types'
import { useData } from '../data/DataProvider'
import { regionLabel, useT, type I18nKey } from '../i18n'
import { parseIds } from '../domain/compare'
import { TIER_VALUE } from '../domain/miscrit'
import { spawnDays } from '../domain/schedule'
import { elementGradient } from '../styles/elements'
import { STAT_COLORS } from '../components/StatBars'
import { MiscritPicker } from '../components/MiscritPicker'
import { Sprite } from '../components/Sprite'
import { ElementIcons } from '../components/ElementIcons'
import { RarityBadge } from '../components/RarityBadge'
import { DayDots } from '../components/DayDots'
import './tools.css'

const KEYS: StatKey[] = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']

export function ComparePage() {
  const t = useT()
  const { byId } = useData()
  const [params, setParams] = useSearchParams()
  const known = useMemo(() => new Set(byId.keys()), [byId])
  const ids = parseIds(params.get('ids'), known)
  const list = ids.map(id => byId.get(id)!)
  const setIds = (next: number[]) => setParams(next.length ? { ids: next.join(',') } : {}, { replace: true })
  const best = Object.fromEntries(KEYS.map(k => [k, Math.max(0, ...list.map(m => TIER_VALUE[m.stats[k]]))]))
  const cols = list.length + (list.length < 4 ? 1 : 0)

  return (
    <div className="container fade-in">
      <div className="tool-head"><div><h1>⚖️ {t('cmp.title')}</h1><p className="muted">{t('cmp.hint')}</p></div></div>
      <div className="cmp-grid" style={{ gridTemplateColumns: `repeat(${Math.max(cols, 1)}, minmax(0, 1fr))` }}>
        {list.map(m => (
          <div key={m.id} className={`card cmp-col rarity-${m.rarity}`} style={{ '--el': elementGradient(m.element) } as CSSProperties}>
            <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={() => setIds(ids.filter(x => x !== m.id))} aria-label={t('pick.remove')}>✕</button>
            <Sprite name={m.names[0]} size={130} eager />
            <Link to={`/m/${m.id}`}><h3 style={{ margin: 0 }}>{m.names[0]}</h3></Link>
            <div className="row" style={{ gap: 8, justifyContent: 'center' }}><RarityBadge rarity={m.rarity} /><ElementIcons element={m.element} /></div>
            <div className="cmp-stats">
              {KEYS.map(k => (
                <div key={k} className={`cmp-stat${TIER_VALUE[m.stats[k]] === best[k] && list.length > 1 ? ' best' : ''}`}>
                  <span>{t(`stat.${k}` as I18nKey)}</span>
                  <span className="stat-track"><span className="stat-fill" style={{ width: `${TIER_VALUE[m.stats[k]] * 20}%`, background: STAT_COLORS[k] }} /></span>
                  <span className="stat-tier">{m.stats[k]}</span>
                </div>
              ))}
            </div>
            {m.perfectStat && <div className="small">{t('m.perfect')}: <b>{m.perfectStat}</b></div>}
            {m.attackType && <div className="small">{t('m.attackType')}: <b>{m.attackType}</b></div>}
            {m.spawns.length > 0 ? <>
              <div className="small muted">{[...new Set(m.spawns.map(s => regionLabel(t, s.region)))].join(', ')}</div>
              <DayDots days={spawnDays(m.spawns)} />
            </> : <div className="small muted">{t('m.noSpawn')}</div>}
          </div>
        ))}
        {list.length < 4 && <div className="card cmp-col" style={{ justifyContent: 'center' }}><MiscritPicker onPick={m => setIds([...ids, m.id])} exclude={ids} /></div>}
      </div>
    </div>
  )
}
