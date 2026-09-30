import { FORMULA, type FormulaParams } from './formulaConfig'
import { BASE_ELEMENTS, splitElement } from './miscrit'

/** attacker element → the element it is strong against */
export const BEATS: Record<string, string> = { Fire: 'Nature', Nature: 'Water', Water: 'Fire', Earth: 'Lightning', Lightning: 'Wind', Wind: 'Earth' }

type Mult = Pick<FormulaParams, 'strong' | 'weak'>

function single(attack: string, defender: string, p: Mult = FORMULA): number {
  if (BEATS[attack] === defender) return p.strong
  if (BEATS[defender] === attack) return p.weak
  return 1
}

/** How many parts of the defender the attack is strong / weak against (dual elements can mix). */
export function matchup(attack: string, defender: string): { strong: number; weak: number } {
  const parts = attack in BEATS ? splitElement(defender).filter(p => BASE_ELEMENTS.includes(p)) : []
  return { strong: parts.filter(p => BEATS[attack] === p).length, weak: parts.filter(p => BEATS[p] === attack).length }
}

/** Damage multiplier of an attack element against a (possibly dual) defender. Physical/Misc are neutral. */
export function multiplier(attack: string, defender: string, p: Mult = FORMULA): number {
  if (!(attack in BEATS)) return 1
  return splitElement(defender).filter(x => BASE_ELEMENTS.includes(x)).reduce((acc, x) => acc * single(attack, x, p), 1)
}

export const strongAgainst = (el: string) => BASE_ELEMENTS.filter(d => single(el, d) > 1)
export const weakAgainst = (el: string) => BASE_ELEMENTS.filter(a => single(a, el) > 1)
