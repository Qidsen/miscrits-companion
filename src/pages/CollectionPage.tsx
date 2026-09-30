import { useMemo, useRef, useState } from 'react'
import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { collectionStats, encodeIds, exportCollection, importCollection, parseNameList } from '../domain/collection'
import { useCollection } from '../store/collection'
import { ProgressRing } from '../components/ProgressRing'
import { StatsBreakdown } from '../components/StatsBreakdown'
import { MiscritCard } from '../components/MiscritCard'
import { Panel } from '../components/Panel'
import './CollectionPage.css'

export function CollectionPage() {
  const t = useT()
  const { miscrits } = useData()
  const { caught, favorites, markMany, replace } = useCollection()
  const stats = useMemo(() => collectionStats(miscrits, new Set(caught)), [miscrits, caught])
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseNameList(text, miscrits), [text, miscrits])
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const link = `${location.origin}${location.pathname}#/c/${encodeIds(caught)}`
  const missing = useMemo(() => miscrits.filter(m => !caught.includes(m.id)), [miscrits, caught])

  const download = () => {
    const blob = new Blob([exportCollection(caught, favorites)], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'miscrits-collection.json' })
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const onFile = async (f: File | undefined) => {
    if (!f) return
    const data = importCollection(await f.text())
    setImportError(!data)
    if (data && confirm(t('col.importConfirm', { n: data.caught.length }))) replace(data.caught, data.favorites)
    if (file.current) file.current.value = ''
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked: the field stays selectable */ }
  }

  return (
    <div className="container collection fade-in">
      <section className="card col-hero">
        <ProgressRing value={stats.caught} total={stats.total} label={t('col.caught')} />
        <div className="col-hero-main">
          <h1>🏆 {t('col.title')}</h1>
          <StatsBreakdown stats={stats} />
        </div>
      </section>

      <div className="col-grid">
        <Panel title={`📋 ${t('col.paste')}`}>
          <p className="small muted">{t('col.pasteHint')}</p>
          <textarea className="input col-textarea" value={text} onChange={e => setText(e.target.value)} placeholder={'Flue\nWaddles\nDark Nessy'} />
          <div className="row">
            <span className="small">{t('col.pasteFound', { n: parsed.ids.length })}</span>
            {parsed.unknown.length > 0 && <span className="small" style={{ color: 'var(--danger)' }}>{t('col.pasteUnknown', { list: parsed.unknown.slice(0, 6).join(', ') })}</span>}
            <button className="btn btn-primary" disabled={!parsed.ids.length} onClick={() => { markMany(parsed.ids); setText('') }}>{t('col.markFound')}</button>
          </div>
        </Panel>

        <Panel title={`🔗 ${t('col.share')}`}>
          <p className="small muted">{t('col.shareHint')}</p>
          <div className="row">
            <input className="input" readOnly value={link} onFocus={e => e.target.select()} data-testid="share-link" style={{ flex: 1 }} />
            <button className="btn" onClick={copy}>{copied ? t('col.copied') : t('col.copy')}</button>
          </div>
          <div className="row">
            <button className="btn" onClick={download}>⬇️ {t('col.export')}</button>
            <button className="btn" onClick={() => file.current?.click()}>⬆️ {t('col.import')}</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onFile(e.target.files?.[0])} />
            <button className="btn" onClick={() => { if (confirm(t('col.clearConfirm'))) replace([], favorites) }}>🗑️ {t('col.clear')}</button>
          </div>
          {importError && <div className="small" style={{ color: 'var(--danger)' }}>{t('col.importBad')}</div>}
        </Panel>
      </div>

      <Panel title={<>{t('col.missing')} <span className="count">{missing.length}</span></>}>
        <div className="grid-cards">{missing.map(m => <MiscritCard key={m.id} m={m} quickMark />)}</div>
      </Panel>
    </div>
  )
}
