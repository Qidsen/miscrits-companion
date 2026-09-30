import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Lang } from '../i18n'
import { safeStorage } from './safeStorage'

interface SettingsState { lang: Lang; setLang(l: Lang): void }

export const useSettings = create<SettingsState>()(persist(set => ({
  lang: 'ru', setLang: lang => set({ lang }),
}), { name: 'mc-settings', storage: createJSONStorage(() => safeStorage) }))
