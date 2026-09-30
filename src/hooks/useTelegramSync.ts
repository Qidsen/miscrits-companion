import { useEffect } from 'react'
import { BOT_API } from '../config'
import { useHunt } from '../store/hunt'
import { useTelegram } from '../store/telegram'

export async function pushHunt(token: string, hunt: number[]): Promise<boolean | null> {
  try {
    const r = await fetch(`${BOT_API}/link/sync`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, hunt }) })
    return r.ok ? ((await r.json()) as { linked: boolean }).linked : null
  } catch { return null } // offline: try again on the next change
}

/** Keeps the bot's copy of the hunt list in sync with this browser once the site is linked. */
export function useTelegramSync() {
  const ids = useHunt(s => s.ids)
  const { token, linked, setLinked } = useTelegram()
  useEffect(() => {
    if (!BOT_API || !token || !linked) return
    const t = setTimeout(async () => { if (await pushHunt(token, ids) === false) setLinked(false) }, 1500)
    return () => clearTimeout(t)
  }, [ids, token, linked, setLinked])
}
