import type { DayList } from '../data/types'
import { dayShort, useT } from '../i18n'
import { WEEK_ORDER } from '../domain/schedule'

/** Mon..Sun chips; available days lit, today outlined. */
export function DayDots({ days, today, compact }: { days: DayList; today?: number; compact?: boolean }) {
  const t = useT()
  return (
    <span className={`day-dots${compact ? ' compact' : ''}`}>
      {WEEK_ORDER.map(d => {
        const on = days === 'all' || days.includes(d)
        return <span key={d} className={`day-dot${on ? ' on' : ''}${d === today ? ' today' : ''}`} title={dayShort(t, d)}>{compact ? '' : dayShort(t, d)}</span>
      })}
    </span>
  )
}
