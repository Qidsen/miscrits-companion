import { beforeEach, expect, test, vi } from 'vitest'
import { safeStorage } from '../../src/store/safeStorage'

beforeEach(() => { vi.unstubAllGlobals() })

test('works with a normal storage', () => {
  const m = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) })
  safeStorage.setItem('a', '1')
  expect(safeStorage.getItem('a')).toBe('1')
})

test('never throws when storage is blocked', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } })
  expect(safeStorage.getItem('a')).toBeNull()
  expect(() => safeStorage.setItem('a', '1')).not.toThrow()
  expect(() => safeStorage.removeItem('a')).not.toThrow()
})

test('corrupted JSON value is dropped', () => {
  vi.stubGlobal('localStorage', { getItem: () => '{not json', setItem: () => {}, removeItem: () => {} })
  expect(safeStorage.getItem('a')).toBeNull()
})
