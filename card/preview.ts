// Local preview: npx tsx preview.ts → ../.superpowers/hunt-card.png
import { readFileSync, writeFileSync } from 'node:fs'
import { ImageResponse } from '@vercel/og'
import { huntCardModel } from './model'
import { WIDTH, cardHeight, huntCardTree } from './render'

const data = JSON.parse(readFileSync('../public/data/bot.json', 'utf8'))
const fonts = ([600, 800, 900] as const).map(w => ({ name: 'Nunito', data: readFileSync(`fonts/nunito-${w}.ttf`), weight: w, style: 'normal' as const }))
const ids = (process.argv[2] ?? '433,546,20,94,512,5').split(',').map(Number)
const model = huntCardModel(data, ids, Number(process.argv[3] ?? 3), 'https://qidsen.github.io/miscrits-companion/')
// thumbnails aren't deployed yet during local preview: inline them
for (const t of model.tiles) if (t.thumb) t.thumb = `data:image/jpeg;base64,${readFileSync(`../public/data/locmap/${t.id}.jpg`).toString('base64')}`
const res = new ImageResponse(huntCardTree(model) as never, { width: WIDTH, height: cardHeight(model), fonts, emoji: 'twemoji' })
writeFileSync('../.superpowers/hunt-card.png', Buffer.from(await res.arrayBuffer()))
console.log('ok', model.tiles.map(t => t.name))
