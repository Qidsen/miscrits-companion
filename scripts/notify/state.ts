import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { gameDate } from '../../src/domain/schedule'

export interface Sub { chatId: number; name: string; hunt: number[] }
export interface BotState { v: 1; offset: number; lastDaily: string | null; subs: Sub[]; groups: number[]; lastNewsDate: string | null }
export const EMPTY_STATE: BotState = { v: 1, offset: 0, lastDaily: null, subs: [], groups: [], lastNewsDate: null }

const keyOf = (b64: string) => {
  const k = Buffer.from(b64, 'base64')
  if (k.length !== 32) throw new Error('NOTIFY_KEY must be 32 bytes, base64')
  return k
}

/** AES-256-GCM, "iv.tag.data" in base64 — chat ids never land in the public repo in plaintext. */
export function encryptState(s: BotState, keyB64: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', keyOf(keyB64), iv)
  const data = Buffer.concat([c.update(JSON.stringify(s), 'utf8'), c.final()])
  return [iv, c.getAuthTag(), data].map(b => b.toString('base64')).join('.')
}

/** Throws on a wrong key or a damaged file (GCM authentication) — callers must not overwrite state then. */
export function decryptState(blob: string, keyB64: string): BotState {
  const [iv, tag, data] = blob.trim().split('.').map(p => Buffer.from(p, 'base64'))
  if (!iv || !tag || !data || iv.length !== 12 || tag.length !== 16) throw new Error('state file is corrupted')
  const d = createDecipheriv('aes-256-gcm', keyOf(keyB64), iv)
  d.setAuthTag(tag)
  const s = JSON.parse(Buffer.concat([d.update(data), d.final()]).toString('utf8')) as BotState
  return { ...EMPTY_STATE, ...s }
}

export const shouldSendDaily = (s: BotState, now: Date) => s.lastDaily !== gameDate(now)
