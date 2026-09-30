import { useEffect, useState } from 'react'
import { gameDay, msUntilReset, nextReset } from '../domain/schedule'

/** Current game day that flips exactly at the 03:00 Kyiv reset (and after the tab wakes up). */
export function useGameDay(): { day: number; nextReset: Date } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { setNow(new Date()); arm() }, msUntilReset(new Date()) + 50)
    }
    const onVisible = () => { if (document.visibilityState === 'visible') { setNow(new Date()); arm() } }
    arm()
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  return { day: gameDay(now), nextReset: nextReset(now) }
}
