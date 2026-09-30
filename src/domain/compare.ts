export function parseIds(s: string | null, known: Set<number>, max = 4): number[] {
  const out: number[] = []
  for (const part of (s ?? '').split(',')) {
    if (out.length === max) break
    const id = Number(part)
    if (/^\d+$/.test(part) && known.has(id) && !out.includes(id)) out.push(id)
  }
  return out
}
