import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data/DataProvider'
import { spriteUrl } from '../../data/images'
import { useT } from '../../i18n'
import { silhouetteQuestion, type Question } from '../../domain/games'
import { mulberry32 } from '../../domain/rng'
import { useScores } from '../../store/scores'
import './games.css'

const HARD = ['Epic', 'Exotic', 'Legendary']

export function SilhouetteGame() {
  const t = useT()
  const { miscrits } = useData()
  const { silhouette: best, record } = useScores()
  const [hard, setHard] = useState(false)
  const rnd = useMemo(() => mulberry32(Date.now() & 0xffffffff), [])
  const pool = useMemo(() => (hard ? miscrits.filter(m => HARD.includes(m.rarity)) : miscrits), [miscrits, hard])
  const [q, setQ] = useState<Question | null>(() => silhouetteQuestion(pool, rnd))
  const [answer, setAnswer] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [newRecord, setNewRecord] = useState(false)

  const next = useCallback((p = pool) => { setQ(silhouetteQuestion(p, rnd)); setAnswer(null); setNewRecord(false) }, [pool, rnd])
  const choose = (id: number) => {
    if (!q || answer !== null) return
    setAnswer(id)
    if (id === q.answer.id) { const s = streak + 1; setStreak(s); if (record('silhouette', s)) setNewRecord(true) }
    else setStreak(0)
  }
  if (!q) return null
  const done = answer !== null
  const right = answer === q.answer.id

  return (
    <div className="container game fade-in">
      <div className="game-top">
        <Link to="/games" className="btn">← {t('games.back')}</Link>
        <h1>{t('games.sil.title')}</h1>
        <div className="row">
          <button className="chip" aria-pressed={!hard} onClick={() => { setHard(false); next(miscrits) }}>{t('games.all')}</button>
          <button className="chip" aria-pressed={hard} onClick={() => { setHard(true); next(miscrits.filter(m => HARD.includes(m.rarity))) }}>{t('games.hard')}</button>
        </div>
      </div>
      <div className="game-score"><span>🔥 {t('games.streak', { n: streak })}</span><span>🏆 {t('games.best', { n: best })}</span></div>
      <div className={`card sil-stage${done ? (right ? ' ok' : ' bad') : ''}`}>
        <img key={q.answer.id} src={spriteUrl(q.answer.names[0])} alt="?" className={`sil-img${done ? ' revealed' : ''}`} onError={() => next()} draggable={false} />
        {done && <div className="sil-verdict">{right ? `✅ ${t('games.correct')}` : `❌ ${t('games.wrong', { name: q.answer.names[0] })}`}{newRecord && <b> 🏆 {t('games.newRecord')}</b>}</div>}
      </div>
      <div className="options">
        {q.options.map(o => (
          <button key={o.id} className={`btn option${done && o.id === q.answer.id ? ' correct' : ''}${done && o.id === answer && !right ? ' wrong' : ''}`}
            onClick={() => choose(o.id)} disabled={done} data-testid="game-option">{o.names[0]}</button>
        ))}
      </div>
      {done && <div className="game-next"><button className="btn btn-primary" onClick={() => next()} autoFocus>{t('games.next')}</button></div>}
    </div>
  )
}
