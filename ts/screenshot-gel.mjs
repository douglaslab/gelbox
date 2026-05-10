import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.addInitScript((b) => localStorage.setItem('gelBackend', b), 'webgpu');
await page.goto('http://localhost:5173/#/gel');
await page.waitForTimeout(1000);
await page.getByTestId('band-2').click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/gel-final.png', fullPage: false });

const broken = await page.evaluate(() =>
  Array.from(document.querySelectorAll('img'))
    .filter((img) => img.naturalWidth === 0)
    .map((img) => img.src)
);
console.log('broken imgs:', broken);

await browser.close();
