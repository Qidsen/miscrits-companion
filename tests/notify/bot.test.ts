import { randomBytes } from 'node:crypto'
import { expect, test } from 'vitest'
import { EMPTY_STATE, decryptState, encryptState, shouldSendDaily, type BotState } from '../../scripts/notify/state'
import { groupDigest, personalDigest, type DigestData } from '../../scripts/notify/digest'
import { applyUpdate, type TgUpdate } from '../../scripts/notify/commands'
import { encodeIds } from '../../src/domain/collection'
import type { Miscrit, Region } from '../../src/data/types'

const key = randomBytes(32).toString('base64')
const mc = (id: number, name: string, rarity: string, spawns: unknown[]) => ({ id, names: [name], rarity, spawns }) as unknown as Miscrit
const data: DigestData = {
  miscrits: [
    mc(1, 'Flue <b>', 'Common', [{ region: 'Forest', zone: '1', days: 'all' }]),
    mc(2, 'Aquarion', 'Legendary', [{ region: 'Moon', zone: '1', days: [3] }]),
    mc(3, 'Waddles', 'Rare', [{ region: 'Forest', zone: '1', days: [4] }]),
  ],
  regions: [{ name: 'Forest', zones: { '1': 'Azore Lake' }, map: null }, { name: 'Moon', zones: { '1': 'Zone 1' }, map: null }] as Region[],
}
const WED = new Date('2026-09-30T12:00:00Z') // game day Wednesday (3)
const ctx = { data, now: WED, siteUrl: 'https://x.test/', botName: 'mc_bot' }
const pm = (id: number, text: string, update_id = 10): TgUpdate => ({ update_id, message: { chat: { id, type: 'private' }, from: { first_name: 'Ann' }, text } })
const gm = (id: number, text: string, update_id = 10): TgUpdate => ({ update_id, message: { chat: { id, type: 'group' }, text } })

test('state encrypts, decrypts, and refuses a wrong key or corrupted blob', () => {
  const s: BotState = { ...EMPTY_STATE, subs: [{ chatId: 5, name: 'Ann', hunt: [1] }], groups: [-7] }
  const blob = encryptState(s, key)
  expect(blob).not.toContain('Ann')
  expect(decryptState(blob, key)).toEqual(s)
  expect(() => decryptState(blob, randomBytes(32).toString('base64'))).toThrow()
  expect(() => decryptState(blob.slice(0, -4), key)).toThrow()
})

test('daily digest goes out once per game day', () => {
  const s = { ...EMPTY_STATE, lastDaily: '2026-09-29' }
  expect(shouldSendDaily(s, new Date('2026-09-29T23:59:00Z'))).toBe(false) // still Tuesday in the game
  expect(shouldSendDaily(s, new Date('2026-09-30T00:00:30Z'))).toBe(true)
  expect(shouldSendDaily({ ...s, lastDaily: '2026-09-30' }, WED)).toBe(false)
})

test('personal digest lists hunted miscrits available today and escapes HTML', () => {
  const text = personalDigest(data, [1, 3], WED, 'https://x.test/')
  expect(text).toContain('Среда')
  expect(text).toContain('Flue &lt;b&gt;')
  expect(text).toContain('Azore Lake')
  expect(text).not.toContain('Waddles') // Thursday only
  expect(text).toContain('Aquarion') // rare only today
  expect(personalDigest(data, [3], WED, 'u')).toMatch(/никого/)
})

test('group digest has the rare of the day and news, never the tournament', () => {
  const text = groupDigest(data, WED, 'https://x.test/', [{ date: 'd', added: [3], spawnChanged: [1] }])
  expect(text).toContain('Aquarion'); expect(text).toContain('Waddles')
  expect(text.toLowerCase()).not.toContain('турнир')
})

test('commands: start, hunt, today, stop, garbage', () => {
  let r = applyUpdate(EMPTY_STATE, pm(5, '/start'), ctx)
  expect(r.replies[0].chatId).toBe(5); expect(r.state.offset).toBe(11)
  r = applyUpdate(r.state, pm(5, `/hunt ${encodeIds([1, 3, 999])}`, 11), ctx)
  expect(r.state.subs).toEqual([{ chatId: 5, name: 'Ann', hunt: [1, 3] }])
  expect(r.replies[0].text).toMatch(/2/)
  const bad = applyUpdate(r.state, pm(5, '/hunt ***', 12), ctx)
  expect(bad.state.subs).toEqual(r.state.subs); expect(bad.replies[0].text).toMatch(/не получилось/i)
  expect(applyUpdate(r.state, pm(5, '/today', 13), ctx).replies[0].text).toContain('Flue')
  expect(applyUpdate(r.state, pm(5, '/stop@mc_bot', 14), ctx).state.subs).toEqual([])
  expect(applyUpdate(r.state, pm(5, 'hello', 15), ctx).replies).toHaveLength(1)
  expect(applyUpdate(r.state, { update_id: 99 }, ctx)).toEqual({ state: { ...r.state, offset: 100 }, replies: [] })
})

test('groups subscribe by command or by adding the bot; kicked removes', () => {
  let r = applyUpdate(EMPTY_STATE, gm(-7, '/subscribe'), ctx)
  r = applyUpdate(r.state, gm(-7, '/subscribe', 11), ctx)
  expect(r.state.groups).toEqual([-7])
  expect(applyUpdate(r.state, gm(-7, 'random chat', 12), ctx).replies).toEqual([]) // no spam in groups
  const added = applyUpdate(EMPTY_STATE, { update_id: 1, my_chat_member: { chat: { id: -9, type: 'supergroup' }, new_chat_member: { status: 'member' } } }, ctx)
  expect(added.state.groups).toEqual([-9])
  const kicked = applyUpdate(added.state, { update_id: 2, my_chat_member: { chat: { id: -9, type: 'supergroup' }, new_chat_member: { status: 'kicked' } } }, ctx)
  expect(kicked.state.groups).toEqual([])
})
