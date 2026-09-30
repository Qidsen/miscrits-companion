import { useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { elementLabel, zoneLabel, dayShort, regionLabel, useT } from '../i18n'
import { nextAvailableDay } from '../domain/schedule'
import { elementGradient, elementColor } from '../styles/elements'
import { toggleCaught } from '../store/actions'
import { useCollection } from '../store/collection'
import { useHunt } from '../store/hunt'
import { useGameDay } from '../hooks/useGameDay'
import { ElementIcons } from '../components/ElementIcons'
import { RarityBadge } from '../components/RarityBadge'
import { StatBars } from '../components/StatBars'
import { RegionMap } from '../components/RegionMap'
import { Sprite } from '../components/Sprite'
import { DayDots } from '../components/DayDots'
import { Panel } from '../components/Panel'
import { NotFound } from './NotFound'
import './MiscritPage.css'

/** Remount per id so evolution choice and image state never leak between miscrits. */
export function MiscritRoute() {
  const { id } = useParams()
  return <MiscritPage key={id} id={id} />
}

function MiscritPage({ id }: { id?: string }) {
  const t = useT()
  const { byId, relics, regionByName, markersByMiscrit } = useData()
  const { day: today } = useGameDay()
  const m = byId.get(Number(id))
  const [evo, setEvo] = useState(0)
  const { caught, favorites, toggleFavorite } = useCollection()
  const hunt = useHunt()
  if (!m) return <NotFound />

  const isCaught = caught.includes(m.id)
  const isFav = favorites.includes(m.id)
  const next = nextAvailableDay(m.spawns, new Date())
  const markers = markersByMiscrit.get(m.id) ?? []
  const firstMarker = markers[0]
  const markerRegion = firstMarker ? regionByName.get(firstMarker.region) : undefined
  const heroStyle = { '--el': elementGradient(m.element), '--elc': elementColor(m.element) } as CSSProperties

  return (
    <div className={`container miscrit rarity-${m.rarity} fade-in`}>
      <section className="card miscrit-hero" style={heroStyle}>
        <div className="miscrit-sprite">
          <div className="miscrit-glow" />
          <Sprite key={m.names[evo]} name={m.names[evo]} size={260} eager className="miscrit-sprite-img" />
        </div>
        <div className="miscrit-info">
          <div className="row" style={{ gap: 8 }}>
            <span className="miscrit-num">#{m.id}</span><RarityBadge rarity={m.rarity} />
            <span className="miscrit-el"><ElementIcons element={m.element} size={20} /> {elementLabel(t, m.element)}</span>
          </div>
          <h1>{m.names[evo]}</h1>
          <p className="miscrit-desc">{m.descriptions[evo]}</p>
          <div className="tiny muted upper">{t('m.evolutions')}</div>
          <div className="evo-strip">
            {m.names.map((n, i) => (
              <button key={i} type="button" className={`evo${evo === i ? ' on' : ''}`} aria-pressed={evo === i} aria-label={`${i + 1}. ${n}`} onClick={() => setEvo(i)}>
                <Sprite name={n} size={64} />
                <span>{i + 1}. {n}</span>
              </button>
            ))}
          </div>
          <div className="row">
            <button className={`btn${isCaught ? ' btn-primary' : ''}`} aria-pressed={isCaught} onClick={() => toggleCaught(m.id)} data-testid="toggle-caught">{isCaught ? `✓ ${t('m.caught')}` : t('m.catch')}</button>
            <button className="btn" aria-pressed={isFav} onClick={() => toggleFavorite(m.id)}>{isFav ? '★' : '☆'} {t('m.fav')}</button>
            <button className="btn" aria-pressed={hunt.ids.includes(m.id)} onClick={() => hunt.toggle(m.id)}>🎯 {t(hunt.ids.includes(m.id) ? 'hunt.added' : 'hunt.add')}</button>
            <Link className="btn" to={`/compare?ids=${m.id}`}>⚖️ {t('m.compare')}</Link>
            <Link className="btn" to={`/calc?a=${m.id}.30`}>🧮 {t('m.openCalc')}</Link>
          </div>
        </div>
      </section>

      <div className="miscrit-grid">
        <Panel title={t('m.stats')}>
          <StatBars stats={m.stats} />
          <div className="miscrit-facts">
            {m.perfectStat && <div><span>{t('m.perfect')}</span><b>{m.perfectStat}</b></div>}
            {m.attackType && <div><span>{t('m.attackType')}</span><b>{m.attackType}</b></div>}
            {m.shopInfo && <div><span>{t('m.shop')}</span><b>{m.shopInfo.cost} {m.shopInfo.currency}</b></div>}
          </div>
        </Panel>

        <Panel title={t('m.where')}>
          {m.spawns.length === 0 && <div className="muted">{t('m.noSpawn')}</div>}
          {m.spawns.map(s => (
            <div key={`${s.region}-${s.zone}`} className="spawn">
              <div><Link to={`/map/${encodeURIComponent(s.region)}`}><b>{regionLabel(t, s.region)}</b></Link>
                <span className="muted"> · {zoneLabel(t, regionByName.get(s.region)?.zones[s.zone] ?? `Zone ${s.zone}`)}</span></div>
              <DayDots days={s.days} today={today} />
            </div>
          ))}
          {next && <div className="next-avail">{t('m.nextAvail', { day: dayShort(t, next.day), when: next.inDays === 0 ? t('day.today') : t('day.inDays', { n: next.inDays }) })}</div>}
          {firstMarker && markerRegion?.map ? (
            <>
              <div className="miscrit-minimap"><RegionMap region={markerRegion} markers={[firstMarker]} flyTo={{ id: firstMarker.id, nonce: 0 }} compact height={220} /></div>
              <Link className="btn" to={`/map/${encodeURIComponent(firstMarker.region)}?focus=${firstMarker.id}`}>🗺️ {t('m.openMap')} →</Link>
            </>
          ) : m.spawns.length > 0 && <div className="small muted">{t('m.noMarker')}</div>}
        </Panel>

        {m.relicSet && (
          <Panel title={<>{t('m.relics')} <span className="count">{m.relicSet.name}</span></>}>
            <div className="relics">
              {m.relicSet.relicIds.map(rid => relics.get(rid)).filter(Boolean).map(r => (
                <div key={r!.id} className="relic" title={r!.desc}>
                  <img src={r!.imageUrl} alt="" width={44} height={44} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
                  <div><div className="tiny muted upper">{t('m.lvl', { n: r!.level })}</div><b className="small">{r!.name}</b>
                    <div className="relic-effects">{Object.entries(r!.effect).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
                      <span key={k} className={(v as number) >= 0 ? 'pos' : 'neg'}>{k.toUpperCase()} {(v as number) > 0 ? '+' : ''}{v as number}</span>))}</div>
                    {r!.special && <div className="small" style={{ color: 'var(--accent)' }}>{r!.special}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <Panel title={<>{t('m.abilities')} <span className="count">{m.abilities.length}</span></>}>
        <div className="abilities">
          {m.abilities.map((a, i) => (
            <div key={a.id} className="ability" style={{ '--ac': elementColor(a.element) } as CSSProperties}>
              <div className="ability-head">
                <span className="ability-num">{i + 1}</span><b>{a.name}</b>
                <span className="chip small">{elementLabel(t, a.element)}</span><span className="chip small">{a.type}</span>
                {a.ap !== undefined && <span className="ability-ap">AP {a.ap}</span>}
                {a.accuracy !== undefined && <span className="small muted">{a.accuracy}%</span>}
              </div>
              <div className="small muted">{a.desc}</div>
              {a.enchantDesc && <div className="small ability-ench">✦ {t('m.enchant')}: {a.enchantDesc}</div>}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
