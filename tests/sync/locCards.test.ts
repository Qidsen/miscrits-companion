import { expect, test } from 'vitest'
import { mapCrop } from '../../scripts/sync/locCards'

const map = { file: 'f.webp', width: 3200, height: 2000 }
test('crop is centred on the marker and the marker position inside the crop is returned', () => {
  const c = mapCrop(map, { x: 50, y: 50 }, 1000)
  expect(c).toEqual({ left: 1100, top: 500, size: 1000, mx: 500, my: 500 })
})
test('crop is clamped to the map edges', () => {
  const c = mapCrop(map, { x: 1, y: 99 }, 1000)
  expect(c.left).toBe(0); expect(c.top).toBe(1000)
  expect(c.mx).toBe(32); expect(c.my).toBe(980)
})
test('crop never exceeds a small map', () => {
  const c = mapCrop({ file: 'f', width: 600, height: 400 }, { x: 50, y: 50 }, 1000)
  expect(c.size).toBe(400); expect(c.left).toBe(100); expect(c.top).toBe(0)
})
