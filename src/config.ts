/** Telegram bot username (without @), injected at build time from the repo variable BOT_USERNAME. Empty = panel hidden. */
export const BOT_USERNAME: string = (import.meta.env.VITE_BOT_USERNAME ?? '').replace(/^@/, '')
/** Bot's HTTP API (Cloudflare Worker) used to link the site and push the hunt list. */
export const BOT_API: string = BOT_USERNAME ? (import.meta.env.VITE_BOT_API ?? 'https://miscrits-bot.yaros1406.workers.dev') : ''
