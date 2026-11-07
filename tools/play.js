// Автопрогон в мобильном размере: node tools/play.js <outdir> <level...>   (сервер: python3 -m http.server 8123 в src/)
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8123/index.html';
(async () => {
  const [out, ...lvls] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE);
  await p.screenshot({ path: out + '/00-splash.png' });
  await p.waitForSelector('#scr-menu.active', { timeout: 5000 });
  await p.waitForTimeout(700);
  await p.screenshot({ path: out + '/01-menu-gift.png' });
  if (await p.isVisible('#modal-gift.show')) { await p.click('#btn-gift-take'); await p.waitForTimeout(300); }
  await p.screenshot({ path: out + '/02-menu.png' });
  await p.click('#btn-levels'); await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/03-map.png' });
  await p.click('#btn-map-back');
  for (const l of lvls.map(Number)) {
    await p.evaluate(n => window.__game.start(n), l); await p.waitForTimeout(1200);
    await p.screenshot({ path: out + `/L${l}-a.png` });
    const st = await p.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
    const bx = await p.locator('#pic-b svg').boundingBox(), ax = await p.locator('#pic-a svg').boundingBox();
    const at = (box, r) => [box.x + (r.x0 + r.x1) / 2 * box.width / 400, box.y + (r.y0 + r.y1) / 2 * box.height / 340];
    // промах: ищем точку вне всех отличий
    let mx = null;
    for (let y = 20; y < 320 && !mx; y += 23) for (let x = 20; x < 380 && !mx; x += 29) if (!st.some(r => x > r.x0 - 30 && x < r.x1 + 30 && y > r.y0 - 30 && y < r.y1 + 30)) mx = { x, y };
    await p.mouse.click(ax.x + mx.x * ax.width / 400, ax.y + mx.y * ax.height / 340); await p.waitForTimeout(150);
    await p.screenshot({ path: out + `/L${l}-b-miss.png` });
    for (let i = 0; i < st.length - 1; i++) { const [x, y] = at(i % 2 ? ax : bx, st[i]); await p.mouse.click(x, y); await p.waitForTimeout(380); }
    await p.click('#btn-hint'); await p.waitForTimeout(2600);
    await p.screenshot({ path: out + `/L${l}-c-found.png` });
    const [x, y] = at(bx, st[st.length - 1]); await p.mouse.click(x, y);
    await p.waitForTimeout(1900);
    await p.screenshot({ path: out + `/L${l}-d-win.png` });
    const won = await p.isVisible('#modal-win.show');
    console.log('level', l, 'diffs', st.length, 'won', won, 'save', JSON.stringify(await p.evaluate(() => ({ u: window.__game.save.unlocked, s: window.__game.save.stars, h: window.__game.save.hints }))));
    await p.click('#btn-win-menu'); await p.waitForTimeout(300);
  }
  // проигрыш
  await p.evaluate(() => window.__game.start(5)); await p.waitForTimeout(600);
  const ax = await p.locator('#pic-a svg').boundingBox();
  for (let i = 0; i < 3; i++) { await p.mouse.click(ax.x + 6 + i * 3, ax.y + 6); await p.waitForTimeout(400); }
  await p.waitForTimeout(900);
  await p.screenshot({ path: out + '/90-lose.png' });
  console.log('lose shown', await p.isVisible('#modal-lose.show'));
  // перезагрузка — прогресс сохранился
  await p.reload(); await p.waitForSelector('#scr-menu.active');
  console.log('after reload', JSON.stringify(await p.evaluate(() => ({ u: window.__game.save.unlocked, s: window.__game.save.stars }))));
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
