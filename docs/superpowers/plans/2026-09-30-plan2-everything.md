# Miscrits Companion — Plan 2: Everything Else Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the whole spec: visual overhaul, map auto-zones, mini games, week calendar, relics, collection (quick mark, import/export, share), elements chart, damage calculator, team builder, compare, hunt list, PWA, auto-update workflow.

**Architecture:** Same as Plan 1. All game logic in pure `src/domain/*` modules with Vitest tests written first; pages are thin React views over them. A shared design system (`src/styles/*`, `MiscritCard`, `Sprite`, `Panel`) replaces the Plan 1 tiles. Routes are added to `src/App.tsx`; navigation moves to `src/components/nav.ts` config.

**Tech Stack:** as Plan 1 + vite-plugin-pwa, Google Fonts (Nunito, Baloo 2).

**Spec:** `docs/superpowers/specs/2026-09-30-miscrits-companion-design.md` (sections 5, 6, 12).

**Branch:** `feat/plan2` from `feat/core` (not merged to main).

**Plan-writing note:** domain tasks carry full test code (the contract). UI tasks carry file lists, component contracts and acceptance checks, not every JSX line: the UI is iterated visually with screenshots, and freezing hundreds of lines of JSX in the plan would be stale on first contact. Every UI task ends with a screenshot review at 1280 and 360 px and the e2e suite.

## Global Constraints

- Everything from Plan 1 Global Constraints still holds (03:00 Europe/Kyiv, 0 = Sunday, `'all'`, RU/EN for every new string, hash routing, `base: './'`, 360 px without horizontal scroll, no heavy UI kit).
- Element cycles: Fire > Nature > Water > Fire; Earth > Lightning > Wind > Earth; Physical/Misc neutral; dual defender = product. Strong 1.5, weak 0.5 (config).
- Stat growth per level (approximate, config): Weak 1, Moderate 2, Strong 2, Max 3, Elite 5; growth stops after level 35.
- Damage calculator and element chart are labeled "approximate".
- No game-account automation (no bots, no game credentials).
- `prefers-reduced-motion: reduce` disables non-essential animation.
- All persisted stores go through `safeStorage` + a sanitizing `merge`.

## Review Focus

1. **Share-link decoding of garbage / truncated / huge input** → friend view shows an error state, never crashes or hangs. Pinned in Task 7 tests (`decodeIds`).
2. **Zones with 1–2 markers, or a region with no markers** → circle / nothing, never a broken polygon or NaN. Pinned in Task 3 tests.
3. **Game day changes while a page is open (03:00 Kyiv)** → Today, Map, Dex, Hunt switch day without reload, countdown and day agree. Pinned in Task 2 (`useGameDay` helper test) + e2e clock test in Task 16.
4. **Team/compare URLs with unknown ids, duplicates, >4 entries** → ignored/truncated, page still renders. Pinned in Tasks 10 and 11.
5. **Mini game pools too small (e.g. Epic+ filter leaves < 4 miscrits with sprites, evolution lines with repeated names)** → question generator never loops forever or shows duplicate options. Pinned in Task 13.

---

### Task 1: Design system foundation

**Files:**
- Modify: `index.html` (Google Fonts preconnect + link Nunito 400/600/800, Baloo 2 600/800), `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/styles/elements.ts`, `src/components/Sprite.tsx`, `src/components/MiscritCard.tsx`, `src/components/MiscritCard.css`, `src/components/Panel.tsx`, `src/components/nav.ts`, `src/components/BottomNav.tsx`, `src/components/MoreMenu.tsx`
- Modify: `src/components/Header.tsx/.css`, `src/components/Layout.tsx`, `src/components/ElementIcons.tsx` (onError hide), `src/components/LangToggle.tsx` (translated aria-label), `src/components/Footer.tsx` (date in app language)
- Test: `tests/styles/elements.test.ts`

**Interfaces:**
- Produces:
  - `ELEMENT_COLORS: Record<string, string>` for the 6 bases + `Physical`, `Misc`; `elementGradient(element: string): string` (CSS `linear-gradient(...)`, dual → two colors)
  - `<Sprite name size? className? />`: `_back.png` with fallback to `<MiscritAvatar>`
  - `<MiscritCard m size?: 'sm'|'md'|'lg' showDays?: boolean day?: number onHover?(id|null) highlighted?: boolean quickMark?: boolean />` (quickMark: click toggles caught instead of navigating)
  - `<Panel title? actions? children />` glass panel
  - `NAV: { to: string; key: I18nKey; icon: string; primary: boolean }[]`

- [ ] **Step 1: failing test**
```ts
// tests/styles/elements.test.ts
import { expect, test } from 'vitest'
import { ELEMENT_COLORS, elementGradient } from '../../src/styles/elements'
test('every base element has a color', () => {
  for (const e of ['Fire', 'Water', 'Nature', 'Earth', 'Wind', 'Lightning', 'Physical', 'Misc']) expect(ELEMENT_COLORS[e]).toMatch(/^#[0-9a-f]{6}$/i)
})
test('gradient uses both colors for dual elements, falls back for unknown', () => {
  expect(elementGradient('FireWind')).toContain(ELEMENT_COLORS.Fire)
  expect(elementGradient('FireWind')).toContain(ELEMENT_COLORS.Wind)
  expect(elementGradient('Bogus')).toContain(ELEMENT_COLORS.Misc)
})
```
- [ ] **Step 2:** run → FAIL. **Step 3:** implement `elements.ts`; tokens: `--font-body: 'Nunito'`, `--font-head: 'Baloo 2'`, background radial gradients, `--glass: rgba(22,26,35,.72)` + `backdrop-filter: blur(12px)`, `--glow-<rarity>` box-shadows; global `@media (prefers-reduced-motion: reduce) { *{animation:none!important;transition:none!important} }`.
- [ ] **Step 4:** components. Header: logo, primary nav (Today, Map, Dex, Week, Team, Games), "More" dropdown (Relics, Elements, Calculator, Compare, Hunt, Collection), search, countdown, lang. Phone (<720 px): header shows logo/search/countdown/lang; `BottomNav` fixed at bottom with 5 primary icons + "More" sheet; `main` gets bottom padding.
- [ ] **Step 5:** replace `MiscritTile` usages with `MiscritCard` (Today, Dex); delete `MiscritTile.*`. Update e2e testid: `MiscritCard` root keeps `data-testid="miscrit-tile"`.
- [ ] **Step 6:** `npm test && npm run build`, screenshots `#/` and `#/dex` at 1280/360; `npm run e2e` green. Commit `feat(ui): design system, miscrit cards, navigation`.

