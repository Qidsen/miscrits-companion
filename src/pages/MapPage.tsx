import { useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { regionLabel, useT, type I18nKey } from '../i18n'
import { useGameDay } from '../hooks/useGameDay'
import { markerVisible } from '../domain/mapCoords'
import { BASE_ELEMENTS, RARITY_ORDER } from '../domain/miscrit'
import { elementIconUrl } from '../data/images'
import { groupAvailable } from '../domain/today'
import { useCollection } from '../store/collection'
import { DayPicker } from '../components/DayPicker'
import { RegionMap } from '../components/RegionMap'
import { MiscritAvatar } from '../components/MiscritAvatar'
import './MapPage.css'

export function MapPage() {
  const t = useT()
  const { regions, regionByName, markers, byId, miscrits } = useData()
  const { region: param } = useParams()
  const [search] = useSearchParams()
  const { day: today } = useGameDay()
  // undefined = follow the live game day; null = any day
  const [picked, setDay] = useState<number | null | undefined>(undefined)
  const day = picked === undefined ? today : picked
  const [rarities, setRarities] = useState<string[]>([])
  const [elements, setElements] = useState<string[]>([])
  const [hideCaught, setHideCaught] = useState(false)
  const caught = useCollection(s => s.caught)

  const regionName = param ? decodeURIComponent(param) : regions.find(r => r.map)?.name
  const region = regionName ? regionByName.get(regionName) : undefined
  const visible = useMemo(() => {
    const opts = { day, rarities, elements, hideCaught, caught: new Set(caught) }
    return (markers[regionName ?? ''] ?? []).filter(mk => markerVisible(mk, mk.miscritId !== null ? byId.get(mk.miscritId) : undefined, opts))
  }, [markers, regionName, day, rarities, elements, hideCaught, caught, byId])
  const zones = useMemo(() => (day === null ? [] : groupAvailable(miscrits, day).find(g => g.region === regionName)?.zones ?? []), [miscrits, day, regionName])

  if (!region && param) return <Navigate to="/map" replace />
  if (!region) return <div className="container card map-empty">{t('map.noMap')}</div>

  return (
    <div className="map-page">
      <aside className="map-side">
        <h3>{t('map.regions')}</h3>
        <nav className="map-regions">
          {regions.map(r => (
            <Link key={r.name} to={`/map/${encodeURIComponent(r.name)}`} className={r.name === region.name ? 'active' : ''}>
              {regionLabel(t, r.name)} <span className="muted small">{markers[r.name]?.length ?? 0}</span>
            </Link>
          ))}
        </nav>
        {zones.length > 0 && <>
          <h3>{t('map.zones')}</h3>
          {zones.map(z => (
            <div key={z.zone} className="map-zone">
              <div className="small muted">{region.zones[z.zone] ?? z.zone}</div>
              <div className="map-zone-list">{z.miscrits.map(m => <Link key={m.id} to={`/m/${m.id}`} title={m.names[0]} className={`rarity-${m.rarity}`}><MiscritAvatar name={m.names[0]} size={32} /></Link>)}</div>
            </div>
          ))}
        </>}
      </aside>
      <section className="map-main">
        <div className="map-toolbar card">
          <DayPicker value={day} today={today} onChange={setDay} anyLabel={t('map.anyDay')} />
          <div className="row">
            {BASE_ELEMENTS.map(el => (
              <button key={el} className="chip" aria-pressed={elements.includes(el)} title={el}
                onClick={() => setElements(es => (es.includes(el) ? es.filter(x => x !== el) : [...es, el]))}>
                <img src={elementIconUrl(el)} alt={el} width={16} height={16} />
              </button>
            ))}
          </div>
          <div className="row">
            {RARITY_ORDER.map(r => (
              <button key={r} className={`chip rarity-${r}`} style={{ color: 'var(--r)' }} aria-pressed={rarities.includes(r)}
                onClick={() => setRarities(rs => (rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r]))}>{t(`rarity.${r}` as I18nKey)}</button>
            ))}
            <label className="chip"><input type="checkbox" checked={hideCaught} onChange={e => setHideCaught(e.target.checked)} /> {t('map.hideCaught')}</label>
            <span className="small muted">{t('map.markers', { n: visible.length })}</span>
          </div>
        </div>
        <div className="map-canvas" data-testid="map-canvas">
          {region.map ? <RegionMap region={region} markers={visible} focusId={search.get('focus') ?? undefined} /> : <div className="card map-empty">{t('map.noMap')}</div>}
        </div>
      </section>
    </div>
  )
}
