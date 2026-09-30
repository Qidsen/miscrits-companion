import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ChangeEntry, Marker, Meta, Miscrit, Region, Relic } from './types'
import { dataUrl } from './images'
import { sortRegions } from '../domain/miscrit'

export interface AppData {
  miscrits: Miscrit[]; byId: Map<number, Miscrit>; relics: Map<number, Relic>
  regions: Region[]; regionByName: Map<string, Region>
  markers: Record<string, Marker[]>; markersByMiscrit: Map<number, Marker[]>; meta: Meta
  changelog: ChangeEntry[]
}

const Ctx = createContext<AppData | null>(null)

async function get<T>(file: string): Promise<T> {
  const r = await fetch(dataUrl(file))
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`)
  return r.json()
}

export async function loadData(): Promise<AppData> {
  const [miscrits, relics, regions, markers, meta, changelog] = await Promise.all([
    get<Miscrit[]>('miscrits.json'), get<Relic[]>('relics.json'), get<Region[]>('regions.json'),
    get<Record<string, Marker[]>>('markers.json'), get<Meta>('meta.json'),
    // optional: older deployments have no changelog yet
    get<ChangeEntry[]>('changelog.json').catch(() => [] as ChangeEntry[]),
  ])
  const order = sortRegions(regions.map(r => r.name))
  const sorted = order.map(n => regions.find(r => r.name === n)!)
  const markersByMiscrit = new Map<number, Marker[]>()
  for (const list of Object.values(markers)) for (const mk of list) {
    if (mk.miscritId === null) continue
    markersByMiscrit.set(mk.miscritId, [...(markersByMiscrit.get(mk.miscritId) ?? []), mk])
  }
  return {
    miscrits, byId: new Map(miscrits.map(m => [m.id, m])), relics: new Map(relics.map(r => [r.id, r])),
    regions: sorted, regionByName: new Map(sorted.map(r => [r.name, r])), markers, markersByMiscrit, meta,
    changelog: Array.isArray(changelog) ? changelog : [],
  }
}

export function DataProvider({ children, fallback, error }: { children: ReactNode; fallback: ReactNode; error: (e: Error) => ReactNode }) {
  const [state, setState] = useState<{ data?: AppData; err?: Error }>({})
  useEffect(() => { loadData().then(data => setState({ data }), err => setState({ err })) }, [])
  if (state.err) return <>{error(state.err)}</>
  if (!state.data) return <>{fallback}</>
  return <Ctx.Provider value={state.data}>{children}</Ctx.Provider>
}

export function useData(): AppData {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData outside DataProvider')
  return v
}
