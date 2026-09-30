import { gameDate } from '../../src/domain/schedule'

export interface Sub { chatId: number; name: string; hunt: number[] }
export interface BotState {
  v: 1; offset: number; lastDaily: string | null; subs: Sub[]; groups: number[]; lastNewsDate: string | null
  /** chats that already got today's digest — lets a crashed run resume without resending */
  sent: { date: string; ids: number[] } | null
  /** chat id allowed to use /admin (set by /claim) */
  owner: number | null
}
export const EMPTY_STATE: BotState = { v: 1, offset: 0, lastDaily: null, subs: [], groups: [], lastNewsDate: null, sent: null, owner: null }

/** Daily digest is due until every current subscriber and group got today's message. */
export function dailyTargets(s: BotState, now: Date): { users: number[]; groups: number[] } {
  const date = gameDate(now)
  const done = new Set(s.sent?.date === date ? s.sent.ids : [])
  return { users: s.subs.map(x => x.chatId).filter(id => !done.has(id)), groups: s.groups.filter(id => !done.has(id)) }
}

export function markSent(s: BotState, now: Date, chatId: number): BotState {
  const date = gameDate(now)
  const ids = s.sent?.date === date ? s.sent.ids : []
  const next = { ...s, sent: { date, ids: [...new Set([...ids, chatId])] } }
  const left = dailyTargets(next, now)
  return left.users.length || left.groups.length ? next : { ...next, lastDaily: date }
}

export const shouldSendDaily = (s: BotState, now: Date) => s.lastDaily !== gameDate(now)
