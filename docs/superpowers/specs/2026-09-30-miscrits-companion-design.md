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
