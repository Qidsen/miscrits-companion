import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Observation } from '../domain/calibration'
import type { FormulaParams } from '../domain/formulaConfig'
import { safeStorage } from './safeStorage'

export interface Applied extends FormulaParams { n: number }
interface CalState {
  observations: Observation[]; applied: Applied | null
  add(o: Observation): void; remove(i: number): void; apply(p: Applied | null): void; clear(): void
}

const num = (v: unknown, min = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : null)
const cleanObs = (v: unknown): Observation[] => (Array.isArray(v) ? v : []).flatMap(o => {
  const x = (o ?? {}) as Record<string, unknown>
  const f = [num(x.attackerId), num(x.attackerLevel, 1), num(x.abilityId), num(x.defenderId), num(x.defenderLevel, 1), num(x.damage)]
  if (f.some(n => n === null)) return []
  return [{ attackerId: f[0]!, attackerLevel: f[1]!, abilityId: f[2]!, defenderId: f[3]!, defenderLevel: f[4]!, damage: f[5]!, ...(num(x.attackStat, 1) ? { attackStat: num(x.attackStat, 1)! } : {}) }]
}).slice(0, 200)
const cleanApplied = (v: unknown): Applied | null => {
  const x = (v ?? {}) as Record<string, unknown>
  const s = num(x.damageScale), st = num(x.strong), w = num(x.weak), n = num(x.n)
  return s && st && w && n !== null ? { damageScale: s, strong: st, weak: w, n } : null
}

export const useCalibration = create<CalState>()(persist(set => ({
  observations: [], applied: null,
  add: o => set(s => ({ observations: [...s.observations, o].slice(-200) })),
  remove: i => set(s => ({ observations: s.observations.filter((_, j) => j !== i) })),
  apply: applied => set({ applied }),
  clear: () => set({ observations: [], applied: null }),
}), {
  name: 'mc-calibration', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => { const o = (p ?? {}) as Record<string, unknown>; return { ...c, observations: cleanObs(o.observations), applied: cleanApplied(o.applied) } },
}))
