import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useT } from '../i18n'
import { challengeScore, decodeResult } from '../domain/challenge'
import { useTournament } from '../store/tournament'
import { Panel } from '../components/Panel'
import './games/games.css'

/** Opening a friend's result link shows it and adds it to the local board. */
export function ResultPage() {
  const t = useT()
  const { code = '' } = useParams()
  const r = useMemo(() => decodeResult(code), [code])
  const addFriend = useTournament(s => s.addFriend)
  useEffect(() => { if (r) addFriend(r) }, [r, addFriend])
  return (
    <div className="container game fade-in">
      <Panel title={`🏅 ${t('tour.title')}`}>
        {r ? (
          <div className="tour-mine" data-testid="result-ok">
            <div className="big-score">{challengeScore(r.correct, r.ms)}</div>
            <div>{t('tour.result', { name: r.name, score: challengeScore(r.correct, r.ms), correct: r.correct, date: r.date })}</div>
            <div className="small" style={{ color: 'var(--ok)' }}>✓ {t('tour.addedBoard')}</div>
          </div>
        ) : <div role="alert">{t('tour.badResult')}</div>}
        <Link className="btn btn-primary" to="/tournament" style={{ marginTop: 12 }}>{t('tour.back')}</Link>
      </Panel>
    </div>
  )
}
