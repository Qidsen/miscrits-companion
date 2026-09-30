import { expect, test } from 'vitest'
import { avatarUrl, slug, spriteUrl } from '../../src/data/images'

test('slug', () => { expect(slug('Dark Nessy')).toBe('dark_nessy') })
test('urls', () => {
  expect(avatarUrl('Dark Nessy')).toBe('https://cdn.worldofmiscrits.com/avatars/dark_nessy_avatar.png')
  expect(spriteUrl('Afterburn')).toBe('https://cdn.worldofmiscrits.com/miscrits/afterburn_back.png')
})
