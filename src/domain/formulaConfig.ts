/** Approximate game constants. The game does not publish its formulas; tune these against real battles. */
export const FORMULA = {
  strong: 1.5,
  weak: 0.5,
  /** average stat points gained per level by tier (community data: Weak 0–2, Moderate/Strong 1–3, Max 2–4, Elite Max+2) */
  perLevel: { Weak: 1, Moderate: 2, Strong: 2, Max: 3, Elite: 5 },
  maxLevel: 35,
  base: { hp: 40, spd: 10, ea: 10, pa: 10, ed: 10, pd: 10 },
  hpPerLevelFactor: 2,
  damageScale: 1,
  variance: 0.1,
} as const

/** The tunable part of the formula (what calibration fits). */
export interface FormulaParams { damageScale: number; strong: number; weak: number }
export const DEFAULT_PARAMS: FormulaParams = { damageScale: FORMULA.damageScale, strong: FORMULA.strong, weak: FORMULA.weak }
