# Telegram bot setup

1. In Telegram open **@BotFather** → `/newbot` → pick a name and a username ending in `bot`.
2. Save the token as a repo secret (never paste it in chat or commit it):
   `gh secret set TELEGRAM_TOKEN -R Qidsen/miscrits-companion`
3. Encryption key for the subscriber list (random 32 bytes):
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" | gh secret set NOTIFY_KEY -R Qidsen/miscrits-companion`
   Keep a copy somewhere safe: losing it means losing the subscriber list (users just send /hunt again).
4. Bot username (shown on the site): `gh variable set BOT_USERNAME --body your_bot -R Qidsen/miscrits-companion`
5. Rebuild the site (push to main or run "Sync data and deploy") so the Hunt page shows the Telegram panel.

The bot runs in `.github/workflows/notify.yml` every 15 minutes. Commands: `/start`, `/hunt <code>`, `/today`, `/stop`;
in a group: `/subscribe`, `/unsubscribe`, `/today` (or just add the bot to the group).
