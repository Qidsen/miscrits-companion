export type DayList = number[] | 'all'
export interface Spawn { region: string; zone: string; days: DayList }
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Exotic' | 'Legendary'
export type StatKey = 'hp' | 'spd' | 'ea' | 'pa' | 'ed' | 'pd'
export type Tier = 'Weak' | 'Moderate' | 'Strong' | 'Max' | 'Elite'

export interface Ability {
  id: number; name: string; element: string; type: string
  ap?: number; accuracy?: number; turns?: number; target?: string
  desc: string; enchantDesc?: string
}
export interface ShopInfo { cost: number; costR?: number; costS?: number; currency: string }
/** relic ids for levels 10, 20, 30, 35 */
export interface RelicSet { name: string; relicIds: number[] }
export interface Miscrit {
  id: number; names: string[]; element: string; rarity: Rarity
  stats: Record<StatKey, Tier>; abilities: Ability[]; descriptions: string[]
  spawns: Spawn[]; perfectStat: string | null; attackType: string | null
  relicSet: RelicSet | null; shopInfo: ShopInfo | null
}
export interface Relic {
  id: number; name: string; desc: string; level: number
  effect: Record<string, number | boolean>; special: string | null; imageUrl: string
}
export interface Marker {
  id: string; region: string; x: number; y: number; name: string
  miscritId: number | null; rarity: string; element: string; exactImg: string | null
}
export interface MapInfo { file: string; width: number; height: number }
export interface Region { name: string; zones: Record<string, string>; map: MapInfo | null }
export interface Meta { syncedAt: string; counts: { miscrits: number; markers: number; relics: number; perRegion?: Record<string, number> }; warnings: string[] }
export interface Snapshot {
  miscrits: Miscrit[]; relics: Relic[]; regions: Region[]
  markers: Record<string, Marker[]>; warnings: string[]
}
export interface ChangeEntry {
  date: string; initial?: boolean
  added?: number[]; removed?: { id: number; name: string }[]; spawnChanged?: number[]
  markersAdded?: { region: string; count: number; miscritIds: number[] }[]
  relicsAdded?: number[]; relicsChanged?: number[]
}
