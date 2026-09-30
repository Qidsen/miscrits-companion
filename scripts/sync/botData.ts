import type { DayList, Marker, Miscrit, Rarity, Region } from '../../src/data/types'
import { translate, type I18nKey } from '../../src/i18n'

const t = (k: string, v?: Record<string, string | number>) => translate('ru', k as I18nKey, v)
const RARITIES = ['Common', 'Rare', 'Epic', 'Exotic', 'Legendary']

/** Compact dataset for the bot: small enough to parse inside a 10 ms Worker CPU budget. */
export interface BotLabels { days: string[]; dayShort: string[]; regions: Record<string, string>; rarity: Record<string, string>; zone: string; everyDay: string }

export interface BotData {
  v: 1
  /** Russian labels so the image renderer needs no dictionaries of its own */
  ru?: BotLabels
  /** l: has a location card; mk: [region, markerId] of its first map marker */
  miscrits: { id: number; n: string; r: string; e: string; s: [string, string, DayList][]; l?: 1; mk?: [string, string] }[]
  zones: Record<string, Record<string, string>>
}

export function buildBotData(miscrits: Miscrit[], regions: Region[], markers: Record<string, Marker[]> = {}, withCards: Set<number> = new Set()): BotData {
  const firstMarker = new Map<number, [string, string]>()
  for (const [region, list] of Object.entries(markers)) for (const mk of list) if (mk.miscritId !== null && !firstMarker.has(mk.miscritId)) firstMarker.set(mk.miscritId, [region, mk.id])
  const ru: BotLabels = {
    days: [0, 1, 2, 3, 4, 5, 6].map(d => t(`dayFull.${d}`)), dayShort: [0, 1, 2, 3, 4, 5, 6].map(d => t(`day.${d}`)),
    regions: Object.fromEntries(regions.map(r => [r.name, t(`region.${r.name}`).startsWith('region.') ? r.name : t(`region.${r.name}`)])),
    rarity: Object.fromEntries(RARITIES.map(r => [r, t(`rarity.${r}`)])), zone: t('zone.n', { n: '' }).trim(), everyDay: t('today.everyDay'),
  }
  return {
    v: 1,
    ru,
    miscrits: miscrits.map(m => ({
      id: m.id, n: m.names[0], r: m.rarity, e: m.element, s: m.spawns.map(s => [s.region, s.zone, s.days]),
      ...(withCards.has(m.id) ? { l: 1 as const } : {}), ...(firstMarker.has(m.id) ? { mk: firstMarker.get(m.id) } : {}),
    })),
    zones: Object.fromEntries(regions.map(r => [r.name, r.zones])),
  }
}

/** Back to the shapes the shared domain code expects (only the fields the bot uses are filled). */
export function expandBotData(d: BotData): { miscrits: Miscrit[]; regions: Region[] } {
  return {
    miscrits: d.miscrits.map(m => ({
      id: m.id, names: [m.n], rarity: m.r as Rarity, element: m.e,
      spawns: m.s.map(([region, zone, days]) => ({ region, zone, days })),
      loc: m.l === 1, marker: m.mk ?? null,
    }) as unknown as Miscrit),
    regions: Object.entries(d.zones).map(([name, zones]) => ({ name, zones, map: null })),
  }
}
