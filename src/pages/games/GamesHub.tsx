import { Link } from 'react-router-dom'
import { useData } from '../../data/DataProvider'
import { useT } from '../../i18n'
import { useScores } from '../../store/scores'
import { Sprite } from '../../components/Sprite'
import './games.css'

export function GamesHub() {
  const t = useT()
  const { miscrits } = useData()
  const scores = useScores()
  const pick = (i: number) => miscrits[(i * 97) % miscrits.length].names[0]
  const games = [
    { to: '/games/silhouette', title: t('games.sil.title'), desc: t('games.sil.desc'), best: t('games.best', { n: scores.silhouette }), art: <Sprite name={pick(3)} size={130} className="sil-dark" />, cls: 'g-sil' },
    { to: '/games/memory', title: t('games.mem.title'), desc: t('games.mem.desc'), best: scores.memory ? t('games.memBest', { moves: scores.memory.moves }) : '—', art: <div className="hub-mem">{[5, 9, 13, 17].map(i => <Sprite key={i} name={pick(i)} size={56} />)}</div>, cls: 'g-mem' },
    { to: '/games/evolution', title: t('games.evo.title'), desc: t('games.evo.desc'), best: t('games.best', { n: scores.evolution }), art: <div className="hub-evo"><Sprite name={pick(21)} size={80} /><span>→</span><span className="hub-q">?</span></div>, cls: 'g-evo' },
  ]
  return (
    <div className="container fade-in">
      <div className="tool-head"><div><h1>🎮 {t('games.title')}</h1><p className="muted">{t('games.subtitle')}</p></div></div>
      <div className="games-grid">
        {games.map(g => (
          <Link key={g.to} to={g.to} className={`card game-card ${g.cls}`}>
            <div className="game-art">{g.art}</div>
            <h2>{g.title}</h2>
            <p className="muted">{g.desc}</p>
            <div className="game-foot"><span className="game-best">🏆 {g.best}</span><span className="btn btn-primary">{t('games.play')} →</span></div>
          </Link>
        ))}
      </div>
    </div>
  )
}
