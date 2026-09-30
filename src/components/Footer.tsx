import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { useSettings } from '../store/settings'
export function Footer() {
  const t = useT()
  const { meta } = useData()
  const lang = useSettings(s => s.lang)
  const date = new Date(meta.syncedAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <footer className="container small muted" style={{ borderTop: '1px solid var(--line)', marginTop: 32 }}>
      <div data-testid="data-updated">{t('data.updated', { date })}</div>
      <div>{t('footer.credits')}</div>
    </footer>
  )
}
