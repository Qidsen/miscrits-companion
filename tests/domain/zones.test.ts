import { expect, test } from 'vitest'
import { convexHull, padHull, zoneShapes } from '../../src/domain/zones'
import type { Marker, Miscrit, Region } from '../../src/data/types'

test('convexHull drops interior and collinear points', () => {
  const h = convexHull([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5], [5, 0]])
  expect(h).toHaveLength(4)
  expect(h).toEqual(expect.arrayContaining([[0, 0], [10, 0], [10, 10], [0, 10]]))
})
test('convexHull of <3 unique points returns them', () => {
  expect(convexHull([[1, 1], [1, 1]])).toEqual([[1, 1]])
  expect(convexHull([])).toEqual([])
})
test('padHull pushes vertices away from center', () => {
  const [p] = padHull([[10, 0]], [0, 0], 2)
  expect(p[0]).toBeCloseTo(12)
})

const region: Region = { name: 'Forest', zones: { '1': 'Azore Lake', '2': 'Axe' }, map: { file: 'f', width: 100, height: 100 } }
const mc = (id: number, zones: string[]) => ({ id, spawns: zones.map(zone => ({ region: 'Forest', zone, days: 'all' })) }) as unknown as Miscrit
const byId = new Map([[1, mc(1, ['1'])], [2, mc(2, ['2'])], [3, mc(3, ['1', '2'])]])
const mk = (id: string, miscritId: number | null, x: number, y: number): Marker => ({ id, region: 'Forest', x, y, name: 'n', miscritId, rarity: 'Common', element: 'Fire', exactImg: null })

test('zoneShapes: polygon for ≥3 markers, circle for 1, skips ambiguous and unknown', () => {
  const shapes = zoneShapes(region, [mk('a', 1, 10, 10), mk('b', 1, 30, 10), mk('c', 1, 20, 30), mk('d', 2, 70, 70), mk('e', 3, 50, 50), mk('f', null, 5, 5)], byId)
  expect(shapes.map(s => s.zone)).toEqual(['1', '2'])
  expect(shapes[0].name).toBe('Azore Lake')
  expect(shapes[0].hull.length).toBeGreaterThanOrEqual(3)
  expect(shapes[0].markerIds.sort()).toEqual(['a', 'b', 'c'])
  expect(shapes[1].hull).toEqual([])
  expect(shapes[1].radius).toBeGreaterThan(0)
  expect(shapes[1].center).toEqual([70, 70])
  for (const s of shapes) for (const [x, y] of [...s.hull, s.center]) { expect(Number.isFinite(x)).toBe(true); expect(Number.isFinite(y)).toBe(true) }
})
test('zoneShapes: no markers → []', () => { expect(zoneShapes(region, [], byId)).toEqual([]) })
test('two markers → circle covering both', () => {
  const [s] = zoneShapes(region, [mk('a', 1, 10, 10), mk('b', 1, 30, 10)], byId)
  expect(s.hull).toEqual([])
  expect(s.center).toEqual([20, 10])
  expect(s.radius).toBeGreaterThanOrEqual(10)
})

test('circle radius is measured in map pixels, so tall maps still cover their markers', () => {
  const tall: Region = { name: 'Forest', zones: { '1': 'A' }, map: { file: 'f', width: 100, height: 300 } }
  const [s] = zoneShapes(tall, [mk('a', 1, 50, 10), mk('b', 1, 50, 20)], byId)
  expect(s.radiusPx).toBeGreaterThanOrEqual(15) // half of 10% of 300px
})
