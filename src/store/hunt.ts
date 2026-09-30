import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'

const numbers = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [])

interface HuntState { ids: number[]; toggle(id: number): void; remove(ids: number[]): void; clear(): void }

export const useHunt = create<HuntState>()(persist(set => ({
  ids: [],
  toggle: id => set(s => ({ ids: s.ids.includes(id) ? s.ids.filter(x => x !== id) : [...s.ids, id] })),
  remove: ids => set(s => ({ ids: s.ids.filter(x => !ids.includes(x)) })),
  clear: () => set({ ids: [] }),
}), {
  name: 'mc-hunt', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => ({ ...c, ids: numbers((p as { ids?: unknown } | null)?.ids) }),
}))
