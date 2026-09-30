import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ChangeEntry, Miscrit, Region } from '../../src/data/types'
import { gameDate } from '../../src/domain/schedule'
import { applyUpdate, type Reply } from './commands'
import { groupDigest, personalDigest } from './digest'
import { EMPTY_STATE, decryptState, encryptState, shouldSendDaily, type BotState } from './state'
import { TelegramClient } from './telegram'

const ROOT = process.cwd()
const STATE_FILE = join(ROOT, 'notify', 'state.enc')
const DATA = join(ROOT, 'public', 'data')
const readJson = <T>(file: string, fallback: T): T => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as T : fallback)

async function main() {
  const { TELEGRAM_TOKEN: token, NOTIFY_KEY: key } = process.env
  if (!token || !key) { console.log('notify: disabled (TELEGRAM_TOKEN / NOTIFY_KEY not set)'); return }
  const siteUrl = process.env.SITE_URL || 'https://qidsen.github.io/miscrits-companion/'
  const botName = process.env.BOT_USERNAME || ''

  // a decrypt failure throws here on purpose: never overwrite subscribers with an empty state
  const before = existsSync(STATE_FILE) ? decryptState(readFileSync(STATE_FILE, 'utf8'), key) : EMPTY_STATE
  let state: BotState = before
  const data = { miscrits: readJson<Miscrit[]>(join(DATA, 'miscrits.json'), []), regions: readJson<Region[]>(join(DATA, 'regions.json'), []) }
  const changelog = readJson<ChangeEntry[]>(join(DATA, 'changelog.json'), [])
  const now = new Date()
  const tg = new TelegramClient(token)

  const replies: Reply[] = []
  for (const u of await tg.getUpdates(state.offset)) {
    const r = applyUpdate(state, u, { data, now, siteUrl, botName })
    state = r.state
    replies.push(...r.replies)
  }
  const deliver = async (chatId: number, text: string) => {
    if (await tg.send(chatId, text) === 'blocked') {
      state = { ...state, subs: state.subs.filter(s => s.chatId !== chatId), groups: state.groups.filter(g => g !== chatId) }
    }
  }
  for (const r of replies) await deliver(r.chatId, r.text)

  if (shouldSendDaily(state, now)) {
    const news = state.lastNewsDate === null ? [] : changelog.filter(e => !e.initial && e.date > state.lastNewsDate!)
    for (const s of [...state.subs]) await deliver(s.chatId, personalDigest(data, s.hunt, now, siteUrl))
    for (const g of [...state.groups]) await deliver(g, groupDigest(data, now, siteUrl, news))
    state = { ...state, lastDaily: gameDate(now), lastNewsDate: changelog[0]?.date ?? state.lastNewsDate }
    console.log(`notify: daily sent to ${state.subs.length} users, ${state.groups.length} groups`)
  }

  console.log(`notify: ${replies.length} replies, ${state.subs.length} subscribers, ${state.groups.length} groups`)
  if (JSON.stringify(state) !== JSON.stringify(before)) {
    mkdirSync(join(ROOT, 'notify'), { recursive: true })
    writeFileSync(STATE_FILE, encryptState(state, key) + '\n')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
