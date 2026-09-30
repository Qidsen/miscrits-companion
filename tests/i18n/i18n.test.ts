import { expect, test } from 'vitest'
import { translate } from '../../src/i18n'

test('interpolates vars', () => {
  expect(translate('en', 'today.count', { n: 5 })).toBe('5 available')
  expect(translate('ru', 'today.count', { n: 5 })).toBe('Доступно: 5')
})
test('every ru key exists in en and vice versa', async () => {
  const { en } = await import('../../src/i18n/en')
  const { ru } = await import('../../src/i18n/ru')
  expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort())
})

import { elementLabel, zoneLabel, controlLabel } from '../../src/i18n'
test('game term labels', () => {
  const ru = (k: string, v?: Record<string, string | number>) => translate('ru', k as never, v)
  expect(elementLabel(ru, 'Fire')).toBe('Огонь')
  expect(elementLabel(ru, 'FireWind')).toBe('Огонь/Ветер')
  expect(zoneLabel(ru, 'Zone 3')).toBe('Зона 3')
  expect(zoneLabel(ru, 'Azore Lake')).toBe('Azore Lake')
  expect(controlLabel(ru, 'Sleep')).toBe('Сон')
  expect(controlLabel(ru, 'Weird')).toBe('Weird')
})
