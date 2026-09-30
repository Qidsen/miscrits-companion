import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Miscrit, Relic } from '../data/types'
import { useData } from '../data/DataProvider'
import { useT, type I18nKey } from '../i18n'
import { damage, isDamaging } from '../domain/damage'
import { FORMULA } from '../domain/formulaConfig'
import { STAT_KEYS, statsAt, withBuffs, withRelics, type Stats } from '../domain/stats'
import { elementColor, elementGradient } from '../styles/elements'
import { MiscritPicker } from '../components/MiscritPicker'
import { LevelSlider } from '../components/LevelSlider'
import { Sprite } from '../components/Sprite'
import { ElementIcons } from '../components/ElementIcons'
import { Panel } from '../components/Panel'
import './tools.css'

interface Side { id: number; level: number; relics: boolean }
const parseSide = (s: string | null, known: Map<number, Miscrit>): Side | null => {
  if (!s) return null
  const [id, lv, r] = s.split('.')
  const n = Number(id)
  if (!known.has(n)) return null
  const level = Math.min(FORMULA.maxLevel, Math.max(1, Number(lv) || 30))
  return { id: n, level, relics: r === 'r' }
}
const fmtSide = (s: Side) => `${s.id}.${s.level}${s.relics ? '.r' : ''}`

function Fighter({ title, side, onChange, buffs, setBuffs, stats }: {
  title: string; side: Side | null; onChange: (s: Side | null) => void
  buffs: Partial<Stats>; setBuffs: (b: Partial<Stats>) => void; stats: Stats | null
}) {
  const t = useT()
  const { byId } = useData()
  const m = side ? byId.get(side.id) : undefined
  return (
    <Panel title={title} className="fighter">
      {m && side ? (
        <>
          <div className="fighter-top" style={{ '--el': elementGradient(m.element) } as CSSProperties}>
            <Sprite name={m.names[0]} size={72} eager />
            <div><Link to={`/m/${m.id}`}><h3>{m.names[0]}</h3></Link><ElementIcons element={m.element} /></div>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => onChange(null)} aria-label={t('pick.remove')}>✕</button>
          </div>
          <LevelSlider value={side.level} onCommit={level => onChange({ ...side, level })} />
          {m.relicSet && <label className="chip"><input type="checkbox" checked={side.relics} onChange={e => onChange({ ...side, relics: e.target.checked })} /> {t('calc.relics')}</label>}
          {stats && <>
            <div className="tiny muted upper">{t('calc.statsAt', { n: side.level })}</div>
            <div className="stat-mini">{STAT_KEYS.map(k => <div key={k}><b>{stats[k]}</b><span>{t(`stat.${k}` as I18nKey)}</span></div>)}</div>
          </>}
          <div className="tiny muted upper">{t('calc.buffs')}</div>
          <div className="buffs">
            {STAT_KEYS.filter(k => k !== 'hp').map(k => (
              <label key={k}>{t(`stat.${k}` as I18nKey)}
                <input className="input" type="number" value={buffs[k] ?? 0} onChange={e => setBuffs({ ...buffs, [k]: Number(e.target.value) || 0 })} /></label>
            ))}
          </div>
        </>
      ) : <MiscritPicker onPick={p => onChange({ id: p.id, level: 30, relics: false })} />}
    </Panel>
  )
}

export function CalculatorPage() {
  const t = useT()
  const { byId, relics } = useData()
  const [params, setParams] = useSearchParams()
  const a = parseSide(params.get('a'), byId), d = parseSide(params.get('d'), byId)
  const set = (key: 'a' | 'd', s: Side | null) => {
    const p = new URLSearchParams(params)
    if (s) p.set(key, fmtSide(s)); else p.delete(key)
    setParams(p, { replace: true })
  }
  const [buffA, setBuffA] = useState<Partial<Stats>>({})
  const [buffD, setBuffD] = useState<Partial<Stats>>({})

  const build = (s: Side | null, buffs: Partial<Stats>) => {
    const m = s ? byId.get(s.id) : undefined
    if (!m || !s) return null
    let st = statsAt(m, s.level)
    if (s.relics && m.relicSet) st = withRelics(st, m.relicSet.relicIds.map(id => relics.get(id)).filter((r): r is Relic => !!r).filter(r => r.level <= s.level))
    return { m, stats: withBuffs(st, buffs) }
  }
  const A = build(a, buffA), D = build(d, buffD)
  const rows = useMemo(() => {
    if (!A || !D) return []
    return A.m.abilities.filter(isDamaging).map(ab => ({ ab, r: damage(ab, { element: A.m.element, stats: A.stats }, { element: D.m.element, stats: D.stats })! }))
      .sort((x, y) => y.r.avg - x.r.avg)
  }, [A, D])
  const top = rows[0]?.r.max ?? 1

  return (
    <div className="container fade-in">
      <div className="tool-head"><h1>🧮 {t('calc.title')}</h1><span className="badge-approx">{t('approx')}</span></div>
      <div className="calc-layout">
        <Fighter title={t('calc.attacker')} side={a} onChange={s => set('a', s)} buffs={buffA} setBuffs={setBuffA} stats={A?.stats ?? null} />
        <Panel className="calc-results" title={t('calc.dmg')} actions={a && d && <button className="btn" onClick={() => { const p = new URLSearchParams(params); p.set('a', fmtSide(d)); p.set('d', fmtSide(a)); setParams(p, { replace: true }); setBuffA(buffD); setBuffD(buffA) }}>⇄ {t('calc.swap')}</button>}>
          {!A || !D ? <div className="muted">{t('calc.pickBoth')}</div>
            : rows.length === 0 ? <div className="muted">{t('calc.noAttacks')}</div>
              : (
                <table className="dmg-table" data-testid="dmg-table">
                  <thead><tr><th>{t('calc.ability')}</th><th>{t('calc.mult')}</th><th>{t('calc.dmg')}</th><th>{t('calc.hits')}</th></tr></thead>
                  <tbody>
                    {rows.map(({ ab, r }) => (
                      <tr key={ab.id}>
                        <td><b>{ab.name}</b><div className="tiny" style={{ color: elementColor(ab.element), fontWeight: 800 }}>{ab.element} · AP {ab.ap}</div></td>
                        <td><span className={`mult-pill ${r.multiplier > 1 ? 'strong' : r.multiplier < 1 ? 'weak' : 'neutral'}`}>×{r.multiplier}</span></td>
                        <td><b>{r.min}–{r.max}</b> <span className="muted small">({r.avg})</span><div className="dmg-bar" style={{ width: `${(r.max / top) * 100}%` }} /></td>
                        <td><b>{r.hitsToKo}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </Panel>
        <Fighter title={t('calc.defender')} side={d} onChange={s => set('d', s)} buffs={buffD} setBuffs={setBuffD} stats={D?.stats ?? null} />
      </div>
    </div>
  )
}
