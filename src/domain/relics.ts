import type { Miscrit, Relic } from '../data/types'

export function relicUsage(miscrits: Miscrit[]): Map<number, number[]> {
  const out = new Map<number, number[]>()
  for (const m of miscrits) for (const id of m.relicSet?.relicIds ?? []) out.set(id, [...(out.get(id) ?? []), m.id])
  return out
}

export interface RelicFilter { levels: number[]; stat: string | null; q: string }

export function filterRelics(relics: Relic[], f: RelicFilter): Relic[] {
  const q = f.q.trim().toLowerCase()
  return relics.filter(r =>
    (!f.levels.length || f.levels.includes(r.level))
    && (!f.stat || (typeof r.effect[f.stat] === 'number' && (r.effect[f.stat] as number) > 0))
    && (!q || r.name.toLowerCase().includes(q)),
  ).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
}
