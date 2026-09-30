import type { Miscrit } from '../../src/data/types'
import { RARITY_ORDER } from '../../src/domain/miscrit'
import { exclusiveToday } from '../../src/domain/today'

export const CARD_W = 1200
export const CARD_H = 630
const SLOT = 250
const COLS = 4

export interface CardSlot { id: number; name: string; rarity: string; x: number; y: number; size: number }

/** Which miscrits go on a weekday card and where: day-only spawns, rarest first, max 8 in a 4×2 grid. */
export function cardLayout(miscrits: Miscrit[], day: number): CardSlot[] {
  const pick = exclusiveToday(miscrits, day)
    .filter(m => ['Legendary', 'Exotic', 'Epic'].includes(m.rarity))
    .sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.id - b.id)
    .slice(0, 8)
  const rows = Math.ceil(pick.length / COLS)
  return pick.map((m, i) => {
    const row = Math.floor(i / COLS), col = i % COLS
    const inRow = row === rows - 1 ? pick.length - row * COLS : COLS
    const left = (CARD_W - inRow * SLOT) / 2
    const size = 190
    return { id: m.id, name: m.names[0], rarity: m.rarity, x: Math.round(left + col * SLOT + (SLOT - size) / 2), y: 138 + row * 238, size }
  })
}
