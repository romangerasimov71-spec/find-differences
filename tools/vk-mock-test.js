// Проверка интеграции с VK Bridge на подставном мосте: Init, Storage, реклама, ViewHide/Restore.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.addInitScript(() => {
    const calls = []; const subs = []; const store = {};
    const mock = {
      send(m, d) {
        calls.push(m + ' ' + JSON.stringify(d || {}));
        if (m === 'VKWebAppStorageGet') return Promise.resolve({ keys: d.keys.map(k => ({ key: k, value: store[k] || '' })) });
        if (m === 'VKWebAppStorageSet') { store[d.key] = d.value; return Promise.resolve({ result: true }); }
        if (m === 'VKWebAppCheckNativeAds') return Promise.resolve({ result: true });
        if (m === 'VKWebAppShowNativeAds') return new Promise(r => setTimeout(() => r({ result: true }), 300));
        return Promise.resolve({ result: true });
      },
      subscribe(f) { subs.push(f); },
      __emit(type) { subs.forEach(f => f({ detail: { type, data: {} } })); },
      __calls: calls, __store: store
    };
    Object.defineProperty(window, 'vkBridge', { get: () => mock, set: () => {}, configurable: true });
  });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../src/index.html') + '?vk_app_id=1&vk_platform=mobile_android');
  await p.waitForSelector('#scr-menu.active');
  const ok = (c, m) => console.log((c ? 'OK   ' : 'FAIL ') + m);
  let calls = await p.evaluate(() => vkBridge.__calls.slice());
  ok(calls[0].startsWith('VKWebAppInit'), 'первый вызов — VKWebAppInit');
  ok(calls.some(c => c.startsWith('VKWebAppStorageGet')), 'облачное сохранение читается');
  await p.click('#btn-play'); await p.waitForTimeout(200);
  // решаем уровень 1
  const solve = async () => {
    const st = await p.evaluate(() => window.__game.state.boxes);
    const bx = await p.locator('#pic-b svg').boundingBox();
    for (const s of st) { await p.mouse.click(bx.x + s.cx * bx.width / 400, bx.y + s.cy * bx.height / 340); await p.waitForTimeout(60); }
    await p.waitForSelector('#modal-win.show');
  };
  await solve(); await p.waitForTimeout(1000);
  calls = await p.evaluate(() => vkBridge.__calls.slice());
  ok(calls.some(c => c.startsWith('VKWebAppStorageSet')), 'прогресс пишется в VK Storage');
  // сворачивание → пауза
  await p.click('#btn-next'); await p.waitForTimeout(300);
  await p.evaluate(() => vkBridge.__emit('VKWebAppViewHide'));
  ok(await p.isVisible('#modal-pause.show'), 'VKWebAppViewHide ставит игру на паузу');
  await p.evaluate(() => vkBridge.__emit('VKWebAppViewRestore'));
  await p.click('#btn-resume');
  // подсказки → реклама за вознаграждение
  await p.evaluate(() => { window.__game.save.hints = 0; });
  await p.click('#btn-hint'); await p.waitForTimeout(200);
  ok(await p.isVisible('#modal-hint.show'), 'при 0 подсказок предлагается реклама');
  await p.click('#btn-hint-ad'); await p.waitForTimeout(800);
  const h = await p.evaluate(() => window.__game.save.hints);
  ok(h === 3, 'после rewarded начислено +3 подсказки (' + h + ')');
  calls = await p.evaluate(() => vkBridge.__calls.slice());
  ok(calls.some(c => c.startsWith('VKWebAppShowNativeAds {"ad_format":"reward"')), 'показ reward через VKWebAppShowNativeAds');
  // межстраничная: уровни 1-2 без рекламы, с 3-го и после 3 минут — показ
  const before = calls.filter(c => c.includes('"interstitial"') && c.startsWith('VKWebAppShow')).length;
  ok(before === 0, 'межстраничной не было в начале игры');
  await p.evaluate(() => window.__game.start(3)); await p.waitForTimeout(200);
  await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 200000; });
  await solve(); await p.waitForTimeout(900); await p.click('#btn-next'); await p.waitForTimeout(800);
  calls = await p.evaluate(() => vkBridge.__calls.slice());
  ok(calls.some(c => c.startsWith('VKWebAppShowNativeAds {"ad_format":"interstitial"')), 'межстраничная после 3-го уровня спустя 3 мин');
  const title = await p.textContent('#game-title');
  ok(title === 'Уровень 4', 'после рекламы открылся следующий уровень (' + title + ')');
  // перезагрузка — прогресс из облака
  await p.evaluate(() => localStorage.clear());
  const store = await p.evaluate(() => JSON.stringify(vkBridge.__store));
  ok(store.includes('unlocked'), 'в облаке лежит прогресс: ' + store.slice(0, 90));
  console.log('ошибки страницы:', JSON.stringify(errs));
  await b.close();
})();
