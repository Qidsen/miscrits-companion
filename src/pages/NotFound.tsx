import { Link } from 'react-router-dom'
import { useT } from '../i18n'
export function NotFound() {
  const t = useT()
  return <div className="container"><h1>{t('notFound')}</h1><Link className="btn" to="/">{t('back.home')}</Link></div>
}
