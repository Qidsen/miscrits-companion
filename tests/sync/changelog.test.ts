import { expect, test } from 'vitest'
import { diffSnapshots, prependChange } from '../../scripts/sync/changelog'
import type { ChangeEntry, Marker, Miscrit, Relic, Spawn } from '../../src/data/types'

const m = (id: number, spawns: Spawn[]) => ({ id, names: [`M${id}`], spawns }) as unknown as Miscrit
const r = (id: number, effect: Record<string, number>) => ({ id, name: `R${id}`, desc: '', level: 10, effect, special: null, imageUrl: '' }) as Relic
const mk = (id: string, miscritId: number): Marker => ({ id, region: 'Forest', x: 1, y: 1, name: 'n', miscritId, rarity: 'Common', element: 'Fire', exactImg: null })

const base = { miscrits: [m(1, [{ region: 'Forest', zone: '1', days: 'all' }]), m(2, [])], relics: [r(10, { ea: 1 })], markers: { Forest: [mk('a', 1)] } }

test('first run writes an initial entry', () => {
  expect(diffSnapshots(null, base, 'D')).toMatchObject({ date: 'D', initial: true })
})
test('no changes → null', () => { expect(diffSnapshots(base, base, 'D')).toBeNull() })
test('detects additions, removals, spawn changes, markers and relics', () => {
  const next = {
    miscrits: [m(1, [{ region: 'Forest', zone: '1', days: [1] }]), m(3, [])],
    relics: [r(10, { ea: 2 }), r(11, {})],
    markers: { Forest: [mk('a', 1), mk('b', 3)] },
  }
  expect(diffSnapshots(base, next, 'D')).toEqual({
    date: 'D', added: [3], removed: [{ id: 2, name: 'M2' }], spawnChanged: [1],
    markersAdded: [{ region: 'Forest', count: 1, miscritIds: [3] }], relicsAdded: [11], relicsChanged: [10],
  })
})
test('prependChange caps the log and ignores null', () => {
  const e = { date: 'x' } as ChangeEntry
  expect(prependChange([], null)).toEqual([])
  const log = prependChange(Array(200).fill(e), { date: 'new' } as ChangeEntry)
  expect(log).toHaveLength(200); expect(log[0].date).toBe('new')
})
