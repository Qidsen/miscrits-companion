import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'

interface Memory { moves: number; ms: number }
interface ScoresState {
  silhouette: number; evolution: number; memory: Memory | null
  record(game: 'silhouette' | 'evolution', streak: number): boolean
  recordMemory(r: Memory): boolean
}
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0)

export const useScores = create<ScoresState>()(persist((set, get) => ({
  silhouette: 0, evolution: 0, memory: null,
  record: (game, streak) => { if (streak <= get()[game]) return false; set({ [game]: streak } as Partial<ScoresState>); return true },
  recordMemory: r => { const b = get().memory; if (b && (b.moves < r.moves || (b.moves === r.moves && b.ms <= r.ms))) return false; set({ memory: r }); return true },
}), {
  name: 'mc-scores', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => {
    const o = (p ?? {}) as Record<string, unknown>
    const m = o.memory as Memory | null | undefined
    return { ...c, silhouette: num(o.silhouette), evolution: num(o.evolution), memory: m && num(m.moves) > 0 ? { moves: num(m.moves), ms: num(m.ms) } : null }
  },
}))
