/*
 * Режим Android-приложения (RuStore): WebView дописывает «FindDifferencesAndroid/<версия>» к user agent.
 * Проверяет на VK-сборке dist/vk (именно она лежит в APK):
 *  - быстрый запуск без параметров площадки и без моста, площадка = android, мост VK не вызывается;
 *  - язык по языку телефона (ru → русский, en → английский);
 *  - нет рекламы: ни заглушки межстраничной между уровнями, ни «за награду» (×2 подарка, «Продолжить», подсказка);
 *  - нет «Друзья», «Поделиться», строки «Поддержка и новинки: vk.com/…», внешних запросов;
 *  - прогресс переживает перезагрузку (localStorage WebView);
 *  - FDGame.back(): закрывает окно, ставит игру на паузу, из карты — в меню, в меню — false (выход);
 *  - FDGame.appPause(): пауза и тишина, потом звук возвращается.
 *
 *   ./build.sh && (cd dist/vk && python3 -m http.server 8125 &)
 *   GAME_URL=http://127.0.0.1:8125/index.html node tools/android-test.js
 */
const { chromium } = require('playwright');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8125/index.html';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 FindDifferencesAndroid/1.2.0';
const results = [];
function check(name, ok, extra) { results.push((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); }

async function open(browser, locale, query) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA, locale, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('request', r => { if (!/^http:\/\/127\.0\.0\.1/.test(r.url()) && !/^data:/.test(r.url())) external.push(r.url()); });
  await page.addInitScript(() => {
    // мост VK, который «умеет всё»: в приложении его всё равно нельзя трогать
    window.__vkCalls = [];
    const mock = { send(m) { window.__vkCalls.push(m); return Promise.resolve({ result: true }); }, subscribe() {} };
    Object.defineProperty(window, 'vkBridge', { get: () => mock, set: () => {}, configurable: true });
    // заглушка рекламы не должна появиться ни разу
    window.__stub = 0;
    new MutationObserver(() => { const el = document.getElementById('ad-stub'); if (el && el.classList.contains('show')) window.__stub++; })
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  const t0 = Date.now();
  await page.goto(URL + (query || ''));
  await page.waitForSelector('#scr-menu.active', { timeout: 15000 });
  return { ctx, page, errors, external, ms: Date.now() - t0 };
}

async function solve(page, n) {
  await page.evaluate(n => window.__game.start(n), n); await page.waitForTimeout(500);
  const st = await page.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
  const bx = await page.locator('#pic-b svg').boundingBox();
  for (const r of st) { await page.mouse.click(bx.x + (r.x0 + r.x1) / 2 * bx.width / 400, bx.y + (r.y0 + r.y1) / 2 * bx.height / 340); await page.waitForTimeout(90); }
  await page.waitForSelector('#modal-win.show', { timeout: 5000 });
}

(async () => {
  const browser = await chromium.launch();
  // параметры VK в адресе — тоже не должны включить мост
  const { ctx, page, errors, external, ms } = await open(browser, 'ru-RU', '?vk_platform=mobile_android&vk_app_id=1');
  check('запуск до меню без моста (< 3,5 с, заставка 1,2 с)', ms < 3500, ms + ' ms');
  check('площадка android', (await page.evaluate(() => Platform.id)) === 'android');
  check('версия игры доступна (FDGame.version)', /^\d+\.\d+\.\d+$/.test(await page.evaluate(() => FDGame.version)));
  check('язык телефона ru → русский', (await page.textContent('#btn-play')).includes('Играть'));

  // ежедневный подарок: без «×2 за рекламу»
  await page.waitForTimeout(700);
  check('подарок дня открыт', await page.isVisible('#modal-gift.show'));
  check('нет «Забрать ×2» за рекламу', !(await page.isVisible('#btn-gift-x2')));
  check('back() закрывает подарок', (await page.evaluate(() => FDGame.back())) === true && !(await page.isVisible('#modal-gift.show')));
  check('нет кнопки «Друзья»', !(await page.isVisible('#btn-invite')));

  // звук: строки поддержки нет
  await page.click('#btn-audio'); await page.waitForTimeout(200);
  check('нет строки «Поддержка и новинки: vk.com/…»', !(await page.isVisible('#support-line')) && !(await page.textContent('#support-line')).includes('vk.com'));
  check('back() закрывает окно «Звук»', (await page.evaluate(() => FDGame.back())) === true && !(await page.isVisible('#modal-sound.show')));

  // уровни 1–5 подряд: межстраничной (и её заглушки) нет, «Поделиться» скрыто
  await solve(page, 1);
  check('нет «Поделиться» после победы', !(await page.isVisible('#btn-share')));
  for (let n = 2; n <= 5; n++) {
    await page.click('#btn-next'); await page.waitForTimeout(700);
    check('после «Дальше» сразу уровень ' + n + ' (без рекламы)', (await page.evaluate(() => window.__game.state.n)) === n && !(await page.isVisible('#ad-stub.show')));
    await solve(page, n);
  }
  // межстраничная по правилам VK идёт не раньше 2,5 мин — поэтому зовём рекламу напрямую: сразу «нет», без заглушки
  check('Platform.showInterstitial() → false сразу, без заглушки', (await page.evaluate(() => Promise.race([Platform.showInterstitial(), new Promise(r => setTimeout(() => r('timeout'), 300))]))) === false);
  check('Platform.showRewarded() → false сразу, без заглушки', (await page.evaluate(() => Promise.race([Platform.showRewarded(), new Promise(r => setTimeout(() => r('timeout'), 300))]))) === false);
  check('back() из окна победы — в меню', (await page.evaluate(() => FDGame.back())) === true && (await page.isVisible('#scr-menu.active')));

  // подсказки кончились: без значка рекламы, тап — сообщение, а не реклама
  await page.evaluate(() => window.__game.start(6)); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__game.save.hints = 0; });
  await page.evaluate(() => window.__game.start(6)); await page.waitForTimeout(500);
  check('подсказок 0 — на кнопке «0», без значка рекламы', !(await page.evaluate(() => document.getElementById('hint-badge').classList.contains('ad'))) && (await page.textContent('#hint-badge')).trim() === '0');
  await page.click('#btn-hint'); await page.waitForTimeout(300);
  check('тап по подсказке — «Подсказки закончились…», без рекламы', (await page.textContent('#toast')).includes('Подсказки закончились') && !(await page.isVisible('#ad-stub.show')));

  // back() в игре — пауза, ещё раз — продолжить
  check('back() в игре ставит паузу', (await page.evaluate(() => FDGame.back())) === true && (await page.isVisible('#modal-pause.show')));
  check('back() на паузе — продолжить', (await page.evaluate(() => FDGame.back())) === true && !(await page.isVisible('#modal-pause.show')));

  // проигрыш: нет «Продолжить» за рекламу
  const ax = await page.locator('#pic-a svg').boundingBox();
  for (let i = 0; i < 3; i++) { await page.mouse.click(ax.x + 6 + i * 3, ax.y + 6); await page.waitForTimeout(400); }
  await page.waitForTimeout(900);
  check('проигрыш показан', await page.isVisible('#modal-lose.show'));
  check('нет «Продолжить» за рекламу', !(await page.isVisible('#btn-continue')));
  check('back() из проигрыша — в меню', (await page.evaluate(() => FDGame.back())) === true && (await page.isVisible('#scr-menu.active')));

  // сворачивание приложения
  await page.evaluate(() => window.__game.start(3)); await page.waitForTimeout(500);
  await page.evaluate(() => FDGame.appPause(true));
  check('appPause(true): игра на паузе и тихо', (await page.isVisible('#modal-pause.show')) && (await page.evaluate(() => window.Sound.blocked)) === true);
  await page.evaluate(() => FDGame.appPause(false));
  check('appPause(false): звук вернулся (пауза остаётся до нажатия)', (await page.evaluate(() => window.Sound.blocked)) === false && (await page.isVisible('#modal-pause.show')));
  await page.evaluate(() => FDGame.back());

  // карта уровней: back() — в меню, в меню — false
  await page.evaluate(() => { document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show')); });
  await page.click('#btn-pause'); await page.waitForTimeout(150); await page.click('#btn-pause-menu'); await page.waitForTimeout(200);
  await page.click('#btn-levels'); await page.waitForTimeout(400);
  check('back() с карты уровней — в меню', (await page.evaluate(() => FDGame.back())) === true && (await page.isVisible('#scr-menu.active')));
  check('back() в меню без окон → false (приложение выходит)', (await page.evaluate(() => FDGame.back())) === false);

  // прогресс переживает перезагрузку
  const before = await page.evaluate(() => window.__game.save.unlocked);
  await page.reload(); await page.waitForSelector('#scr-menu.active');
  const after = await page.evaluate(() => ({ u: window.__game.save.unlocked, k: Object.keys(localStorage) }));
  check('прогресс сохранён после перезагрузки (localStorage)', before >= 6 && after.u === before && after.k.includes('fd_ny_android_v2'), JSON.stringify(after));

  check('мост VK ни разу не вызван', (await page.evaluate(() => window.__vkCalls.length)) === 0, JSON.stringify(await page.evaluate(() => window.__vkCalls)));
  check('заглушка рекламы ни разу не показана', (await page.evaluate(() => window.__stub)) === 0);
  check('нет внешних запросов', external.length === 0, external.join(' '));
  check('нет ошибок и предупреждений в консоли', errors.length === 0, errors.join(' | '));
  await ctx.close();

  // английский телефон
  const en = await open(browser, 'en-US');
  check('язык телефона en → английский', (await en.page.textContent('#btn-play')).includes('Play'));
  await en.ctx.close();

  console.log(results.join('\n'));
  await browser.close();
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
})();
