import { useT } from '../i18n'
import { useNow } from '../hooks/useNow'
import { formatDuration, nextReset } from '../domain/schedule'
import './ResetCountdown.css'

export function ResetCountdown() {
  const t = useT()
  const now = useNow()
  const reset = nextReset(now)
  const local = reset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="reset" title={t('reset.at', { local })} data-testid="reset-countdown">
      <span className="reset-label">{t('reset.in')}</span>
      <span className="reset-time">{formatDuration(reset.getTime() - now.getTime())}</span>
    </div>
  )
}
