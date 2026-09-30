import { expect, test } from '@playwright/test'

test('Today shows countdown, data badge and tiles', async ({ page }) => {
  await page.goto('#/')
  await expect(page.getByTestId('reset-countdown')).toContainText(/\d\d:\d\d:\d\d/)
  await expect(page.getByTestId('data-updated')).toBeVisible()
  expect(await page.getByTestId('miscrit-tile').count()).toBeGreaterThan(10)
})

test('no horizontal scroll', async ({ page }) => {
  for (const route of ['#/', '#/dex', '#/m/1', '#/map/Forest', '#/week', '#/relics', '#/collection', '#/elements', '#/calc?a=1.30&d=20.30', '#/team?t=1.30~20.30', '#/compare?ids=1,20,94', '#/hunt', '#/games', '#/games/memory']) {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, route).toBeLessThanOrEqual(1)
  }
})

test('Dex search filters and survives reload', async ({ page }) => {
  await page.goto('#/dex')
  await page.getByTestId('dex-search').fill('blighted afterburn')
  await expect(page.getByTestId('miscrit-tile')).toHaveCount(1)
  await page.reload()
  await expect(page.getByTestId('miscrit-tile')).toHaveCount(1)
})

test('Miscrit page caught toggle persists', async ({ page }) => {
  await page.goto('#/m/1')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Flue')
  await page.getByTestId('toggle-caught').click()
  await page.reload()
  await expect(page.getByTestId('toggle-caught')).toHaveAttribute('aria-pressed', 'true')
})

test('Map renders markers', async ({ page }) => {
  await page.goto('#/map/Forest')
  await expect(page.getByTestId('map-canvas').locator('.leaflet-image-layer')).toBeVisible()
  await page.getByRole('button', { name: /Any day|Любой день/ }).click()
  expect(await page.locator('.map-pin').count()).toBeGreaterThan(5)
})

test('sprite 404 shows placeholder, not broken image', async ({ page }) => {
  await page.route('https://cdn.worldofmiscrits.com/**', r => r.fulfill({ status: 404, body: '' }))
  await page.goto('#/dex')
  await expect(page.locator('.avatar-fallback').first()).toBeVisible()
})

test('blocked localStorage does not break the app', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })
  })
  await page.goto('#/')
  await expect(page.getByTestId('reset-countdown')).toBeVisible()
})

test('search palette', async ({ page }) => {
  await page.goto('#/')
  await expect(page.getByTestId('reset-countdown')).toBeVisible()
  await page.keyboard.press('Control+k')
  await page.getByTestId('palette-input').fill('afterb')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/m\/1$/)
})

test('Dex search input keeps typed characters and caret', async ({ page }) => {
  await page.goto('#/dex')
  const input = page.getByTestId('dex-search')
  await input.pressSequentially('afterburn')
  await input.press('Home')
  await input.pressSequentially('blighted ')
  await expect(input).toHaveValue('blighted afterburn')
  await expect(page.getByTestId('miscrit-tile')).toHaveCount(1)
})

test('Miscrit page resets evolution when navigating to another miscrit', async ({ page }) => {
  await page.goto('#/m/1')
  await page.getByRole('button', { name: /^4\./ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Afterburn')
  await page.evaluate(() => { location.hash = '#/m/20' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Waddles')
})

test('Today shows rare catches block', async ({ page }) => {
  await page.goto('#/')
  await expect(page.getByTestId('rare-today')).toBeVisible()
})

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
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Вторник|Tuesday/)
  await page.clock.runFor(15_000)
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Среда|Wednesday/)
})

test('share link round trip', async ({ page }) => {
  await page.goto('#/m/1'); await page.getByTestId('toggle-caught').click()
  await page.goto('#/collection')
  const link = await page.getByTestId('share-link').inputValue()
  await page.goto(link.slice(link.indexOf('#')))
  await expect(page.getByTestId('friend-caught-count')).toHaveText(/1/)
})

test('damage calculator shows a result table', async ({ page }) => {
  await page.goto('#/calc?a=20.30&d=1.30')
  await expect(page.getByTestId('dmg-table').locator('tbody tr').first()).toBeVisible()
})

test('game day catches up after the laptop sleeps (no timers fired)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-29T22:00:00Z') }) // Kyiv 01:00 Wed → game Tue
  await page.goto('#/')
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Вторник|Tuesday/)
  await page.clock.setSystemTime(new Date('2026-09-30T06:00:00Z')) // woke up at 09:00 Kyiv
  await page.clock.runFor(61_000)
  await expect(page.locator('[data-testid="game-day"]')).toHaveText(/Среда|Wednesday/)
})

test('map focus link works for a miscrit that does not spawn today', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-30T12:00:00Z') }) // Wednesday; Waddles spawns Sun/Mon/Thu
  await page.goto('#/map/Forest?focus=0779dfa8-1ae8-478f-92c6-c50bdc1a1569')
  await expect(page.locator('.map-pin-focus')).toHaveCount(1)
})

test('a failed page chunk shows a reload prompt instead of a blank app', async ({ page }) => {
  await page.route('**/assets/WeekPage-*.js', r => r.abort())
  await page.goto('#/')
  await expect(page.getByTestId('reset-countdown')).toBeVisible()
  await page.evaluate(() => { location.hash = '#/week' })
  await expect(page.getByTestId('chunk-error')).toBeVisible()
})

test('silhouette game stops retrying when sprites cannot load', async ({ page }) => {
  await page.route('https://cdn.worldofmiscrits.com/**', r => r.fulfill({ status: 404, body: '' }))
  await page.goto('#/games/silhouette')
  await expect(page.getByTestId('game-empty')).toBeVisible({ timeout: 10_000 })
})

test('cards have no interactive element nested inside a link', async ({ page }) => {
  await page.goto('#/dex')
  await expect(page.getByTestId('miscrit-tile').first()).toBeVisible()
  expect(await page.locator('a button, a [role="button"]').count()).toBe(0)
})

test('compare and hunt use full width columns on phones', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript(() => localStorage.setItem('mc-hunt', JSON.stringify({ state: { ids: [1, 20] }, version: 0 })))
  await page.goto('#/compare?ids=1,20,94')
  const col = await page.locator('.cmp-col').first().boundingBox()
  expect(col!.width).toBeGreaterThan(250)
  await page.goto('#/hunt')
  const panel = await page.locator('.panel').first().boundingBox()
  expect(panel!.width).toBeGreaterThan(300)
})
