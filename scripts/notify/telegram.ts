import type { TgUpdate } from './commands'
import type { OutMsg } from './digest'

type Sleep = (ms: number) => Promise<void>
const realSleep: Sleep = ms => new Promise(r => setTimeout(r, ms))

/** Minimal Bot API client. fetch/sleep are injectable for tests. */
export class TelegramClient {
  private token: string
  private fetchImpl: typeof fetch
  private sleep: Sleep
  constructor(token: string, fetchImpl: typeof fetch = fetch, sleep: Sleep = realSleep) {
    this.token = token; this.fetchImpl = fetchImpl; this.sleep = sleep
  }

  private async call(method: string, body: unknown, tries = 3): Promise<{ status: number; data: { ok: boolean; result?: unknown; description?: string; parameters?: { retry_after?: number } } }> {
    for (let i = 0; ; i++) {
      let status = 0
      let data: { ok: boolean; result?: unknown; description?: string; parameters?: { retry_after?: number } }
      try {
        // call unbound: Workers throw "Illegal invocation" when fetch runs with `this` = our object
        const doFetch = this.fetchImpl
        const res = await doFetch(`https://api.telegram.org/bot${this.token}/${method}`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
        })
        status = res.status
        data = await res.json()
      } catch (e) {
        // network error, timeout or a non-JSON body (e.g. an HTML 502): a transient failure, never a crash
        data = { ok: false, description: (e as Error).message }
      }
      const transient = status === 0 || status >= 500
      if ((status === 429 || transient) && i < tries - 1) { await this.sleep(((data.parameters?.retry_after ?? 1) + 0.5) * 1000); continue }
      return { status, data }
    }
  }

  async getUpdates(offset: number): Promise<TgUpdate[]> {
    const { data } = await this.call('getUpdates', { offset, timeout: 0, allowed_updates: ['message', 'my_chat_member'] })
    if (!data.ok) { console.warn(`getUpdates failed: ${data.description}`); return [] }
    return data.result as TgUpdate[]
  }

  /** 'blocked' when the user blocked the bot or the chat is gone (caller unsubscribes them). */
  async send(chatId: number, text: string): Promise<'ok' | 'blocked' | 'error'> {
    return this.deliver({ chatId, text })
  }

  /** Send one OutMsg (text / photo+caption / album) with optional inline buttons. */
  async deliver(m: OutMsg): Promise<'ok' | 'blocked' | 'error'> {
    const markup = m.buttons?.length ? { reply_markup: { inline_keyboard: m.buttons } } : {}
    let res
    if (m.album?.length) {
      res = await this.call('sendMediaGroup', { chat_id: m.chatId, media: m.album.map(a => ({ type: 'photo', media: a.photo, caption: a.caption })) })
    } else if (m.photo) {
      res = await this.call('sendPhoto', { chat_id: m.chatId, photo: m.photo, caption: m.caption, parse_mode: 'HTML', ...markup })
      // Telegram couldn't fetch the image: still deliver the words
      if (!res.data.ok && res.status === 400 && !/chat not found/i.test(res.data.description ?? '')) return this.deliver({ chatId: m.chatId, text: m.caption ?? '', buttons: m.buttons })
    } else {
      res = await this.call('sendMessage', { chat_id: m.chatId, text: m.text ?? '', parse_mode: 'HTML', disable_web_page_preview: true, ...markup })
    }
    const { status, data } = res
    if (data.ok) return 'ok'
    if (status === 403 || (status === 400 && /chat not found/i.test(data.description ?? ''))) return 'blocked'
    console.warn(`send to chat failed: ${status} ${data.description}`)
    return 'error'
  }

  async webhookInfo() {
    return (await this.call('getWebhookInfo', {})).data
  }

  async setWebhook(url: string, secret: string) {
    return (await this.call('setWebhook', { url, secret_token: secret, allowed_updates: ['message', 'my_chat_member'], max_connections: 1, drop_pending_updates: false })).data
  }
}
