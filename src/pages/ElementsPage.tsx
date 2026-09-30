import { useId, useState } from 'react'
import { elementIconUrl } from '../data/images'
import { elementLabel, useT } from '../i18n'
import { BEATS, multiplier, strongAgainst, weakAgainst } from '../domain/elements'
import { BASE_ELEMENTS } from '../domain/miscrit'
import { ELEMENT_COLORS } from '../styles/elements'
import { Panel } from '../components/Panel'
import './tools.css'

const pill = (v: number) => <span className={`mult-pill ${v > 1 ? 'strong' : v < 1 ? 'weak' : 'neutral'}`}>×{v}</span>

/** Triangle diagram: each element's arrow points at the one it beats. */
function Cycle({ els, title }: { els: string[]; title: string }) {
  const t = useT()
  const arrow = `arr-${useId().replace(/:/g, '')}` // unique per diagram: two SVGs share the page
  const pts = [[150, 30], [265, 225], [35, 225]]
  return (
    <div className="el-cycle">
      <h3>{title}</h3>
      <svg viewBox="0 0 300 285" role="img" aria-label={title}>
        <defs><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ffb547" /></marker></defs>
        {els.map((e, i) => {
          const target = els.indexOf(BEATS[e])
          const [x1, y1] = pts[i], [x2, y2] = pts[target]
          const k = 0.26
          return <line key={e} x1={x1 + (x2 - x1) * k} y1={y1 + (y2 - y1) * k} x2={x2 - (x2 - x1) * k} y2={y2 - (y2 - y1) * k} stroke="#ffb547" strokeWidth="3" markerEnd={`url(#${arrow})`} />
        })}
        {els.map((e, i) => (
          <g key={e} transform={`translate(${pts[i][0]},${pts[i][1]})`}>
            <circle r="30" fill={`${ELEMENT_COLORS[e]}33`} stroke={ELEMENT_COLORS[e]} strokeWidth="3" />
            <image href={elementIconUrl(e)} x="-16" y="-16" width="32" height="32" />
            <text y="48" textAnchor="middle" fill="#eef1f7" fontSize="14" fontWeight="800">{elementLabel(t, e)}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function ElementsPage() {
  const t = useT()
  const [hl, setHl] = useState<string | null>(null)
  const [d1, setD1] = useState('Nature')
  const [d2, setD2] = useState('Water')
  const dual = d1 === d2 ? d1 : `${d1}${d2}`
  return (
    <div className="container fade-in">
      <div className="tool-head">
        <div><h1>🔥 {t('el.title')}</h1><p className="muted">{t('el.subtitle')}</p></div>
        <span className="badge-approx">{t('approx')}</span>
      </div>
      <div className="el-layout">
        <Panel>
          <table className="el-grid">
            <thead>
              <tr><th>{t('el.attacker')} \ {t('el.defender')}</th>{BASE_ELEMENTS.map(d => <th key={d} className={hl === d ? 'hl' : ''}><img src={elementIconUrl(d)} alt="" width={22} height={22} />{elementLabel(t, d)}</th>)}</tr>
            </thead>
            <tbody>
              {BASE_ELEMENTS.map(a => (
                <tr key={a} onMouseEnter={() => setHl(a)} onMouseLeave={() => setHl(null)}>
                  <th className={hl === a ? 'hl' : ''}><img src={elementIconUrl(a)} alt="" width={22} height={22} />{elementLabel(t, a)}</th>
                  {BASE_ELEMENTS.map(d => { const v = multiplier(a, d); return <td key={d} className={v > 1 ? 'strong' : v < 1 ? 'weak' : ''}>×{v}</td> })}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="el-side">
          <Panel><div className="el-cycles"><Cycle els={['Fire', 'Nature', 'Water']} title={t('el.cycle1')} /><Cycle els={['Earth', 'Lightning', 'Wind']} title={t('el.cycle2')} /></div></Panel>
          <Panel title={t('el.dual')}>
            <div className="row">
              <select className="input" style={{ width: 'auto' }} value={d1} onChange={e => setD1(e.target.value)}>{BASE_ELEMENTS.map(e => <option key={e} value={e}>{elementLabel(t, e)}</option>)}</select>
              <span>+</span>
              <select className="input" style={{ width: 'auto' }} value={d2} onChange={e => setD2(e.target.value)}>{BASE_ELEMENTS.map(e => <option key={e} value={e}>{elementLabel(t, e)}</option>)}</select>
            </div>
            <div className="el-row" style={{ marginTop: 12 }}>
              {[...BASE_ELEMENTS, 'Physical'].map(a => (
                <div key={a} className="el-badge">{a === 'Physical' ? '👊' : <img src={elementIconUrl(a)} alt="" width={20} height={20} />}{pill(multiplier(a, dual))}</div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <div className="grid-cards-lg" style={{ marginTop: 18 }}>
        {BASE_ELEMENTS.map(e => (
          <Panel key={e} style={{ borderTop: `3px solid ${ELEMENT_COLORS[e]}` }}>
            <h3 className="el-card"><img src={elementIconUrl(e)} alt="" width={26} height={26} />{elementLabel(t, e)}</h3>
            <div className="small">{t('el.strong')}: <b style={{ color: 'var(--ok)' }}>{strongAgainst(e).map(x => elementLabel(t, x)).join(', ')}</b></div>
            <div className="small">{t('el.weak')}: <b style={{ color: 'var(--danger)' }}>{weakAgainst(e).map(x => elementLabel(t, x)).join(', ')}</b></div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
