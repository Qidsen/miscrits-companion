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

test('deliver picks the right API method for text, photo+buttons and albums', async () => {
  const calls: { method: string; body: Record<string, unknown> }[] = []
  const tg = new TelegramClient('T', (async (url: string, init?: RequestInit) => {
    calls.push({ method: url.split('/').pop()!, body: JSON.parse(String(init!.body)) })
    return json(200, { ok: true, result: {} })
  }) as typeof fetch, () => Promise.resolve())
  await tg.deliver({ chatId: 1, text: 'hi', buttons: [[{ text: 'Site', url: 'https://x' }]] })
  await tg.deliver({ chatId: 1, photo: 'https://x/p.jpg', caption: 'cap' })
  await tg.deliver({ chatId: 1, album: [{ photo: 'https://x/a.png', caption: 'A' }, { photo: 'https://x/b.png', caption: 'B' }] })
  expect(calls.map(c => c.method)).toEqual(['sendMessage', 'sendPhoto', 'sendMediaGroup'])
  expect(calls[0].body.reply_markup).toEqual({ inline_keyboard: [[{ text: 'Site', url: 'https://x' }]] })
  expect(calls[1].body).toMatchObject({ photo: 'https://x/p.jpg', caption: 'cap', parse_mode: 'HTML' })
  expect((calls[2].body.media as unknown[]).length).toBe(2)
})
test('a failed photo falls back to plain text so the user still gets the digest', async () => {
  const calls: string[] = []
  const tg = new TelegramClient('T', (async (url: string) => {
    const m = url.split('/').pop()!; calls.push(m)
    return m === 'sendPhoto' ? json(400, { ok: false, description: 'wrong file identifier' }) : json(200, { ok: true, result: {} })
  }) as typeof fetch, () => Promise.resolve())
  expect(await tg.deliver({ chatId: 1, photo: 'https://x/p.jpg', caption: 'cap' })).toBe('ok')
  expect(calls).toEqual(['sendPhoto', 'sendMessage'])
})
