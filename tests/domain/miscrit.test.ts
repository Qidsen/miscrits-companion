import { expect, test } from 'vitest'
import { sortRegions, splitElement } from '../../src/domain/miscrit'

test('splitElement', () => {
  expect(splitElement('Fire')).toEqual(['Fire'])
  expect(splitElement('FireWind')).toEqual(['Fire', 'Wind'])
  expect(splitElement('NatureLightning')).toEqual(['Nature', 'Lightning'])
})
test('sortRegions puts known order first, unknown last alphabetically', () => {
  expect(sortRegions(['Moon', 'Zeta', 'Forest', 'Alpha'])).toEqual(['Forest', 'Moon', 'Alpha', 'Zeta'])
})
