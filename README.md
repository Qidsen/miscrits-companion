# Miscrits Companion

Personal companion site for Miscrits: World of Creatures — today's spawns, interactive map with zones,
Miscritdex, week calendar, relics, collection tracking, team builder, damage calculator, element chart,
compare, hunt list and mini games. RU/EN.

    npm install
    npm run sync        # refresh data (add --maps to re-download map images)
    npm run dev         # http://localhost:5173
    npm test            # unit tests
    npm run e2e         # browser smoke tests
    npx tsx scripts/make-icons.ts   # regenerate PWA icons from public/icon.svg

Game day resets at 03:00 Europe/Kyiv. Data: worldofmiscrits.com, miscritcompanion.com.
Damage calculator and element multipliers are approximations (tune `src/domain/formulaConfig.ts`).

## Auto-update and hosting

`.github/workflows/sync-and-deploy.yml` runs every 6 hours (and on push to `main`): syncs data,
commits changes, builds. Deploying to GitHub Pages needs a public repo (or a paid plan):
enable Pages with source "GitHub Actions" and set the repository variable `PAGES_ENABLED=true`.

The site is a PWA: on a phone use "Add to Home screen"; it works offline after the first visit.
