import type { Miscrit } from '../data/types'

function rank(name: string, q: string): number {
  const n = name.toLowerCase()
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.split(/\s+/).some(w => w.startsWith(q))) return 2
  if (n.includes(q)) return 3
  return -1
}

export function searchMiscrits(list: Miscrit[], query: string, limit = 8): { m: Miscrit; matched: string }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: { m: Miscrit; matched: string; r: number }[] = []
  for (const m of list) {
    let best: { matched: string; r: number } | null = null
    for (const n of m.names) {
      const r = rank(n, q)
      if (r >= 0 && (!best || r < best.r)) best = { matched: n, r }
    }
    if (best) hits.push({ m, ...best })
  }
  return hits.sort((a, b) => a.r - b.r || a.m.id - b.m.id).slice(0, limit).map(({ m, matched }) => ({ m, matched }))
}
