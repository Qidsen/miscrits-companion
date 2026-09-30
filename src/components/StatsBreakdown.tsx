import { elementIconUrl } from '../data/images'
import { useT, type I18nKey } from '../i18n'
import { BASE_ELEMENTS, RARITY_ORDER } from '../domain/miscrit'
import { ELEMENT_COLORS } from '../styles/elements'
import type { collectionStats } from '../domain/collection'

type Stats = ReturnType<typeof collectionStats>

function Bar({ label, icon, color, v }: { label: string; icon?: string; color: string; v?: { total: number; caught: number } }) {
  const pct = v && v.total ? (v.caught / v.total) * 100 : 0
  return (
    <div className="bd-row">
      <span className="bd-label">{icon && <img src={icon} alt="" width={16} height={16} />}{label}</span>
      <span className="bd-track"><span className="bd-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px -2px ${color}` }} /></span>
      <span className="bd-num">{v?.caught ?? 0}/{v?.total ?? 0}</span>
    </div>
  )
}

export function StatsBreakdown({ stats }: { stats: Stats }) {
  const t = useT()
  return (
    <div className="breakdown">
      <div>
        <h3>{t('col.byElement')}</h3>
        {BASE_ELEMENTS.map(e => <Bar key={e} label={e} icon={elementIconUrl(e)} color={ELEMENT_COLORS[e]} v={stats.byElement[e]} />)}
      </div>
      <div>
        <h3>{t('col.byRarity')}</h3>
        {RARITY_ORDER.map(r => <Bar key={r} label={t(`rarity.${r}` as I18nKey)} color={`var(--r-${r.toLowerCase()})`} v={stats.byRarity[r]} />)}
      </div>
    </div>
  )
}
