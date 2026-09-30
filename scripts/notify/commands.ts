import { decodeIds } from '../../src/domain/collection'
import { groupDigest, personalDigest, type DigestData } from './digest'
import type { BotState } from './state'

export interface TgChat { id: number; type: 'private' | 'group' | 'supergroup' | 'channel' }
export interface TgUpdate {
  update_id: number
  message?: { chat: TgChat; text?: string; from?: { first_name?: string } }
  my_chat_member?: { chat: TgChat; new_chat_member: { status: string } }
}
export interface Reply { chatId: number; text: string }
interface Ctx { data: DigestData; now: Date; siteUrl: string; botName: string }

const MAX_SUBS = 500
const isGroup = (c: TgChat) => c.type === 'group' || c.type === 'supergroup'

function help(siteUrl: string) {
  return [
    '👋 Я бот Miscrits Companion.',
    'Каждый день после 03:00 по Киеву пришлю сводку: игровой день, редкие дня и кто из твоего списка охоты доступен.',
    '',
    `1. Добавь мискритов в «Охоту» на сайте: ${siteUrl}#/hunt`,
    '2. Скопируй там команду /hunt … и отправь мне.',
    '',
    '/today — сводка сейчас · /stop — отписаться',
  ].join('\n')
}

/** Pure reducer: one Telegram update → new state + replies. Never throws on user input. */
export function applyUpdate(s: BotState, u: TgUpdate, ctx: Ctx): { state: BotState; replies: Reply[] } {
  let state: BotState = { ...s, offset: Math.max(s.offset, u.update_id + 1) }
  const replies: Reply[] = []

  if (u.my_chat_member) {
    const { chat, new_chat_member } = u.my_chat_member
    const inChat = ['member', 'administrator', 'creator'].includes(new_chat_member.status)
    if (isGroup(chat)) state = { ...state, groups: inChat ? [...new Set([...state.groups, chat.id])] : state.groups.filter(g => g !== chat.id) }
    else if (!inChat) state = { ...state, subs: state.subs.filter(x => x.chatId !== chat.id) } // user blocked the bot
    return { state, replies }
  }

  const msg = u.message
  if (!msg?.text) return { state, replies }
  const [rawCmd, ...args] = msg.text.trim().split(/\s+/)
  // "/cmd@bot" in groups: strip our own name, or any suffix when the name is not configured
  const cmd = rawCmd.toLowerCase().replace(ctx.botName ? new RegExp(`@${ctx.botName.toLowerCase()}$`) : /@\w+$/, '')
  const chatId = msg.chat.id
  const known = new Set(ctx.data.miscrits.map(m => m.id))

  if (isGroup(msg.chat)) {
    if (cmd === '/subscribe') {
      state = { ...state, groups: [...new Set([...state.groups, chatId])] }
      replies.push({ chatId, text: '✅ Группа подписана на ежедневную сводку.' })
    } else if (cmd === '/unsubscribe') {
      state = { ...state, groups: state.groups.filter(g => g !== chatId) }
      replies.push({ chatId, text: '👋 Сводки для группы выключены.' })
    } else if (cmd === '/today') {
      replies.push({ chatId, text: groupDigest(ctx.data, ctx.now, ctx.siteUrl, []) })
    }
    return { state, replies } // ignore everything else: no spam in groups
  }

  if (cmd === '/hunt') {
    const ids = args[0] ? decodeIds(args[0])?.filter(id => known.has(id)) : null
    if (!ids || !ids.length) {
      replies.push({ chatId, text: '⚠️ Не получилось прочитать список. Скопируй команду /hunt … на сайте в разделе «Охота».' })
      return { state, replies }
    }
    const others = state.subs.filter(x => x.chatId !== chatId)
    if (others.length >= MAX_SUBS) {
      replies.push({ chatId, text: '⚠️ Сейчас слишком много подписчиков, попробуй позже.' })
      return { state, replies }
    }
    state = { ...state, subs: [...others, { chatId, name: (msg.from?.first_name ?? '').slice(0, 40), hunt: ids }] }
    replies.push({ chatId, text: `✅ Готово! В списке охоты: ${ids.length}. Сводка — каждый день после 03:00 по Киеву.\n\n${personalDigest(ctx.data, ids, ctx.now, ctx.siteUrl)}` })
  } else if (cmd === '/today') {
    replies.push({ chatId, text: personalDigest(ctx.data, state.subs.find(x => x.chatId === chatId)?.hunt ?? [], ctx.now, ctx.siteUrl) })
  } else if (cmd === '/stop') {
    state = { ...state, subs: state.subs.filter(x => x.chatId !== chatId) }
    replies.push({ chatId, text: '👋 Отписал. Вернуться — снова отправь /hunt …' })
  } else {
    replies.push({ chatId, text: help(ctx.siteUrl) })
  }
  return { state, replies }
}
