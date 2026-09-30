import type { Rarity } from '../data/types'
import { useT, type I18nKey } from '../i18n'
export function RarityBadge({ rarity }: { rarity: Rarity | string }) {
  const t = useT()
  return <span className={`rarity-badge rarity-${rarity}`}>{t(`rarity.${rarity}` as I18nKey)}</span>
}
