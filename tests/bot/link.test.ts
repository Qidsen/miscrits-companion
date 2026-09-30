import { expect, test } from 'vitest'
import { linkKey, syncHunt, linkStatus, type BotDeps } from '../../bot/handlers'
import { applyUpdate } from '../../scripts/notify/commands'
import { EMPTY_STATE, type BotState } from '../../scripts/notify/state'
import type { Miscrit } from '../../src/data/types'

const miscrits = [1, 2, 3].map(id => ({ id, names: [`M${id}`], rarity: 'Common', spawns: [{ region: 'Forest', zone: '1', days: 'all' }] })) as unknown as Miscrit[]
const TOKEN = 'a'.repeat(32)
const ctx = { data: { miscrits, regions: [] }, now: new Date('2026-09-30T12:00:00Z'), siteUrl: 'https://x/', botName: 'b' }

function deps(initial: BotState) {
  let stored = initial
  const d: BotDeps = {
    loadState: async () => stored, saveState: async s => { stored = s },
    data: async () => ({ data: ctx.data, changelog: [] }), deliver: async () => 'ok',
    now: () => ctx.now, siteUrl: ctx.siteUrl, botName: 'b',
  }
  return { d, get state() { return stored } }
}

test('/start <token> links the chat to the site (only a hash of the token is stored)', async () => {
  const key = await linkKey(TOKEN)
  const r = applyUpdate(EMPTY_STATE, { update_id: 1, message: { chat: { id: 5, type: 'private' }, from: { first_name: 'Ann' }, text: `/start ${TOKEN}` } }, { ...ctx, linkKey: key })
  expect(r.state.links).toEqual({ [key]: 5 })
  expect(JSON.stringify(r.state)).not.toContain(TOKEN)
  expect(r.state.subs.map(s => s.chatId)).toEqual([5])
  expect(r.replies[0].text).toMatch(/подключ/i)
})

test('the site pushes its hunt list; unknown tokens are rejected', async () => {
  const key = await linkKey(TOKEN)
  const t = deps({ ...EMPTY_STATE, links: { [key]: 5 }, subs: [{ chatId: 5, name: 'Ann', hunt: [] }] })
  expect(await syncHunt(t.d, TOKEN, [1, 3, 999, -1])).toEqual({ linked: true, count: 2 })
  expect(t.state.subs[0].hunt).toEqual([1, 3])
  expect(await syncHunt(t.d, 'b'.repeat(32), [1])).toEqual({ linked: false, count: 0 })
  expect(await linkStatus(t.d, TOKEN)).toEqual({ linked: true })
  expect(await linkStatus(t.d, 'short')).toEqual({ linked: false })
})

test('/unlink drops the link but keeps the subscription', async () => {
  const key = await linkKey(TOKEN)
  const s = { ...EMPTY_STATE, links: { [key]: 5 }, subs: [{ chatId: 5, name: 'Ann', hunt: [1] }] }
  const r = applyUpdate(s, { update_id: 2, message: { chat: { id: 5, type: 'private' }, text: '/unlink' } }, ctx)
  expect(r.state.links).toEqual({})
  expect(r.state.subs).toHaveLength(1)
})
