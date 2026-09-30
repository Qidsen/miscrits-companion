// Self-contained (deployed as its own Netlify site): only type imports from the main repo.
import type { BotData } from '../scripts/sync/botData'

export interface Tile { id: number; name: string; rarity: string; rarityLabel: string; place: string; days: string; sprite: string; thumb: string | null }
export interface HuntCardModel { dayName: string; tiles: Tile[]; more: number }

const ORDER = ['Common', 'Rare', 'Epic', 'Exotic', 'Legendary']
const WEEK = [1, 2, 3, 4, 5, 6, 0]
const MAX = 6
const slug = (n: string) => encodeURIComponent(n.toLowerCase().replace(/\s+/g, '_'))

/** Hunted miscrits that spawn on `day`, rarest first, each with its place and a map thumbnail. */
export function huntCardModel(d: BotData, ids: number[], day: number, siteUrl: string): HuntCardModel {
  const ru = d.ru
  const want = new Set(ids)
  const list = d.miscrits
    .filter(m => want.has(m.id))
    .map(m => ({ m, spawn: m.s.find(([, , days]) => days === 'all' || days.includes(day)) }))
    .filter((x): x is { m: typeof x.m; spawn: NonNullable<typeof x.spawn> } => !!x.spawn)
    .sort((a, b) => ORDER.indexOf(b.m.r) - ORDER.indexOf(a.m.r) || a.m.n.localeCompare(b.m.n))
  const tiles = list.slice(0, MAX).map(({ m, spawn: [region, zone, days] }) => {
    const zn = d.zones[region]?.[zone] ?? `Zone ${zone}`
    const zoneLabel = /^Zone \d+$/.test(zn) ? `${ru?.zone ?? 'Zone'} ${zone}` : zn
    return {
      id: m.id, name: m.n, rarity: m.r, rarityLabel: ru?.rarity[m.r] ?? m.r,
      place: `${ru?.regions[region] ?? region} → ${zoneLabel}`,
      days: days === 'all' ? (ru?.everyDay ?? 'Every day') : WEEK.filter(x => days.includes(x)).map(x => ru?.dayShort[x] ?? String(x)).join(' · '),
      sprite: `https://cdn.worldofmiscrits.com/miscrits/${slug(m.n)}_back.png`,
      thumb: m.l ? `${siteUrl}data/locmap/${m.id}.jpg` : null,
    }
  })
  return { dayName: ru?.days[day] ?? String(day), tiles, more: Math.max(0, list.length - MAX) }
}
