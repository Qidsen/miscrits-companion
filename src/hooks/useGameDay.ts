import { useEffect, useState } from 'react'
import { gameDay, msUntilReset, nextReset } from '../domain/schedule'

const CHECK_MS = 30_000

/**
 * Current game day that flips at the 03:00 Kyiv reset.
 * A long setTimeout alone is not enough: timers freeze while the laptop sleeps, so we also
 * re-check the wall clock periodically and when the tab regains focus.
 */
export function useGameDay(): { day: number; nextReset: Date } {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => setNow(prev => {
      const n = new Date()
      return gameDay(n) === gameDay(prev) && nextReset(n).getTime() === nextReset(prev).getTime() ? prev : n
    })
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { refresh(); arm() }, msUntilReset(new Date()) + 50)
    }
    const wake = () => { refresh(); arm() }
    arm()
    const interval = setInterval(wake, CHECK_MS)
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('focus', wake)
    window.addEventListener('pageshow', wake)
    return () => {
      clearTimeout(timer); clearInterval(interval)
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('focus', wake)
      window.removeEventListener('pageshow', wake)
    }
  }, [])
  return { day: gameDay(now), nextReset: nextReset(now) }
}
