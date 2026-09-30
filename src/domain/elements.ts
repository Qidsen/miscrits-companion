import { FORMULA } from './formulaConfig'
import { BASE_ELEMENTS, splitElement } from './miscrit'

/** attacker element → the element it is strong against */
export const BEATS: Record<string, string> = { Fire: 'Nature', Nature: 'Water', Water: 'Fire', Earth: 'Lightning', Lightning: 'Wind', Wind: 'Earth' }

function single(attack: string, defender: string): number {
  if (BEATS[attack] === defender) return FORMULA.strong
  if (BEATS[defender] === attack) return FORMULA.weak
  return 1
}

/** Damage multiplier of an attack element against a (possibly dual) defender. Physical/Misc are neutral. */
export function multiplier(attack: string, defender: string): number {
  if (!(attack in BEATS)) return 1
  return splitElement(defender).filter(p => BASE_ELEMENTS.includes(p)).reduce((acc, p) => acc * single(attack, p), 1)
}

export const strongAgainst = (el: string) => BASE_ELEMENTS.filter(d => single(el, d) > 1)
export const weakAgainst = (el: string) => BASE_ELEMENTS.filter(a => single(a, el) > 1)
