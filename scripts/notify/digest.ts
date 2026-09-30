import type { ChangeEntry, Miscrit, Region } from '../../src/data/types'
import { escapeHtml } from '../../src/data/escape'
import { translate, type I18nKey } from '../../src/i18n'
import { spriteUrl } from '../../src/data/images'
import { gameDate, gameDay } from '../../src/domain/schedule'
import { exclusiveToday, groupAvailable } from '../../src/domain/today'

export interface Button { text: string; url: string }
/** One outgoing Telegram message: text, a photo with caption, or an album. */
export interface OutMsg {
  chatId: number; text?: string; photo?: string; caption?: string
  album?: { photo: string; caption: string }[]; buttons?: Button[][]
}

export interface DigestData { miscrits: Miscrit[]; regions: Region[] }

const t = (k: string, v?: Record<string, string | number>) => translate('ru', k as I18nKey, v)
const region = (name: string) => { const s = t(`region.${name}`); return s === `region.${name}` ? name : s }
const zone = (d: DigestData, r: string, z: string) => {
  const n = d.regions.find(x => x.name === r)?.zones[z] ?? `Zone ${z}`
  const m = /^Zone (\d+)$/.exec(n)
  return m ? t('zone.n', { n: m[1] }) : n
}
const e = escapeHtml
const RARE = ['Exotic', 'Legendary']

function header(now: Date) {
  return `<b>🗓 ${e(t('today.gameDay'))}: ${e(t(`dayFull.${gameDay(now)}`))}</b>`
}
function rareToday(d: DigestData, now: Date): string | null {
  const rare = exclusiveToday(d.miscrits, gameDay(now)).filter(m => RARE.includes(m.rarity))
  return rare.length ? `✨ <b>Редкие только сегодня:</b> ${rare.map(m => e(m.names[0])).join(', ')}` : null
}

const LIMIT = 3900 // Telegram rejects messages over 4096 characters

/** Cut at a line boundary and point to the site when a digest is too long for Telegram. */
export function fitMessage(text: string, siteUrl: string): string {
  if (text.length <= LIMIT) return text
  const lines = text.split('\n')
  const out: string[] = []
  let len = 0
  for (const l of lines) {
    if (len + l.length + 1 > LIMIT - 150) break
    out.push(l)
    len += l.length + 1
  }
  return `${out.join('\n')}\n… и ещё ${lines.length - out.length} строк — полный список на сайте: ${e(siteUrl)}`
}

export function personalDigest(d: DigestData, hunt: number[], now: Date, siteUrl: string): string {
  const set = new Set(hunt)
  const groups = groupAvailable(d.miscrits.filter(m => set.has(m.id)), gameDay(now))
  const lines = [header(now), '']
  if (groups.length) {
    lines.push('🎯 <b>Из твоего списка охоты сегодня:</b>')
    for (const g of groups) for (const z of g.zones)
      lines.push(`• ${z.miscrits.map(m => `<b>${e(m.names[0])}</b>`).join(', ')} — ${e(region(g.region))} · ${e(zone(d, g.region, z.zone))}`)
  } else {
    lines.push(hunt.length ? '🎯 Сегодня никого из твоего списка охоты.' : '🎯 Список охоты пуст — добавь мискритов на сайте и отправь /hunt.')
  }
  const rare = rareToday(d, now)
  if (rare) lines.push('', rare)
  lines.push('', `🔗 ${e(siteUrl)}`)
  return fitMessage(lines.join('\n'), siteUrl)
}

export function groupDigest(d: DigestData, now: Date, siteUrl: string, news: ChangeEntry[]): string {
  const byId = new Map(d.miscrits.map(m => [m.id, m]))
  const names = (ids: number[]) => ids.map(id => byId.get(id)?.names[0]).filter(Boolean).map(n => e(n!)).join(', ')
  const lines = [header(now)]
  const rare = rareToday(d, now)
  lines.push('', rare ?? '✨ Сегодня без эксклюзивных редких.')
  const added = [...new Set(news.flatMap(n => n.added ?? []))], changed = [...new Set(news.flatMap(n => n.spawnChanged ?? []))]
  const markers = news.flatMap(n => n.markersAdded ?? []).reduce((s, x) => s + x.count, 0)
  if (added.length || changed.length || markers) {
    lines.push('', '📰 <b>Новое в игре:</b>')
    if (added.length) lines.push(`• Новые мискриты: ${names(added)}`)
    if (changed.length) lines.push(`• Изменились места/дни: ${names(changed)}`)
    if (markers) lines.push(`• Новых маркеров на карте: ${markers}`)
  }
  lines.push('', `🔗 ${e(siteUrl)}`)
  return fitMessage(lines.join('\n'), siteUrl)
}

const CAPTION = 1000 // Telegram photo captions are limited to 1024 characters
const cardUrl = (siteUrl: string, now: Date) => `${siteUrl}data/cards/${gameDay(now)}.jpg?v=${gameDate(now)}`
const fitCaption = (text: string, siteUrl: string) => (text.length <= CAPTION ? text : cutCaption(text, siteUrl))
function cutCaption(text: string, siteUrl: string) {
  const lines = text.split('\n'), out: string[] = []
  let len = 0
  for (const l of lines) { if (len + l.length + 1 > CAPTION - 80) break; out.push(l); len += l.length + 1 }
  return `${out.join('\n')}\n… полный список: ${e(siteUrl)}`
}

export function personalMessages(chatId: number, d: DigestData, hunt: number[], now: Date, siteUrl: string): OutMsg[] {
  const set = new Set(hunt)
  const today = groupAvailable(d.miscrits.filter(m => set.has(m.id)), gameDay(now))
  const buttons: Button[][] = [[{ text: '🗺 Карта', url: `${siteUrl}#/map` }, { text: '🎯 Моя охота', url: `${siteUrl}#/hunt` }], [{ text: '✦ Открыть сайт', url: siteUrl }]]
  const out: OutMsg[] = [{ chatId, photo: cardUrl(siteUrl, now), caption: fitCaption(personalDigest(d, hunt, now, siteUrl), siteUrl), buttons }]
  const album = today.flatMap(g => g.zones.flatMap(z => z.miscrits.map(m => ({ photo: spriteUrl(m.names[0]), caption: `${m.names[0]} — ${region(g.region)} · ${zone(d, g.region, z.zone)}` }))))
  if (album.length) out.push({ chatId, album: album.slice(0, 10) })
  return out
}

export function groupMessages(chatId: number, d: DigestData, now: Date, siteUrl: string, news: ChangeEntry[]): OutMsg[] {
  const buttons: Button[][] = [[{ text: '✦ Открыть сайт', url: siteUrl }, { text: '📰 Что нового', url: `${siteUrl}#/news` }]]
  return [{ chatId, photo: cardUrl(siteUrl, now), caption: fitCaption(groupDigest(d, now, siteUrl, news), siteUrl), buttons }]
}