---

### Task 2: Live game day hook (fixes deferred minor)

**Files:** Create `src/hooks/useGameDay.ts`; Modify `src/domain/schedule.ts` (add `msUntilReset`), TodayPage, MapPage, DexPage (use hook). Test: `tests/domain/schedule.test.ts` (append).

**Interfaces:** `msUntilReset(now: Date): number`; `useGameDay(): { day: number; nextReset: Date }` — re-renders exactly at reset via `setTimeout(msUntilReset + 50)`, re-armed after firing and on `visibilitychange`.

- [ ] **Step 1: failing test (append)**
```ts
import { msUntilReset } from '../../src/domain/schedule'
test('msUntilReset', () => {
  expect(msUntilReset(new Date('2026-09-30T23:00:00Z'))).toBe(3_600_000)
  expect(msUntilReset(new Date('2026-10-01T00:00:00Z'))).toBe(86_400_000)
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS. Map `day` state: initialized from hook and follows it while the user has not picked a day manually (`picked ?? liveDay`), same pattern as Today.
- [ ] **Step 5:** commit `feat: live game day switch at reset`.

---

### Task 3: Zone shapes domain

**Files:** Create `src/domain/zones.ts`. Test: `tests/domain/zones.test.ts`.

**Interfaces:**
```ts
export const ZONE_COLORS: string[] // 8 distinct hex colors
export function convexHull(pts: [number, number][]): [number, number][] // Andrew monotone chain, CCW, no duplicate/collinear points
export interface ZoneShape { zone: string; name: string; color: string; center: [number, number]; hull: [number, number][]; radius: number; markerIds: string[] }
// percent coordinates (x,y of markers). hull has ≥3 points → polygon; otherwise radius > 0 → circle around center.
export function zoneShapes(region: Region, markers: Marker[], byId: Map<number, Miscrit>, pad?: number /* default 3 */): ZoneShape[]
export function padHull(hull: [number, number][], center: [number, number], pad: number): [number, number][]
```
Zone of a marker = the single zone of that region in its miscrit's spawns; markers with unknown miscrit or ambiguous zone are skipped. Output sorted by zone number; color = `ZONE_COLORS[i % 8]` by zone index.

- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { convexHull, padHull, zoneShapes } from '../../src/domain/zones'
import type { Marker, Miscrit, Region } from '../../src/data/types'

test('convexHull drops interior and collinear points', () => {
  const h = convexHull([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5], [5, 0]])
  expect(h).toHaveLength(4)
  expect(h).toEqual(expect.arrayContaining([[0, 0], [10, 0], [10, 10], [0, 10]]))
})
test('convexHull of <3 unique points returns them', () => {
  expect(convexHull([[1, 1], [1, 1]])).toEqual([[1, 1]])
  expect(convexHull([])).toEqual([])
})
test('padHull pushes vertices away from center', () => {
  const [p] = padHull([[10, 0]], [0, 0], 2)
  expect(p[0]).toBeCloseTo(12)
})

const region: Region = { name: 'Forest', zones: { '1': 'Azore Lake', '2': 'Axe' }, map: { file: 'f', width: 100, height: 100 } }
const mc = (id: number, zones: string[]) => ({ id, spawns: zones.map(zone => ({ region: 'Forest', zone, days: 'all' })) }) as unknown as Miscrit
const byId = new Map([[1, mc(1, ['1'])], [2, mc(2, ['2'])], [3, mc(3, ['1', '2'])]])
const mk = (id: string, miscritId: number | null, x: number, y: number): Marker => ({ id, region: 'Forest', x, y, name: 'n', miscritId, rarity: 'Common', element: 'Fire', exactImg: null })

test('zoneShapes: polygon for ≥3 markers, circle for 1, skips ambiguous and unknown', () => {
  const shapes = zoneShapes(region, [mk('a', 1, 10, 10), mk('b', 1, 30, 10), mk('c', 1, 20, 30), mk('d', 2, 70, 70), mk('e', 3, 50, 50), mk('f', null, 5, 5)], byId)
  expect(shapes.map(s => s.zone)).toEqual(['1', '2'])
  expect(shapes[0].name).toBe('Azore Lake')
  expect(shapes[0].hull.length).toBeGreaterThanOrEqual(3)
  expect(shapes[0].markerIds.sort()).toEqual(['a', 'b', 'c'])
  expect(shapes[1].hull).toEqual([])
  expect(shapes[1].radius).toBeGreaterThan(0)
  expect(shapes[1].center).toEqual([70, 70])
  for (const s of shapes) for (const [x, y] of [...s.hull, s.center]) { expect(Number.isFinite(x)).toBe(true); expect(Number.isFinite(y)).toBe(true) }
})
test('zoneShapes: no markers → []', () => { expect(zoneShapes(region, [], byId)).toEqual([]) })
test('two markers → circle covering both', () => {
  const [s] = zoneShapes(region, [mk('a', 1, 10, 10), mk('b', 1, 30, 10)], byId)
  expect(s.hull).toEqual([])
  expect(s.center).toEqual([20, 10])
  expect(s.radius).toBeGreaterThanOrEqual(10)
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS. Commit `feat(domain): zone shapes from markers`.

---

### Task 4: Map redesign with zones

**Files:** Modify `src/components/RegionMap.tsx/.css`, `src/pages/MapPage.tsx/.css`. Create `src/components/ZoneLayer.tsx`, `src/components/RegionStrip.tsx`, `src/components/ZonePanel.tsx`, `src/components/MarkerPopupCard.tsx`.

**Contracts:**
- `RegionStrip`: horizontal scroll strip of regions: map thumbnail (the webp, `object-fit: cover`, lazy), localized name, count of miscrits available on the selected day; active region highlighted.
- `ZoneLayer({ shapes, map, hovered, onHover })`: Leaflet `Polygon` (hull ≥3, converted with `toLatLng`) or `Circle` (radius in map px = `radius% × width`), fill = zone color at 0.18 (0.35 when hovered), dashed stroke; permanent `Tooltip` label with zone name at center (`direction: 'center'`, class `zone-label`).
- `RegionMap` gains props `hoveredZone?: string | null`, `pulseId?: string | null`, `onZoneHover?`, `flyTo?: string | null`; markers outside the hovered zone get class `map-pin-dim`; `pulseId` marker gets `map-pin-pulse`; icons memoized per (marker, rarity, state). Fix: when the `?focus` marker is filtered out, do not refit (keep view). Compact minimap: disable `doubleClickZoom`, `touchZoom`, `boxZoom`, `keyboard`.
- `ZonePanel({ region, shapes, day, onHoverZone, onHoverMiscrit, onPickMiscrit })`: for each zone a colored block (color stripe, name, count), inside `MiscritCard size="sm" showDays` in a 2-column grid; hover on block → zone highlight; hover on card → marker pulse; click on card → map flies to its marker (if it has one in this region) and opens the popup; card has "details" link.
- `MarkerPopupCard`: sprite (Sprite, 96 px) on element gradient, name, rarity badge, zone name, day chips (today marked), "Details" button.
- Layout: desktop = region strip on top, then grid `[panel 380px | map 1fr]`, map height `calc(100vh - header - strip)`; phone = strip, map 65vh, panel below.

**Acceptance:** Forest shows 4 labeled colored zones; hovering "Azore Lake" in panel highlights its polygon and dims other pins; clicking a card flies to its marker; Mansion attic zones render as circles. e2e (added in Task 16): `.leaflet-interactive` zone paths count ≥ 3 on Forest; hover panel zone → `.map-pin-dim` count > 0.

- [ ] Steps: implement → screenshots (Forest, Mansion, phone) → `npm run e2e` → commit `feat(map): auto zones, region strip, zone panel with cards`.

---

### Task 5: Today + Miscrit page redesign

**Files:** Modify `src/pages/TodayPage.tsx/.css`, `src/pages/MiscritPage.tsx/.css`, `src/components/StatBars.tsx`.

**Contracts:**
- Today hero: big countdown (HH:MM:SS, 48 px, Baloo), "Reset 03:00 Kyiv / HH:MM your time", game day name; Miscrit of the day as `MiscritCard size="lg"`.
- "Rare today" showcase: horizontal scroll of `lg` cards with glow. "Only today", then regions: each region panel header has the map thumbnail as a banner background with the region name; zones as sub-headers with the zone color dot (color from `zoneShapes` order so it matches the map).
- Miscrit page: hero background `elementGradient`, sprite 260 px with rarity glow and float animation; evolution strip of 4 sprite thumbnails (click to switch); stat bars colored by stat; buttons caught / favorite / + hunt / compare (compare adds id to `#/compare?ids=`); rest as before.

