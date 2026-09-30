import { splitElement } from '../domain/miscrit'

export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#ff6b3d', Water: '#3aa0ff', Nature: '#4cc764', Earth: '#c98b4e',
  Wind: '#b48cff', Lightning: '#ffd23f', Physical: '#9aa4b2', Misc: '#8c96a8',
}

const colorsOf = (element: string) => {
  const parts = splitElement(element).filter(p => p in ELEMENT_COLORS)
  return parts.length ? parts.map(p => ELEMENT_COLORS[p]) : [ELEMENT_COLORS.Misc]
}

export const elementColor = (element: string) => colorsOf(element)[0]

/** Soft backdrop for cards and heroes; dual elements blend both colors. */
export function elementGradient(element: string): string {
  const [a, b = a] = colorsOf(element)
  return `linear-gradient(135deg, ${a}66 0%, ${b}26 100%)`
}
