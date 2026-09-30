import { expect, test } from 'vitest'
import { ELEMENT_COLORS, elementGradient } from '../../src/styles/elements'
test('every base element has a color', () => {
  for (const e of ['Fire', 'Water', 'Nature', 'Earth', 'Wind', 'Lightning', 'Physical', 'Misc']) expect(ELEMENT_COLORS[e]).toMatch(/^#[0-9a-f]{6}$/i)
})
test('gradient uses both colors for dual elements, falls back for unknown', () => {
  expect(elementGradient('FireWind')).toContain(ELEMENT_COLORS.Fire)
  expect(elementGradient('FireWind')).toContain(ELEMENT_COLORS.Wind)
  expect(elementGradient('Bogus')).toContain(ELEMENT_COLORS.Misc)
})
