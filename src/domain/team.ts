import type { Miscrit } from '../data/types'
import { multiplier } from './elements'
import { FORMULA } from './formulaConfig'
import { BASE_ELEMENTS } from './miscrit'

export interface TeamSlot { id: number; level: number }
export const CONTROL_TYPES = ['Sleep', 'Confuse', 'Paralyze', 'Poison', 'Dot', 'Bleed', 'Heal', 'Hot', 'Negate', 'Antiheal', 'Block', 'Cleanser']
const DEFAULT_LEVEL = 30

export const encodeTeam = (slots: TeamSlot[]) => slots.map(s => `${s.id}.${s.level}`).join('~')

export function decodeTeam(s: string, known: Set<number>): TeamSlot[] {
  const out: TeamSlot[] = []
  for (const part of s.split('~')) {
    if (out.length === 4) break
    const [idStr, lvStr] = part.split('.')
    const id = Number(idStr)
    if (!/^\d+$/.test(idStr ?? '') || !known.has(id) || out.some(x => x.id === id)) continue
    const lv = /^\d+$/.test(lvStr ?? '') ? Number(lvStr) : DEFAULT_LEVEL
    out.push({ id, level: Math.min(FORMULA.maxLevel, Math.max(1, lv)) })
  }
  return out
}

const attackElements = (m: Miscrit) => [...new Set(m.abilities.filter(a => a.type === 'Attack' && (a.ap ?? 0) > 0).map(a => a.element))]

export function offenseCoverage(team: Miscrit[]): Record<string, number> {
  const els = [...new Set(team.flatMap(attackElements))]
  return Object.fromEntries(BASE_ELEMENTS.map(d => [d, els.length ? Math.max(...els.map(a => multiplier(a, d))) : 0]))
}

export function defenseWeakness(team: Miscrit[]): Record<string, number> {
  return Object.fromEntries(BASE_ELEMENTS.map(a => [a, team.filter(m => multiplier(a, m.element) > 1).length]))
}

export function controlSummary(team: Miscrit[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const m of team) for (const type of new Set(m.abilities.map(a => a.type))) if (CONTROL_TYPES.includes(type)) out[type] = (out[type] ?? 0) + 1
  return out
}
