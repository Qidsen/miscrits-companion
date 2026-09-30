import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Lang } from '../i18n'
import { safeStorage } from './safeStorage'
import { sanitizeSettings } from './sanitize'

interface SettingsState { lang: Lang; setLang(l: Lang): void }

export const useSettings = create<SettingsState>()(persist(set => ({
  lang: 'ru', setLang: lang => set({ lang }),
}), {
  name: 'mc-settings', storage: createJSONStorage(() => safeStorage),
  merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted) }),
}))
