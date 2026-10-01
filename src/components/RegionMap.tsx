import L from 'leaflet'
import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Circle, ImageOverlay, MapContainer, Marker as LMarker, Polygon, Popup, Tooltip, useMap } from 'react-leaflet'
import type { MapInfo, Marker, Region } from '../data/types'
import { avatarUrl, mapImageUrl } from '../data/images'
import { escapeHtml, safeClass } from '../data/escape'
import { useData } from '../data/DataProvider'
import { useT, zoneLabel } from '../i18n'
import { toLatLng } from '../domain/mapCoords'
import { markerZone, type ZoneShape } from '../domain/zones'
import { MarkerPopupCard } from './MarkerPopupCard'
import './RegionMap.css'

// the icon never depends on hover/focus state: swapping icons rebuilds the pin's DOM, which restarts
// its CSS transitions (the map "jitters") and can swallow a click mid-press; state classes are toggled in place
const iconCache = new Map<string, L.DivIcon>()
function icon(mk: Marker, rarity: string) {
  const key = `${mk.id}|${rarity}`
  let ic = iconCache.get(key)
  if (!ic) {
    ic = L.divIcon({
      className: '',
      html: `<div class="map-pin rarity-${safeClass(rarity)}" title="${escapeHtml(mk.name)}"><img src="${escapeHtml(avatarUrl(mk.name))}" alt="${escapeHtml(mk.name)}" onerror="this.style.visibility='hidden'"/></div>`,
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

/**
 * Replaces Leaflet's popup autoPan, which fights maxBounds: autoPan pans past the edge, maxBounds snaps back,
 * the popup asks again — the map bounces. We pan only as far as the bounds allow, and open the popup
 * below the pin when there is still no room above it.
 */
function PopupFit({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const lmap = useMap()
  useEffect(() => {
    const PAD = 12
    let raf = 0
    // react-leaflet renders the popup's content after 'popupopen': measure once it is laid out
    const onOpen = (e: L.PopupEvent) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => fit(e.popup)) }) }
    const fit = (popup: L.Popup) => {
      if (!lmap.hasLayer(popup)) return
      const el = popup.getElement()
      if (!el) return
      el.classList.remove('mc-popup-below')
      const box = lmap.getContainer().getBoundingClientRect(), r = el.getBoundingClientRect()
      const want = L.point(
        r.left - PAD < box.left ? r.left - PAD - box.left : r.right + PAD > box.right ? r.right + PAD - box.right : 0,
        r.top - PAD < box.top ? r.top - PAD - box.top : 0)
      const b = L.latLngBounds(bounds as L.LatLngBoundsLiteral), z = lmap.getZoom()
      const view = lmap.getPixelBounds(), max = L.bounds(lmap.project(b.getNorthWest(), z), lmap.project(b.getSouthEast(), z))
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, Math.min(0, lo)), Math.max(0, hi))
      const pan = L.point(clamp(want.x, max.min!.x - view.min!.x, max.max!.x - view.max!.x), clamp(want.y, max.min!.y - view.min!.y, max.max!.y - view.max!.y))
      if (pan.x || pan.y) lmap.panBy(pan, { animate: true, duration: 0.3 })
      if (want.y < pan.y - 1) el.classList.add('mc-popup-below') // still clipped at the top: flip under the pin
    }
    lmap.on('popupopen', onOpen)
    return () => { cancelAnimationFrame(raf); lmap.off('popupopen', onOpen) }
  }, [lmap, bounds])
  return null
}

const PIN_STATES = ['map-pin-dim', 'map-pin-pulse', 'map-pin-focus']
function applyPinState(m: L.Marker | undefined, state: string[]) {
  const pin = m?.getElement()?.querySelector('.map-pin')
  if (pin) for (const c of PIN_STATES) pin.classList.toggle(c, state.includes(c))
}

/** Hover reports with a short grace period, so zone -> pin -> zone moves don't flash "no zone" in between. */
function useZoneHover(onHover?: (z: string | null) => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return useCallback((z: string | null) => {
    clearTimeout(timer.current)
    if (z) onHover?.(z)
    else timer.current = setTimeout(() => onHover?.(null), 60)
  }, [onHover])
}

