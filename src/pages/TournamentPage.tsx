import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { challengeScore, decodeResult, encodeResult, leaderboard, type ChallengeResult } from '../domain/challenge'
import { collectionStats, decodeIds } from '../domain/collection'
import { formatClock, gameDate } from '../domain/schedule'
import { useCollection } from '../store/collection'
import { useTournament } from '../store/tournament'
import { Panel } from '../components/Panel'
import './games/games.css'

/** Accepts "#/r/<code>" result links and "#/c/<code>?n=<name>" collection links. */
function parseLink(text: string): { result: ChallengeResult } | { collection: { name: string; code: string } } | null {
  const r = /#\/r\/([A-Za-z0-9_-]+)/.exec(text)
  if (r) { const result = decodeResult(r[1]); return result ? { result } : null }
  const c = /#\/c\/([A-Za-z0-9_-]*)(?:\?n=([^&\s]+))?/.exec(text)
  if (c && decodeIds(c[1]) !== null) {
    let name = 'Friend'
    try { if (c[2]) name = decodeURIComponent(c[2]).slice(0, 24) } catch { /* keep default */ }
    return { collection: { name, code: c[1] } }
  }
  return null
}

function Board({ rows, me }: { rows: (ChallengeResult & { score: number })[]; me: string }) {
  const t = useT()
  return (
    <ol className="board">
      {rows.map((r, i) => (
        <li key={r.name} className={r.name === me ? 'me' : ''}>
          <span className="board-pos">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
          <span className="board-name">{r.name}{r.name === me && <span className="muted small"> ({t('tour.you')})</span>}</span>
          <span className="small muted">{t('tour.correct', { n: r.correct })} · {formatClock(r.ms)}</span>
          <b>{t('tour.points', { n: r.score })}</b>
        </li>
      ))}
    </ol>
  )
}

export function TournamentPage() {
  const t = useT()
  const { miscrits } = useData()
  const myCaught = useCollection(s => s.caught)
  const { name, setName, played, friends, collections, addFriend, addCollection, removeCollection } = useTournament()
  const date = gameDate(new Date())
  const mine = played[date]
  const [paste, setPaste] = useState('')
  const [bad, setBad] = useState(false)
  const all = useMemo(() => [...Object.values(played), ...friends], [played, friends])
  const today = leaderboard(all.filter(r => r.date === date))
  const totals = useMemo(() => {
    const m = new Map<string, { name: string; score: number; days: number }>()
    for (const r of all) {
      const x = m.get(r.name) ?? { name: r.name, score: 0, days: 0 }
      x.score += challengeScore(r.correct, r.ms); x.days++
      m.set(r.name, x)
    }
    return [...m.values()].sort((a, b) => b.score - a.score)
  }, [all])
  const colRows = useMemo(() => [{ name: name || t('tour.you'), ids: myCaught }, ...collections.map(c => ({ name: c.name, ids: decodeIds(c.code) ?? [] }))]
    .map(r => ({ ...r, stats: collectionStats(miscrits, new Set(r.ids)) })), [collections, myCaught, miscrits, name, t])
  const myLink = mine ? `${location.origin}${location.pathname}#/r/${encodeResult(mine)}` : ''

  const onAdd = () => {
    const p = parseLink(paste)
    setBad(!p)
    if (!p) return
    if ('result' in p) addFriend(p.result); else addCollection(p.collection)
    setPaste('')
  }

  return (
    <div className="container fade-in tournament">
      <div className="tool-head"><div><h1>🏅 {t('tour.title')}</h1><p className="muted">{t('tour.subtitle')}</p></div></div>
      <div className="tour-grid">
        <Panel title={`🎯 ${date}`} className="tour-today">
          <label className="small">{t('tour.name')}
            <input className="input" value={name} placeholder={t('tour.namePh')} maxLength={24} onChange={e => setName(e.target.value)} data-testid="tour-name" /></label>
          {mine ? (
            <div className="tour-mine">
              <div className="small muted">{t('tour.played')}</div>
              <div className="big-score">{challengeScore(mine.correct, mine.ms)}</div>
              <div>{t('tour.correct', { n: mine.correct })} · ⏱ {formatClock(mine.ms)}</div>
              <input className="input" readOnly value={myLink} onFocus={e => e.target.select()} />
            </div>
          ) : name.trim()
            ? <Link className="btn btn-primary tour-play" to="/tournament/play" data-testid="tour-play">▶ {t('tour.play')}</Link>
            : <div className="muted small">{t('tour.needName')}</div>}
        </Panel>
        <Panel title={`🏆 ${t('tour.today')}`}>
          {today.length ? <Board rows={today} me={name.trim()} /> : <div className="muted">{t('tour.noResults')}</div>}
        </Panel>
      </div>

      <Panel title={t('tour.addLink')} style={{ marginBottom: 16 }}>
        <div className="row">
          <input className="input" style={{ flex: 1 }} value={paste} onChange={e => { setPaste(e.target.value); setBad(false) }} placeholder="https://…#/r/… | #/c/…" data-testid="tour-paste" />
          <button className="btn btn-primary" onClick={onAdd}>{t('tour.add')}</button>
        </div>
        {bad && <div className="small" style={{ color: 'var(--danger)' }}>{t('tour.badLink')}</div>}
      </Panel>

      <div className="tour-grid">
        <Panel title={`📊 ${t('tour.total')}`}>
          {totals.length ? (
            <ol className="board">{totals.map((r, i) => (
              <li key={r.name} className={r.name === name.trim() ? 'me' : ''}><span className="board-pos">{i + 1}</span><span className="board-name">{r.name}</span>
                <span className="small muted">{t('tour.days', { n: r.days })}</span><b>{t('tour.points', { n: r.score })}</b></li>))}</ol>
          ) : <div className="muted">{t('tour.noResults')}</div>}
        </Panel>
        <Panel title={`🏆 ${t('tour.collections')}`}>
          <table className="dmg-table">
            <thead><tr><th>{t('tour.colName')}</th><th>{t('col.caught')}</th><th>%</th><th>{t('tour.legendary')}</th><th /></tr></thead>
            <tbody>{colRows.map((r, i) => (
              <tr key={r.name + i}>
                <td><b>{r.name}</b></td><td>{r.stats.caught}</td><td>{Math.round((r.stats.caught / r.stats.total) * 100)}%</td>
                <td>{r.stats.byRarity.Legendary?.caught ?? 0}</td>
                <td>{i > 0 && <button className="btn" onClick={() => removeCollection(r.name)} aria-label={t('pick.remove')}>✕</button>}</td>
              </tr>))}</tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
