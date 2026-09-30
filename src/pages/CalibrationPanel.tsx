import { useMemo, useState } from 'react'
import type { Miscrit } from '../data/types'
import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { fitCalibration, predict, type Calibration } from '../domain/calibration'
import { isDamaging } from '../domain/damage'
import { useCalibration } from '../store/calibration'
import { MiscritAvatar } from '../components/MiscritAvatar'
import { Panel } from '../components/Panel'

/** Record real hits and fit the formula to them. Attacker/defender come from the calculator. */
type Side = { m: Miscrit; level: number; relics: boolean }
export function CalibrationPanel({ attacker, defender }: { attacker?: Side; defender?: Side }) {
  const t = useT()
  const { byId, relics } = useData()
  const { observations, applied, add, remove, apply, clear } = useCalibration()
  const abilities = (attacker?.m.abilities.filter(isDamaging) ?? []).sort((x, y) => (y.ap ?? 0) - (x.ap ?? 0))
  const [abilityId, setAbilityId] = useState<number | null>(null)
  const [attackStat, setAttackStat] = useState('')
  const [dmg, setDmg] = useState('')
  const [fit, setFit] = useState<Calibration | null>(null)
  const [copied, setCopied] = useState(false)
  const ability = abilities.find(a => a.id === abilityId) ?? abilities[0]
  const params = applied ?? undefined
  const rows = useMemo(() => observations.map(o => ({ o, p: predict(o, byId, params, relics) })), [observations, byId, params, relics])

  const canAdd = attacker && defender && ability && Number(dmg) > 0
  const onAdd = () => {
    if (!canAdd) return
    add({ attackerId: attacker.m.id, attackerLevel: attacker.level, abilityId: ability.id, defenderId: defender.m.id, defenderLevel: defender.level,
      damage: Number(dmg), attackerRelics: attacker.relics, defenderRelics: defender.relics, ...(Number(attackStat) > 0 ? { attackStat: Number(attackStat) } : {}) })
    setDmg('')
  }

  return (
    <Panel title={`🎯 ${t('cal.tab')}`} className="calib">
      <p className="small muted">{t('cal.intro')}</p>
      {!attacker || !defender ? <div className="muted">{t('cal.pickAttacker')}</div> : (
        <div className="calib-form">
          <label className="small">{t('calc.ability')}
            <select className="input" value={ability?.id ?? ''} onChange={e => setAbilityId(Number(e.target.value))}>
              {abilities.map(a => <option key={a.id} value={a.id}>{a.name} (AP {a.ap})</option>)}
            </select></label>
          <label className="small">{t('cal.attackStat')}<input className="input" inputMode="numeric" value={attackStat} onChange={e => setAttackStat(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="small">{t('cal.damage')}<input className="input" inputMode="numeric" value={dmg} onChange={e => setDmg(e.target.value.replace(/\D/g, ''))} data-testid="cal-damage" /></label>
          <button className="btn btn-primary" disabled={!canAdd} onClick={onAdd} data-testid="cal-add">+ {t('cal.add')}</button>
        </div>
      )}
      {observations.length > 0 && <>
        <h3>{t('cal.list')} <span className="count">{observations.length}</span></h3>
        <div className="calib-list">
          {rows.map(({ o, p }, i) => {
            const a = byId.get(o.attackerId), d = byId.get(o.defenderId), ab = a?.abilities.find(x => x.id === o.abilityId)
            return (
              <div key={i} className="calib-row">
                {a && <MiscritAvatar name={a.names[0]} size={28} />}<span className="small">{ab?.name} → </span>{d && <MiscritAvatar name={d.names[0]} size={28} />}
                <span className="small grow">{t('cal.observed')}: <b>{o.damage}</b> · {t('cal.predicted')}: {p ? Math.round(p.value) : '—'}</span>
                <button className="btn" onClick={() => remove(i)} aria-label={t('pick.remove')}>✕</button>
              </div>
            )
          })}
        </div>
      </>}
      <div className="row">
        <button className="btn" disabled={!observations.length} onClick={() => setFit(fitCalibration(observations, byId, relics))} data-testid="cal-fit">🧪 {t('cal.fit')}</button>
        {applied && <button className="btn" onClick={() => { clear(); setFit(null) }}>{t('cal.reset')}</button>}
      </div>
      {fit && (
        <div className="calib-result">
          <b>{t('cal.result', { before: Math.round(fit.errorBefore * 100), after: Math.round(fit.errorAfter * 100) })}</b>
          <span className="small muted">scale {fit.damageScale.toFixed(3)} · strong ×{fit.strong.toFixed(2)} · weak ×{fit.weak.toFixed(2)} · n={fit.n}</span>
          <div className="row">
            <button className="btn btn-primary" disabled={!fit.n} onClick={() => apply({ damageScale: fit.damageScale, strong: fit.strong, weak: fit.weak, n: fit.n })} data-testid="cal-apply">✓ {t('cal.apply')}</button>
            <button className="btn" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify({ fit, observations })); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }}>
              📋 {copied ? t('col.copied') : t('cal.copy')}</button>
          </div>
        </div>
      )}
    </Panel>
  )
}
