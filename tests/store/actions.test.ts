import { beforeEach, expect, test } from 'vitest'
import { toggleCaught } from '../../src/store/actions'
import { useCollection } from '../../src/store/collection'
import { useHunt } from '../../src/store/hunt'

beforeEach(() => { useCollection.setState({ caught: [], favorites: [] }); useHunt.setState({ ids: [] }) })

test('marking a hunted miscrit as caught takes it off the hunt list', () => {
  useHunt.setState({ ids: [1, 2] })
  toggleCaught(1)
  expect(useCollection.getState().caught).toEqual([1])
  expect(useHunt.getState().ids).toEqual([2])
})

test('un-marking caught does not put it back on the hunt list', () => {
  useCollection.setState({ caught: [1], favorites: [] })
  toggleCaught(1)
  expect(useCollection.getState().caught).toEqual([])
  expect(useHunt.getState().ids).toEqual([])
})
