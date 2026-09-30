import { en } from './en'
import { ru } from './ru'
import { useSettings } from '../store/settings'

export type Lang = 'ru' | 'en'
export type I18nKey = keyof typeof en
type Vars = Record<string, string | number>
const dicts: Record<Lang, Record<I18nKey, string>> = { en, ru }

export function translate(lang: Lang, key: I18nKey, vars?: Vars): string {
  const s = (dicts[lang] ?? en)[key] ?? en[key] ?? key
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s
}

export type T = (key: I18nKey, vars?: Vars) => string

export function useT(): T {
  const lang = useSettings(s => s.lang)
  return (key, vars) => translate(lang, key, vars)
}

export const dayShort = (t: T, day: number) => t(`day.${day}` as I18nKey)
export const regionLabel = (t: T, name: string) => {
  const key = `region.${name}` as I18nKey
  return key in en ? t(key) : name
}
