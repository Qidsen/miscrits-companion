import { useEffect } from 'react'
import { BOT_API } from '../config'
import { useHunt } from '../store/hunt'
import { useTelegram } from '../store/telegram'

/** Push the list and record the outcome in the store, so the UI never claims "synced" before the bot confirms. */
export async function pushHunt(token: string, hunt: number[]): Promise<boolean | null> {
  const { setSync, setLinked } = useTelegram.getState()
  setSync({ state: 'syncing' })
  try {
    const r = await fetch(`${BOT_API}/link/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, hunt }) })
    if (!r.ok) { setSync({ state: 'failed' }); return null }
    const res = (await r.json()) as { linked: boolean; count: number }
    if (!res.linked) { setLinked(false); setSync({ state: 'idle' }); return false }
    setSync({ state: 'synced', count: res.count, at: Date.now() })
    return true
  } catch { setSync({ state: 'failed' }); return null } // offline: retried on the next change
}

/** Keeps the bot's copy of the hunt list in sync with this browser once the site is linked. */
export function useTelegramSync() {
  const ids = useHunt(s => s.ids)
  const { token, linked, setSync } = useTelegram()
  useEffect(() => {
    if (!BOT_API || !token || !linked) return
    setSync({ state: 'syncing' }) // show it immediately, the request is debounced
    const t = setTimeout(() => { void pushHunt(token, ids) }, 1500)
    return () => clearTimeout(t)
  }, [ids, token, linked, setSync])
}
