import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'

export interface SavedTeam { name: string; code: string }
interface TeamsState { teams: SavedTeam[]; save(t: SavedTeam): void; remove(name: string): void }

const valid = (v: unknown): SavedTeam[] => (Array.isArray(v) ? v.filter((x): x is SavedTeam => !!x && typeof x.name === 'string' && typeof x.code === 'string') : [])

export const useTeams = create<TeamsState>()(persist(set => ({
  teams: [],
  save: t => set(s => ({ teams: [t, ...s.teams.filter(x => x.name !== t.name)].slice(0, 30) })),
  remove: name => set(s => ({ teams: s.teams.filter(x => x.name !== name) })),
}), {
  name: 'mc-teams', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => ({ ...c, teams: valid((p as { teams?: unknown } | null)?.teams) }),
}))
