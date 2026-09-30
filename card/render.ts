import type { HuntCardModel, Tile } from './model'

// Minimal element factory (satori takes React-like objects; no React dependency needed)
type Node = { type: string; props: Record<string, unknown> }
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children, ...extra } })

export const WIDTH = 1200
const ROW = 210
const RING: Record<string, string> = { Common: '#9aa4b2', Rare: '#4fa3ff', Epic: '#b36bff', Exotic: '#ff8a3d', Legendary: '#ffd84a' }

export const cardHeight = (m: HuntCardModel) => 170 + Math.max(1, m.tiles.length) * ROW + (m.more ? 50 : 0) + 60

function tile(t: Tile): Node {
  const ring = RING[t.rarity] ?? '#9aa4b2'
  return h('div', {
    width: WIDTH - 80, height: ROW - 20, marginBottom: 20, borderRadius: 28, alignItems: 'center', padding: '0 24px',
    backgroundColor: 'rgba(20,25,37,0.95)', backgroundImage: `linear-gradient(90deg, ${ring}40 0%, rgba(20,25,37,0) 45%)`, border: `2px solid ${ring}88`,
  }, [
    h('div', { width: 160, height: 160, borderRadius: 80, border: `5px solid ${ring}`, backgroundColor: `${ring}22`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      h('img', { width: 140, height: 140, objectFit: 'contain' }, undefined, { src: t.sprite, width: 140, height: 140 })),
    h('div', { flexDirection: 'column', flexGrow: 1, marginLeft: 28, minWidth: 0 }, [
      h('div', { fontSize: 42, fontWeight: 900, color: '#eef1f7', lineHeight: 1.1 }, t.name),
      h('div', { fontSize: 20, fontWeight: 800, color: ring, letterSpacing: 2, marginTop: 4 }, t.rarityLabel.toUpperCase()),
      h('div', { fontSize: 30, fontWeight: 800, color: '#ffb547', marginTop: 12 }, `📍 ${t.place}`),
      h('div', { fontSize: 20, fontWeight: 600, color: '#aab4c8', marginTop: 6 }, t.days),
    ]),
    t.thumb
      ? h('img', { width: 255, height: 170, borderRadius: 18, border: '3px solid #ffb547', objectFit: 'cover', flexShrink: 0 }, undefined, { src: t.thumb, width: 255, height: 170 })
      : h('div', { width: 0 }, ''),
  ])
}

export function huntCardTree(m: HuntCardModel): Node {
  const body = m.tiles.length
    ? m.tiles.map(tile)
    : [h('div', { width: WIDTH - 80, height: ROW - 20, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,25,37,0.95)', border: '2px solid #2a3346', fontSize: 34, fontWeight: 800, color: '#aab4c8' },
      'Сегодня никого из твоего списка — загляни завтра!')]
  return h('div', {
    width: WIDTH, height: cardHeight(m), flexDirection: 'column', padding: '48px 40px 0', fontFamily: 'Nunito', color: '#eef1f7',
    backgroundColor: '#0b0e15',
    backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(255,181,71,0.28), rgba(11,14,21,0) 55%), radial-gradient(circle at 100% 100%, rgba(179,107,255,0.25), rgba(11,14,21,0) 55%)',
  }, [
    h('div', { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 }, [
      h('div', { flexDirection: 'column' }, [
        h('div', { fontSize: 24, fontWeight: 800, color: '#aab4c8', letterSpacing: 3 }, `ТВОЯ ОХОТА · ${m.dayName.toUpperCase()}`),
        h('div', { fontSize: 56, fontWeight: 900, backgroundImage: 'linear-gradient(90deg, #ffe08a, #ff8a3d)', backgroundClip: 'text', color: 'transparent', lineHeight: 1.15 },
          m.tiles.length ? `Сегодня можно поймать: ${m.tiles.length + m.more}` : 'Сегодня отдыхаем'),
      ]),
      h('div', { fontSize: 20, color: '#707c94', fontWeight: 700, marginTop: 8 }, 'Miscrits Companion · by Qidsen'),
    ]),
    ...body,
    ...(m.more ? [h('div', { fontSize: 26, fontWeight: 800, color: '#aab4c8', justifyContent: 'center', height: 40 }, `… и ещё ${m.more} — полный список на сайте`)] : []),
  ])
}
