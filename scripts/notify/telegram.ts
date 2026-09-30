import type { TgUpdate } from './commands'

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
        const res = await this.fetchImpl(`https://api.telegram.org/bot${this.token}/${method}`, {
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
    const { status, data } = await this.call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
    if (data.ok) return 'ok'
    if (status === 403 || (status === 400 && /chat not found/i.test(data.description ?? ''))) return 'blocked'
    console.warn(`send to chat failed: ${status} ${data.description}`)
    return 'error'
  }
}
