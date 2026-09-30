/// <reference types="@cloudflare/workers-types" />
import type { ChangeEntry } from '../src/data/types'
import { expandBotData, type BotData } from '../scripts/sync/botData'
import type { DigestData } from '../scripts/notify/digest'
import { EMPTY_STATE, type BotState } from '../scripts/notify/state'
import { TelegramClient } from '../scripts/notify/telegram'
import { gameDay } from '../src/domain/schedule'
import { handleUpdate, importState, linkStatus, runDaily, syncHunt, type BotDeps } from './handlers'

interface Env {
  STATE: KVNamespace
  TELEGRAM_TOKEN: string; WEBHOOK_SECRET: string; ADMIN_TOKEN: string
  SITE_URL: string; BOT_USERNAME: string; CARD_URL?: string
}

// data lives on GitHub Pages; cached per isolate for 10 minutes (the Worker never parses the big miscrits.json)
let cache: { at: number; value: { data: DigestData; changelog: ChangeEntry[] } } | null = null
async function siteData(site: string) {
  if (cache && Date.now() - cache.at < 600_000) return cache.value
  const [bot, changelog] = await Promise.all([
    fetch(`${site}data/bot.json?t=${Math.floor(Date.now() / 600_000)}`) /* bust the Pages CDN cache */.then(r => r.json() as Promise<BotData>),
    fetch(`${site}data/changelog.json?t=${Math.floor(Date.now() / 600_000)}`).then(r => (r.ok ? r.json() as Promise<ChangeEntry[]> : [])).catch(() => [] as ChangeEntry[]),
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
    siteUrl: env.SITE_URL, botName: env.BOT_USERNAME, adminToken: env.ADMIN_TOKEN, cardUrl: env.CARD_URL || undefined,
  }
}

const safeEqual = (a: string | null, b: string) => !!a && a.length === b.length && [...a].reduce((acc, c, i) => acc | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0

// the site (GitHub Pages) and local dev may call the /link endpoints from the browser
const ALLOWED = ['https://qidsen.github.io', 'http://localhost:5173', 'http://localhost:4173']
const cors = (req: Request): Record<string, string> => {
  const o = req.headers.get('Origin') ?? ''
  return ALLOWED.includes(o) ? { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' } : {}
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const { pathname } = url
    if (pathname === '/health') return new Response('ok')
    if (pathname.startsWith('/link/')) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
      if (req.method === 'GET' && pathname === '/link/status') return Response.json(await linkStatus(deps(env), url.searchParams.get('token') ?? ''), { headers: cors(req) })
      if (req.method === 'POST' && pathname === '/link/sync') {
        const body = await req.json().catch(() => ({})) as { token?: string; hunt?: unknown[] }
        return Response.json(await syncHunt(deps(env), String(body.token ?? ''), Array.isArray(body.hunt) ? body.hunt : []), { headers: cors(req) })
      }
    }
    if (req.method === 'POST' && pathname === '/tg') {
      // only Telegram knows the secret passed to setWebhook
      if (!safeEqual(req.headers.get('X-Telegram-Bot-Api-Secret-Token'), env.WEBHOOK_SECRET)) return new Response('forbidden', { status: 403 })
      await handleUpdate(deps(env), await req.json())
      return new Response('ok')
    }
    if (req.method === 'POST' && pathname === '/admin/import') {
      if (!safeEqual(req.headers.get('X-Admin-Token'), env.ADMIN_TOKEN)) return new Response('forbidden', { status: 403 })
      const s = await importState(deps(env), await req.json())
      const { data } = await siteData(env.SITE_URL)
      const day = gameDay(new Date())
      const byId = new Map(data.miscrits.map(m => [m.id, m]))
      const hunts = s.subs.map(x => ({ hunt: x.hunt.length, today: x.hunt.map(id => byId.get(id)).filter(m => m && m.spawns.some(sp => sp.days === 'all' || sp.days.includes(day))).map(m => m!.names[0]) }))
      return Response.json({ hunts, subs: s.subs.length, groups: s.groups.length })
    }
    if (req.method === 'GET' && pathname === '/admin/status') {
      if (!safeEqual(req.headers.get('X-Admin-Token'), env.ADMIN_TOKEN)) return new Response('forbidden', { status: 403 })
      const s = await deps(env).loadState()
      const info = (await new TelegramClient(env.TELEGRAM_TOKEN).webhookInfo()).result as Record<string, unknown> | undefined
      // counts and webhook health only — no chat ids
      const { data } = await siteData(env.SITE_URL)
      const day = gameDay(new Date())
      const byId = new Map(data.miscrits.map(m => [m.id, m]))
      const hunts = s.subs.map(x => ({ hunt: x.hunt.length, today: x.hunt.map(id => byId.get(id)).filter(m => m && m.spawns.some(sp => sp.days === 'all' || sp.days.includes(day))).map(m => m!.names[0]) }))
      return Response.json({ hunts, subs: s.subs.length, groups: s.groups.length, owner: s.owner !== null, lastDaily: s.lastDaily,
        webhook: { pending: info?.pending_update_count, lastError: info?.last_error_message ?? null, url: String(info?.url ?? '').replace(/\/tg$/, '/tg') } })
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