- [ ] Steps: implement → screenshots → e2e → commit `feat(ui): Today hero and miscrit page redesign`.

---

### Task 6: Week calendar + Relics

**Files:** Create `src/domain/week.ts`, `src/domain/relics.ts`, `src/pages/WeekPage.tsx/.css`, `src/pages/RelicsPage.tsx/.css`. Tests: `tests/domain/week.test.ts`, `tests/domain/relics.test.ts`.

**Interfaces:**
```ts
// week.ts — only day-restricted spawns (not 'all'), sorted by rarity desc then name
export function weekMatrix(miscrits: Miscrit[]): Map<string /*region*/, Map<number /*day*/, Miscrit[]>>
// relics.ts
export function relicUsage(miscrits: Miscrit[]): Map<number /*relicId*/, number[] /*miscritIds*/>
export interface RelicFilter { levels: number[]; stat: string | null; q: string }
export function filterRelics(relics: Relic[], f: RelicFilter): Relic[] // stat: effect key with positive number; sorted level, then name
```
- [ ] **Step 1: failing tests**
```ts
// week.test.ts
import { expect, test } from 'vitest'
import { weekMatrix } from '../../src/domain/week'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, rarity: string, spawns: unknown[]) => ({ id, names: [`M${id}`], rarity, spawns }) as unknown as Miscrit
test('weekMatrix lists only day-restricted spawns per region and day', () => {
  const w = weekMatrix([
    m(1, 'Common', [{ region: 'Forest', zone: '1', days: [1, 3] }]),
    m(2, 'Legendary', [{ region: 'Forest', zone: '2', days: [1] }]),
    m(3, 'Rare', [{ region: 'Forest', zone: '1', days: 'all' }]),
  ])
  expect(w.get('Forest')!.get(1)!.map(x => x.id)).toEqual([2, 1])
  expect(w.get('Forest')!.get(3)!.map(x => x.id)).toEqual([1])
  expect(w.get('Forest')!.get(2)).toBeUndefined()
})
// relics.test.ts
import { filterRelics, relicUsage } from '../../src/domain/relics'
import type { Relic } from '../../src/data/types'
test('relicUsage maps relics to miscrits', () => {
  const u = relicUsage([{ id: 1, relicSet: { name: 'A', relicIds: [10, 20] } }, { id: 2, relicSet: { name: 'A', relicIds: [10] } }, { id: 3, relicSet: null }] as unknown as Miscrit[])
  expect(u.get(10)).toEqual([1, 2]); expect(u.get(20)).toEqual([1])
})
test('filterRelics by level, stat, query', () => {
  const r = (id: number, level: number, name: string, effect: Record<string, number>) => ({ id, level, name, desc: '', effect, special: null, imageUrl: '' }) as Relic
  const list = [r(1, 20, 'B', { ea: 5 }), r(2, 10, 'A', { ea: -1, hp: 3 }), r(3, 10, 'C', { pd: 2 })]
  expect(filterRelics(list, { levels: [], stat: null, q: '' }).map(x => x.id)).toEqual([2, 3, 1])
  expect(filterRelics(list, { levels: [10], stat: null, q: '' }).map(x => x.id)).toEqual([2, 3])
  expect(filterRelics(list, { levels: [], stat: 'ea', q: '' }).map(x => x.id)).toEqual([1])
  expect(filterRelics(list, { levels: [], stat: null, q: 'c' }).map(x => x.id)).toEqual([3])
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: pages.** Week: sticky header row Mon..Sun (today highlighted), one row per region (localized name + thumbnail), cells show `MiscritCard size="xs"` avatars (tooltip name); phone: day tabs + list per region instead of the table. Relics: filters (level chips 10/20/30/35, stat select, search), grid of relic cards (image, name, level, effect chips +green/−red, special in accent), "Used by" avatars (max 8, "+N").
- [ ] Commit `feat: week calendar and relics pages`.

---

### Task 7: Collection domain + page + quick mark + share

**Files:** Create `src/domain/collection.ts`, `src/pages/CollectionPage.tsx/.css`, `src/pages/FriendCollectionPage.tsx`. Modify `src/pages/DexPage.tsx` (quick-mark toggle), `src/store/collection.ts` (add `setCaught(ids)`, `markMany(ids)`). Test: `tests/domain/collection.test.ts`.

**Interfaces:**
```ts
export function encodeIds(ids: number[]): string            // base64url of a bitset (bit i = id i); '' for []
export function decodeIds(s: string, maxId?: number /* 4096 */): number[] | null  // null if not base64url or longer than 20 000 chars; bits > maxId ignored
export function parseNameList(text: string, miscrits: Miscrit[]): { ids: number[]; unknown: string[] } // split on newline/comma/semicolon, trim, any evolution name, case-insensitive, dedupe
export function collectionStats(miscrits: Miscrit[], caught: Set<number>): { total: number; caught: number; byElement: Record<string, { total: number; caught: number }>; byRarity: Record<string, { total: number; caught: number }> }
export function exportCollection(caught: number[], favorites: number[]): string   // JSON {version:1, caught, favorites}
export function importCollection(json: string): { caught: number[]; favorites: number[] } | null
```
- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { collectionStats, decodeIds, encodeIds, exportCollection, importCollection, parseNameList } from '../../src/domain/collection'
import type { Miscrit } from '../../src/data/types'

test('encode/decode round trip', () => {
  const ids = [1, 2, 20, 425, 520]
  expect(decodeIds(encodeIds(ids))).toEqual(ids)
  expect(encodeIds([])).toBe('')
  expect(decodeIds('')).toEqual([])
})
test('decodeIds rejects garbage and caps size', () => {
  expect(decodeIds('***')).toBeNull()
  expect(decodeIds('A'.repeat(100_000))).toBeNull() // longer than 20 000 chars
  expect(decodeIds(encodeIds([3, 5000]), 4096)).toEqual([3])
})
const ms = [
  { id: 1, names: ['Flue', 'Afterburn'], element: 'Fire', rarity: 'Common' },
  { id: 2, names: ['Breezy'], element: 'FireWind', rarity: 'Legendary' },
] as unknown as Miscrit[]
test('parseNameList', () => {
  expect(parseNameList('afterburn\n Breezy ; nope, FLUE', ms)).toEqual({ ids: [1, 2], unknown: ['nope'] })
  expect(parseNameList('', ms)).toEqual({ ids: [], unknown: [] })
})
test('collectionStats counts dual elements in both bases', () => {
  const s = collectionStats(ms, new Set([2]))
  expect(s).toMatchObject({ total: 2, caught: 1 })
  expect(s.byElement.Fire).toEqual({ total: 2, caught: 1 })
  expect(s.byElement.Wind).toEqual({ total: 1, caught: 1 })
  expect(s.byRarity.Legendary).toEqual({ total: 1, caught: 1 })
})
test('export/import', () => {
  expect(importCollection(exportCollection([1, 2], [2]))).toEqual({ caught: [1, 2], favorites: [2] })
  expect(importCollection('{"caught":"x"}')).toBeNull()
  expect(importCollection('not json')).toBeNull()
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: UI.** Collection page: big progress ring (caught/total), bars by element (element colors) and rarity; actions: "Paste list" (textarea → shows matched count + unknown names → confirm marks), "Export" (download `miscrits-collection.json`), "Import" (file input, confirm replace), "Share link" (copies `#/c/<encodeIds(caught)>`). Friend page `#/c/:code`: decoded collection read-only with stats, "they have / you don't" and "you have / they don't" lists; invalid code → error panel. Dex: "Quick mark" toggle chip → `MiscritCard quickMark`, a floating counter "Marked: N".
- [ ] Commit `feat: collection page, quick mark, import/export, share link`.

