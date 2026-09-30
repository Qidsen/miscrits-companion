import type { StatKey, Tier } from '../data/types'
import { TIER_VALUE } from '../domain/miscrit'
import { useT, type I18nKey } from '../i18n'

const KEYS: StatKey[] = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']
export function StatBars({ stats }: { stats: Record<StatKey, Tier> }) {
  const t = useT()
  return (
    <div className="stat-bars">
      {KEYS.map(k => (
        <div key={k} className="stat-row">
          <span className="stat-key">{t(`stat.${k}` as I18nKey)}</span>
          <span className="stat-track"><span className="stat-fill" style={{ width: `${TIER_VALUE[stats[k]] * 20}%` }} /></span>
          <span className="stat-tier small muted">{stats[k]}</span>
        </div>
      ))}
    </div>
  )
}
