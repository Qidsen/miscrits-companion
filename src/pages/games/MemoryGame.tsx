import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../data/DataProvider'
import { useT } from '../../i18n'
import { memoryDeck, memoryFlip, type MemoryState } from '../../domain/games'
import { mulberry32 } from '../../domain/rng'
import { formatDuration } from '../../domain/schedule'
import { useScores } from '../../store/scores'
import { MiscritAvatar } from '../../components/MiscritAvatar'
import './games.css'

const PAIRS = 8
const EMPTY: MemoryState = { flipped: [], matched: [], moves: 0 }

export function MemoryGame() {
  const t = useT()
  const { miscrits } = useData()
  const { memory: best, recordMemory } = useScores()
  const [round, setRound] = useState(0)
  const deck = useMemo(() => memoryDeck(miscrits, PAIRS, mulberry32((Date.now() + round) & 0xffffffff)), [miscrits, round])
  const [s, setS] = useState<MemoryState>(EMPTY)
  const [start, setStart] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [record, setRecord] = useState(false)
  const won = s.matched.length === deck.length

  // two unmatched cards stay face up briefly, then turn back
  useEffect(() => {
    if (s.flipped.length !== 2) return
    const id = setTimeout(() => setS(x => (x.flipped.length === 2 ? { ...x, flipped: [] } : x)), 900)
    return () => clearTimeout(id)
  }, [s.flipped])
  useEffect(() => {
    if (!start || won) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [start, won])
  useEffect(() => { if (won && start) setRecord(recordMemory({ moves: s.moves, ms: Date.now() - start })) }, [won]) // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (key: number) => { if (!start) setStart(Date.now()); setS(x => memoryFlip(deck, x, key)) }
  const restart = () => { setRound(r => r + 1); setS(EMPTY); setStart(null); setRecord(false) }
  const elapsed = start ? (won ? now : Date.now()) - start : 0

  return (
    <div className="container game fade-in">
      <div className="game-top"><Link to="/games" className="btn">← {t('games.back')}</Link><h1>{t('games.mem.title')}</h1><button className="btn" onClick={restart}>↻</button></div>
      <div className="game-score">
        <span>{t('games.moves', { n: s.moves })}</span><span>⏱ {t('games.time', { t: formatDuration(elapsed).slice(3) })}</span>
        <span>🏆 {best ? t('games.memBest', { moves: best.moves }) : '—'}</span>
      </div>
      <div className="mem-grid">
        {deck.map(c => {
          const open = s.flipped.includes(c.key) || s.matched.includes(c.key)
          return (
            <button key={`${round}-${c.key}`} className={`mem-card${open ? ' open' : ''}${s.matched.includes(c.key) ? ' matched' : ''}`} onClick={() => flip(c.key)} aria-label={open ? c.name : '?'} data-testid="mem-card">
              <span className="mem-inner">
                <span className="mem-back">✦</span>
                <span className="mem-front"><MiscritAvatar name={c.name} size={72} /><span className="tiny">{c.name}</span></span>
              </span>
            </button>
          )
        })}
      </div>
      {won && (
        <div className="card mem-won">
          <h2>🎉 {t('games.won')}</h2>
          <div>{t('games.moves', { n: s.moves })} · {formatDuration(elapsed).slice(3)}{record && <b> · 🏆 {t('games.newRecord')}</b>}</div>
          <button className="btn btn-primary" onClick={restart}>{t('games.again')}</button>
        </div>
      )}
    </div>
  )
}
