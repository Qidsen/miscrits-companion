/** Telegram bot username (without @), injected at build time from the repo variable BOT_USERNAME. Empty = panel hidden. */
export const BOT_USERNAME: string = (import.meta.env.VITE_BOT_USERNAME ?? '').replace(/^@/, '')
