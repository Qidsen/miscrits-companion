import { expect, test } from 'vitest'
import { huntCardModel } from '../../card/model'
import type { BotData } from '../../scripts/sync/botData'

const data: BotData = {
  v: 1,
  ru: { days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'], dayShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    regions: { Forest: 'Лес', Moon: 'Луна' }, rarity: { Exotic: 'Экзотический' }, zone: 'Зона', everyDay: 'Каждый день' },
  zones: { Forest: { '4': 'Elder Tree' }, Moon: {} },
  miscrits: [
    { id: 433, n: 'Blighted Flue', r: 'Exotic', e: 'Fire', s: [['Forest', '4', 'all']], mk: ['Forest', 'm1'], l: 1 },
    { id: 20, n: 'Waddles', r: 'Rare', e: 'Water', s: [['Forest', '1', [0, 1, 4]]] },
    { id: 2, n: 'Aquarion', r: 'Legendary', e: 'Water', s: [['Moon', '2', [3]]] },
    ...Array.from({ length: 8 }, (_, i) => ({ id: 100 + i, n: `M${i}`, r: 'Common', e: 'Fire', s: [['Forest', '4', 'all'] as [string, string, 'all']] })),
  ],
}

test('only hunted miscrits available on that day, rarest first, with where to catch them', () => {
  const m = huntCardModel(data, [20, 433, 2], 3, 'https://site/')
  expect(m.dayName).toBe('Среда')
  expect(m.tiles.map(t => t.name)).toEqual(['Aquarion', 'Blighted Flue']) // Waddles is not on Wednesday
  expect(m.tiles[1]).toMatchObject({ place: 'Лес → Elder Tree', rarity: 'Exotic', days: 'Каждый день', thumb: 'https://site/data/locmap/433.jpg' })
  expect(m.tiles[0]).toMatchObject({ place: 'Луна → Зона 2', thumb: null })
  expect(m.tiles[0].sprite).toContain('cdn.worldofmiscrits.com')
})
test('at most 6 tiles, the rest counted; unknown ids ignored; empty list is valid', () => {
  const m = huntCardModel(data, [...Array.from({ length: 8 }, (_, i) => 100 + i), 99999], 3, 'https://site/')
  expect(m.tiles).toHaveLength(6); expect(m.more).toBe(2)
  expect(huntCardModel(data, [], 3, 'https://site/').tiles).toEqual([])
})