---

### Task 8: Elements domain + chart page

**Files:** Create `src/domain/formulaConfig.ts`, `src/domain/elements.ts`, `src/pages/ElementsPage.tsx/.css`. Test: `tests/domain/elements.test.ts`.

**Interfaces:**
```ts
// formulaConfig.ts
export const FORMULA = { strong: 1.5, weak: 0.5, perLevel: { Weak: 1, Moderate: 2, Strong: 2, Max: 3, Elite: 5 }, maxLevel: 35,
  base: { hp: 40, spd: 10, ea: 10, pa: 10, ed: 10, pd: 10 }, hpPerLevelFactor: 2, damageScale: 0.35, variance: 0.1 } as const
// elements.ts
export const BEATS: Record<string, string> // Fire→Nature, Nature→Water, Water→Fire, Earth→Lightning, Lightning→Wind, Wind→Earth
export function multiplier(attack: string, defender: string): number // attack: base element | 'Physical' | 'Misc'
export function strongAgainst(el: string): string[]; export function weakAgainst(el: string): string[] // for chart
```
- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { multiplier, strongAgainst, weakAgainst } from '../../src/domain/elements'
test('cycles', () => {
  expect(multiplier('Fire', 'Nature')).toBe(1.5)
  expect(multiplier('Nature', 'Fire')).toBe(0.5)
  expect(multiplier('Water', 'Fire')).toBe(1.5)
  expect(multiplier('Earth', 'Lightning')).toBe(1.5)
  expect(multiplier('Lightning', 'Wind')).toBe(1.5)
  expect(multiplier('Wind', 'Earth')).toBe(1.5)
  expect(multiplier('Fire', 'Earth')).toBe(1)
  expect(multiplier('Fire', 'Fire')).toBe(1)
})
test('neutral attack types and dual defenders', () => {
  expect(multiplier('Physical', 'Nature')).toBe(1)
  expect(multiplier('Misc', 'Water')).toBe(1)
  expect(multiplier('Fire', 'NatureWind')).toBe(1.5)
  expect(multiplier('Fire', 'NatureWater')).toBe(0.75)
  expect(multiplier('Lightning', 'WaterWind')).toBe(1.5)
})
test('chart helpers', () => {
  expect(strongAgainst('Fire')).toEqual(['Nature'])
  expect(weakAgainst('Fire')).toEqual(['Water'])
})
```
Note `Lightning` vs `WaterWind` = 1 × 1.5 = 1.5 (Lightning is neutral to Water in this cycle model).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: page.** Two cycle diagrams (SVG triangles with element icons and arrows), a 6×6 grid (attacker rows × defender cols, cells colored green/red/neutral with ×1.5/×0.5), dual-defender lookup (two selects → multiplier for each attacking element), "approximate" badge.
- [ ] Commit `feat: element chart`.

---

### Task 9: Stats + damage domain + calculator page

**Files:** Create `src/domain/stats.ts`, `src/domain/damage.ts`, `src/pages/CalculatorPage.tsx/.css`. Test: `tests/domain/stats.test.ts`, `tests/domain/damage.test.ts`.

**Interfaces:**
```ts
export type Stats = Record<StatKey, number>
export function statsAt(m: Miscrit, level: number): Stats          // base + perLevel[tier] × (min(level,35)-1); hp × hpPerLevelFactor
export function withRelics(s: Stats, relics: Relic[]): Stats       // add numeric effects of keys in StatKey
export function withBuffs(s: Stats, buffs: Partial<Stats>): Stats  // add, floor at 1
export interface DamageResult { min: number; avg: number; max: number; multiplier: number; hitsToKo: number }
export function damage(ability: Ability, attacker: { element: string; stats: Stats }, defender: { element: string; stats: Stats }): DamageResult | null
// null for non-damaging abilities (no ap or ap <= 0 or type !== 'Attack');
// Physical → pa vs pd, else ea vs ed; raw = ap × (atk / max(1, def)) × multiplier(ability.element, defender.element) × damageScale × 10 / 10... avg = round(raw), min/max = round(raw × (1 ∓ variance)), min ≥ 1; hitsToKo = ceil(defender.hp / max(1, avg))
```
- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { statsAt, withRelics } from '../../src/domain/stats'
import { damage } from '../../src/domain/damage'
import type { Ability, Miscrit, Relic } from '../../src/data/types'
const mk = (tiers: Partial<Miscrit['stats']>, element = 'Fire') => ({ element, stats: { hp: 'Weak', spd: 'Weak', ea: 'Weak', pa: 'Weak', ed: 'Weak', pd: 'Weak', ...tiers } }) as unknown as Miscrit
test('statsAt grows with level and tier, capped at 35', () => {
  const weak = statsAt(mk({}), 10), elite = statsAt(mk({ ea: 'Elite' }), 10)
  expect(elite.ea).toBeGreaterThan(weak.ea)
  expect(statsAt(mk({}), 50)).toEqual(statsAt(mk({}), 35))
  expect(statsAt(mk({}), 1).ea).toBe(10)
})
test('withRelics adds numeric stat effects only', () => {
  const s = statsAt(mk({}), 1)
  const r = { effect: { ea: 5, CI: true, hp: -2 } } as unknown as Relic
  expect(withRelics(s, [r])).toMatchObject({ ea: s.ea + 5, hp: s.hp - 2 })
})
const ab = (over: Partial<Ability>): Ability => ({ id: 1, name: 'x', element: 'Fire', type: 'Attack', desc: '', ap: 10, ...over })
const att = { element: 'Fire', stats: statsAt(mk({ ea: 'Max', pa: 'Max' }), 20) }
const defNature = { element: 'Nature', stats: statsAt(mk({}, 'Nature'), 20) }
const defWater = { element: 'Water', stats: statsAt(mk({}, 'Water'), 20) }
test('element advantage increases damage; higher AP increases damage', () => {
  const strong = damage(ab({}), att, defNature)!, weak = damage(ab({}), att, defWater)!
  expect(strong.multiplier).toBe(1.5); expect(weak.multiplier).toBe(0.5)
  expect(strong.avg).toBeGreaterThan(weak.avg)
  expect(damage(ab({ ap: 20 }), att, defNature)!.avg).toBeGreaterThan(strong.avg)
  expect(strong.min).toBeLessThanOrEqual(strong.avg); expect(strong.max).toBeGreaterThanOrEqual(strong.avg)
  expect(strong.hitsToKo).toBe(Math.ceil(defNature.stats.hp / strong.avg))
})
test('non-damaging abilities → null; physical ignores element', () => {
  expect(damage(ab({ type: 'Buff' }), att, defNature)).toBeNull()
  expect(damage(ab({ ap: undefined }), att, defNature)).toBeNull()
  expect(damage(ab({ element: 'Physical' }), att, defWater)!.multiplier).toBe(1)
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: page** `#/calc?a=<id>.<lvl>&d=<id>.<lvl>`: two side panels (search-select miscrit via `searchMiscrits`, level slider 1–35, relics toggle "use relic set", buff inputs ±), center: table of attacker's damaging abilities sorted by avg (ability, element chip, ×mult colored, min–avg–max, hits to KO), "swap" button, "approximate" badge. URL state.
- [ ] Commit `feat: damage calculator`.

