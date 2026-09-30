import type { Lang } from '../i18n'

const LANGS: Lang[] = ['ru', 'en']
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' ? v as Record<string, unknown> : {})
const numbers = (v: unknown): number[] => (Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : [])

/** Persisted settings may come from an older version or be hand-edited: keep only valid values. */
export function sanitizeSettings(v: unknown): { lang: Lang } {
  const lang = obj(v).lang
  return { lang: LANGS.includes(lang as Lang) ? lang as Lang : 'ru' }
}

export function sanitizeCollection(v: unknown): { caught: number[]; favorites: number[] } {
  const o = obj(v)
  return { caught: numbers(o.caught), favorites: numbers(o.favorites) }
}
