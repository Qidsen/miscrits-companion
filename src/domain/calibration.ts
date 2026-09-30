import type { Miscrit } from '../data/types'
import { isDamaging } from './damage'
import { matchup } from './elements'
import { DEFAULT_PARAMS, type FormulaParams } from './formulaConfig'
import { statsAt } from './stats'

export interface Observation {
  attackerId: number; attackerLevel: number; attackStat?: number
  abilityId: number; defenderId: number; defenderLevel: number; damage: number
}
export interface Calibration extends FormulaParams { n: number; errorBefore: number; errorAfter: number }

/** Damage at multiplier 1 and scale 1, plus how the matchup multiplies it. */
function baseOf(o: Observation, byId: Map<number, Miscrit>) {
  const a = byId.get(o.attackerId), d = byId.get(o.defenderId)
  const ability = a?.abilities.find(x => x.id === o.abilityId)
  if (!a || !d || !ability || !isDamaging(ability)) return null
  const physical = ability.element === 'Physical'
  const as = statsAt(a, o.attackerLevel), ds = statsAt(d, o.defenderLevel)
  const atk = o.attackStat && o.attackStat > 0 ? o.attackStat : physical ? as.pa : as.ea
  const def = physical ? ds.pd : ds.ed
  const mu = physical ? { strong: 0, weak: 0 } : matchup(ability.element, d.element)
  return { base: ability.ap! * (atk / Math.max(1, def)), ...mu }
}

export function predict(o: Observation, byId: Map<number, Miscrit>, p: Partial<FormulaParams> = {}): { value: number; multiplier: number } | null {
  const b = baseOf(o, byId)
  if (!b) return null
  const f = { ...DEFAULT_PARAMS, ...p }
  const multiplier = f.strong ** b.strong * f.weak ** b.weak
  return { value: b.base * multiplier * f.damageScale, multiplier }
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const meanAbsPct = (rows: { o: Observation; pred: number }[]) =>
  rows.length ? rows.reduce((sum, r) => sum + Math.abs(r.pred - r.o.damage) / r.o.damage, 0) / rows.length : 0

/**
 * Fit damageScale from neutral hits (or all hits corrected by the default multipliers),
 * then strong/weak from ≥2 pure advantage/disadvantage hits. Medians keep outliers harmless.
 */
export function fitCalibration(obs: Observation[], byId: Map<number, Miscrit>): Calibration | null {
  if (!obs.length) return null
  const usable = obs.map(o => ({ o, b: baseOf(o, byId) })).filter((x): x is { o: Observation; b: NonNullable<ReturnType<typeof baseOf>> } =>
    !!x.b && x.b.base > 0 && x.o.damage > 0)
  if (!usable.length) return { ...DEFAULT_PARAMS, n: 0, errorBefore: 0, errorAfter: 0 }

  const neutral = usable.filter(x => x.b.strong === 0 && x.b.weak === 0)
  const damageScale = neutral.length
    ? median(neutral.map(x => x.o.damage / x.b.base))
    : median(usable.map(x => x.o.damage / (x.b.base * DEFAULT_PARAMS.strong ** x.b.strong * DEFAULT_PARAMS.weak ** x.b.weak)))
  const fitClass = (s: number, w: number, fallback: number) => {
    const rows = usable.filter(x => x.b.strong === s && x.b.weak === w)
    return rows.length >= 2 ? median(rows.map(x => x.o.damage / (x.b.base * damageScale))) : fallback
  }
  const fitted: FormulaParams = { damageScale, strong: fitClass(1, 0, DEFAULT_PARAMS.strong), weak: fitClass(0, 1, DEFAULT_PARAMS.weak) }
  const rowsWith = (p: FormulaParams) => usable.map(x => ({ o: x.o, pred: x.b.base * p.strong ** x.b.strong * p.weak ** x.b.weak * p.damageScale }))
  return { ...fitted, n: usable.length, errorBefore: meanAbsPct(rowsWith(DEFAULT_PARAMS)), errorAfter: meanAbsPct(rowsWith(fitted)) }
}
