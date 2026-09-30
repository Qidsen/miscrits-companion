import type { Miscrit, Relic, StatKey } from '../data/types'
import { FORMULA } from './formulaConfig'

export type Stats = Record<StatKey, number>
export const STAT_KEYS: StatKey[] = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']

export function statsAt(m: Pick<Miscrit, 'stats'>, level: number): Stats {
  const lv = Math.min(Math.max(1, Math.round(level)), FORMULA.maxLevel) - 1
  const out = {} as Stats
  for (const k of STAT_KEYS) {
    const gain = FORMULA.perLevel[m.stats[k]] ?? 1
    out[k] = Math.round(FORMULA.base[k] + gain * lv * (k === 'hp' ? FORMULA.hpPerLevelFactor : 1))
  }
  return out
}

export function withRelics(s: Stats, relics: Pick<Relic, 'effect'>[]): Stats {
  const out = { ...s }
  for (const r of relics) for (const k of STAT_KEYS) { const v = r.effect[k]; if (typeof v === 'number') out[k] += v }
  return out
}

export function withBuffs(s: Stats, buffs: Partial<Stats>): Stats {
  const out = { ...s }
  for (const k of STAT_KEYS) out[k] = Math.max(1, out[k] + (buffs[k] ?? 0))
  return out
}
