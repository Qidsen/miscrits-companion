import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data/DataProvider'
import { useT } from '../../i18n'
import { evolutionQuestion } from '../../domain/games'
import { mulberry32 } from '../../domain/rng'
import { useScores } from '../../store/scores'
import { Sprite } from '../../components/Sprite'
import './games.css'

export function EvolutionGame() {
  const t = useT()
  const { miscrits } = useData()
  const { evolution: best, record } = useScores()
  const rnd = useMemo(() => mulberry32(Date.now() & 0xffffffff), [])
  const [q, setQ] = useState(() => evolutionQuestion(miscrits, rnd))
  const [answer, setAnswer] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [newRecord, setNewRecord] = useState(false)
  if (!q) return null
  const done = answer !== null
  const right = answer === q.answer
  const choose = (name: string) => {
    if (done) return
    setAnswer(name)
    if (name === q.answer) { const s = streak + 1; setStreak(s); if (record('evolution', s)) setNewRecord(true) } else setStreak(0)
  }
  const next = () => { setQ(evolutionQuestion(miscrits, rnd)); setAnswer(null); setNewRecord(false) }

  return (
    <div className="container game fade-in">
      <div className="game-top"><Link to="/games" className="btn">← {t('games.back')}</Link><h1>{t('games.evo.title')}</h1><span /></div>
      <div className="game-score"><span>🔥 {t('games.streak', { n: streak })}</span><span>🏆 {t('games.best', { n: best })}</span></div>
      <div className={`card evo-stage${done ? (right ? ' ok' : ' bad') : ''}`}>
        <Sprite key={q.start} name={q.start} size={180} eager className="evo-start" />
        <div className="evo-label"><b>{q.start}</b> {t('games.evolvesInto')}</div>
        {done && <div className="sil-verdict">{right ? `✅ ${t('games.correct')}` : `❌ ${t('games.wrong', { name: q.answer })}`}{newRecord && <b> 🏆 {t('games.newRecord')}</b>}</div>}
      </div>
      <div className="options options-art">
        {q.options.map(o => (
          <button key={o} className={`btn option${done && o === q.answer ? ' correct' : ''}${done && o === answer && !right ? ' wrong' : ''}`} onClick={() => choose(o)} disabled={done} data-testid="game-option">
            <Sprite name={o} size={96} eager /><span>{o}</span>
          </button>
        ))}
      </div>
      {done && <div className="game-next"><button className="btn btn-primary" onClick={next} autoFocus>{t('games.next')}</button></div>}
    </div>
  )
}
