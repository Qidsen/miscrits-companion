import type { MapInfo, Marker, Miscrit } from '../data/types'
import { isAvailable } from './schedule'

export function toLatLng(x: number, y: number, map: MapInfo): [number, number] {
  return [map.height * (1 - y / 100), map.width * (x / 100)]
}

export function markerVisible(mk: Marker, m: Miscrit | undefined,
  o: { day: number | null; rarities: string[]; hideCaught: boolean; caught: Set<number> }): boolean {
  if (o.rarities.length && !o.rarities.includes(m?.rarity ?? mk.rarity)) return false
  if (!m) return true
  if (o.hideCaught && o.caught.has(m.id)) return false
  if (o.day !== null) {
    const local = m.spawns.filter(s => s.region === mk.region)
    if (!isAvailable(local.length ? local : m.spawns, o.day)) return false
  }
  return true
}
