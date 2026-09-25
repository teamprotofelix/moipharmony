/**
 * Headless-browser E2E (plan §11 acceptance: language switching, theme,
 * header layout, 360px mobile menu). Uses the installed Edge/Chrome —
 * no browser download needed.
 *
 *   node scripts/e2e.mjs                     # against http://localhost:4321 (astro preview)
 *   E2E_BASE=https://moipharmony.caipex.site node scripts/e2e.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.E2E_BASE ?? 'http://localhost:4321';
const candidates = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
import { existsSync } from 'node:fs';
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error('Edge not found. Set E2E_EXECUTABLE to a Chromium-based browser path.');
  process.exit(2);
}

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let failures = 0;
const check = (label, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
};
page.on('pageerror', (e) => {
  console.log('[pageerror]', String(e).slice(0, 200));
  failures++;
});

await page.goto(`${BASE}/?lang=ja`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
check('ja load: html lang=ja', (await page.evaluate(() => document.documentElement.lang)) === 'ja');
check('ja load: h1 translated', (await page.evaluate(() => document.querySelector('h1')?.textContent))?.includes('同じ発明') ?? false);
check('ja load: select shows 日本語', (await page.evaluate(() => document.querySelector('[data-lang-select]').value)) === 'ja');

const layout = await page.evaluate(() => {
  const sel = document.querySelector('[data-lang-select]').getBoundingClientRect();
  const nav = document.querySelector('.site-nav').getBoundingClientRect();
  const brand = document.querySelector('.brand').getBoundingClientRect();
  return { selTop: sel.top, navTop: nav.top, brandRight: brand.right, selLeft: sel.left };
});
check('layout: controls above nav row', layout.selTop < layout.navTop);
check('layout: select on the right side', layout.selLeft > layout.brandRight);

await page.selectOption('[data-lang-select]', 'en');
await page.waitForTimeout(1500);
check('switch en: html lang=en', (await page.evaluate(() => document.documentElement.lang)) === 'en');
check('switch en: select shows English', (await page.evaluate(() => document.querySelector('[data-lang-select]').value)) === 'en');
check('switch en: title translated', (await page.title()).includes('KJ-EQH Research Experience'));

await page.selectOption('[data-lang-select]', 'ko');
await page.waitForTimeout(1500);
check('switch ko: html lang=ko', (await page.evaluate(() => document.documentElement.lang)) === 'ko');
check('switch ko: select shows 한국어', (await page.evaluate(() => document.querySelector('[data-lang-select]').value)) === 'ko');

await page.click('[data-theme-choice="dark"]');
await page.waitForTimeout(300);
check('theme: dark applied', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark');
await page.click('[data-theme-choice="light"]');
await page.waitForTimeout(300);
check('theme: light applied', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light');

await page.setViewportSize({ width: 360, height: 780 });
await page.waitForTimeout(400);
check('mobile: nav hidden', await page.evaluate(() => getComputedStyle(document.querySelector('.site-nav')).display === 'none'));
check('mobile: menu button visible', await page.evaluate(() => getComputedStyle(document.querySelector('.menu-button')).display !== 'none'));
const mobLayout = await page.evaluate(() => {
  const sel = document.querySelector('[data-lang-select]').getBoundingClientRect();
  const menu = document.querySelector('.menu-button').getBoundingClientRect();
  return { selTop: sel.top, menuTop: menu.top };
});
check('mobile: select + menu on first row', Math.abs(mobLayout.selTop - mobLayout.menuTop) < 30);

await page.click('.menu-button');
await page.waitForTimeout(200);
check('mobile: menu opens', (await page.evaluate(() => document.querySelector('#mobile-menu').getAttribute('data-open'))) === 'true');
await page.click('#mobile-menu a[href*="/experience/"]');
await page.waitForTimeout(1200);
check('mobile: navigates to experience', page.url().includes('/experience/'));

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
