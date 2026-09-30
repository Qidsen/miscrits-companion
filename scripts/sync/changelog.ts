import type { ChangeEntry, Marker, Miscrit, Relic } from '../../src/data/types'

interface Snap { miscrits: Miscrit[]; relics: Relic[]; markers: Record<string, Marker[]> }

const spawnKey = (m: Miscrit) => JSON.stringify([...m.spawns].sort((a, b) => `${a.region}${a.zone}`.localeCompare(`${b.region}${b.zone}`)))

/** What changed between two snapshots; null when nothing did, an "initial" entry on the first run. */
export function diffSnapshots(prev: Snap | null, next: Snap, date: string): ChangeEntry | null {
  if (!prev) return { date, initial: true }
  const before = new Map(prev.miscrits.map(m => [m.id, m]))
  const after = new Map(next.miscrits.map(m => [m.id, m]))
  const added = next.miscrits.filter(m => !before.has(m.id)).map(m => m.id)
  const removed = prev.miscrits.filter(m => !after.has(m.id)).map(m => ({ id: m.id, name: m.names[0] }))
  const spawnChanged = next.miscrits.filter(m => before.has(m.id) && spawnKey(before.get(m.id)!) !== spawnKey(m)).map(m => m.id)

  const markersAdded: NonNullable<ChangeEntry['markersAdded']> = []
  for (const [region, list] of Object.entries(next.markers)) {
    const old = new Set((prev.markers[region] ?? []).map(mk => mk.id))
    const fresh = list.filter(mk => !old.has(mk.id))
    if (fresh.length) markersAdded.push({ region, count: fresh.length, miscritIds: [...new Set(fresh.map(mk => mk.miscritId).filter((x): x is number => x !== null))] })
  }

  const oldRelics = new Map(prev.relics.map(r => [r.id, JSON.stringify(r)]))
  const relicsAdded = next.relics.filter(r => !oldRelics.has(r.id)).map(r => r.id)
  const relicsChanged = next.relics.filter(r => oldRelics.has(r.id) && oldRelics.get(r.id) !== JSON.stringify(r)).map(r => r.id)

  if (!added.length && !removed.length && !spawnChanged.length && !markersAdded.length && !relicsAdded.length && !relicsChanged.length) return null
  return { date, added, removed, spawnChanged, markersAdded, relicsAdded, relicsChanged }
}

export function prependChange(log: ChangeEntry[], e: ChangeEntry | null, max = 200): ChangeEntry[] {
  return e ? [e, ...log].slice(0, max) : log
}
