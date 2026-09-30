import type { Ability, Marker, Miscrit, Rarity, Region, Relic, RelicSet, Snapshot, Spawn, StatKey, Tier, MapInfo } from '../../src/data/types'

export interface RawAbility {
  id: number; name: string; element: string; type: string; desc: string
  ap?: number; accuracy?: number; turns?: number; target?: string; enchant_desc?: string
}
export interface RawGameMiscrit {
  id: number; element: string; names: string[]; rarity: string
  hp: string; spd: string; ea: string; pa: string; ed: string; pd: string
  abilities: RawAbility[]; ability_order: number[]; descriptions: string[]
  locations: Record<string, Record<string, number[]>>
}
export interface RawRelic {
  id: number; name: string; desc: string; level: number
  effect: Record<string, number | boolean>; special: string | null; image_url: string
}
export interface RawOrganizedEntry {
  id: number; perfectStat?: string | null; attackType?: string | null
  shopInfo?: { cost: number; cost_r?: number; cost_s?: number; currency: string } | null
  relicSet?: { name: string; level_10?: RawRelic | null; level_20?: RawRelic | null; level_30?: RawRelic | null; level_35?: RawRelic | null } | null
}
export interface RawMarker {
  id: string; x: number; y: number; miscritName: string
  miscritElement: string; miscritRarity: string; exactLocationImage?: string
}
export interface RawInput {
  game: RawGameMiscrit[]
  organized: Record<string, Record<string, RawOrganizedEntry[]>>
  areaNames: Record<string, Record<string, string>>
  markers: Record<string, RawMarker[]>
  relics: RawRelic[]
  mapSizes: Record<string, MapInfo>
}

const STAT_KEYS: StatKey[] = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

function toRelic(r: RawRelic): Relic {
  return { id: r.id, name: r.name, desc: r.desc, level: r.level, effect: r.effect, special: r.special ?? null, imageUrl: r.image_url }
}

function toAbility(a: RawAbility): Ability {
  const out: Ability = { id: a.id, name: a.name, element: a.element, type: a.type, desc: a.desc }
  if (a.ap !== undefined) out.ap = a.ap
  if (a.accuracy !== undefined) out.accuracy = a.accuracy
  if (a.turns !== undefined) out.turns = a.turns
  if (a.target !== undefined) out.target = a.target
  if (a.enchant_desc !== undefined) out.enchantDesc = a.enchant_desc
  return out
}

export function normalize(raw: RawInput): Snapshot {
  const warnings: string[] = []

  const extra = new Map<number, RawOrganizedEntry>()
  for (const zones of Object.values(raw.organized))
    for (const list of Object.values(zones))
      for (const e of list) if (!extra.has(e.id)) extra.set(e.id, e)

  const relics = new Map<number, Relic>()
  for (const r of raw.relics) relics.set(r.id, toRelic(r))

  const miscrits: Miscrit[] = raw.game.map(g => {
    const byId = new Map(g.abilities.map(a => [a.id, a]))
    const ordered = g.ability_order.map(id => byId.get(id)).filter((a): a is RawAbility => !!a)
    const rest = g.abilities.filter(a => !g.ability_order.includes(a.id))
    const spawns: Spawn[] = Object.entries(g.locations).flatMap(([region, zones]) =>
      Object.entries(zones).map(([zone, days]) => ({ region, zone, days: days.length === 0 ? 'all' as const : [...days].sort((a, b) => a - b) })))
    const x = extra.get(g.id)
    let relicSet: RelicSet | null = null
    if (x?.relicSet) {
      const levels = [x.relicSet.level_10, x.relicSet.level_20, x.relicSet.level_30, x.relicSet.level_35].filter((r): r is RawRelic => !!r)
      for (const r of levels) if (!relics.has(r.id)) relics.set(r.id, toRelic(r))
      relicSet = { name: x.relicSet.name, relicIds: levels.map(r => r.id) }
    }
    return {
      id: g.id, names: g.names, element: g.element, rarity: g.rarity as Rarity,
      stats: Object.fromEntries(STAT_KEYS.map(k => [k, cap(g[k]) as Tier])) as Record<StatKey, Tier>,
      abilities: [...ordered, ...rest].map(toAbility),
      descriptions: g.descriptions, spawns,
      perfectStat: x?.perfectStat ?? null, attackType: x?.attackType ?? null, relicSet,
      shopInfo: x?.shopInfo ? { cost: x.shopInfo.cost, costR: x.shopInfo.cost_r, costS: x.shopInfo.cost_s, currency: x.shopInfo.currency } : null,
    }
  })

  const regionNames = new Set<string>()
  for (const m of miscrits) for (const s of m.spawns) regionNames.add(s.region)
  for (const r of Object.keys(raw.markers)) regionNames.add(r)
  const regions: Region[] = [...regionNames].map(name => {
    const zones: Record<string, string> = {}
    for (const m of miscrits) for (const s of m.spawns)
      if (s.region === name) zones[s.zone] = raw.areaNames[name]?.[s.zone] ?? `Zone ${s.zone}`
    return { name, zones, map: raw.mapSizes[name] ?? null }
  })

  const nameIndex = new Map<string, number>()
  for (const m of miscrits) for (const n of m.names) nameIndex.set(n.toLowerCase(), m.id)
  const markers: Record<string, Marker[]> = {}
  for (const [region, list] of Object.entries(raw.markers)) {
    markers[region] = list.map(mk => {
      const miscritId = nameIndex.get(mk.miscritName.toLowerCase()) ?? null
      if (miscritId === null) warnings.push(`marker ${mk.id} in ${region}: unknown miscrit "${mk.miscritName}"`)
      const img = mk.exactLocationImage ?? ''
      return {
        id: mk.id, region, x: mk.x, y: mk.y, name: mk.miscritName, miscritId,
        rarity: mk.miscritRarity, element: mk.miscritElement,
        exactImg: /^https?:\/\//.test(img) ? img : null,
      }
    })
  }

  return { miscrits, relics: [...relics.values()].sort((a, b) => a.level - b.level || a.id - b.id), regions, markers, warnings }
}
