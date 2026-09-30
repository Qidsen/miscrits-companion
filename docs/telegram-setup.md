# Telegram bot (Cloudflare Workers)

The bot is a Cloudflare Worker (`bot/worker.ts`, config in `wrangler.toml`), free plan:
Telegram calls `https://miscrits-bot.<account>.workers.dev/tg` (webhook) → replies are instant;
a cron trigger every 5 minutes sends the daily card right after the 03:00 Kyiv reset.
Subscribers live in Workers KV (`STATE` namespace, key `state`). The bot reads `bot.json`,
`changelog.json` and the weekday cards (`data/cards/<day>.jpg`) from the GitHub Pages site.

## One-time setup
1. `npx wrangler login`
2. `npx wrangler kv namespace create STATE` → put the id into `wrangler.toml`
3. `npm run bot:deploy`
4. Secrets (Cloudflare): `npx wrangler secret put TELEGRAM_TOKEN` (from @BotFather),
   `WEBHOOK_SECRET` and `ADMIN_TOKEN` (random strings). Keep `ADMIN_TOKEN` also as GitHub secret `BOT_ADMIN_TOKEN`.
5. Register the webhook: `curl -X POST -H "X-Admin-Token: <ADMIN_TOKEN>" https://miscrits-bot.<account>.workers.dev/admin/set-webhook`
6. In Telegram send the bot `/claim <ADMIN_TOKEN>` once → `/admin` shows subscribers.

## Commands
Private: `/start`, `/hunt <code>` (copied from the Hunt page), `/today`, `/stop`, owner: `/claim`, `/admin`.
Groups: add the bot (or `/subscribe`), `/unsubscribe`, `/today`.

Redeploy after code changes: `npm run bot:deploy`.