function ZoneLayer({ shapes, map, hovered, onHover }: { shapes: ZoneShape[]; map: MapInfo; hovered?: string | null; onHover?: (z: string | null) => void }) {
  const t = useT()
  return <>
    {shapes.map(s => {
      const on = hovered === s.zone
      const style = { color: s.color, weight: on ? 3 : 2, opacity: hovered && !on ? 0.35 : 0.9, dashArray: on ? undefined : '6 6', fillColor: s.color, fillOpacity: on ? 0.34 : hovered ? 0.06 : 0.18 }
      const handlers = { mouseover: () => onHover?.(s.zone), mouseout: () => onHover?.(null) }
      const label = <Tooltip permanent direction="center" className={`zone-label${on ? ' on' : ''}`} opacity={1}><span style={{ borderColor: s.color }}>{zoneLabel(t, s.name)}</span></Tooltip>
      return s.hull.length >= 3
        ? <Polygon key={s.zone} positions={s.hull.map(([x, y]) => toLatLng(x, y, map))} pathOptions={style} eventHandlers={handlers}>{label}</Polygon>
        : <Circle key={s.zone} center={toLatLng(s.center[0], s.center[1], map)} radius={s.radiusPx} pathOptions={style} eventHandlers={handlers}>{label}</Circle>
    })}
  </>
}

interface Props {
  region: Region; markers: Marker[]; compact?: boolean; height?: number | string
  shapes?: ZoneShape[]; hoveredZone?: string | null; onZoneHover?: (z: string | null) => void
  pulseMiscrit?: number | null; flyTo?: { id: string; nonce: number } | null; day?: number
}

export function RegionMap({ region, markers, compact, height = '100%', shapes = [], hoveredZone, onZoneHover, pulseMiscrit, flyTo, day }: Props) {
  const t = useT()
  const { byId } = useData()
  const map = region.map!
  const bounds = useMemo<L.LatLngBoundsExpression>(() => [[0, 0], [map.height, map.width]], [map])
  const refs = useRef(new Map<string, L.Marker>())
  const hoverZone = useZoneHover(onZoneHover)
  const stateOf = (mk: Marker) => [
    hoveredZone && markerZone(mk, byId) !== hoveredZone ? 'map-pin-dim' : '',
    pulseMiscrit != null && mk.miscritId === pulseMiscrit ? 'map-pin-pulse' : '',
    compact || flyTo?.id === mk.id ? 'map-pin-focus' : '',
  ].filter(Boolean)
  useEffect(() => { for (const mk of markers) applyPinState(refs.current.get(mk.id), stateOf(mk)) })

  return (
    <MapContainer key={region.name} crs={L.CRS.Simple} bounds={bounds} maxBounds={bounds} maxBoundsViscosity={0.8}
      minZoom={-4} maxZoom={2} zoomSnap={0.25} style={{ height }} className={`region-map${compact ? ' compact' : ''}`}
      scrollWheelZoom={!compact} dragging={!compact} zoomControl={!compact} doubleClickZoom={!compact} touchZoom={!compact}
      boxZoom={!compact} keyboard={!compact} attributionControl={false}>
      <ImageOverlay url={mapImageUrl(map.file)} bounds={bounds} />
      {!compact && <PopupFit bounds={bounds} />}
      {!compact && <ZoneLayer shapes={shapes} map={map} hovered={hoveredZone} onHover={hoverZone} />}
      {!compact && !flyTo && <PhoneCover map={map} markers={markers} />}
      <FlyTo target={flyTo} map={map} zoom={compact ? -1 : 0} markers={markers} refs={refs} compact={compact} />
      {markers.map(mk => {
        const m = mk.miscritId !== null ? byId.get(mk.miscritId) : undefined
        const zone = markerZone(mk, byId)
        return (
          <LMarker key={mk.id} position={toLatLng(mk.x, mk.y, map)} icon={icon(mk, m?.rarity ?? mk.rarity)}
            eventHandlers={compact ? undefined : {
              mouseover: () => hoverZone(zone ?? null), mouseout: () => hoverZone(null), // a pin counts as part of its zone
              add: e => applyPinState(e.target as L.Marker, stateOf(mk)),
            }}
            ref={r => { if (r) refs.current.set(mk.id, r); else refs.current.delete(mk.id) }}>
            {!compact && <Popup className="mc-popup" minWidth={240} autoPan={false}><MarkerPopupCard marker={mk} miscrit={m} zoneName={zone ? zoneLabel(t, region.zones[zone] ?? `Zone ${zone}`) : undefined} day={day} /></Popup>}
          </LMarker>
        )
      })}
    </MapContainer>
  )
}
