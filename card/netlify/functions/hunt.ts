// Netlify Function (Node): GET /api/hunt?ids=433,546&d=3 → personalised hunt card PNG for the Telegram bot.
import { ImageResponse } from '@vercel/og'
import type { BotData } from '../../../scripts/sync/botData'
import { huntCardModel } from '../../model'
import { WIDTH, cardHeight, huntCardTree } from '../../render'

const SITE = 'https://qidsen.github.io/miscrits-companion/'
// one file per weight with both Latin and Cyrillic (satori ignores weight when falling back between files)
// served as static files of this same site (function bundles don't reliably carry extra files); loaded once per instance
let fontsP: Promise<{ name: string; data: ArrayBuffer; weight: 600 | 800 | 900; style: 'normal' }[]> | null = null
const loadFonts = (origin: string) => (fontsP ??= Promise.all(([600, 800, 900] as const).map(async w => {
  const r = await fetch(`${origin}/fonts/nunito-${w}.ttf`)
  if (!r.ok) { fontsP = null; throw new Error(`font ${w}: HTTP ${r.status}`) }
  return { name: 'Nunito', data: await r.arrayBuffer(), weight: w, style: 'normal' as const }
})))

let data: { at: number; value: Promise<BotData> } | null = null

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const ids = (url.searchParams.get('ids') ?? '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 200)
  const day = Number(url.searchParams.get('d'))
  if (!Number.isInteger(day) || day < 0 || day > 6) return new Response('bad day', { status: 400 })
  if (!data || Date.now() - data.at > 600_000) data = { at: Date.now(), value: fetch(`${SITE}data/bot.json?t=${Math.floor(Date.now() / 600_000)}`).then(r => r.json()) /* bust the Pages CDN cache */ }
  const model = huntCardModel(await data.value, ids, day, SITE)
  const png = await new ImageResponse(huntCardTree(model) as never, { width: WIDTH, height: cardHeight(model), fonts: await loadFonts(url.origin), emoji: 'twemoji' }).arrayBuffer()
  // the URL already encodes ids + day + date, so the image can be cached hard
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400, immutable', 'netlify-cdn-cache-control': 'public, max-age=86400, immutable' } })
}

export const config = { path: '/api/hunt' }