---

### Task 10: Team builder

**Files:** Create `src/domain/team.ts`, `src/store/teams.ts`, `src/pages/TeamPage.tsx/.css`. Test: `tests/domain/team.test.ts`.

**Interfaces:**
```ts
export interface TeamSlot { id: number; level: number }
export function encodeTeam(slots: TeamSlot[]): string                   // "1.30~20.35"
export function decodeTeam(s: string, known: Set<number>): TeamSlot[]  // unknown ids dropped, duplicates dropped, max 4, level clamped 1..35 (default 30)
export function offenseCoverage(team: Miscrit[]): Record<string, number> // for each base defender element: best multiplier among team attack abilities (Attack with ap>0)
export function defenseWeakness(team: Miscrit[]): Record<string, number> // for each base attacking element: how many members take > 1×
export function controlSummary(team: Miscrit[]): Record<string, number> // counts of ability types among CONTROL_TYPES across team (unique per member)
export const CONTROL_TYPES = ['Sleep', 'Confuse', 'Paralyze', 'Poison', 'Dot', 'Bleed', 'Heal', 'Hot', 'Negate', 'Antiheal', 'Block', 'Cleanser']
```
Teams store: saved teams `{ name, code }[]` (persist + sanitize).
- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { controlSummary, decodeTeam, defenseWeakness, encodeTeam, offenseCoverage } from '../../src/domain/team'
import type { Miscrit } from '../../src/data/types'
test('encode/decode with sanitizing', () => {
  const known = new Set([1, 2, 3, 4, 5])
  expect(decodeTeam(encodeTeam([{ id: 1, level: 30 }, { id: 2, level: 35 }]), known)).toEqual([{ id: 1, level: 30 }, { id: 2, level: 35 }])
  expect(decodeTeam('1.30~1.20~99.10~2.80~3~4.5~5.5', known)).toEqual([{ id: 1, level: 30 }, { id: 2, level: 35 }, { id: 3, level: 30 }, { id: 4, level: 5 }])
  expect(decodeTeam('garbage', known)).toEqual([])
})
const m = (id: number, element: string, abilities: { element: string; type: string; ap?: number }[]) => ({ id, element, abilities }) as unknown as Miscrit
const team = [m(1, 'Fire', [{ element: 'Fire', type: 'Attack', ap: 10 }, { element: 'Misc', type: 'Sleep' }]), m(2, 'Water', [{ element: 'Physical', type: 'Attack', ap: 8 }, { element: 'Misc', type: 'Sleep' }, { element: 'Misc', type: 'Sleep' }])]
test('offenseCoverage takes best multiplier', () => {
  const c = offenseCoverage(team)
  expect(c.Nature).toBe(1.5); expect(c.Water).toBe(1); expect(c.Earth).toBe(1)
})
test('defenseWeakness counts members hit hard', () => {
  const w = defenseWeakness(team)
  expect(w.Water).toBe(1)   // Fire member
  expect(w.Nature).toBe(1)  // Water member
  expect(w.Earth).toBe(0)
})
test('controlSummary counts unique per member', () => { expect(controlSummary(team).Sleep).toBe(2) })
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: page** `#/team?t=<code>`: 4 big slots (empty slot = "+" opens search palette-like picker), each with sprite, level slider, remove; analysis panels: offense coverage row (6 element icons with ×best, colored), defense weakness row (count badges; ≥2 red), control/support chips, speed order list; actions: save (name), saved teams list, copy share link, open in calculator.
- [ ] Commit `feat: team builder`.

