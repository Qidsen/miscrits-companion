# Miscrits Companion — Design Spec

Date: 2026-09-30
Status: Draft for review

## 1. Goal

A personal companion website for *Miscrits: World of Creatures*, for the author and friends.
It covers the same information as miscritcompanion.com (creatures, maps, spawns, relics)
but is faster and more convenient: every answer in 1–2 clicks, clear "who can I catch
today" view, an interactive map, and tools (team builder, damage calculator, hunt list).

Out of scope: anything that needs a game account or the reference site's private backend
(arena, clans, players, friends, analytics).

## 2. Data sources

| Source | Content | Access |
|---|---|---|
| `https://worldofmiscrits.com/miscrits.json` (official) | 425 miscrits: 4 evolution names, element, rarity, stat tiers, abilities + learn order, descriptions, `locations` = `{Region: {zoneNo: days[]}}` | public |
| `https://api.miscritcompanion.com/api/markers/load/{Region}` | exact map markers `{x%, y%, miscritName, exactLocationImage}` | public, no auth |
| `.../api/area-friendly-names` | zone names (`Forest.1 = "Azore Lake"`) | public |
| `.../api/relics`, `.../api/miscrits/{id}/details`, `.../api/miscrits/organized` | relics, relic sets, `perfectStat`, `attackType`, shop info | public |
| `.../api/maps/{file}` | region map images (up to 9 MB) | public |
| `https://cdn.worldofmiscrits.com/miscrits/...`, `/avatars/...` | sprites | public CDN, hot-linked |

`days[]` uses JS weekday numbers (0 = Sunday … 6 = Saturday); an empty array means every day.

Usage is personal / friends only. The site credits the game and miscritcompanion.com as data sources in the footer.

## 3. Architecture

Static SPA built from a committed data snapshot.

- **Stack:** Vite + React + TypeScript, React Router (hash routing for GitHub Pages),
  Leaflet (`CRS.Simple` + image overlay), Zustand (persisted to localStorage),
  Vitest, Playwright (smoke), vite-plugin-pwa, `sharp` (map compression in sync).
- **Styling:** CSS modules + theme tokens, dark theme, responsive down to phone width.
  No heavy UI kit.
- **i18n:** RU/EN toggle; UI strings in `src/i18n/{ru,en}.json`. Game names (miscrits,
  abilities, relics, regions) stay in English; zone and region names get RU display labels
  where provided.

### Folder layout

```
miscrits-companion/
├─ scripts/sync/        sources.ts, fetch-game.ts, fetch-companion.ts, fetch-maps.ts, normalize.ts, index.ts
├─ public/data/         miscrits.json relics.json areas.json markers.json meta.json maps/*.webp
├─ src/
│  ├─ data/             types, loader, indexes (by id, name, region, day)
│  ├─ domain/           pure logic: schedule, elements, stats, damage, team
│  ├─ i18n/
│  ├─ store/            caught, favorites, hunt list, teams, settings
│  ├─ components/
│  └─ pages/
├─ tests/
└─ .github/workflows/sync-and-deploy.yml
```

## 4. Data pipeline (`npm run sync`)

1. Fetch all sources (with retry + timeout).
2. Normalize into our schema:
   ```ts
   Miscrit {
     id; names: [4]; element; rarity;
     stats: { hp, spd, ea, pa, ed, pd };        // tier strings
     abilities: Ability[];                        // in learn order
     descriptions: [4];
     perfectStat?; attackType?; relicSet?; shopInfo?;
     spawns: { region; zone; days: number[] | 'all' }[];
     markers: { region; x; y; exactImg? }[];
     images: { avatar; back? ... };               // CDN URLs
   }
   ```
3. Compress map images to webp into `public/data/maps/`.
4. Write `meta.json` (sync timestamp, source hashes, counts).
5. **Validation — fail the sync (write nothing) if:** schema mismatch, zero miscrits,
   or >10% drop in miscrit/marker counts vs. previous snapshot.
6. **Partial failure:** if one optional source fails, keep its previous snapshot file and log a warning.

Sprites are not downloaded; the service worker caches them on first view.

## 5. Pages

1. **Today (home).** Available today, grouped region → zone. Game-reset countdown.
   Highlight Exotic/Legendary and "only today" miscrits. Weekday switcher Mon–Sun.
   "Miscrit of the day" and mini stats (how many available today).
2. **Map.** Region list (tabs on mobile) + Leaflet map of the region with zoom/pan.
   Markers = avatars with rarity-colored ring; zone labels. Overlay filters: day
   (default = today), rarity, element, hide caught. Marker click → popup with who,
   days, exact-location screenshot, "details" link.
3. **Dex.** Card grid. Filters: element, rarity, region, day, "available today",
   caught/favorites. Sort: name, rarity, id, stats. Search across all 4 evolution names.
