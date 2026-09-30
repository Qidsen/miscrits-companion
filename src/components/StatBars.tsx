import type { StatKey, Tier } from '../data/types'
import { TIER_VALUE } from '../domain/miscrit'
import { useT, type I18nKey } from '../i18n'

const KEYS: StatKey[] = ['hp', 'spd', 'ea', 'pa', 'ed', 'pd']
export const STAT_COLORS: Record<StatKey, string> = { hp: '#5ad17a', spd: '#4fc3f7', ea: '#b36bff', pa: '#ff6b3d', ed: '#ffd23f', pd: '#c98b4e' }

export function StatBars({ stats }: { stats: Record<StatKey, Tier> }) {
  const t = useT()
  return (
    <div className="stat-bars">
      {KEYS.map(k => (
        <div key={k} className="stat-row">
          <span className="stat-key">{t(`stat.${k}` as I18nKey)}</span>
          <span className="stat-track">
            <span className="stat-fill" style={{ width: `${TIER_VALUE[stats[k]] * 20}%`, background: `linear-gradient(90deg, ${STAT_COLORS[k]}88, ${STAT_COLORS[k]})`, boxShadow: `0 0 12px -2px ${STAT_COLORS[k]}` }} />
          </span>
          <span className="stat-tier">{stats[k]}</span>
        </div>
      ))}
    </div>
  )
}
