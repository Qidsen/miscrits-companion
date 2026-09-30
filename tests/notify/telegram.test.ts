import { expect, test } from 'vitest'
import { TelegramClient } from '../../scripts/notify/telegram'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

test('retries after 429 using retry_after', async () => {
  const calls: string[] = []
  const responses = [json(429, { ok: false, parameters: { retry_after: 0 } }), json(200, { ok: true, result: { message_id: 1 } })]
  const tg = new TelegramClient('T', (async (url: string) => { calls.push(url); return responses.shift()! }) as typeof fetch, () => Promise.resolve())
  expect(await tg.send(5, 'hi')).toBe('ok')
  expect(calls).toHaveLength(2)
  expect(calls[0]).toContain('/botT/sendMessage')
})
test('403 means the user blocked the bot', async () => {
  const tg = new TelegramClient('T', (async () => json(403, { ok: false, description: 'Forbidden: bot was blocked by the user' })) as typeof fetch, () => Promise.resolve())
  expect(await tg.send(5, 'hi')).toBe('blocked')
})
test('getUpdates returns the result list', async () => {
  const tg = new TelegramClient('T', (async () => json(200, { ok: true, result: [{ update_id: 3 }] })) as typeof fetch, () => Promise.resolve())
  expect(await tg.getUpdates(0)).toEqual([{ update_id: 3 }])
})

test('network errors and non-JSON replies never throw', async () => {
  const boom = new TelegramClient('T', (async () => { throw new Error('fetch failed') }) as typeof fetch, () => Promise.resolve())
  expect(await boom.send(5, 'hi')).toBe('error')
  expect(await boom.getUpdates(0)).toEqual([])
  const html = new TelegramClient('T', (async () => new Response('<html>502</html>', { status: 502 })) as typeof fetch, () => Promise.resolve())
  expect(await html.send(5, 'hi')).toBe('error')
})
