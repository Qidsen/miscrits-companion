/// <reference types="@cloudflare/workers-types" />
import type { ChangeEntry } from '../src/data/types'
import { expandBotData, type BotData } from '../scripts/sync/botData'
import type { DigestData } from '../scripts/notify/digest'
import { EMPTY_STATE, type BotState } from '../scripts/notify/state'
import { TelegramClient } from '../scripts/notify/telegram'
import { handleUpdate, importState, runDaily, type BotDeps } from './handlers'

interface Env {
  STATE: KVNamespace
  TELEGRAM_TOKEN: string; WEBHOOK_SECRET: string; ADMIN_TOKEN: string
  SITE_URL: string; BOT_USERNAME: string
}

// data lives on GitHub Pages; cached per isolate for 10 minutes (the Worker never parses the big miscrits.json)
let cache: { at: number; value: { data: DigestData; changelog: ChangeEntry[] } } | null = null
async function siteData(site: string) {
  if (cache && Date.now() - cache.at < 600_000) return cache.value
  const [bot, changelog] = await Promise.all([
    fetch(`${site}data/bot.json`).then(r => r.json() as Promise<BotData>),
    fetch(`${site}data/changelog.json`).then(r => (r.ok ? r.json() as Promise<ChangeEntry[]> : [])).catch(() => [] as ChangeEntry[]),
  ])
  cache = { at: Date.now(), value: { data: expandBotData(bot), changelog } }
  return cache.value
}

function deps(env: Env): BotDeps {
  const tg = new TelegramClient(env.TELEGRAM_TOKEN)
  return {
    loadState: async () => ({ ...EMPTY_STATE, ...((await env.STATE.get<BotState>('state', 'json')) ?? {}) }),
    saveState: s => env.STATE.put('state', JSON.stringify(s)),
    data: () => siteData(env.SITE_URL),
    deliver: m => tg.deliver(m),
    now: () => new Date(),
    siteUrl: env.SITE_URL, botName: env.BOT_USERNAME, adminToken: env.ADMIN_TOKEN,
  }
}

const safeEqual = (a: string | null, b: string) => !!a && a.length === b.length && [...a].reduce((acc, c, i) => acc | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (pathname === '/health') return new Response('ok')
    if (req.method === 'POST' && pathname === '/tg') {
      // only Telegram knows the secret passed to setWebhook
      if (!safeEqual(req.headers.get('X-Telegram-Bot-Api-Secret-Token'), env.WEBHOOK_SECRET)) return new Response('forbidden', { status: 403 })
      await handleUpdate(deps(env), await req.json())
      return new Response('ok')
    }
    if (req.method === 'POST' && pathname === '/admin/import') {
      if (!safeEqual(req.headers.get('X-Admin-Token'), env.ADMIN_TOKEN)) return new Response('forbidden', { status: 403 })
      const s = await importState(deps(env), await req.json())
      return Response.json({ subs: s.subs.length, groups: s.groups.length })
    }
    if (req.method === 'POST' && pathname === '/admin/set-webhook') {
      if (!safeEqual(req.headers.get('X-Admin-Token'), env.ADMIN_TOKEN)) return new Response('forbidden', { status: 403 })
      // the worker registers its own URL, so the bot token never has to leave Cloudflare
      const hook = `${new URL(req.url).origin}/tg`
      const res = await new TelegramClient(env.TELEGRAM_TOKEN).setWebhook(hook, env.WEBHOOK_SECRET)
      return Response.json(res)
    }
    return new Response('Miscrits Companion bot', { status: 404 })
  },
  async scheduled(_e: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runDaily(deps(env)))
  },
}
