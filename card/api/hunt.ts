import { ImageResponse } from '@vercel/og'
import type { BotData } from '../../scripts/sync/botData'
import { huntCardModel } from '../model'
import { WIDTH, cardHeight, huntCardTree } from '../render'

export const config = { runtime: 'edge' }

const SITE = 'https://qidsen.github.io/miscrits-companion/'
const font = (file: string) => fetch(new URL(`../fonts/${file}`, import.meta.url)).then(r => r.arrayBuffer())
// one file per weight with both Latin and Cyrillic (satori ignores weight when falling back between files)
const fontsP = Promise.all(([600, 800, 900] as const).map(async w => ({ name: 'Nunito', data: await font(`nunito-${w}.ttf`), weight: w, style: 'normal' as const })))

let dataP: Promise<BotData> | null = null
let dataAt = 0

/** GET /api/hunt?ids=433,546&d=3 → PNG card with the caller's hunted miscrits for game day d and where to catch them. */
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const ids = (url.searchParams.get('ids') ?? '').split(',').map(Number).filter(n => Number.isInteger(n) && n > 0).slice(0, 200)
  const day = Number(url.searchParams.get('d'))
  if (!Number.isInteger(day) || day < 0 || day > 6) return new Response('bad day', { status: 400 })
  if (!dataP || Date.now() - dataAt > 600_000) { dataAt = Date.now(); dataP = fetch(`${SITE}data/bot.json`).then(r => r.json()) }
  const model = huntCardModel(await dataP, ids, day, SITE)
  return new ImageResponse(huntCardTree(model) as never, {
    width: WIDTH, height: cardHeight(model), fonts: await fontsP, emoji: 'twemoji',
    // the URL already encodes ids + day + date, so the image can be cached hard
    headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400, immutable' },
  })
}