---

### Task 11: Compare page

**Files:** Create `src/domain/compare.ts`, `src/pages/ComparePage.tsx/.css`. Test: `tests/domain/compare.test.ts`.

**Interfaces:** `parseIds(s: string | null, known: Set<number>, max = 4): number[]` (numbers only, known, unique, first `max`).
- [ ] **Step 1: failing test**
```ts
import { expect, test } from 'vitest'
import { parseIds } from '../../src/domain/compare'
test('parseIds', () => {
  const k = new Set([1, 2, 3, 4, 5])
  expect(parseIds('1,2,x,2,99,3,4,5', k)).toEqual([1, 2, 3, 4])
  expect(parseIds(null, k)).toEqual([])
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: page** `#/compare?ids=`: columns per miscrit (sprite, name, rarity, element), stat rows with bars, best value per row highlighted, perfect stat / attack type, where & when summary, "add" slot with search, remove per column.
- [ ] Commit `feat: compare miscrits`.

---

### Task 12: Hunt list

**Files:** Create `src/domain/hunt.ts`, `src/store/hunt.ts`, `src/pages/HuntPage.tsx/.css`. Modify MiscritPage (+hunt button), MiscritCard (hunt star in corner). Test: `tests/domain/hunt.test.ts`.

**Interfaces:**
```ts
export function huntToday(ids: number[], byId: Map<number, Miscrit>, day: number) // = groupAvailable(filtered, day)
export function huntWeek(ids: number[], byId: Map<number, Miscrit>, now: Date): { m: Miscrit; next: { day: number; inDays: number } | null }[] // sorted by inDays (null last), then name
```
Store `useHunt`: `{ ids: number[]; toggle(id); clear() }` (persist + sanitize, numbers only).
- [ ] **Step 1: failing test**
```ts
import { expect, test } from 'vitest'
import { huntToday, huntWeek } from '../../src/domain/hunt'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, name: string, spawns: unknown[]) => ({ id, names: [name], rarity: 'Common', spawns }) as unknown as Miscrit
const byId = new Map([[1, m(1, 'A', [{ region: 'Forest', zone: '1', days: [4] }])], [2, m(2, 'B', [{ region: 'Moon', zone: '1', days: 'all' }])], [3, m(3, 'C', [])]])
test('huntToday groups only hunted miscrits available today', () => {
  expect(huntToday([1, 2, 3], byId, 3).map(g => g.region)).toEqual(['Moon'])
})
test('huntWeek sorts by next availability', () => {
  // 2026-09-30 12:00Z = Wednesday (3)
  const w = huntWeek([1, 2, 3, 77], byId, new Date('2026-09-30T12:00:00Z'))
  expect(w.map(x => [x.m.id, x.next?.inDays ?? null])).toEqual([[2, 0], [1, 1], [3, null]])
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: page** `#/hunt`: "Today's route" — region → zone steps with cards and "open on map" per region; "This week" — list with next-day chips; empty state explains how to add (star on any card). Mark caught from here removes nothing automatically, but caught ones get a check and "remove caught" button.
- [ ] Commit `feat: hunt list with today route and week plan`.

