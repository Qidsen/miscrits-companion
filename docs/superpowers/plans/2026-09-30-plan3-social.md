# Miscrits Companion — Plan 3: News, Calibration, Tournament, Telegram Bot

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** What's-new changelog, calculator calibration from real hits, daily challenge tournament with result links (site only), Telegram bot with daily personal and group digests (news, rare of the day, hunt list — no tournament).

**Architecture:** Pure domain modules (`src/domain/*`, `scripts/notify/*`) written test-first; the bot is a stateless script run by GitHub Actions every 15 minutes that keeps its state in an AES-GCM encrypted file committed to the repo. The site only gains pages and panels.

**Tech Stack:** as before + Node `crypto` (AES-256-GCM), Telegram Bot HTTP API (`fetch`).

**Spec:** `docs/superpowers/specs/2026-09-30-miscrits-companion-design.md` §13.

**Branch:** `feat/social`. UI tasks are contract + acceptance (same convention as Plan 2).

## Global Constraints
- All Plan 1/2 constraints (03:00 Europe/Kyiv, RU/EN for every string, 360 px, sanitized persisted stores).
- No paid hosting; bot runs only in GitHub Actions; missing `TELEGRAM_TOKEN`/`NOTIFY_KEY` → exit 0.
- Chat ids never stored in plaintext in the repo.
- Daily digest sent at most once per game date (state `lastDaily`).
- Telegram messages use `parse_mode: HTML`; every interpolated string HTML-escaped.

## Review Focus
1. **Bot run twice in the same game day / run skipped for hours** → exactly one daily digest per game date, sent on the first run after the reset. Pinned in Task 5 (`shouldSendDaily`).
2. **Malicious or garbage `/hunt` codes, huge updates, unknown commands, group vs private chats** → no crash, helpful reply. Pinned in Task 5 (`applyUpdate`).
3. **Wrong `NOTIFY_KEY` or corrupted state file** → run fails loudly without overwriting the state (never silently drops subscribers). Pinned in Task 5 (`decryptState`).
4. **Tampered or foreign-day result links** → rejected / shown as other day, never counted for today. Pinned in Task 4.
5. **Calibration with 0–1 observations, zero predicted damage, outliers** → no NaN, falls back to defaults. Pinned in Task 3.

---

### Task 1: gameDate + changelog in sync
**Files:** `src/domain/schedule.ts` (add `gameDate(now): string` 'YYYY-MM-DD' of the game day), `scripts/sync/changelog.ts`, `scripts/sync/index.ts`, `src/data/types.ts` (`ChangeEntry`). Tests: `tests/domain/schedule.test.ts`, `tests/sync/changelog.test.ts`.

**Interfaces:**
```ts
export interface ChangeEntry {
  date: string /* ISO */; initial?: boolean
  added: number[]; removed: { id: number; name: string }[]
  spawnChanged: number[]; markersAdded: { region: string; count: number; miscritIds: number[] }[]
  relicsAdded: number[]; relicsChanged: number[]
}
export function diffSnapshots(prev: { miscrits: Miscrit[]; relics: Relic[]; markers: Record<string, Marker[]> } | null,
  next: same, date: string): ChangeEntry | null   // null when nothing changed; initial entry when prev is null
export function prependChange(log: ChangeEntry[], e: ChangeEntry | null, max = 200): ChangeEntry[]
```
- [ ] Tests (write first, see RED):
```ts
// schedule: gameDate
expect(gameDate(new Date('2026-09-29T23:59:59Z'))).toBe('2026-09-29') // Kyiv 02:59 Wed → still Tue 29th
expect(gameDate(new Date('2026-09-30T00:00:00Z'))).toBe('2026-09-30')
// changelog
const base = { miscrits: [m(1, [{ region: 'Forest', zone: '1', days: 'all' }]), m(2, [])], relics: [r(10, { ea: 1 })], markers: { Forest: [mk('a', 1)] } }
expect(diffSnapshots(null, base, 'D')).toMatchObject({ initial: true })
expect(diffSnapshots(base, base, 'D')).toBeNull()
const next = { miscrits: [m(1, [{ region: 'Forest', zone: '1', days: [1] }]), m(3, [])], relics: [r(10, { ea: 2 }), r(11, {})], markers: { Forest: [mk('a', 1), mk('b', 3)] } }
expect(diffSnapshots(base, next, 'D')).toEqual({ date: 'D', added: [3], removed: [{ id: 2, name: 'M2' }], spawnChanged: [1],
  markersAdded: [{ region: 'Forest', count: 1, miscritIds: [3] }], relicsAdded: [11], relicsChanged: [10] })
expect(prependChange([], null)).toEqual([])
expect(prependChange(Array(200).fill(x), y)).toHaveLength(200)
```
- [ ] Implement; sync reads previous `public/data/{miscrits,relics,markers}.json` before writing, writes `changelog.json` (missing file = `[]`). Run `npm run sync` → `changelog.json` has one initial entry. Commit.

