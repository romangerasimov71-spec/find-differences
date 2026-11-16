// Скриншоты карточки RuStore: телефон, книжные 1080×1920 PNG, русский, режим Android-приложения (без рекламы).
//   ./build.sh && (cd dist/vk && python3 -m http.server 8125 &)
//   GAME_URL=http://127.0.0.1:8125/index.html NODE_PATH=/opt/node-tools/node_modules node tools/capture-rustore.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'release', 'rustore', 'screenshots');
require('fs').mkdirSync(OUT, { recursive: true });
const URL = process.env.GAME_URL || 'http://127.0.0.1:8125/index.html';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 FindDifferencesAndroid/1.2.0';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, locale: 'ru-RU', userAgent: UA, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForSelector('#scr-menu.active');
  await page.waitForTimeout(800);
  if (await page.isVisible('#modal-gift.show')) { await page.click('#btn-gift-take'); await page.waitForTimeout(600); }
  // прогресс «как у игрока»: пройдено 11 уровней, звёзды
  await page.evaluate(() => { const s = window.__game.save; s.unlocked = 12; s.last = 12; for (let i = 1; i <= 11; i++) s.stars[i] = i % 4 ? 3 : 2; s.hints = 4; });
  const shot = async (name) => {
    const bad = await page.evaluate(() => [...document.querySelectorAll('.btn-ad, #ad-stub.show, #btn-share, #btn-invite')].some(e => e.offsetParent !== null && !e.hidden));
    if (bad) throw new Error('ad / share button visible on ' + name);
    await page.screenshot({ path: `${OUT}/${name}-1080x1920.png` });
  };
  const find = async (k) => {
    const st = await page.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
    const bx = await page.locator('#pic-b svg').boundingBox();
    for (const r of st.slice(0, k)) { await page.mouse.click(bx.x + (r.x0 + r.x1) / 2 * bx.width / 400, bx.y + (r.y0 + r.y1) / 2 * bx.height / 340); await page.waitForTimeout(450); }
  };
  // 1 — меню
  await page.evaluate(() => { document.querySelector('#btn-map-back').click(); });
  await page.waitForTimeout(3200); // сообщение о подарке успевает исчезнуть
  await shot('1-menu');
  // 2 — уровень с найденными отличиями
  await page.evaluate(() => window.__game.start(7)); await page.waitForTimeout(900);
  await find(3); await page.waitForTimeout(1200);
  await shot('2-game');
  // 3 — праздничный уровень (каждый 10-й)
  await page.evaluate(() => window.__game.start(10)); await page.waitForTimeout(3500);
  await find(2); await page.waitForTimeout(1200);
  await shot('3-festive');
  // 4 — победа
  await page.evaluate(() => window.__game.start(12)); await page.waitForTimeout(3500);
  await find(99); await page.waitForTimeout(2600);
  await shot('4-win');
  await browser.close();
  console.log('ok');
})();
