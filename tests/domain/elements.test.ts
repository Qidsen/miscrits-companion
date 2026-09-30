import { expect, test } from 'vitest'
import { multiplier, strongAgainst, weakAgainst } from '../../src/domain/elements'
test('cycles', () => {
  expect(multiplier('Fire', 'Nature')).toBe(1.5)
  expect(multiplier('Nature', 'Fire')).toBe(0.5)
  expect(multiplier('Water', 'Fire')).toBe(1.5)
  expect(multiplier('Earth', 'Lightning')).toBe(1.5)
  expect(multiplier('Lightning', 'Wind')).toBe(1.5)
  expect(multiplier('Wind', 'Earth')).toBe(1.5)
  expect(multiplier('Fire', 'Earth')).toBe(1)
  expect(multiplier('Fire', 'Fire')).toBe(1)
})
test('neutral attack types and dual defenders', () => {
  expect(multiplier('Physical', 'Nature')).toBe(1)
  expect(multiplier('Misc', 'Water')).toBe(1)
  expect(multiplier('Fire', 'NatureWind')).toBe(1.5)
  expect(multiplier('Fire', 'NatureWater')).toBe(0.75)
  expect(multiplier('Lightning', 'WaterWind')).toBe(1.5)
})
test('chart helpers', () => {
  expect(strongAgainst('Fire')).toEqual(['Nature'])
  expect(weakAgainst('Fire')).toEqual(['Water'])
})
