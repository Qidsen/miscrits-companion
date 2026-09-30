import { useSettings } from '../store/settings'
import { useT } from '../i18n'
export function LangToggle() {
  const { lang, setLang } = useSettings()
  const t = useT()
  return <button className="btn" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} aria-label={t('lang.switch')}>{lang === 'ru' ? 'EN' : 'RU'}</button>
}