4. **Miscrit page** (`#/m/:id`, shareable). 4 evolutions with images + descriptions,
   stats, perfect stat, attack type, abilities in learn order (desc + enchant),
   relic set, "Where & when" (mini map with marker + weekday calendar, next availability).
   Buttons: ★ favorite, ✓ caught, + hunt list, compare.
5. **Week calendar.** Region × weekday table; cells show day-restricted miscrits.
6. **Relics.** List with filters by level and stat; which relic sets use each relic.
7. **Collection.** Caught N / total, broken down by element and rarity.
   JSON export/import.
8. **Team builder.** 4 slots: miscrit, level, relics, stat quality (RS/S+/custom).
   Element coverage and weaknesses, physical/elemental split, control and buff summary.
   Save locally; share via URL-encoded team.
9. **Damage calculator.** Attacker vs defender (miscrit, level, stats, relics,
   buffs/debuffs) → ability → min/avg/max damage and hits-to-KO; "all abilities" table.
   Labeled "approximate".
10. **Extras.** Element chart (incl. dual elements), Compare (2–4 miscrits),
    Hunt list with today/week route, Silhouette quiz, PWA install + offline.

Global: top nav, command palette search (`/` or `Ctrl+K`), RU/EN toggle,
reset countdown in the header, "data updated at …" badge, footer credits.

## 6. Domain logic

### Schedule (`domain/schedule.ts`)
- Game day resets at **03:00 Europe/Kyiv** (DST handled via `Intl`).
- `gameDay(now)`: Kyiv wall-clock time minus 3 h → weekday 0–6.
  Example: Monday 02:30 Kyiv → Sunday.
- `nextReset(now)`: next 03:00 Kyiv instant. Countdown shows it; when it hits zero the
  app recomputes availability.
- `isAvailable(m, day)`, `availableOn(day)`, `exclusiveOn(day)` (not every-day spawns),
  `nextAvailable(m, now)`.
- Reset time is displayed both in Kyiv and in the viewer's local time.

### Elements (`domain/elements.ts`)
- Config table: attacker element → defender element → multiplier, for the 6 base elements
  and Physical. Dual-element defenders: product of multipliers for both parts.
- Shared by element chart, team coverage and damage calculator.

### Stats & damage (`domain/stats.ts`, `domain/damage.ts`)
- Stat at level from tier (Weak/Moderate/Strong/Max/Elite) + quality bonus + relics.
- Damage ≈ f(ability AP, attacker stat, defender stat, element multiplier, variance)
  → min/avg/max. All coefficients live in `domain/formulaConfig.ts`, so they can be
  calibrated against real battles. The formula is an approximation; the UI says so.

### Team (`domain/team.ts`)
- Coverage, weaknesses, control/buff summary; URL encode/decode.

## 7. State (localStorage via Zustand)

`caught: Set<id>`, `favorites: Set<id>`, `hunt: id[]`, `teams: Team[]`,
`settings: { lang, hideCaught, ... }`. All reads guarded; the app works when
storage is unavailable.

## 8. Auto-update

GitHub Actions `sync-and-deploy.yml`: cron every 6 h + manual trigger.
`npm ci` → `npm run sync` → if `public/data` changed: commit, build, deploy to GitHub Pages.
Failed validation fails the job and leaves the live site on the previous data.
Needs the user's GitHub repo; until then everything runs locally with `npm run dev`.

## 9. Testing

- Vitest, `domain/`: reset boundaries (02:59/03:00 Kyiv, DST transitions), weekday mapping,
  `[]` = every day, element multipliers incl. dual, team URL round-trip, damage
  determinism for a fixed seed.
- Vitest, `normalize`: fixtures cut from real responses; garbage input → validation failure.
- Build + Playwright smoke after each milestone: Today, Dex, Miscrit page, Map render;
  countdown visible.

## 10. Milestones

1. Scaffold + data sync
2. Today + reset countdown
3. Dex + Miscrit page
4. Map
5. Week calendar, Relics, Collection
6. Team builder, Damage calculator, Element chart
7. Extras: Hunt list, Compare, Quiz, PWA
8. GitHub Actions auto-update

## 11. Open risks

- Damage formula and element table are not officially documented; they are approximate and configurable.
- miscritcompanion.com endpoints may change or close; the snapshot plus "keep previous on failure" logic softens this.
- Map marker names must be matched to miscrits by name; unmatched markers are logged during sync and shown without a detail link.

## 12. Addendum (2026-09-30, after Plan 1 review with the user)

Everything below is in scope for Plan 2, together with all remaining items of section 5.

### 12.1 Visual overhaul ("game atlas" style)
- Fonts: Nunito (body) + Baloo 2 (headings) via Google Fonts.
- Deep dark background with gradients, glass panels (backdrop blur), rarity glow, per-element accent colors.
- Shared `MiscritCard`: full sprite (`_back.png`) on an element-tinted backdrop, rarity frame/glow, name, element icons, spawn-day chips. Replaces small avatar tiles on Today, Dex, Map panel.
- Hover/appear animations; respects `prefers-reduced-motion`.
- Navigation: primary links + "More" menu on desktop; bottom tab bar on phones.