---

### Task 13: Mini games

**Files:** Create `src/domain/rng.ts`, `src/domain/games.ts`, `src/store/scores.ts`, `src/pages/games/GamesHub.tsx`, `src/pages/games/SilhouetteGame.tsx`, `src/pages/games/MemoryGame.tsx`, `src/pages/games/EvolutionGame.tsx`, `src/pages/games/games.css`. Test: `tests/domain/games.test.ts`.

**Interfaces:**
```ts
// rng.ts
export function mulberry32(seed: number): () => number
export function shuffle<T>(arr: T[], rnd: () => number): T[]
// games.ts
export interface Question { answer: Miscrit; options: Miscrit[] } // options include answer, unique ids AND unique display names
export function silhouetteQuestion(pool: Miscrit[], rnd: () => number, n = 4): Question | null // null when pool has < n distinct names
export function evolutionQuestion(pool: Miscrit[], rnd: () => number, n = 4): { start: string; answer: string; options: string[] } | null // lines with ≥2 names and names[0] !== last; options = distinct final names
export interface MemoryCard { key: number; id: number; name: string }
export function memoryDeck(pool: Miscrit[], pairs: number, rnd: () => number): MemoryCard[] // 2×pairs cards, shuffled
export interface MemoryState { flipped: number[]; matched: number[]; moves: number }
export function memoryFlip(deck: MemoryCard[], s: MemoryState, key: number): MemoryState
// matched key → unchanged; 2 cards face up (non-matching) → any flip resets to [key];
// 1 face up and same key → unchanged; 1 face up + different key → moves+1, if ids equal both go to matched and flipped=[] else flipped=[a,key]
```
Scores store: `{ silhouette: number /*best streak*/, evolution: number, memory: { moves: number; ms: number } | null }` (persist + sanitize).
- [ ] **Step 1: failing tests**
```ts
import { expect, test } from 'vitest'
import { mulberry32, shuffle } from '../../src/domain/rng'
import { evolutionQuestion, memoryDeck, memoryFlip, silhouetteQuestion } from '../../src/domain/games'
import type { Miscrit } from '../../src/data/types'
const m = (id: number, names: string[]) => ({ id, names }) as unknown as Miscrit
const pool = Array.from({ length: 10 }, (_, i) => m(i + 1, [`S${i}`, `F${i}`]))
test('rng is deterministic; shuffle keeps elements', () => {
  expect(mulberry32(1)()).toBe(mulberry32(1)())
  expect(shuffle([1, 2, 3, 4], mulberry32(2)).sort()).toEqual([1, 2, 3, 4])
})
test('silhouetteQuestion has n unique options including the answer', () => {
  for (let s = 0; s < 50; s++) {
    const q = silhouetteQuestion(pool, mulberry32(s))!
    expect(q.options).toHaveLength(4)
    expect(new Set(q.options.map(o => o.names[0])).size).toBe(4)
    expect(q.options).toContain(q.answer)
  }
})
test('silhouetteQuestion returns null for tiny pools and duplicate names', () => {
  expect(silhouetteQuestion(pool.slice(0, 3), mulberry32(1))).toBeNull()
  expect(silhouetteQuestion([m(1, ['A']), m(2, ['A']), m(3, ['A']), m(4, ['B'])], mulberry32(1))).toBeNull()
})
test('evolutionQuestion', () => {
  const q = evolutionQuestion(pool, mulberry32(3))!
  expect(q.options).toContain(q.answer)
  expect(q.start.startsWith('S')).toBe(true)
  expect(q.answer).toBe(`F${q.start.slice(1)}`)
  expect(evolutionQuestion([m(1, ['Solo'])], mulberry32(1))).toBeNull()
})
test('memory deck and flip logic', () => {
  const deck = memoryDeck(pool, 3, mulberry32(4))
  expect(deck).toHaveLength(6)
  const [a, b] = deck.filter(c => c.id === deck[0].id)
  const other = deck.find(c => c.id !== a.id)!
  let s = { flipped: [], matched: [], moves: 0 } as { flipped: number[]; matched: number[]; moves: number }
  s = memoryFlip(deck, s, a.key); s = memoryFlip(deck, s, other.key)
  expect(s.moves).toBe(1); expect(s.matched).toEqual([])
  s = memoryFlip(deck, s, a.key)           // third flip resets previous pair
  expect(s.flipped).toEqual([a.key])
  s = memoryFlip(deck, s, b.key)
  expect(s.matched.sort()).toEqual([a.key, b.key].sort()); expect(s.moves).toBe(2)
  expect(memoryFlip(deck, s, a.key)).toEqual(s) // matched cards ignored
})
```
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: pages** `#/games` hub (3 big game cards with best scores), `#/games/silhouette` (sprite rendered with CSS `filter: brightness(0)` until answered, then reveal animation; 4 big buttons; streak/best; difficulty toggle All/Epic+; pool = miscrits whose sprite loaded is not knowable in advance, so on sprite error skip to next question), `#/games/memory` (4×4 grid, 8 pairs, flip animation, moves/time, best), `#/games/evolution` (start sprite → 4 option sprites of final forms).
- [ ] Commit `feat: mini games (silhouette, memory, evolution)`.

