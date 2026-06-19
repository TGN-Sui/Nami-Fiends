import { chromium } from 'playwright';

const baseUrl = process.env.NAMI_DEV_URL ?? 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('pageerror', (error) => {
    consoleErrors.push('pageerror: ' + error.message);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push('console: ' + message.text());
    }
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

  const enterButton = page.getByRole('button', { name: /enter nami/i });
  if (await enterButton.isVisible().catch(() => false)) {
    await enterButton.click();
    await page.waitForTimeout(800);
  }

  const gameHubButton = page.locator('.sidebar-nav-button').filter({ hasText: /game hub/i }).first();
  if (await gameHubButton.isVisible().catch(() => false)) {
    await gameHubButton.click();
    await page.waitForTimeout(1200);
  }

  const openChannelButton = page.getByRole('button', { name: /view channel|open/i }).first();
  if (await openChannelButton.isVisible().catch(() => false)) {
    await openChannelButton.click();
    await page.waitForTimeout(1500);
  }

  const activePage = await page.locator('.nami-app').getAttribute('data-active-page');
  const hero = await page.locator('[data-channel-hero="true"]').count();
  const newsCards = await page.locator('.channel-profile-news-card').count();
  const mainText = await page.locator('.main-stage').innerText().catch(() => '');
  const bodySnippet = mainText.replace(/\s+/g, ' ').trim().slice(0, 400);

  console.log(JSON.stringify({ baseUrl, activePage, hero, newsCards, bodySnippet, consoleErrors }, null, 2));

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});