import { useSettings } from '../store/settings'
export function LangToggle() {
  const { lang, setLang } = useSettings()
  return <button className="btn" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} aria-label="language">{lang === 'ru' ? 'EN' : 'RU'}</button>
}
