import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { ImageOverlay, MapContainer, Marker as LMarker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { Marker, Region } from '../data/types'
import { avatarUrl, mapImageUrl } from '../data/images'
import { useData } from '../data/DataProvider'
import { dayShort, useT } from '../i18n'
import { spawnDays } from '../domain/schedule'
import { toLatLng } from '../domain/mapCoords'
import { RarityBadge } from './RarityBadge'
import './RegionMap.css'

function icon(mk: Marker, rarity: string, focused: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="map-pin rarity-${rarity}${focused ? ' map-pin-focus' : ''}"><img src="${avatarUrl(mk.name)}" alt="" onerror="this.style.visibility='hidden'"/></div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18],
  })
}

function FitOnChange({ bounds, focus, zoom }: { bounds: L.LatLngBoundsExpression; focus?: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.setView(focus, zoom)
    else map.fitBounds(bounds)
  }, [map, bounds, focus, zoom])
  return null
}

export function RegionMap({ region, markers, focusId, compact, height = '100%' }:
  { region: Region; markers: Marker[]; focusId?: string; compact?: boolean; height?: number | string }) {
  const t = useT()
  const { byId } = useData()
  const map = region.map!
  const bounds = useMemo<L.LatLngBoundsExpression>(() => [[0, 0], [map.height, map.width]], [map])
  const focusMk = markers.find(m => m.id === focusId)
  const focus = useMemo(() => (focusMk ? toLatLng(focusMk.x, focusMk.y, map) : undefined), [focusMk, map])

  return (
    <MapContainer key={region.name} crs={L.CRS.Simple} bounds={bounds} maxBounds={bounds} maxBoundsViscosity={0.8}
      minZoom={-4} maxZoom={2} zoomSnap={0.25} style={{ height }} className="region-map"
      scrollWheelZoom={!compact} dragging={!compact} zoomControl={!compact} attributionControl={false}>
      <ImageOverlay url={mapImageUrl(map.file)} bounds={bounds} />
      <FitOnChange bounds={bounds} focus={focus} zoom={compact ? -1 : 0} />
      {markers.map(mk => {
        const m = mk.miscritId !== null ? byId.get(mk.miscritId) : undefined
        const days = m ? spawnDays(m.spawns.filter(s => s.region === mk.region)) : null
        return (
          <LMarker key={mk.id} position={toLatLng(mk.x, mk.y, map)} icon={icon(mk, m?.rarity ?? mk.rarity, mk.id === focusId)}>
            {!compact && (
              <Popup>
                <div className="map-popup">
                  <b>{m?.names[0] ?? mk.name}</b> <RarityBadge rarity={m?.rarity ?? mk.rarity} />
                  {days && <div className="small">{days === 'all' ? t('today.everyDay') : days.map(d => dayShort(t, d)).join(', ')}</div>}
                  {mk.exactImg && <img src={mk.exactImg} alt="" className="map-popup-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                  {m ? <Link to={`/m/${m.id}`}>{t('map.details')} →</Link> : <div className="small muted">{t('map.unknown')}</div>}
                </div>
              </Popup>
            )}
          </LMarker>
        )
      })}
    </MapContainer>
  )
}
