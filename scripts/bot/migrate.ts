// One-off: move subscribers from the old GitHub Actions bot (notify/state.enc) into the Cloudflare Worker.
import { existsSync, readFileSync } from 'node:fs'
import { decryptState } from '../notify/crypto'

const { NOTIFY_KEY, BOT_ADMIN_TOKEN, WORKER_URL = 'https://miscrits-bot.yaros1406.workers.dev' } = process.env
if (!NOTIFY_KEY || !BOT_ADMIN_TOKEN) throw new Error('NOTIFY_KEY and BOT_ADMIN_TOKEN are required')
if (!existsSync('notify/state.enc')) { console.log('nothing to migrate'); process.exit(0) }
const s = decryptState(readFileSync('notify/state.enc', 'utf8'), NOTIFY_KEY)
const res = await fetch(`${WORKER_URL}/admin/import`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'X-Admin-Token': BOT_ADMIN_TOKEN },
  body: JSON.stringify({ subs: s.subs, groups: s.groups, owner: s.owner ?? null }),
})
console.log('import:', res.status, await res.text()) // counts only, never chat ids
if (!res.ok) process.exit(1)
