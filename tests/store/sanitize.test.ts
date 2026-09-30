import { expect, test } from 'vitest'
import { sanitizeCollection, sanitizeSettings } from '../../src/store/sanitize'
import { translate } from '../../src/i18n'

test('sanitizeSettings drops unknown lang', () => {
  expect(sanitizeSettings({ lang: 'de' })).toEqual({ lang: 'ru' })
  expect(sanitizeSettings({ lang: 'en' })).toEqual({ lang: 'en' })
  expect(sanitizeSettings(null)).toEqual({ lang: 'ru' })
})
test('sanitizeCollection keeps only number arrays', () => {
  expect(sanitizeCollection({ caught: {}, favorites: [1, 'x', 2] })).toEqual({ caught: [], favorites: [1, 2] })
  expect(sanitizeCollection('junk')).toEqual({ caught: [], favorites: [] })
})
test('translate falls back to en for unknown lang', () => {
  expect(translate('de' as never, 'loading')).toBe('Loading…')
})
