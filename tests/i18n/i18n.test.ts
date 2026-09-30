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
