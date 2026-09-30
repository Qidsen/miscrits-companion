import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { regionLabel, useT, type I18nKey } from '../i18n'
import { EMPTY_FILTER, filterMiscrits, filterToParams, paramsToFilter, type DexFilter, type SortKey } from '../domain/filters'
import { BASE_ELEMENTS, RARITY_ORDER } from '../domain/miscrit'
import { useGameDay } from '../hooks/useGameDay'
import { useCollection } from '../store/collection'
import { DayPicker } from '../components/DayPicker'
import { MiscritCard } from '../components/MiscritCard'
import { elementIconUrl } from '../data/images'
import './DexPage.css'
import './CollectionPage.css'

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

export function DexPage() {
  const t = useT()
  const { miscrits, regions } = useData()
  const [params, setParams] = useSearchParams()
  const { day: today } = useGameDay()
  const f = paramsToFilter(params)
  const set = (over: Partial<DexFilter>) => setParams(filterToParams({ ...f, ...over }), { replace: true })
  // The router applies URL updates in a transition, so a URL-controlled input lags and drops keys.
  const [q, setQ] = useState(f.q)
  const [quick, setQuick] = useState(false)
  const caught = useCollection(s => s.caught)
  const favorites = useCollection(s => s.favorites)
  const result = useMemo(() => filterMiscrits(miscrits, paramsToFilter(params), { caught: new Set(caught), favorites: new Set(favorites) }),
    [miscrits, params, caught, favorites])

  return (
    <div className="container dex">
      <div className="card dex-filters">
        <input className="input" placeholder={t('dex.search')} value={q} onChange={e => { setQ(e.target.value); set({ q: e.target.value }) }} data-testid="dex-search" />
        <div className="row">
          {BASE_ELEMENTS.map(el => (
            <button key={el} className="chip" aria-pressed={f.elements.includes(el)} onClick={() => set({ elements: toggle(f.elements, el) })}>
              <img src={elementIconUrl(el)} alt="" width={16} height={16} />{el}
            </button>
          ))}
        </div>
        <div className="row">
          {RARITY_ORDER.map(r => (
            <button key={r} className={`chip rarity-${r}`} style={{ color: 'var(--r)' }} aria-pressed={f.rarities.includes(r)} onClick={() => set({ rarities: toggle(f.rarities, r) })}>
              {t(`rarity.${r}` as I18nKey)}
            </button>
          ))}
        </div>
        <DayPicker value={f.day} today={today} onChange={day => set({ day })} anyLabel={t('dex.anyDay')} />
        <div className="row">
          <select className="input dex-select" value={f.region ?? ''} onChange={e => set({ region: e.target.value || null })} aria-label={t('dex.region')}>
            <option value="">{t('dex.region')}: {t('dex.any')}</option>
            {regions.map(r => <option key={r.name} value={r.name}>{regionLabel(t, r.name)}</option>)}
          </select>
          <select className="input dex-select" value={f.status} onChange={e => set({ status: e.target.value as DexFilter['status'] })} aria-label={t('dex.status')}>
            <option value="all">{t('dex.all')}</option><option value="caught">{t('dex.caught')}</option><option value="uncaught">{t('dex.uncaught')}</option>
          </select>
          <select className="input dex-select" value={f.sort} onChange={e => set({ sort: e.target.value as SortKey })} aria-label={t('dex.sort')}>
            {(['id', 'name', 'rarity', 'spd', 'hp'] as SortKey[]).map(s => <option key={s} value={s}>{t('dex.sort')}: {t(`dex.sort.${s}` as I18nKey)}</option>)}
          </select>
          <label className="chip"><input type="checkbox" checked={f.favorites} onChange={e => set({ favorites: e.target.checked })} /> {t('dex.favorites')}</label>
          <button className="chip" aria-pressed={quick} onClick={() => setQuick(v => !v)} data-testid="quick-mark">✓ {t('col.quickMark')}</button>
          <button className="btn" onClick={() => { setQ(''); setParams(filterToParams(EMPTY_FILTER), { replace: true }) }}>{t('dex.reset')}</button>
        </div>
      </div>
      {quick && <div className="quick-banner"><span>{t('col.quickHint')}</span><button className="btn" onClick={() => setQuick(false)}>✕</button></div>}
      <div className="muted dex-count" data-testid="dex-count">{t('dex.results', { n: result.length })}</div>
      {result.length === 0
        ? <div className="card dex-empty">{t('dex.empty')}</div>
        : <div className="grid-cards">{result.map(m => <MiscritCard key={m.id} m={m} quickMark={quick} />)}</div>}
    </div>
  )
}
