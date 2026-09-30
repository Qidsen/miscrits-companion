import { useEffect, useState } from 'react'
import { BOT_API, BOT_USERNAME } from '../config'
import { useT } from '../i18n'
import { encodeIds } from '../domain/collection'
import { pushHunt } from '../hooks/useTelegramSync'
import { useHunt } from '../store/hunt'
import { useTelegram } from '../store/telegram'
import { Panel } from './Panel'

const POLL_MS = 3000, POLL_FOR_MS = 180_000

/** "Connect Telegram": deep-links to the bot with a one-time token, then waits until the bot confirms the link. */
export function TelegramPanel() {
  const t = useT()
  const ids = useHunt(s => s.ids)
  const { token, linked, sync, ensureToken, setLinked, reset } = useTelegram()
  const [waiting, setWaiting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!waiting || !token) return
    const started = Date.now()
    const id = setInterval(async () => {
      try {
        const r = await fetch(`${BOT_API}/link/status?token=${token}`)
        if (r.ok && ((await r.json()) as { linked: boolean }).linked) {
          setLinked(true); setWaiting(false)
          await pushHunt(token, useHunt.getState().ids) // first sync right away
        }
      } catch { /* keep polling */ }
      if (Date.now() - started > POLL_FOR_MS) setWaiting(false)
    }, POLL_MS)
    return () => clearInterval(id)
  }, [waiting, token, setLinked])

  if (!BOT_USERNAME) return null
  const botUrl = `https://t.me/${BOT_USERNAME}`
  const command = `/hunt ${encodeIds(ids)}`

  return (
    <Panel title={`📨 ${t('tg.title')}`} style={{ marginBottom: 16 }} testId="tg-panel">
      {linked ? (
        <div className="row">
          {sync.state === 'synced'
            ? <span className="tg-ok" data-testid="tg-status">✅ {t('tg.synced', { n: sync.count, time: new Date(sync.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}</span>
            : sync.state === 'failed'
              ? <span className="tg-warn" data-testid="tg-status">⚠️ {t('tg.failed')}</span>
              : <span className="muted" data-testid="tg-status">⏳ {t('tg.syncing')}</span>}
          <a className="btn" href={botUrl} target="_blank" rel="noreferrer">{t('tg.open')}</a>
          <button className="btn" onClick={reset}>{t('tg.disconnect')}</button>
        </div>
      ) : (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>{t('tg.connectHint')}</p>
          <div className="row">
            <a className="btn btn-primary" href={`${botUrl}?start=${token ?? ''}`} target="_blank" rel="noreferrer" data-testid="tg-connect"
              onClick={e => { const tok = ensureToken(); e.currentTarget.href = `${botUrl}?start=${tok}`; setWaiting(true) }}>
              ✈️ {t('tg.connect')}
            </a>
            {waiting && <span className="small muted">⏳ {t('tg.waiting')}</span>}
          </div>
          {ids.length > 0 && (
            <details className="small muted" style={{ marginTop: 10 }}>
              <summary>{t('tg.manual')}</summary>
              <div className="row" style={{ marginTop: 8 }}>
                <input className="input" readOnly value={command} onFocus={e => e.target.select()} style={{ flex: 1, minWidth: 180 }} />
                <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }}>{copied ? t('col.copied') : t('col.copy')}</button>
              </div>
            </details>
          )}
        </>
      )}
    </Panel>
  )
}
