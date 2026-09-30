import { expect, test } from 'vitest'
import { handleUpdate, importState, runDaily, type BotDeps } from '../../bot/handlers'
import { EMPTY_STATE, type BotState } from '../../scripts/notify/state'
import type { OutMsg } from '../../scripts/notify/digest'
import { encodeIds } from '../../src/domain/collection'
import type { Miscrit } from '../../src/data/types'

const miscrits = [{ id: 1, names: ['Flue'], rarity: 'Common', spawns: [{ region: 'Forest', zone: '1', days: 'all' }] }] as unknown as Miscrit[]

function deps(initial: BotState = EMPTY_STATE, failFor: number[] = []) {
  let stored: BotState = initial
  let writes = 0
  const sent: OutMsg[] = []
  const d: BotDeps = {
    loadState: async () => stored,
    saveState: async s => { stored = s; writes++ },
    data: async () => ({ data: { miscrits, regions: [] }, changelog: [] }),
    deliver: async m => { if (failFor.includes(m.chatId)) throw new Error('network'); sent.push(m); return 'ok' },
    now: () => new Date('2026-09-30T12:00:00Z'),
    siteUrl: 'https://x.test/', botName: 'mc_bot', adminToken: 'tok',
  }
  return { d, sent, get state() { return stored }, get writes() { return writes } }
}
const pm = (id: number, text: string) => ({ update_id: 1, message: { chat: { id, type: 'private' as const }, from: { first_name: 'Ann' }, text } })

test('an update is answered immediately and state saved once', async () => {
  const t = deps()
  await handleUpdate(t.d, pm(5, `/hunt ${encodeIds([1])}`))
  expect(t.state.subs).toHaveLength(1)
  expect(t.sent.length).toBeGreaterThanOrEqual(2)
  expect(t.writes).toBe(1)
})
test('unchanged state is not written (KV write budget)', async () => {
  const t = deps()
  await handleUpdate(t.d, pm(5, '/start'))
  expect(t.writes).toBe(0)
})
test('daily run sends once per game day and resumes after a failure', async () => {
  const s: BotState = { ...EMPTY_STATE, subs: [{ chatId: 1, name: 'a', hunt: [1] }, { chatId: 2, name: 'b', hunt: [1] }] }
  const t = deps(s, [2])
  await runDaily(t.d)
  expect(t.sent.every(m => m.chatId === 1)).toBe(true)
  expect(t.state.lastDaily).toBeNull() // chat 2 still pending
  const t2 = deps(t.state)
  await runDaily(t2.d)
  expect(t2.sent.every(m => m.chatId === 2)).toBe(true) // chat 1 not sent again
  expect(t2.state.lastDaily).toBe('2026-09-30')
  const t3 = deps(t2.state)
  await runDaily(t3.d)
  expect(t3.sent).toEqual([])
})
test('import merges migrated subscribers without dropping existing ones', async () => {
  const t = deps({ ...EMPTY_STATE, subs: [{ chatId: 9, name: 'x', hunt: [1] }] })
  await importState(t.d, { subs: [{ chatId: 1, name: 'a', hunt: [1] }, { chatId: 9, name: 'y', hunt: [2] }], groups: [-5] })
  expect(t.state.subs.map(s => s.chatId).sort()).toEqual([1, 9])
  expect(t.state.groups).toEqual([-5])
})
