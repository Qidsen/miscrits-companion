import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import type { Miscrit } from '../../src/data/types'
import { avatarUrl, slug, spriteUrl } from '../../src/data/images'
import { escapeHtml } from '../../src/data/escape'
import { translate, type I18nKey } from '../../src/i18n'
import { CARD_H, CARD_W, cardLayout } from './cards'
import { fetchBuffer } from './http'

const RING: Record<string, string> = { Common: '#9aa4b2', Rare: '#4fa3ff', Epic: '#b36bff', Exotic: '#ff8a3d', Legendary: '#ffd84a' }
const CACHE = join(process.cwd(), 'scripts', '.cache', 'sprites')

async function sprite(name: string, size: number): Promise<Buffer | null> {
  mkdirSync(CACHE, { recursive: true })
  const file = join(CACHE, `${slug(name)}.png`)
  let buf: Buffer | null = existsSync(file) ? readFileSync(file) : null
  if (!buf) {
    for (const url of [spriteUrl(name), avatarUrl(name)]) {
      try { buf = await fetchBuffer(url); writeFileSync(file, buf); break } catch { /* try the next image */ }
    }
  }
  return buf ? sharp(buf).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer() : null
}

const ru = (k: string) => translate('ru', k as I18nKey)

/** One 1200×630 JPEG per weekday: the rare miscrits that spawn only that day. */
export async function renderCards(miscrits: Miscrit[], outDir: string): Promise<void> {
  mkdirSync(outDir, { recursive: true })
  for (let day = 0; day < 7; day++) {
    const slots = cardLayout(miscrits, day)
    const title = `${ru('today.gameDay')}: ${ru(`dayFull.${day}`)}`
    const rings = slots.map(s => `
      <circle cx="${s.x + s.size / 2}" cy="${s.y + s.size / 2}" r="${s.size / 2 - 4}" fill="${RING[s.rarity]}22" stroke="${RING[s.rarity]}" stroke-width="4"/>
      <text x="${s.x + s.size / 2}" y="${s.y + s.size + 20}" text-anchor="middle" font-size="22" font-weight="700" fill="#eef1f7">${escapeHtml(s.name)}</text>`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
      <defs>
        <radialGradient id="a" cx="15%" cy="0%" r="80%"><stop offset="0" stop-color="#ffb547" stop-opacity=".35"/><stop offset="1" stop-color="#0b0e15" stop-opacity="0"/></radialGradient>
        <radialGradient id="b" cx="90%" cy="100%" r="70%"><stop offset="0" stop-color="#b36bff" stop-opacity=".3"/><stop offset="1" stop-color="#0b0e15" stop-opacity="0"/></radialGradient>
        <linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0b0e15"/><rect width="100%" height="100%" fill="url(#a)"/><rect width="100%" height="100%" fill="url(#b)"/>
      <text x="60" y="78" font-size="46" font-weight="800" fill="url(#t)" font-family="DejaVu Sans, Arial, sans-serif">${escapeHtml(title)}</text>
      <text x="60" y="118" font-size="24" fill="#aab4c8" font-family="DejaVu Sans, Arial, sans-serif">${slots.length ? 'Редкие мискриты, которые есть только сегодня' : 'Сегодня без эксклюзивных редких — ловим обычных!'}</text>
      <g font-family="DejaVu Sans, Arial, sans-serif">${rings}</g>
      <text x="${CARD_W - 40}" y="60" text-anchor="end" font-size="20" fill="#707c94" font-family="DejaVu Sans, Arial, sans-serif">✦ Miscrits Companion · by Qidsen</text>
    </svg>`
    const layers: sharp.OverlayOptions[] = []
    for (const s of slots) {
      const img = await sprite(s.name, s.size - 36)
      if (img) layers.push({ input: img, left: s.x + 18, top: s.y + 18 })
    }
    await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 86 }).toFile(join(outDir, `${day}.jpg`))
  }
}
