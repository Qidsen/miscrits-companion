import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useData } from '../../data/DataProvider'
import { spriteUrl } from '../../data/images'
import { useT } from '../../i18n'
import { challengeScore, dailyChallenge, encodeResult, CHALLENGE_SIZE } from '../../domain/challenge'
import { formatClock, gameDate } from '../../domain/schedule'
import { useTournament } from '../../store/tournament'
import { Sprite } from '../../components/Sprite'
import './games.css'

export function ChallengeGame() {
  const t = useT()
  const { miscrits, byId } = useData()
  const { name, played, record } = useTournament()
  const date = useMemo(() => gameDate(new Date()), [])
  const questions = useMemo(() => dailyChallenge(miscrits, date), [miscrits, date])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState<{ correct: number; ms: number } | null>(null)
  useEffect(() => { if (finished) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id) }, [finished])

  if (!name.trim()) return <Navigate to="/tournament" replace />
  if (played[date] && !finished) return <Navigate to="/tournament" replace />

  const q = questions[i]
  const answer = (opt: string | number) => {
    if (picked !== null || !q) return
    setPicked(opt)
    const ok = opt === q.answer
    const total = correct + (ok ? 1 : 0)
    setCorrect(total)
    setTimeout(() => {
      if (i + 1 < questions.length) { setI(i + 1); setPicked(null); return }
      const ms = Date.now() - start
      record({ date, name: name.trim(), correct: total, ms })
      setFinished({ correct: total, ms })
    }, 700)
  }

  if (finished) {
    const link = `${location.origin}${location.pathname}#/r/${encodeResult({ date, name: name.trim(), ...finished })}`
    return (
      <div className="container game fade-in">
        <div className="card mem-won" data-testid="challenge-done">
          <h2>🏅 {t('tour.done')}</h2>
          <div className="big-score">{challengeScore(finished.correct, finished.ms)}</div>
          <div>{t('tour.correct', { n: finished.correct })} · ⏱ {formatClock(finished.ms)}</div>
          <div className="small muted">{t('tour.share')}</div>
          <input className="input" readOnly value={link} onFocus={e => e.target.select()} data-testid="result-link" />
          <Link className="btn btn-primary" to="/tournament">{t('tour.back')}</Link>
        </div>
      </div>
    )
  }
  if (!q) return null

  const optClass = (opt: string | number) => `btn option${picked !== null && opt === q.answer ? ' correct' : ''}${picked === opt && opt !== q.answer ? ' wrong' : ''}`
  return (
    <div className="container game fade-in">
      <div className="game-top"><Link to="/tournament" className="btn">← {t('tour.back')}</Link><h1>🏅 {t('tour.title')}</h1><span /></div>
      <div className="game-score"><span>{t('tour.question', { i: i + 1, n: CHALLENGE_SIZE })}</span><span>✅ {correct}</span><span>⏱ {formatClock(now - start)}</span></div>
      <div className="challenge-progress"><span style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      {q.kind === 'sil' ? (
        <>
          <div className={`card sil-stage${picked !== null ? (picked === q.answer ? ' ok' : ' bad') : ''}`}>
            <div className="small muted">{t('tour.whoIs')}</div>
            <img key={i} src={spriteUrl(byId.get(q.answer)!.names[0])} alt="?" className={`sil-img${picked !== null ? ' revealed' : ''}`} draggable={false} />
          </div>
          <div className="options">
            {q.options.map(id => <button key={id} className={optClass(id)} disabled={picked !== null} onClick={() => answer(id)} data-testid="game-option">{byId.get(id)!.names[0]}</button>)}
          </div>
        </>
      ) : (
        <>
          <div className={`card evo-stage${picked !== null ? (picked === q.answer ? ' ok' : ' bad') : ''}`}>
            <Sprite key={i} name={q.start} size={170} eager className="evo-start" />
            <div className="evo-label"><b>{q.start}</b> {t('games.evolvesInto')}</div>
          </div>
          <div className="options options-art">
            {q.options.map(o => <button key={o} className={optClass(o)} disabled={picked !== null} onClick={() => answer(o)} data-testid="game-option"><Sprite name={o} size={90} eager /><span>{o}</span></button>)}
          </div>
        </>
      )}
    </div>
  )
}
