import type { ChangeEntry } from '../src/data/types'
import { gameDate } from '../src/domain/schedule'
import { applyUpdate, type TgUpdate } from '../scripts/notify/commands'
import { groupMessages, personalMessages, type DigestData, type OutMsg } from '../scripts/notify/digest'
import { dailyTargets, markSent, shouldSendDaily, type BotState, type Sub } from '../scripts/notify/state'

/** Everything the bot touches from the outside world — injected so the logic is testable. */
export interface BotDeps {
  loadState(): Promise<BotState>
  saveState(s: BotState): Promise<void>
  data(): Promise<{ data: DigestData; changelog: ChangeEntry[] }>
  deliver(m: OutMsg): Promise<'ok' | 'blocked' | 'error'>
  now(): Date
  siteUrl: string; botName: string; adminToken?: string
  /** personalised card renderer (Vercel); without it the bot falls back to the day card + sprite album */
  cardUrl?: string
}

const drop = (s: BotState, chatId: number): BotState =>
  ({ ...s, subs: s.subs.filter(x => x.chatId !== chatId), groups: s.groups.filter(g => g !== chatId) })

/** Send a chat's messages in order; the first failure stops the rest (they'd arrive out of context). */
async function sendAll(d: BotDeps, msgs: OutMsg[]): Promise<'ok' | 'blocked' | 'error'> {
  for (const m of msgs) {
    let r: 'ok' | 'blocked' | 'error'
    try { r = await d.deliver(m) } catch { r = 'error' }
    if (r !== 'ok') return r
  }
  return 'ok'
}

/** Webhook update: reply right away; write state only when it changed (KV free plan: 1000 writes/day). */
export async function handleUpdate(d: BotDeps, u: TgUpdate): Promise<void> {
  const before = await d.loadState()
  const { data } = await d.data()
  const r = applyUpdate(before, u, { data, now: d.now(), siteUrl: d.siteUrl, botName: d.botName, adminToken: d.adminToken, cardUrl: d.cardUrl })
  let state = { ...r.state, offset: before.offset } // offsets are a polling concept; keep the stored value stable
  const byChat = new Map<number, OutMsg[]>()
  for (const m of r.replies) byChat.set(m.chatId, [...(byChat.get(m.chatId) ?? []), m])
  for (const [chatId, msgs] of byChat) if (await sendAll(d, msgs) === 'blocked') state = drop(state, chatId)
  if (JSON.stringify(state) !== JSON.stringify(before)) await d.saveState(state)
}

/** Cron: send today's digest to everyone who hasn't got it yet; progress is saved per chat. */
export async function runDaily(d: BotDeps): Promise<void> {
  let state = await d.loadState()
  const now = d.now()
  if (!shouldSendDaily(state, now)) return
  const { data, changelog } = await d.data()
  const news = state.lastNewsDate === null ? [] : changelog.filter(e => !e.initial && e.date > state.lastNewsDate!)
  const { users, groups } = dailyTargets(state, now)
  const jobs = [
    ...users.map(id => ({ id, msgs: personalMessages(id, data, state.subs.find(s => s.chatId === id)?.hunt ?? [], now, d.siteUrl, d.cardUrl) })),
    ...groups.map(id => ({ id, msgs: groupMessages(id, data, now, d.siteUrl, news) })),
  ]
  for (const job of jobs) {
    const res = await sendAll(d, job.msgs)
    if (res === 'blocked') state = drop(state, job.id)
    if (res !== 'error') { state = markSent(state, now, job.id); await d.saveState(state) } // 'error' → retried next cron tick
  }
  if (!jobs.length) state = { ...state, lastDaily: gameDate(now) }
  if (state.lastDaily === gameDate(now)) {
    state = { ...state, lastNewsDate: changelog[0]?.date ?? state.lastNewsDate }
    await d.saveState(state)
  }
}

/** One-off migration from the old GitHub Actions bot. Existing subscribers win on conflicts. */
export async function importState(d: BotDeps, incoming: { subs?: Sub[]; groups?: number[]; owner?: number | null }): Promise<BotState> {
  const s = await d.loadState()
  const have = new Set(s.subs.map(x => x.chatId))
  const subs = [...s.subs, ...(incoming.subs ?? []).filter(x => typeof x.chatId === 'number' && !have.has(x.chatId))]
  const next: BotState = { ...s, subs, groups: [...new Set([...s.groups, ...(incoming.groups ?? [])])], owner: s.owner ?? incoming.owner ?? null }
  await d.saveState(next)
  return next
}
