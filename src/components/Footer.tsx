import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { useSettings } from '../store/settings'
import './Footer.css'

export const AUTHOR = { nick: 'Qidsen', name: 'Yaroslav Vovnenko', url: 'https://github.com/Qidsen' }

export function Footer() {
  const t = useT()
  const { meta } = useData()
  const lang = useSettings(s => s.lang)
  const date = new Date(meta.syncedAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-info small muted">
          <div data-testid="data-updated">{t('data.updated', { date })}</div>
          <div>{t('footer.credits')}</div>
        </div>
        <a className="author-badge" href={AUTHOR.url} target="_blank" rel="noreferrer" data-testid="author">
          <span className="author-mark">✦</span>
          <span className="author-text">
            <span className="author-label">{t('footer.madeBy')}</span>
            <span className="author-name"><b>{AUTHOR.nick}</b> · {AUTHOR.name}</span>
          </span>
          <span className="author-heart" aria-hidden="true">♥</span>
        </a>
      </div>
    </footer>
  )
}
