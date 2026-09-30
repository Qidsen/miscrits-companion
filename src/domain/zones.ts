import type { Marker, Miscrit, Region } from '../data/types'

export const ZONE_COLORS = ['#4fc3f7', '#ffb547', '#b36bff', '#5ad17a', '#ff6b9a', '#ffd84a', '#4dd0c8', '#ff8a3d']

type Pt = [number, number]
export interface ZoneShape {
  zone: string; name: string; color: string
  /** percent coordinates of the map image (x from left, y from top) */
  center: Pt; hull: Pt[]; radius: number; markerIds: string[]
}

const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

/** Andrew's monotone chain; returns CCW hull without collinear points. */
export function convexHull(points: Pt[]): Pt[] {
  const pts = [...new Map(points.map(p => [`${p[0]},${p[1]}`, p])).values()].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

export function padHull(hull: Pt[], center: Pt, pad: number): Pt[] {
  return hull.map(([x, y]) => {
    const dx = x - center[0], dy = y - center[1]
    const d = Math.hypot(dx, dy) || 1
    return [x + (dx / d) * pad, y + (dy / d) * pad]
  })
}

export const zoneColor = (region: Region, zone: string) => {
  const order = Object.keys(region.zones).sort((a, b) => Number(a) - Number(b))
  const i = Math.max(0, order.indexOf(zone))
  return ZONE_COLORS[i % ZONE_COLORS.length]
}

/** Zone of a marker = the only zone its miscrit spawns in within that region. */
export function markerZone(mk: Marker, byId: Map<number, Miscrit>): string | null {
  const m = mk.miscritId !== null ? byId.get(mk.miscritId) : undefined
  if (!m) return null
  const zones = new Set(m.spawns.filter(s => s.region === mk.region).map(s => s.zone))
  return zones.size === 1 ? [...zones][0] : null
}

export function zoneShapes(region: Region, markers: Marker[], byId: Map<number, Miscrit>, pad = 3): ZoneShape[] {
  const groups = new Map<string, Marker[]>()
  for (const mk of markers) {
    const z = markerZone(mk, byId)
    if (z === null) continue
    groups.set(z, [...(groups.get(z) ?? []), mk])
  }
  return [...groups.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([zone, list]) => {
    const pts = list.map(mk => [mk.x, mk.y] as Pt)
    const center: Pt = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
    const far = Math.max(0, ...pts.map(p => Math.hypot(p[0] - center[0], p[1] - center[1])))
    const raw = convexHull(pts)
    const isPolygon = raw.length >= 3
    return {
      zone, name: region.zones[zone] ?? `Zone ${zone}`, color: zoneColor(region, zone), center,
      hull: isPolygon ? padHull(raw, center, pad) : [],
      radius: far + pad * (pts.length === 1 ? 1.5 : 1),
      markerIds: list.map(mk => mk.id),
    }
  })
}
