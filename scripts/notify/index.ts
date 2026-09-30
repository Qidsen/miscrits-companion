import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ChangeEntry, Miscrit, Region } from '../../src/data/types'
import { gameDate } from '../../src/domain/schedule'
import { applyUpdate, type Reply } from './commands'
import { groupDigest, personalDigest } from './digest'
import { EMPTY_STATE, dailyTargets, decryptState, encryptState, markSent, shouldSendDaily, type BotState } from './state'
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

  // Persist after every step: a crash (or a failed push) later in the run must never cause
  // already-handled updates or already-sent digests to go out again.
  let written = JSON.stringify(before)
  const persist = () => {
    const json = JSON.stringify(state)
    if (json === written) return
    mkdirSync(join(ROOT, 'notify'), { recursive: true })
    writeFileSync(STATE_FILE, encryptState(state, key) + '\n')
    written = json
  }
  const drop = (chatId: number) => {
    state = { ...state, subs: state.subs.filter(s => s.chatId !== chatId), groups: state.groups.filter(g => g !== chatId) }
  }

  const replies: Reply[] = []
  for (const u of await tg.getUpdates(state.offset)) {
    const r = applyUpdate(state, u, { data, now, siteUrl, botName })
    state = r.state
    replies.push(...r.replies)
  }
  persist() // offset first: at worst a reply is lost, never duplicated
  for (const r of replies) if (await tg.send(r.chatId, r.text) === 'blocked') drop(r.chatId)
  persist()

  if (shouldSendDaily(state, now)) {
    const news = state.lastNewsDate === null ? [] : changelog.filter(e => !e.initial && e.date > state.lastNewsDate!)
    const { users, groups } = dailyTargets(state, now)
    const jobs = [
      ...users.map(id => ({ id, text: personalDigest(data, state.subs.find(s => s.chatId === id)?.hunt ?? [], now, siteUrl) })),
      ...groups.map(id => ({ id, text: groupDigest(data, now, siteUrl, news) })),
    ]
    for (const job of jobs) {
      const res = await tg.send(job.id, job.text)
      if (res === 'blocked') drop(job.id)
      if (res !== 'error') state = markSent(state, now, job.id) // 'error' is retried by the next run
      persist()
    }
    if (!jobs.length) state = { ...state, lastDaily: gameDate(now) } // nobody subscribed yet
    if (state.lastDaily === gameDate(now)) state = { ...state, lastNewsDate: changelog[0]?.date ?? state.lastNewsDate }
    console.log(`notify: daily digest ${jobs.length} targets, ${dailyTargets(state, now).users.length + dailyTargets(state, now).groups.length} left`)
  }

  console.log(`notify: ${replies.length} replies, ${state.subs.length} subscribers, ${state.groups.length} groups`)
  persist()
}

main().catch(e => { console.error(e); process.exit(1) })
