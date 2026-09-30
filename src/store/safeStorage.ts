import type { StateStorage } from 'zustand/middleware'

/** localStorage wrapper that never throws and drops corrupted JSON. */
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      const v = localStorage.getItem(name)
      if (v === null) return null
      JSON.parse(v)
      return v
    } catch { return null }
  },
  setItem(name, value) { try { localStorage.setItem(name, value) } catch { /* storage unavailable */ } },
  removeItem(name) { try { localStorage.removeItem(name) } catch { /* storage unavailable */ } },
}
