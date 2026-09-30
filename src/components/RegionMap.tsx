import L from 'leaflet'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Circle, ImageOverlay, MapContainer, Marker as LMarker, Polygon, Popup, Tooltip, useMap } from 'react-leaflet'
import type { MapInfo, Marker, Region } from '../data/types'
import { avatarUrl, mapImageUrl } from '../data/images'
import { escapeHtml, safeClass } from '../data/escape'
import { useData } from '../data/DataProvider'
import { toLatLng } from '../domain/mapCoords'
import { markerZone, type ZoneShape } from '../domain/zones'
import { MarkerPopupCard } from './MarkerPopupCard'
import './RegionMap.css'

const iconCache = new Map<string, L.DivIcon>()
function icon(mk: Marker, rarity: string, state: string) {
  const key = `${mk.id}|${rarity}|${state}`
  let ic = iconCache.get(key)
  if (!ic) {
    ic = L.divIcon({
      className: '',
      html: `<div class="map-pin rarity-${safeClass(rarity)} ${state}" title="${escapeHtml(mk.name)}"><img src="${escapeHtml(avatarUrl(mk.name))}" alt="${escapeHtml(mk.name)}" onerror="this.style.visibility='hidden'"/></div>`,
      iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20],
    })
    iconCache.set(key, ic)
  }
  return ic
}

/** Pans to the requested marker and opens its popup; does nothing when that marker is filtered out. */
function FlyTo({ target, map, zoom, markers, refs, compact }: {
  target?: { id: string; nonce: number } | null; map: MapInfo; zoom: number; markers: Marker[]
  refs: RefObject<Map<string, L.Marker>>; compact?: boolean
}) {
  const lmap = useMap()
  useEffect(() => {
    if (!target) return
    const mk = markers.find(m => m.id === target.id)
    if (!mk) return
    const ll = toLatLng(mk.x, mk.y, map)
    if (compact) { lmap.setView(ll, zoom); return }
    lmap.flyTo(ll, Math.max(lmap.getZoom(), zoom), { duration: 0.6 })
    const t = setTimeout(() => refs.current?.get(mk.id)?.openPopup(), 650)
    return () => clearTimeout(t)
  }, [target?.id, target?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Phones: start zoomed so the map fills the container height ("cover"), centred on the markers. */
function PhoneCover({ map, markers }: { map: MapInfo; markers: Marker[] }) {
  const lmap = useMap()
  useEffect(() => {
    const size = lmap.getSize()
    if (size.x >= 700 || !markers.length) return
    const contain = Math.log2(Math.min(size.x / map.width, size.y / map.height))
    const cover = Math.log2(Math.max(size.x / map.width, size.y / map.height))
    const zoom = Math.min(cover, contain + 1.25) // big enough to read, never so big that the region is lost
    const cx = markers.reduce((s, m) => s + m.x, 0) / markers.length
    const cy = markers.reduce((s, m) => s + m.y, 0) / markers.length
    lmap.setView(toLatLng(cx, cy, map), zoom, { animate: false })
  }, [lmap, map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ZoneLayer({ shapes, map, hovered, onHover }: { shapes: ZoneShape[]; map: MapInfo; hovered?: string | null; onHover?: (z: string | null) => void }) {
  return <>
    {shapes.map(s => {
      const on = hovered === s.zone
      const style = { color: s.color, weight: on ? 3 : 2, opacity: hovered && !on ? 0.35 : 0.9, dashArray: on ? undefined : '6 6', fillColor: s.color, fillOpacity: on ? 0.34 : hovered ? 0.06 : 0.18 }
      const handlers = { mouseover: () => onHover?.(s.zone), mouseout: () => onHover?.(null) }
      const label = <Tooltip permanent direction="center" className={`zone-label${on ? ' on' : ''}`} opacity={1}><span style={{ borderColor: s.color }}>{s.name}</span></Tooltip>
      return s.hull.length >= 3
        ? <Polygon key={s.zone} positions={s.hull.map(([x, y]) => toLatLng(x, y, map))} pathOptions={style} eventHandlers={handlers}>{label}</Polygon>
        : <Circle key={s.zone} center={toLatLng(s.center[0], s.center[1], map)} radius={(s.radius / 100) * map.width} pathOptions={style} eventHandlers={handlers}>{label}</Circle>
    })}
  </>
}

interface Props {
  region: Region; markers: Marker[]; compact?: boolean; height?: number | string
  shapes?: ZoneShape[]; hoveredZone?: string | null; onZoneHover?: (z: string | null) => void
  pulseMiscrit?: number | null; flyTo?: { id: string; nonce: number } | null; day?: number
}

export function RegionMap({ region, markers, compact, height = '100%', shapes = [], hoveredZone, onZoneHover, pulseMiscrit, flyTo, day }: Props) {
  const { byId } = useData()
  const map = region.map!
  const bounds = useMemo<L.LatLngBoundsExpression>(() => [[0, 0], [map.height, map.width]], [map])
  const refs = useRef(new Map<string, L.Marker>())

  return (
    <MapContainer key={region.name} crs={L.CRS.Simple} bounds={bounds} maxBounds={bounds} maxBoundsViscosity={0.8}
      minZoom={-4} maxZoom={2} zoomSnap={0.25} style={{ height }} className={`region-map${compact ? ' compact' : ''}`}
      scrollWheelZoom={!compact} dragging={!compact} zoomControl={!compact} doubleClickZoom={!compact} touchZoom={!compact}
      boxZoom={!compact} keyboard={!compact} attributionControl={false}>
      <ImageOverlay url={mapImageUrl(map.file)} bounds={bounds} />
      {!compact && <ZoneLayer shapes={shapes} map={map} hovered={hoveredZone} onHover={onZoneHover} />}
      {!compact && !flyTo && <PhoneCover map={map} markers={markers} />}
      <FlyTo target={flyTo} map={map} zoom={compact ? -1 : 0} markers={markers} refs={refs} compact={compact} />
      {markers.map(mk => {
        const m = mk.miscritId !== null ? byId.get(mk.miscritId) : undefined
        const zone = markerZone(mk, byId)
        const state = [
          hoveredZone && zone !== hoveredZone ? 'map-pin-dim' : '',
          pulseMiscrit != null && mk.miscritId === pulseMiscrit ? 'map-pin-pulse' : '',
          compact || flyTo?.id === mk.id ? 'map-pin-focus' : '',
        ].filter(Boolean).join(' ')
        return (
          <LMarker key={mk.id} position={toLatLng(mk.x, mk.y, map)} icon={icon(mk, m?.rarity ?? mk.rarity, state)}
            ref={r => { if (r) refs.current.set(mk.id, r); else refs.current.delete(mk.id) }}>
            {!compact && <Popup className="mc-popup" minWidth={240}><MarkerPopupCard marker={mk} miscrit={m} zoneName={zone ? region.zones[zone] : undefined} day={day} /></Popup>}
          </LMarker>
        )
      })}
    </MapContainer>
  )
}
