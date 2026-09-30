import type { Ability } from '../data/types'
import { multiplier } from './elements'
import { FORMULA } from './formulaConfig'
import type { Stats } from './stats'

export interface DamageResult { min: number; avg: number; max: number; multiplier: number; hitsToKo: number }
interface Side { element: string; stats: Stats }

export const isDamaging = (a: Ability) => a.type === 'Attack' && (a.ap ?? 0) > 0

/** Approximate damage: AP × attack/defense × element multiplier (physical uses PA/PD and ignores elements). */
export function damage(ability: Ability, attacker: Side, defender: Side): DamageResult | null {
  if (!isDamaging(ability)) return null
  const physical = ability.element === 'Physical'
  const atk = physical ? attacker.stats.pa : attacker.stats.ea
  const def = physical ? defender.stats.pd : defender.stats.ed
  const mult = physical ? 1 : multiplier(ability.element, defender.element)
  const raw = ability.ap! * (atk / Math.max(1, def)) * mult * FORMULA.damageScale
  const avg = Math.max(1, Math.round(raw))
  return {
    avg, multiplier: mult,
    min: Math.max(1, Math.round(raw * (1 - FORMULA.variance))),
    max: Math.max(1, Math.round(raw * (1 + FORMULA.variance))),
    hitsToKo: Math.ceil(defender.stats.hp / avg),
  }
}
