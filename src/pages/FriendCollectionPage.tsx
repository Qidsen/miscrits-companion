import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useData } from '../data/DataProvider'
import { useT } from '../i18n'
import { collectionStats, decodeIds } from '../domain/collection'
import { useCollection } from '../store/collection'
import { ProgressRing } from '../components/ProgressRing'
import { StatsBreakdown } from '../components/StatsBreakdown'
import { MiscritCard } from '../components/MiscritCard'
import { Panel } from '../components/Panel'
import './CollectionPage.css'

export function FriendCollectionPage() {
  const t = useT()
  const { code = '' } = useParams()
  const { miscrits, byId } = useData()
  const mine = useCollection(s => s.caught)
  const theirs = useMemo(() => decodeIds(code)?.filter(id => byId.has(id)) ?? null, [code, byId])
  const stats = useMemo(() => (theirs ? collectionStats(miscrits, new Set(theirs)) : null), [theirs, miscrits])

  if (!theirs || !stats) return <div className="container"><Panel title={t('friend.title')}><div role="alert">{t('friend.bad')}</div></Panel></div>

  const mineSet = new Set(mine), theirSet = new Set(theirs)
  const theyHave = miscrits.filter(m => theirSet.has(m.id) && !mineSet.has(m.id))
  const youHave = miscrits.filter(m => mineSet.has(m.id) && !theirSet.has(m.id))
  const both = miscrits.filter(m => mineSet.has(m.id) && theirSet.has(m.id))

  return (
    <div className="container collection fade-in">
      <section className="card col-hero">
        <ProgressRing value={stats.caught} total={stats.total} label={t('col.caught')} />
        <div className="col-hero-main">
          <h1>👥 {t('friend.title')}</h1>
          <div className="friend-counts"><span data-testid="friend-caught-count">{stats.caught}</span> / {stats.total}</div>
          <StatsBreakdown stats={stats} />
        </div>
      </section>
      {[[t('friend.theyHave'), theyHave], [t('friend.youHave'), youHave], [t('friend.both'), both]].map(([title, list]) => (
        <Panel key={title as string} title={<>{title as string} <span className="count">{(list as typeof miscrits).length}</span></>} style={{ marginBottom: 16 }}>
          <div className="grid-cards">{(list as typeof miscrits).map(m => <MiscritCard key={m.id} m={m} size="sm" />)}</div>
        </Panel>
      ))}
    </div>
  )
}
