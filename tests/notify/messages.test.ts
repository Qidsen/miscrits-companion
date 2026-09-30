import { expect, test } from 'vitest'
import { EMPTY_STATE } from '../../scripts/notify/state'
import { groupMessages, personalMessages, type DigestData } from '../../scripts/notify/digest'
import { applyUpdate, type TgUpdate } from '../../scripts/notify/commands'
import { encodeIds } from '../../src/domain/collection'
import type { Miscrit, Region } from '../../src/data/types'

const mc = (id: number, name: string, rarity: string, spawns: unknown[]) => ({ id, names: [name], rarity, spawns }) as unknown as Miscrit
const data: DigestData = {
  miscrits: [
    mc(1, 'Flue', 'Common', [{ region: 'Forest', zone: '1', days: 'all' }]),
    mc(2, 'Aquarion', 'Legendary', [{ region: 'Moon', zone: '1', days: [3] }]),
    mc(3, 'Waddles', 'Rare', [{ region: 'Forest', zone: '1', days: [4] }]),
  ],
  regions: [{ name: 'Forest', zones: { '1': 'Azore Lake' }, map: null }, { name: 'Moon', zones: {}, map: null }] as Region[],
}
const WED = new Date('2026-09-30T12:00:00Z')
const SITE = 'https://x.test/'
const ctx = { data, now: WED, siteUrl: SITE, botName: 'mc_bot', adminToken: 'sekret' }
const pm = (id: number, text: string, update_id = 10, first_name = 'Ann'): TgUpdate => ({ update_id, message: { chat: { id, type: 'private' }, from: { first_name }, text } })

test('personal daily: weekday card with caption and buttons, then an album of hunted miscrits', () => {
  const [card, album] = personalMessages(5, data, [1, 3], WED, SITE)
  expect(card.photo).toBe(`${SITE}data/cards/3.jpg?v=2026-09-30`)
  expect(card.caption!.length).toBeLessThanOrEqual(1024)
  expect(card.caption).toContain('Flue')
  expect(card.buttons!.flat().map(b => b.url)).toEqual(expect.arrayContaining([`${SITE}#/hunt`, `${SITE}#/map`]))
  expect(album.album!.map(a => a.caption)).toEqual(['Flue — Лес · Azore Lake'])
  expect(album.album![0].photo).toContain('cdn.worldofmiscrits.com')
  expect(personalMessages(5, data, [3], WED, SITE)).toHaveLength(1) // nothing hunted today → no album
})

test('album is capped at 10 photos', () => {
  const many = { ...data, miscrits: Array.from({ length: 15 }, (_, i) => mc(100 + i, `M${i}`, 'Common', [{ region: 'Forest', zone: '1', days: 'all' }])) }
  const msgs = personalMessages(5, many, many.miscrits.map(m => m.id), WED, SITE)
  expect(msgs[1].album).toHaveLength(10)
})

test('group daily: card with rare of the day and a site button', () => {
  const [card] = groupMessages(-7, data, WED, SITE, [])
  expect(card.chatId).toBe(-7)
  expect(card.caption).toContain('Aquarion')
  expect(card.buttons!.flat().length).toBeGreaterThan(0)
})

test('/today answers with the visual digest; /claim + /admin for the owner only', () => {
  let r = applyUpdate(EMPTY_STATE, pm(5, `/hunt ${encodeIds([1])}`), ctx)
  expect(r.replies.some(m => m.photo)).toBe(true)
  expect(applyUpdate(r.state, pm(5, '/today', 11), ctx).replies[0].photo).toBeTruthy()
  expect(applyUpdate(r.state, pm(9, '/admin', 12), ctx).replies[0].text).not.toMatch(/Ann/) // not the owner
  const wrong = applyUpdate(r.state, pm(9, '/claim nope', 13), ctx)
  expect(wrong.state.owner).toBeNull()
  r = applyUpdate(r.state, pm(9, '/claim sekret', 14, 'Owner'), ctx)
  expect(r.state.owner).toBe(9)
  const admin = applyUpdate(r.state, pm(9, '/admin', 15), ctx).replies[0].text!
  expect(admin).toContain('Ann'); expect(admin).toMatch(/1/)
})
