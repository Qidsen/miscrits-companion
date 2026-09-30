import { expect, test } from '@playwright/test'

test('Today shows countdown, data badge and tiles', async ({ page }) => {
  await page.goto('#/')
  await expect(page.getByTestId('reset-countdown')).toContainText(/\d\d:\d\d:\d\d/)
  await expect(page.getByTestId('data-updated')).toBeVisible()
  expect(await page.getByTestId('miscrit-tile').count()).toBeGreaterThan(10)
})

test('no horizontal scroll', async ({ page }) => {
  for (const route of ['#/', '#/dex', '#/m/1', '#/map/Forest']) {
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
