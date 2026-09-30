import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Miscrit } from '../data/types'
import { useData } from '../data/DataProvider'
import { elementIconUrl } from '../data/images'
import { useT } from '../i18n'
import { BASE_ELEMENTS } from '../domain/miscrit'
import { statsAt } from '../domain/stats'
import { controlSummary, decodeTeam, defenseWeakness, encodeTeam, offenseCoverage, type TeamSlot } from '../domain/team'
import { elementGradient } from '../styles/elements'
import { useTeams } from '../store/teams'
import { MiscritPicker } from '../components/MiscritPicker'
import { LevelSlider } from '../components/LevelSlider'
import { MiscritAvatar } from '../components/MiscritAvatar'
import { Sprite } from '../components/Sprite'
import { ElementIcons } from '../components/ElementIcons'
import { RarityBadge } from '../components/RarityBadge'
import { Panel } from '../components/Panel'
import './tools.css'

export function TeamPage() {
  const t = useT()
  const { byId } = useData()
  const [params, setParams] = useSearchParams()
  const known = useMemo(() => new Set(byId.keys()), [byId])
  const slots = decodeTeam(params.get('t') ?? '', known)
  const setSlots = (s: TeamSlot[]) => setParams(s.length ? { t: encodeTeam(s) } : {}, { replace: true })
  const team = slots.map(s => byId.get(s.id)).filter((m): m is Miscrit => !!m)
  const { teams, save, remove } = useTeams()
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  const offense = offenseCoverage(team), defense = defenseWeakness(team), control = controlSummary(team)
  const speed = slots.map(s => ({ m: byId.get(s.id)!, spd: statsAt(byId.get(s.id)!, s.level).spd })).sort((a, b) => b.spd - a.spd)
  const code = encodeTeam(slots)

  return (
    <div className="container fade-in">
      <div className="tool-head"><h1>⚔️ {t('team.title')}</h1><span className="badge-approx">{t('approx')}</span></div>
      <div className="team-slots">
        {[0, 1, 2, 3].map(i => {
          const s = slots[i]
          const m = s ? byId.get(s.id) : undefined
          if (!s || !m) return (
            <div key={i} className="card team-slot empty">
              <div className="muted small" style={{ textAlign: 'center' }}>{t('team.empty')}</div>
              <MiscritPicker onPick={p => setSlots([...slots, { id: p.id, level: 30 }])} exclude={slots.map(x => x.id)} />
            </div>
          )
          return (
            <div key={i} className={`card team-slot rarity-${m.rarity}`} style={{ '--el': elementGradient(m.element) } as CSSProperties}>
              <div className="team-slot-art"><Sprite name={m.names[0]} size={120} eager /></div>
              <Link to={`/m/${m.id}`}><h3>{m.names[0]}</h3></Link>
              <div className="row" style={{ justifyContent: 'center', gap: 8 }}><RarityBadge rarity={m.rarity} /><ElementIcons element={m.element} /></div>
              <LevelSlider value={s.level} onCommit={lv => setSlots(slots.map((x, j) => (j === i ? { ...x, level: lv } : x)))} />
              <button className="btn" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>✕ {t('pick.remove')}</button>
            </div>
          )
        })}
      </div>

      {team.length > 0 && (
        <div className="team-analysis">
          <Panel title={t('team.offense')}>
            <div className="el-row">{BASE_ELEMENTS.map(e => (
              <div key={e} className={`el-badge ${offense[e] > 1 ? 'good' : offense[e] < 1 ? 'bad' : ''}`}><img src={elementIconUrl(e)} alt={e} width={22} height={22} />×{offense[e]}</div>))}</div>
          </Panel>
          <Panel title={t('team.defense')}>
            <div className="el-row">{BASE_ELEMENTS.map(e => (
              <div key={e} className={`el-badge ${defense[e] >= 2 ? 'bad' : defense[e] === 0 ? 'good' : ''}`}><img src={elementIconUrl(e)} alt={e} width={22} height={22} />{t('team.hitBy', { n: defense[e] })}</div>))}</div>
          </Panel>
          <Panel title={t('team.control')}>
            {Object.keys(control).length === 0 ? <div className="muted small">{t('team.none')}</div>
              : <div className="row" style={{ gap: 6 }}>{Object.entries(control).map(([k, v]) => <span key={k} className="chip">{k} ×{v}</span>)}</div>}
          </Panel>
          <Panel title={t('team.speed')}>
            <div className="speed-list">{speed.map(({ m, spd }, i) => <div key={m.id}><b>{i + 1}.</b><MiscritAvatar name={m.names[0]} size={30} />{m.names[0]}<span className="muted small">SPD ≈ {spd}</span></div>)}</div>
          </Panel>
        </div>
      )}

      <div className="team-analysis">
        <Panel title={t('team.save')}>
          <div className="row">
            <input className="input" style={{ flex: 1 }} placeholder={t('team.name')} value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-primary" disabled={!name.trim() || !slots.length} onClick={() => { save({ name: name.trim(), code }); setName('') }}>💾 {t('team.save')}</button>
            <button className="btn" disabled={!slots.length} onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }}>
              🔗 {copied ? t('col.copied') : t('team.share')}</button>
          </div>
          {slots.length >= 2 && <Link className="btn" to={`/calc?a=${slots[0].id}.${slots[0].level}&d=${slots[1].id}.${slots[1].level}`}>🧮 {t('m.openCalc')}</Link>}
        </Panel>
        {teams.length > 0 && (
          <Panel title={t('team.saved')}>
            <div className="saved-teams">
              {teams.map(tm => (
                <div key={tm.name} className="saved-team">
                  <span className="grow">{tm.name}</span>
                  <span className="row" style={{ gap: 2 }}>{decodeTeam(tm.code, known).map(s => <MiscritAvatar key={s.id} name={byId.get(s.id)!.names[0]} size={26} />)}</span>
                  <button className="btn" onClick={() => setParams({ t: tm.code })}>↺</button>
                  <button className="btn" onClick={() => remove(tm.name)} aria-label={t('pick.remove')}>✕</button>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}
