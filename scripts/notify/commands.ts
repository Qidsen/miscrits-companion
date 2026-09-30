import { decodeIds } from '../../src/domain/collection'
import { escapeHtml } from '../../src/data/escape'
import { groupMessages, personalMessages, type DigestData, type OutMsg } from './digest'
import type { BotState } from './state'

export interface TgChat { id: number; type: 'private' | 'group' | 'supergroup' | 'channel' }
export interface TgUpdate {
  update_id: number
  message?: { chat: TgChat; text?: string; from?: { first_name?: string } }
  my_chat_member?: { chat: TgChat; new_chat_member: { status: string } }
}
export type Reply = OutMsg
interface Ctx { data: DigestData; now: Date; siteUrl: string; botName: string; adminToken?: string }

const MAX_SUBS = 500
const isGroup = (c: TgChat) => c.type === 'group' || c.type === 'supergroup'

function help(siteUrl: string) {
  return [
    '👋 <b>Miscrits Companion</b>',
    'Каждый день в 03:00 по Киеву пришлю карточку дня: редкие мискриты и кто из твоего списка охоты появляется сегодня.',
    '',
    `1. Добавь мискритов в «Охоту» на сайте: ${siteUrl}#/hunt`,
    '2. Нажми там «Скопировать» и отправь мне команду /hunt …',
    '',
    '/today — сводка сейчас · /stop — отписаться',
    '',
    '✦ Сайт и бот сделал Qidsen (Yaroslav Vovnenko)',
  ].join('\n')
}

function adminReport(s: BotState): string {
  const lines = ['👑 <b>Админка</b>', `Подписчиков: <b>${s.subs.length}</b> · групп: <b>${s.groups.length}</b>`, '']
  for (const x of s.subs.slice(0, 50)) lines.push(`• ${escapeHtml(x.name || 'без имени')} — в охоте ${x.hunt.length}`)
  if (s.subs.length > 50) lines.push(`… и ещё ${s.subs.length - 50}`)
  if (s.lastDaily) lines.push('', `Последняя рассылка: ${s.lastDaily}`)
  return lines.join('\n')
}

/** Pure reducer: one Telegram update → new state + outgoing messages. Never throws on user input. */
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
      replies.push({ chatId, text: '✅ Группа подписана: каждый день в 03:00 по Киеву пришлю карточку дня.' })
    } else if (cmd === '/unsubscribe') {
      state = { ...state, groups: state.groups.filter(g => g !== chatId) }
      replies.push({ chatId, text: '👋 Сводки для группы выключены.' })
    } else if (cmd === '/today') {
      replies.push(...groupMessages(chatId, ctx.data, ctx.now, ctx.siteUrl, []))
    }
    return { state, replies } // ignore everything else: no spam in groups
  }

  const hunt = () => state.subs.find(x => x.chatId === chatId)?.hunt ?? []
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
    replies.push({ chatId, text: `✅ Готово! В списке охоты: <b>${ids.length}</b>. Карточка дня — каждый день в 03:00 по Киеву. Вот что сегодня:` })
    replies.push(...personalMessages(chatId, ctx.data, ids, ctx.now, ctx.siteUrl))
  } else if (cmd === '/today') {
    replies.push(...personalMessages(chatId, ctx.data, hunt(), ctx.now, ctx.siteUrl))
  } else if (cmd === '/stop') {
    state = { ...state, subs: state.subs.filter(x => x.chatId !== chatId) }
    replies.push({ chatId, text: '👋 Отписал. Вернуться — снова отправь /hunt …' })
  } else if (cmd === '/claim') {
    const ok = !!ctx.adminToken && args[0] === ctx.adminToken
    if (ok) state = { ...state, owner: chatId }
    replies.push({ chatId, text: ok ? '👑 Теперь ты владелец бота. Команда /admin — статистика.' : '⛔ Неверный код.' })
  } else if (cmd === '/admin') {
    replies.push({ chatId, text: state.owner === chatId ? adminReport(state) : '⛔ Эта команда только для владельца бота.' })
  } else {
    replies.push({ chatId, text: help(ctx.siteUrl) })
  }
  return { state, replies }
}
