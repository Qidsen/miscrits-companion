import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { decodeResult, encodeResult, type ChallengeResult } from '../domain/challenge'
import { safeStorage } from './safeStorage'

export interface FriendCollection { name: string; code: string }
interface TournamentState {
  name: string; played: Record<string, ChallengeResult>; friends: ChallengeResult[]; collections: FriendCollection[]
  setName(n: string): void; record(r: ChallengeResult): void; addFriend(r: ChallengeResult): void
  addCollection(c: FriendCollection): void; removeCollection(name: string): void
}

// persisted results go through the same encode/decode as links, so tampered storage is dropped too
const valid = (r: unknown): ChallengeResult | null => {
  try { return decodeResult(encodeResult(r as ChallengeResult)) } catch { return null }
}
const sameRun = (a: ChallengeResult, b: ChallengeResult) => a.name === b.name && a.date === b.date

export const useTournament = create<TournamentState>()(persist(set => ({
  name: '', played: {}, friends: [], collections: [],
  setName: name => set({ name: name.slice(0, 24) }),
  record: r => set(s => ({ played: { ...s.played, [r.date]: r } })),
  addFriend: r => set(s => ({ friends: [r, ...s.friends.filter(f => !sameRun(f, r))].slice(0, 500) })),
  addCollection: c => set(s => ({ collections: [c, ...s.collections.filter(x => x.name !== c.name)].slice(0, 30) })),
  removeCollection: name => set(s => ({ collections: s.collections.filter(x => x.name !== name) })),
}), {
  name: 'mc-tournament', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => {
    const o = (p ?? {}) as Record<string, unknown>
    const played: Record<string, ChallengeResult> = {}
    for (const r of Object.values((o.played ?? {}) as Record<string, unknown>)) { const v = valid(r); if (v) played[v.date] = v }
    const friends = (Array.isArray(o.friends) ? o.friends : []).map(valid).filter((r): r is ChallengeResult => !!r)
    const collections = (Array.isArray(o.collections) ? o.collections : []).filter((x): x is FriendCollection =>
      !!x && typeof x.name === 'string' && typeof x.code === 'string' && x.code.length < 2000)
    return { ...c, name: typeof o.name === 'string' ? o.name.slice(0, 24) : '', played, friends, collections }
  },
}))
