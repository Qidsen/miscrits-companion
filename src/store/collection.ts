import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'
import { sanitizeCollection } from './sanitize'

interface CollectionState {
  caught: number[]; favorites: number[]
  toggleCaught(id: number): void; toggleFavorite(id: number): void
  markMany(ids: number[]): void; replace(caught: number[], favorites: number[]): void
}
const toggle = (list: number[], id: number) => (list.includes(id) ? list.filter(x => x !== id) : [...list, id])

export const useCollection = create<CollectionState>()(persist(set => ({
  caught: [], favorites: [],
  toggleCaught: id => set(s => ({ caught: toggle(s.caught, id) })),
  toggleFavorite: id => set(s => ({ favorites: toggle(s.favorites, id) })),
  markMany: ids => set(s => ({ caught: [...new Set([...s.caught, ...ids])] })),
  replace: (caught, favorites) => set({ caught: [...new Set(caught)], favorites: [...new Set(favorites)] }),
}), {
  name: 'mc-collection', storage: createJSONStorage(() => safeStorage),
  merge: (persisted, current) => ({ ...current, ...sanitizeCollection(persisted) }),
}))
