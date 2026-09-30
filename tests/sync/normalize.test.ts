import { expect, test } from 'vitest'
import { normalize, type RawInput } from '../../scripts/sync/normalize'

const relic10 = { id: 201, name: "Woodsman's Axe Head", desc: 'x', level: 10, effect: { hp: 1, pa: 3 }, special: null, image_url: 'https://cdn/r1.png' }

const raw: RawInput = {
  game: [
    {
      id: 1, element: 'Fire', names: ['Flue', 'Chimnay', 'Firebrawl', 'Afterburn'], rarity: 'Common',
      hp: 'Strong', spd: 'Weak', ea: 'Weak', pa: 'Max', ed: 'Strong', pd: 'Strong',
      abilities: [
        { id: 48, name: 'Bash', ap: 15, accuracy: 95, element: 'Physical', type: 'Attack', desc: 'd48', enchant_desc: '+3' },
        { id: 1, name: 'Burn', ap: 7, element: 'Fire', type: 'Attack', desc: 'd1' },
      ],
      ability_order: [1, 48],
      descriptions: ['a', 'b', 'c', 'd'],
      locations: { Forest: { '1': [] }, Moon: { '2': [4, 5] } },
    },
  ],
  organized: {
    Forest: { '1': [{ id: 1, perfectStat: 'RS', attackType: 'PA', shopInfo: null,
      relicSet: { name: 'Set A', level_10: relic10, level_20: null, level_30: null, level_35: null } }] },
  },
  areaNames: { Forest: { '1': 'Azore Lake' } },
  markers: {
    Forest: [
      { id: 'm1', x: 26.3, y: 41.0, miscritName: 'Chimnay', miscritElement: 'Fire', miscritRarity: 'Common', exactLocationImage: 'assets/x.png' },
      { id: 'm2', x: 10, y: 10, miscritName: 'Nobody', miscritElement: 'Water', miscritRarity: 'Rare', exactLocationImage: '' },
    ],
  },
  relics: [],
  mapSizes: { Forest: { file: 'forest.webp', width: 3000, height: 2000 } },
}

test('normalizes a miscrit', () => {
  const s = normalize(raw)
  const m = s.miscrits[0]
  expect(m.names).toEqual(['Flue', 'Chimnay', 'Firebrawl', 'Afterburn'])
  expect(m.stats).toEqual({ hp: 'Strong', spd: 'Weak', ea: 'Weak', pa: 'Max', ed: 'Strong', pd: 'Strong' })
  expect(m.abilities.map(a => a.id)).toEqual([1, 48]) // ability_order
  expect(m.abilities[1].enchantDesc).toBe('+3')
  expect(m.spawns).toEqual([
    { region: 'Forest', zone: '1', days: 'all' },
    { region: 'Moon', zone: '2', days: [4, 5] },
  ])
  expect(m.perfectStat).toBe('RS')
  expect(m.relicSet).toEqual({ name: 'Set A', relicIds: [201] })
})

test('collects relics from sets', () => {
  expect(normalize(raw).relics).toEqual([
    { id: 201, name: "Woodsman's Axe Head", desc: 'x', level: 10, effect: { hp: 1, pa: 3 }, special: null, imageUrl: 'https://cdn/r1.png' },
  ])
})

test('regions: zones + map info, fallback zone names', () => {
  const s = normalize(raw)
  expect(s.regions.find(r => r.name === 'Forest')).toEqual({ name: 'Forest', zones: { '1': 'Azore Lake' }, map: { file: 'forest.webp', width: 3000, height: 2000 } })
  expect(s.regions.find(r => r.name === 'Moon')).toEqual({ name: 'Moon', zones: { '2': 'Zone 2' }, map: null })
})

test('markers matched by any evolution name; unmatched kept with null id + warning', () => {
  const s = normalize(raw)
  const [m1, m2] = s.markers.Forest
  expect(m1).toMatchObject({ id: 'm1', miscritId: 1, name: 'Chimnay', exactImg: null })
  expect(m2.miscritId).toBeNull()
  expect(s.warnings.some(w => w.includes('Nobody'))).toBe(true)
})
