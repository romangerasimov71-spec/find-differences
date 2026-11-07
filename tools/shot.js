// node tools/shot.js <url> <out.png> [w] [h] [scale]
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 390, h = 844, sc = 1] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +sc });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(url); await p.waitForTimeout(600);
  await p.screenshot({ path: out, fullPage: true }); await b.close();
})();
