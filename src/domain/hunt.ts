import type { Miscrit } from '../data/types'
import { nextAvailableDay } from './schedule'
import { groupAvailable } from './today'

const pick = (ids: number[], byId: Map<number, Miscrit>) => ids.map(id => byId.get(id)).filter((m): m is Miscrit => !!m)

export const huntToday = (ids: number[], byId: Map<number, Miscrit>, day: number) => groupAvailable(pick(ids, byId), day)

export function huntWeek(ids: number[], byId: Map<number, Miscrit>, now: Date) {
  return pick(ids, byId).map(m => ({ m, next: nextAvailableDay(m.spawns, now) }))
    .sort((a, b) => (a.next?.inDays ?? 99) - (b.next?.inDays ?? 99) || a.m.names[0].localeCompare(b.m.names[0]))
}