### Task 2: News page
**Files:** `src/data/DataProvider.tsx` (load `changelog.json`, tolerate 404 → `[]`), `src/pages/NewsPage.tsx/.css`, TodayPage block, nav item `/news` (secondary, icon 📰).
- **Acceptance:** `#/news` lists entries newest first: date (localized), sections "New miscrits" (cards), "Removed", "Spawn changes" (cards + link), "New map markers" (region + avatars), "Relics"; initial entry shows "History starts here". Today shows "New this week" (cards) only if an entry within 7 days has additions. e2e: `#/news` renders without errors.

### Task 3: Calibration
**Files:** `src/domain/calibration.ts`, `src/domain/damage.ts` (optional `formula` param), `src/store/calibration.ts`, `src/pages/CalibrationPanel.tsx`, CalculatorPage (tab + badge). Test: `tests/domain/calibration.test.ts`.

**Interfaces:**
```ts
export interface Observation { attackerId: number; attackerLevel: number; attackStat?: number; abilityId: number; defenderId: number; defenderLevel: number; damage: number }
export interface Calibration { damageScale: number; strong: number; weak: number; n: number; errorBefore: number; errorAfter: number }
export function predict(o: Observation, byId: Map<number, Miscrit>, f?: Partial<FormulaParams>): { value: number; multiplier: number } | null
export function fitCalibration(obs: Observation[], byId: Map<number, Miscrit>): Calibration | null   // null when <1 usable observation
```
- [ ] Tests:
```ts
// synthetic: generate observations with the real formula at damageScale 0.8, strong 1.4
const cal = fitCalibration(obsFrom(0.8, 1.4), byId)!
expect(cal.damageScale).toBeCloseTo(0.8, 1); expect(cal.strong).toBeCloseTo(1.4, 1)
expect(cal.errorAfter).toBeLessThan(cal.errorBefore)
expect(fitCalibration([], byId)).toBeNull()
expect(fitCalibration([{ ...o, damage: 0 }], byId)!.damageScale).toBeGreaterThan(0) // zero damage ignored → defaults
expect(Number.isFinite(fitCalibration([o, { ...o, damage: 10_000 }], byId)!.damageScale)).toBe(true) // median resists outliers
```
- [ ] UI: form (pick attacker via MiscritPicker, level, optional attack stat, ability select of damaging abilities, defender + level, damage) → list of observations with predicted vs observed, "Fit" → shows before/after error, "Apply", "Reset", "Copy JSON". Calculator uses applied calibration and shows badge. Commit.

### Task 4: Tournament
**Files:** `src/domain/challenge.ts`, `src/store/tournament.ts`, `src/pages/TournamentPage.tsx/.css`, `src/pages/ResultPage.tsx` (`#/r/:code`), `src/pages/games/ChallengeGame.tsx`, FriendCollectionPage/CollectionPage (`?n=` name). Test: `tests/domain/challenge.test.ts`.

**Interfaces:**
```ts
export const CHALLENGE_SIZE = 10
export function daySeed(date: string): number
export type ChallengeQ = { kind: 'sil'; answer: number; options: number[] } | { kind: 'evo'; start: string; answer: string; options: string[] }
export function dailyChallenge(miscrits: Miscrit[], date: string): ChallengeQ[]   // deterministic; 6 sil + 4 evo
export const challengeScore = (correct: number, ms: number) => correct * 100 + Math.max(0, 300 - Math.floor(ms / 1000))
export interface ChallengeResult { date: string; name: string; correct: number; ms: number }
export function encodeResult(r: ChallengeResult): string
export function decodeResult(code: string): ChallengeResult | null   // null on bad checksum/shape
export function leaderboard(results: ChallengeResult[]): (ChallengeResult & { score: number })[] // per name best, sorted desc
```
- [ ] Tests: same date → identical questions; different dates differ; 10 questions, options unique; `decodeResult(encodeResult(r))` equals r; flipping one char → null; `name` length capped 24 and HTML-escaped when rendered; leaderboard keeps best per name.
- [ ] UI: Tournament page: name field (stored), "Play today's challenge" (disabled after playing; shows own result + share link), today's board (own + friends for today's date), all-time totals (sum of scores per name), input "paste friend's link", friends' collections table (name, caught, %, legendary count) from pasted collection links. ChallengeGame: 10 questions in a row with timer; ends → saves result → shows share link. Commit.

