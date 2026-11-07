// Автопрогон: меню → уровень → промах → все отличия → победа. node tools/play.js <outdir> [level] [w] [h]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, lvl = 1, w = 390, h = 844] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../src/index.html'));
  await p.waitForSelector('#scr-menu.active');
  await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/01-menu.png' });
  await p.click('#btn-levels'); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/02-levels.png' });
  await p.click('#btn-levels-back');
  await p.evaluate(n => window.__game.start(n), +lvl);
  await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/03-game.png' });
  // промах в угол
  const boxA = await p.locator('#pic-a svg').boundingBox();
  const boxB = await p.locator('#pic-b svg').boundingBox();
  const st = await p.evaluate(() => window.__game.state.boxes);
  const sx = boxA.width / 400, sy = boxA.height / 340;
  // найти точку без отличий
  await p.mouse.click(boxA.x + 4, boxA.y + boxA.height - 4);
  await p.waitForTimeout(150);
  await p.screenshot({ path: out + '/04-miss.png' });
  for (let i = 0; i < st.length - 1; i++) {
    const t = i % 2 ? boxB : boxA;
    await p.mouse.click(t.x + st[i].cx * sx, t.y + st[i].cy * sy);
    await p.waitForTimeout(120);
  }
  await p.click('#btn-hint'); await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/05-almost.png' });
  const l = st[st.length - 1];
  await p.mouse.click(boxB.x + l.cx * sx, boxB.y + l.cy * sy);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/06-win.png' });
  await p.click('#btn-next'); await p.waitForTimeout(400);
  await p.click('#btn-pause'); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/07-pause.png' });
  const save = await p.evaluate(() => JSON.stringify(window.__game.save));
  console.log('save', save);
  console.log('errors', JSON.stringify(errs));
  await b.close();
})();
