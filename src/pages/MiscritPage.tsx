import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { dayShort, regionLabel, useT } from '../i18n'
import { spriteUrl } from '../data/images'
import { nextAvailableDay, WEEK_ORDER } from '../domain/schedule'
import { useCollection } from '../store/collection'
import { ElementIcons } from '../components/ElementIcons'
import { RarityBadge } from '../components/RarityBadge'
import { StatBars } from '../components/StatBars'
import { RegionMap } from '../components/RegionMap'
import { MiscritAvatar } from '../components/MiscritAvatar'
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
  const m = byId.get(Number(id))
  const [evo, setEvo] = useState(0)
  const [failedSprite, setFailedSprite] = useState<string | null>(null)
  const { caught, favorites, toggleCaught, toggleFavorite } = useCollection()
  if (!m) return <NotFound />

  const isCaught = caught.includes(m.id)
  const isFav = favorites.includes(m.id)
  const next = nextAvailableDay(m.spawns, new Date())
  const markers = markersByMiscrit.get(m.id) ?? []
  const firstMarker = markers[0]
  const markerRegion = firstMarker ? regionByName.get(firstMarker.region) : undefined

  return (
    <div className={`container miscrit rarity-${m.rarity}`}>
      <section className="card miscrit-hero">
        <div className="miscrit-sprite">
          {failedSprite === spriteUrl(m.names[evo])
            ? <MiscritAvatar name={m.names[evo]} size={120} />
            : <img src={spriteUrl(m.names[evo])} alt={m.names[evo]} onError={() => setFailedSprite(spriteUrl(m.names[evo]))} />}
        </div>
        <div className="miscrit-info">
          <div className="small muted">#{m.id}</div>
          <h1>{m.names[evo]}</h1>
          <div className="row"><RarityBadge rarity={m.rarity} /><ElementIcons element={m.element} size={22} /><span className="muted">{m.element}</span></div>
          <div className="row miscrit-evos">
            {m.names.map((n, i) => <button key={i} className="chip" aria-pressed={evo === i} onClick={() => setEvo(i)}>{i + 1}. {n}</button>)}
          </div>
          <p className="muted">{m.descriptions[evo]}</p>
          <div className="row">
            <button className="btn" aria-pressed={isCaught} onClick={() => toggleCaught(m.id)} data-testid="toggle-caught">{isCaught ? `✓ ${t('m.caught')}` : t('m.catch')}</button>
            <button className="btn" aria-pressed={isFav} onClick={() => toggleFavorite(m.id)}>{isFav ? '★' : '☆'} {t('m.fav')}</button>
          </div>
        </div>
      </section>

      <div className="miscrit-grid">
        <section className="card miscrit-block">
          <h2>{t('m.stats')}</h2>
          <StatBars stats={m.stats} />
          {m.perfectStat && <div className="small">{t('m.perfect')}: <b>{m.perfectStat}</b></div>}
          {m.attackType && <div className="small">{t('m.attackType')}: <b>{m.attackType}</b></div>}
          {m.shopInfo && <div className="small">{t('m.shop')}: {m.shopInfo.cost} {m.shopInfo.currency}</div>}
        </section>

        <section className="card miscrit-block">
          <h2>{t('m.where')}</h2>
          {m.spawns.length === 0 && <div className="muted">{t('m.noSpawn')}</div>}
          {m.spawns.map(s => (
            <div key={`${s.region}-${s.zone}`} className="spawn">
              <Link to={`/map/${encodeURIComponent(s.region)}`}><b>{regionLabel(t, s.region)}</b></Link>
              <span className="muted"> · {regionByName.get(s.region)?.zones[s.zone] ?? s.zone}</span>
              <div className="spawn-days">
                {WEEK_ORDER.map(d => <span key={d} className={`spawn-day${s.days === 'all' || s.days.includes(d) ? ' on' : ''}`}>{dayShort(t, d)}</span>)}
              </div>
            </div>
          ))}
          {next && <div className="small">{t('m.nextAvail', { day: dayShort(t, next.day), when: next.inDays === 0 ? t('day.today') : t('day.inDays', { n: next.inDays }) })}</div>}
          {firstMarker && markerRegion?.map ? (
            <>
              <div className="miscrit-minimap"><RegionMap region={markerRegion} markers={[firstMarker]} focusId={firstMarker.id} compact height={220} /></div>
              <Link className="btn" to={`/map/${encodeURIComponent(firstMarker.region)}?focus=${firstMarker.id}`}>{t('m.openMap')} →</Link>
            </>
          ) : m.spawns.length > 0 && <div className="small muted">{t('m.noMarker')}</div>}
        </section>

        {m.relicSet && (
          <section className="card miscrit-block">
            <h2>{t('m.relics')} <span className="muted small">{m.relicSet.name}</span></h2>
            <div className="relics">
              {m.relicSet.relicIds.map(rid => relics.get(rid)).filter(Boolean).map(r => (
                <div key={r!.id} className="relic" title={r!.desc}>
                  <img src={r!.imageUrl} alt="" width={40} height={40} />
                  <div><div className="small muted">{t('m.lvl', { n: r!.level })}</div><b className="small">{r!.name}</b>
                    <div className="small muted">{Object.entries(r!.effect).filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k.toUpperCase()} ${(v as number) > 0 ? '+' : ''}${v}`).join(' · ')}</div>
                    {r!.special && <div className="small" style={{ color: 'var(--accent)' }}>{r!.special}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="card miscrit-block">
        <h2>{t('m.abilities')}</h2>
        <div className="abilities">
          {m.abilities.map((a, i) => (
            <div key={a.id} className="ability">
              <div className="ability-head">
                <span className="muted small">{i + 1}</span><b>{a.name}</b>
                <span className="chip small">{a.element}</span><span className="chip small">{a.type}</span>
                {a.ap !== undefined && <span className="small">AP {a.ap}</span>}
                {a.accuracy !== undefined && <span className="small muted">{a.accuracy}%</span>}
              </div>
              <div className="small muted">{a.desc}</div>
              {a.enchantDesc && <div className="small">{t('m.enchant')}: {a.enchantDesc}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