### Task 5: Bot domain (pure)
**Files:** `scripts/notify/state.ts`, `scripts/notify/digest.ts`, `scripts/notify/commands.ts`. Tests: `tests/notify/*.test.ts`.

**Interfaces:**
```ts
// state.ts
export interface Sub { chatId: number; name: string; hunt: number[] }
export interface BotState { v: 1; offset: number; lastDaily: string | null; subs: Sub[]; groups: number[]; lastNewsDate: string | null }
export const EMPTY_STATE: BotState
export function encryptState(s: BotState, keyB64: string): string   // "iv.tag.data" base64
export function decryptState(blob: string, keyB64: string): BotState // throws on wrong key/corruption
export function shouldSendDaily(s: BotState, now: Date): boolean      // lastDaily !== gameDate(now)
// digest.ts
export function personalDigest(d: DigestData, hunt: number[], now: Date, siteUrl: string, lang: 'ru'): string
export function groupDigest(d: DigestData, now: Date, siteUrl: string, news: ChangeEntry[]): string
// commands.ts
export interface Reply { chatId: number; text: string }
export function applyUpdate(s: BotState, u: TgUpdate, ctx: { data: DigestData; now: Date; siteUrl: string; botName: string }): { state: BotState; replies: Reply[] }
```
- [ ] Tests: encrypt→decrypt round trip; wrong key throws; truncated blob throws. `shouldSendDaily` false after recording today, true next game day (use 02:59/03:00 Kyiv instants). Digest escapes HTML in names, lists hunted available today grouped by region, says "nobody from your list today" otherwise. `applyUpdate`: `/start` → help; `/hunt <valid>` → sub stored, reply confirms count; `/hunt garbage` → error reply, state unchanged; `/stop` → removed; `/today` → digest reply; group `/subscribe` → group added (dedupe); `my_chat_member` added-to-group → group added; kicked → group removed; unknown text → short help; updates without message → ignored; offset advanced to `update_id + 1` always.
- [ ] Commit.

### Task 6: Bot runner, workflow, site panel, setup docs
**Files:** `scripts/notify/index.ts`, `scripts/notify/telegram.ts` (getUpdates/sendMessage with retry + 429 `retry_after`), `.github/workflows/notify.yml`, `notify/state.enc` (created on first run), `src/pages/HuntPage.tsx` (Telegram panel), `vite.config.ts`/`src/config.ts` (`BOT_USERNAME` from `import.meta.env.VITE_BOT_USERNAME`), workflow `sync-and-deploy.yml` passes `VITE_BOT_USERNAME: ${{ vars.BOT_USERNAME }}` to build, `docs/telegram-setup.md`.
- Runner: exits 0 if secrets missing; loads state (missing file → EMPTY_STATE; decrypt failure → exit 1 without writing); getUpdates(offset, timeout 0); applyUpdate for each; send replies; if `shouldSendDaily` → personal digests to subs, group digest to groups, set `lastDaily`, `lastNewsDate`; blocked users (403) removed; write encrypted state only if changed.
- Workflow: `*/15 * * * *` + dispatch; concurrency group `notify`; checkout, node 22, `npm ci`, run, commit `notify/state.enc` with `pull --rebase` + push.
- Site panel (Hunt): "Get daily Telegram alerts": button `t.me/<bot>` + copyable command `/hunt <code>`; hidden when `BOT_USERNAME` empty.
- [ ] Verify locally with a fake: `TELEGRAM_TOKEN` unset → prints "disabled" and exits 0. Unit test for telegram retry on 429 using an injected fetch. Commit.

### Task 7: i18n, e2e, review
- [ ] All new strings RU/EN (parity test). e2e: `#/news`, `#/tournament`, challenge play-through (answer all 10, result link appears, opening it adds a row), `#/r/garbage` shows error, calibration fit with 3 observations shows "calibrated" badge in calculator. Full suites green; final fresh review.
