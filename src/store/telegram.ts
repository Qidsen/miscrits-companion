import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeStorage } from './safeStorage'

/** Site ↔ bot link: a random token known only to this browser (the bot stores its hash). */
interface TgState { token: string | null; linked: boolean; ensureToken(): string; setLinked(v: boolean): void; reset(): void }

const newToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('')

export const useTelegram = create<TgState>()(persist((set, get) => ({
  token: null, linked: false,
  ensureToken: () => { const t = get().token ?? newToken(); if (!get().token) set({ token: t }); return t },
  setLinked: linked => set({ linked }),
  reset: () => set({ token: null, linked: false }),
}), {
  name: 'mc-telegram', storage: createJSONStorage(() => safeStorage),
  merge: (p, c) => {
    const o = (p ?? {}) as Record<string, unknown>
    const token = typeof o.token === 'string' && /^[a-f0-9]{32}$/.test(o.token) ? o.token : null
    return { ...c, token, linked: token !== null && o.linked === true }
  },
}))
