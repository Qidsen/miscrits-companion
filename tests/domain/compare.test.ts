import { expect, test } from 'vitest'
import { parseIds } from '../../src/domain/compare'
test('parseIds', () => {
  const k = new Set([1, 2, 3, 4, 5])
  expect(parseIds('1,2,x,2,99,3,4,5', k)).toEqual([1, 2, 3, 4])
  expect(parseIds(null, k)).toEqual([])
})
