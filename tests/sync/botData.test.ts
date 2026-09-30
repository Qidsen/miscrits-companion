import { expect, test } from 'vitest'
import { buildBotData, expandBotData } from '../../scripts/sync/botData'
import { cardLayout } from '../../scripts/sync/cards'
import type { Miscrit, Region } from '../../src/data/types'

const mc = (id: number, rarity: string, spawns: unknown[], element = 'Fire') => ({ id, names: [`M${id}`, `M${id}b`], rarity, element, spawns, stats: {}, abilities: [], descriptions: ['long text'] }) as unknown as Miscrit
const regions = [{ name: 'Forest', zones: { '1': 'Azore Lake' }, map: null }] as Region[]

test('compact bot data keeps what the bot needs and expands back', () => {
  const ms = [mc(1, 'Common', [{ region: 'Forest', zone: '1', days: 'all' }]), mc(2, 'Legendary', [{ region: 'Forest', zone: '1', days: [3, 4] }])]
  const d = buildBotData(ms, regions)
  expect(JSON.stringify(d)).not.toContain('long text')
  const back = expandBotData(d)
  expect(back.miscrits.map(m => [m.id, m.names[0], m.rarity, m.element])).toEqual([[1, 'M1', 'Common', 'Fire'], [2, 'M2', 'Legendary', 'Fire']])
  expect(back.miscrits[1].spawns).toEqual([{ region: 'Forest', zone: '1', days: [3, 4] }])
  expect(back.regions[0].zones['1']).toBe('Azore Lake')
})

test('card layout shows day-exclusive rare miscrits first, at most 8, deterministic', () => {
  const ms = [
    ...Array.from({ length: 6 }, (_, i) => mc(10 + i, 'Legendary', [{ region: 'Forest', zone: '1', days: [3] }])),
    ...Array.from({ length: 6 }, (_, i) => mc(30 + i, 'Epic', [{ region: 'Forest', zone: '1', days: [3] }])),
    mc(50, 'Legendary', [{ region: 'Forest', zone: '1', days: 'all' }]),
  ]
  const a = cardLayout(ms, 3)
  expect(a).toHaveLength(8)
  expect(a.slice(0, 6).every(x => x.rarity === 'Legendary')).toBe(true)
  expect(a.map(x => x.id)).not.toContain(50) // every-day spawns are not "of the day"
  expect(cardLayout(ms, 3)).toEqual(a)
  expect(cardLayout(ms, 1)).toEqual([])
  for (const s of a) { expect(s.x).toBeGreaterThanOrEqual(0); expect(s.x + s.size).toBeLessThanOrEqual(1200) }
})