### 12.2 Map zones
- Zones are derived from data: every marker belongs to exactly one zone of its region (verified: 100% of markers). A zone's shape = padded convex hull of its markers; 1–2 markers → circle.
- Each zone has a color, a permanent label on the map, and a panel block in the side panel.
- Hovering a zone (map or panel) highlights it and dims other zones' markers; hovering a miscrit card pulses its marker; clicking flies to it.
- Region switcher = strip of map thumbnails with names and counts. Marker popup = rich card.

### 12.3 Collection & game account
- No official game API exists; automated account sync (bot friend / protocol reverse-engineering) is out of scope (ToS/ban risk).
- Instead: quick-mark mode in Dex (click tile toggles caught), paste a list of names to mark, JSON export/import, and a share link that encodes the collection so friends can view it and compare with their own.

### 12.4 Mini games (`#/games`)
1. "Who's that Miscrit?" — silhouette, 4 options, reveal, streak + best; difficulty All / Epic+.
2. Memory — avatar pairs, moves + time, best result.
3. "Guess the evolution" — show first form, pick its final form from 4.
Best scores stored locally.

### 12.5 Game rules used
- Element cycles: Fire > Nature > Water > Fire; Earth > Lightning > Wind > Earth. Physical/Misc are neutral. Dual-element defender = product of both parts. Multipliers (strong 1.5, weak 0.5) live in `formulaConfig.ts` and are approximate.
- Stat growth per level by tier (community data): Weak 0–2, Moderate 1–3, Strong 1–3, Max 2–4, Elite 2–4 (+2). Stats stop growing after level 35.

## 13. Addendum 2 — notifications, news, calibration, tournament (2026-09-30)

Constraint: the site stays static (GitHub Pages); scheduled work runs in GitHub Actions (free for public repos). No paid hosting.

### 13.1 Telegram bot
- Bot created by the owner via @BotFather; token in repo secret `TELEGRAM_TOKEN`, state encryption key in `NOTIFY_KEY`, bot username in repo variable `BOT_USERNAME` (used by the site's "Connect Telegram" panel via `VITE_BOT_USERNAME` at build time).
- Workflow `notify.yml` runs every 15 minutes: polls `getUpdates`, applies commands, sends replies, and once per game day (first run after the 03:00 Kyiv reset) sends digests. GitHub may delay scheduled runs by 5–30 min; replies to commands are therefore delayed too.
- Commands (private chat): `/start` (help), `/hunt <code>` (subscribe with a hunt list encoded like the collection share code), `/today` (digest now), `/stop` (unsubscribe). Group: adding the bot or `/subscribe` subscribes the group to the group digest; `/unsubscribe` stops.
- Personal digest: game day, hunted miscrits available today (region, zone), day-restricted Exotic/Legendary available today, site link. Group digest: game day, day-restricted rare miscrits today, "new in the game" since the last digest, site link. The tournament is site-only; the bot never mentions it.
- Subscriber state (`notify/state.enc`) is committed AES-256-GCM encrypted; plaintext chat ids never enter the public repo.
- Missing secrets → the workflow exits successfully doing nothing.

### 13.2 What's new
- Sync diffs the previous snapshot against the new one and prepends an entry to `public/data/changelog.json` (max 200 entries): new/removed miscrits, changed spawns (days/places), new markers, new/changed relics. First run writes an "initial" entry. Empty diffs write nothing.
- Page `#/news` (timeline with miscrit cards); Today shows "New this week" when there are entries in the last 7 days.

### 13.3 Calculator calibration
- Calibration tab: the user records observed hits (attacker, level, optional real attack stat, ability, defender, level, damage).
- Fit: `damageScale` = median of observed/predicted (at scale 1); with ≥2 advantage (or disadvantage) hits, `strong`/`weak` multipliers are fitted the same way. Shows mean absolute % error before/after.
- Stored locally; applied to the calculator (badge "calibrated on N hits"); exportable as JSON so the owner can bake it into `formulaConfig.ts`.

### 13.4 Tournament
- Daily challenge: 10 questions (6 silhouette, 4 evolution) generated from a seed derived from the game date — identical for everyone that day. One scored attempt per day per browser.
- Score = 100 × correct + time bonus max(0, 300 − seconds).
- Result link `#/r/<code>` encodes {date, name, correct, ms} plus a checksum; tampered codes are rejected. Opening a friend's link adds it to the local board.
- Page `#/tournament`: today's challenge, share link, today's leaderboard and all-time totals (local), plus a friends' collections table built from collection share links (`#/c/<code>?n=<name>`).
