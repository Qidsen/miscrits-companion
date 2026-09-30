import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'

/** Site ↔ bot link: a random token known only to this browser (the bot stores its hash). */
export type SyncStatus = { state: 'idle' | 'syncing' | 'failed' } | { state: 'synced'; count: number; at: number }
interface TgState {
  token: string | null; linked: boolean; sync: SyncStatus
  ensureToken(): string; setLinked(v: boolean): void; setSync(s: SyncStatus): void; reset(): void
}

const newToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('')

export const useTelegram = create<TgState>()(persist((set, get) => ({
  token: null, linked: false, sync: { state: 'idle' },
  ensureToken: () => { const t = get().token ?? newToken(); if (!get().token) set({ token: t }); return t },
  setLinked: linked => set({ linked }),
  setSync: sync => set({ sync }),
  reset: () => set({ token: null, linked: false, sync: { state: 'idle' } }),
}), {
  name: 'mc-telegram', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => {
    const o = (p ?? {}) as Record<string, unknown>
    const token = typeof o.token === 'string' && /^[a-f0-9]{32}$/.test(o.token) ? o.token : null
    const sync = o.sync && typeof o.sync === 'object' && (o.sync as SyncStatus).state === 'synced' ? o.sync as SyncStatus : { state: 'idle' as const }
    return { ...c, token, linked: token !== null && o.linked === true, sync }
  },
}))
