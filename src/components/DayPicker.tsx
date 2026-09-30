import { dayShort, useT } from '../i18n'
import { WEEK_ORDER } from '../domain/schedule'

export function DayPicker({ value, today, onChange, anyLabel }: { value: number | null; today: number; onChange: (d: number | null) => void; anyLabel?: string }) {
  const t = useT()
  return (
    <div className="row" role="group" style={{ gap: 6 }}>
      {anyLabel && <button className="chip" aria-pressed={value === null} onClick={() => onChange(null)}>{anyLabel}</button>}
      {WEEK_ORDER.map(d => (
        <button key={d} className="chip" aria-pressed={value === d} onClick={() => onChange(d)}
          style={d === today ? { fontWeight: 700 } : undefined}>
          {dayShort(t, d)}{d === today ? ' •' : ''}
        </button>
      ))}
    </div>
  )
}