---

### Task 14: Sync hardening (deferred minors)

**Files:** Modify `scripts/sync/validate.ts`, `scripts/sync/http.ts`. Test: `tests/sync/validate.test.ts` (append).

- [ ] **Step 1: failing tests (append)**
```ts
test('rejects a region whose markers vanished', () => {
  const s = snap(100, 0); s.markers = { Forest: [], Moon: [] }
  expect(() => validateSnapshot(s, { miscrits: 100, markers: 0, perRegion: { Forest: 5, Moon: 0 } })).toThrow(/Forest/)
})
test('rejects unknown stat tier', () => {
  const s = snap(1); s.miscrits[0] = m(1, { stats: { ...s.miscrits[0].stats, hp: 'Huge' as never } })
  expect(() => validateSnapshot(s, null)).toThrow(/tier/)
})
```
- [ ] **Step 2–4:** FAIL → extend `prev` with optional `perRegion: Record<string, number>` (from `meta.counts.perRegion`, written by sync), a region that had ≥3 markers and now has 0 fails; tier must be in `TIER_VALUE`; http: no retry on 4xx, no sleep after last attempt. PASS.
- [ ] Commit `fix(sync): per-region and tier validation, no retry on 4xx`.

---

### Task 15: PWA + auto-update workflow

**Files:** Modify `vite.config.ts` (VitePWA: `registerType: 'autoUpdate'`, manifest name/short_name/theme `#0f1117`/icons 192/512/maskable, workbox `globPatterns: ['**/*.{js,css,html,json,webp,png,svg}']`, `maximumFileSizeToCacheInBytes: 3_000_000`, runtimeCaching `CacheFirst` for `cdn.worldofmiscrits.com` and `worldofmiscrits.com/*.png` with expiration 2000 entries / 30 days), create `scripts/make-icons.ts` (sharp renders `public/icon.svg` to `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`), `public/icon.svg`, `.github/workflows/sync-and-deploy.yml`.

Workflow: triggers `schedule: '0 */6 * * *'`, `workflow_dispatch`, `push` to `main`; job `sync`: checkout, setup-node 22 with npm cache, `npm ci`, `npm run sync`, `npm test`, commit `public/data data-raw` if changed (`git config user.name github-actions`), then `npm run build`, `actions/upload-pages-artifact` (dist) and `actions/deploy-pages` (permissions `pages: write, id-token: write, contents: write`). Note in README: Pages requires a public repo or a paid plan; until enabled, the deploy step is skipped via `if: vars.PAGES_ENABLED == 'true'`.

- [ ] Steps: `npm i -D vite-plugin-pwa`; build shows `sw.js` + `manifest.webmanifest` in `dist`; `npx tsx scripts/make-icons.ts`; YAML lint by `npx --yes yaml-lint .github/workflows/sync-and-deploy.yml` (or a node `yaml` parse); README updated. Commit `feat: PWA and scheduled sync/deploy workflow`.

---

### Task 16: i18n completeness, a11y, e2e, final verification

**Files:** Modify `src/i18n/en.ts`, `src/i18n/ru.ts` (all new keys — the existing key-parity test enforces RU/EN), `tests/e2e/smoke.spec.ts`.

- [ ] a11y: map pins `title` + `alt` (done in Plan 1 fix), `DayPicker` gets `aria-label`, SearchPalette `aria-modal="true"`, focus trap (Tab cycles within), focus returns to the trigger on close.
- [ ] e2e additions:
```ts
test('map zones render and highlight on hover', async ({ page }) => {
  await page.goto('#/map/Forest')
  await expect(page.locator('.zone-label')).toHaveCount(4)
  await page.locator('[data-testid="zone-block"]').first().hover()
  expect(await page.locator('.map-pin-dim').count()).toBeGreaterThan(0)
})
test('every new page renders without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  for (const r of ['#/week', '#/relics', '#/collection', '#/elements', '#/calc?a=1.30&d=20.30', '#/team?t=1.30~20.30', '#/compare?ids=1,20', '#/hunt', '#/games', '#/games/silhouette', '#/games/memory', '#/games/evolution', '#/c/garbage***']) {
    await page.goto(r); await page.waitForLoadState('networkidle')
    await expect(page.locator('main')).not.toBeEmpty()
  }
  expect(errors).toEqual([])
})
test('day switches at reset without reload', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-29T23:59:50Z') }) // Kyiv 02:59:50 Wed → game Tue
  await page.goto('#/')
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Вт|Tue/)
  await page.clock.runFor(15_000)
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Ср|Wed/)
})
test('share link round trip', async ({ page }) => {
  await page.goto('#/m/1'); await page.getByTestId('toggle-caught').click()
  await page.goto('#/collection')
  const link = await page.getByTestId('share-link').inputValue()
  await page.goto(link.slice(link.indexOf('#')))
  await expect(page.getByTestId('friend-caught-count')).toHaveText(/1/)
})
```
- [ ] Run: `npm test`, `npm run build`, `npm run e2e` all green; screenshot every page at 1280 and 360. Commit `test: e2e for plan 2; a11y and i18n completeness`.
