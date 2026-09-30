import { useCollection } from './collection'
import { useHunt } from './hunt'

/** Toggle "caught"; catching a miscrit also finishes its hunt (un-marking never re-adds it). */
export function toggleCaught(id: number): void {
  const wasCaught = useCollection.getState().caught.includes(id)
  useCollection.getState().toggleCaught(id)
  if (!wasCaught) useHunt.getState().remove([id])
}
