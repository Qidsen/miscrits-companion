import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Miscrit } from '../data/types'
import { useData } from '../data/DataProvider'
import { elementIconUrl } from '../data/images'
import { elementLabel, regionLabel, useT, type I18nKey } from '../i18n'
import { useGameDay } from '../hooks/useGameDay'
import { markerVisible } from '../domain/mapCoords'
import { BASE_ELEMENTS, RARITY_ORDER, splitElement } from '../domain/miscrit'
import { zoneGroups } from '../domain/today'
import { zoneShapes } from '../domain/zones'
import { useCollection } from '../store/collection'
import { DayPicker } from '../components/DayPicker'
import { RegionMap } from '../components/RegionMap'
import { RegionStrip } from '../components/RegionStrip'
import { ZonePanel } from '../components/ZonePanel'
import './MapPage.css'

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

export function MapPage() {
  const t = useT()
  const nav = useNavigate()
  const { regions, regionByName, markers, byId, miscrits, markersByMiscrit } = useData()
  const { region: param } = useParams()
  const [search] = useSearchParams()
  const focus = search.get('focus')
  const { day: today } = useGameDay()
  // undefined = follow the live game day; null = any day
  // a focus link targets one marker: show any day so it is never filtered out
  const [picked, setDay] = useState<number | null | undefined>(focus ? null : undefined)
  const day = picked === undefined ? today : picked
  useEffect(() => { setDay(p => (p === today ? undefined : p)) }, [today]) // the picked day became today at reset
  const [rarities, setRarities] = useState<string[]>([])
  const [elements, setElements] = useState<string[]>([])
  const [hideCaught, setHideCaught] = useState(false)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [hoveredMiscrit, setHoveredMiscrit] = useState<number | null>(null)
  const [flyTo, setFlyTo] = useState<{ id: string; nonce: number } | null>(focus ? { id: focus, nonce: 0 } : null)
  const caught = useCollection(s => s.caught)

  const regionName = param ? decodeURIComponent(param) : regions.find(r => r.map)?.name
  const region = regionName ? regionByName.get(regionName) : undefined

  const passes = useMemo(() => {
    const c = new Set(caught)
    return (m: Miscrit) => (!rarities.length || rarities.includes(m.rarity))
      && (!elements.length || splitElement(m.element).some(e => elements.includes(e)))
      && (!hideCaught || !c.has(m.id))
  }, [rarities, elements, hideCaught, caught])
  const filtered = useMemo(() => miscrits.filter(passes), [miscrits, passes])

  const regionMarkers = useMemo(() => markers[regionName ?? ''] ?? [], [markers, regionName])
  const visible = useMemo(() => {
    const opts = { day, rarities, elements, hideCaught, caught: new Set(caught) }
    return regionMarkers.filter(mk => markerVisible(mk, mk.miscritId !== null ? byId.get(mk.miscritId) : undefined, opts))
  }, [regionMarkers, day, rarities, elements, hideCaught, caught, byId])
  const shapes = useMemo(() => (region ? zoneShapes(region, regionMarkers, byId) : []), [region, regionMarkers, byId])
  const groups = useMemo(() => (regionName ? zoneGroups(filtered, regionName, day) : []), [filtered, regionName, day])
  const counts = useMemo(() => Object.fromEntries(regions.map(r =>
    [r.name, new Set(zoneGroups(filtered, r.name, day).flatMap(g => g.miscrits.map(m => m.id))).size])), [regions, filtered, day])

  if (!region && param) return <Navigate to="/map" replace />
  if (!region) return <div className="container card map-empty">{t('map.noMap')}</div>

  /** Fly to the miscrit's marker in this region; otherwise open its page. */
  const pick = (m: Miscrit) => {
    const mk = (markersByMiscrit.get(m.id) ?? []).find(x => x.region === region.name && visible.includes(x))
    if (mk) setFlyTo({ id: mk.id, nonce: Date.now() })
    else nav(`/m/${m.id}`)
    return true
  }

  return (
    <div className="map-page fade-in">
      <RegionStrip regions={regions} active={region.name} counts={counts} />
      <div className="map-layout">
        <aside className="card map-panel">
          <div className="map-panel-head">
            <h1>{regionLabel(t, region.name)}</h1>
            <span className="count">{t('map.onMap', { n: visible.length })}</span>
          </div>
          <div className="map-filters">
            <DayPicker value={day} today={today} onChange={d => setDay(d === today ? undefined : d)} anyLabel={t('map.anyDay')} />
            <div className="row" style={{ gap: 6 }}>
              {BASE_ELEMENTS.map(el => (
                <button key={el} className="chip chip-icon" aria-pressed={elements.includes(el)} title={elementLabel(t, el)} aria-label={elementLabel(t, el)} onClick={() => setElements(es => toggle(es, el))}>
                  <img src={elementIconUrl(el)} alt="" width={18} height={18} />
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 6 }}>
              {RARITY_ORDER.map(r => (
                <button key={r} className={`chip rarity-${r}`} style={{ color: 'var(--r)' }} aria-pressed={rarities.includes(r)} onClick={() => setRarities(rs => toggle(rs, r))}>
                  {t(`rarity.${r}` as I18nKey)}
                </button>
              ))}
              <label className="chip"><input type="checkbox" checked={hideCaught} onChange={e => setHideCaught(e.target.checked)} /> {t('map.hideCaught')}</label>
            </div>
          </div>
          <ZonePanel region={region} groups={groups} day={day ?? undefined} hoveredZone={hoveredZone} hoveredMiscrit={hoveredMiscrit}
            onHoverZone={setHoveredZone} onHoverMiscrit={setHoveredMiscrit} onPick={pick} />
        </aside>
        <section className="map-stage card" data-testid="map-canvas">
          {region.map
            ? <RegionMap region={region} markers={visible} shapes={shapes} hoveredZone={hoveredZone} onZoneHover={setHoveredZone}
                pulseMiscrit={hoveredMiscrit} flyTo={flyTo} day={day ?? undefined} />
            : <div className="map-empty">{t('map.noMap')}</div>}
        </section>
      </div>
    </div>
  )
}
