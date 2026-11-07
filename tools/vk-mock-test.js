// Интеграция с VK Bridge на подставном мосте (VK и OK): Init, Storage, реклама, сворачивание, рост.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8123/index.html';
async function run(b, query, label) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.addInitScript(() => {
    window.__storyUrl = 'https://example.test/share/story.png'; // история требует https
    const calls = [], subs = [], store = {};
    const mock = {
      send(m, d) {
        calls.push(m + ' ' + JSON.stringify(d || {}));
        if (m === 'VKWebAppStorageGet') return Promise.resolve({ keys: d.keys.map(k => ({ key: k, value: store[k] || '' })) });
        if (m === 'VKWebAppStorageSet') { store[d.key] = d.value; return Promise.resolve({ result: true }); }
        if (m === 'VKWebAppCheckNativeAds') return Promise.resolve({ result: true });
        if (m === 'VKWebAppShowNativeAds') return new Promise(r => setTimeout(() => r({ result: true }), 200));
        if (m === 'VKWebAppAddToHomeScreenInfo') return Promise.resolve({ is_feature_supported: true, is_added_to_home_screen: false });
        return Promise.resolve({ result: true, success: true });
      },
      subscribe(f) { subs.push(f); }, __emit(type) { subs.forEach(f => f({ detail: { type, data: {} } })); }, __calls: calls, __store: store
    };
    Object.defineProperty(window, 'vkBridge', { get: () => mock, set: () => {}, configurable: true });
  });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + query);
  await p.waitForSelector('#scr-menu.active');
  await p.waitForTimeout(600);
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + label + ': ' + m); if (!c) process.exitCode = 1; };
  const calls = () => p.evaluate(() => vkBridge.__calls.slice());
  let c = await calls();
  ok(c[0].startsWith('VKWebAppInit'), 'первый вызов — VKWebAppInit');
  ok(c.some(x => x.startsWith('VKWebAppStorageGet')), 'облачное сохранение читается');
  ok(await p.evaluate(() => window.Platform.id) === label, 'площадка определена как ' + label);
  ok(c.some(x => x.startsWith('VKWebAppShowBannerAd') && x.includes('"layout_type":"resize"')), 'баннер в меню (снизу, окно ужимается)');
  if (await p.isVisible('#modal-gift.show')) { await p.click('#btn-gift-x2'); await p.waitForTimeout(600); }
  ok(await p.evaluate(() => window.__game.save.hints) === 5, 'подарок дня ×2 за рекламу (+2 к 3 подсказкам)');
  const solve = async (n) => {
    await p.evaluate(n => window.__game.start(n), n); await p.waitForTimeout(400);
    const st = await p.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
    const bx = await p.locator('#pic-b svg').boundingBox();
    for (const r of st) { await p.mouse.click(bx.x + (r.x0 + r.x1) / 2 * bx.width / 400, bx.y + (r.y0 + r.y1) / 2 * bx.height / 340); await p.waitForTimeout(80); }
    await p.waitForSelector('#modal-win.show');
  };
  await solve(1); await p.waitForTimeout(900);
  c = await calls();
  ok(c.some(x => x.startsWith('VKWebAppHideBannerAd')), 'баннер скрывается в игре');
  ok(c.some(x => x.startsWith('VKWebAppStorageSet')), 'прогресс пишется в VK Storage');
  ok(c.some(x => x.includes(label === 'ok' ? 'fd_ny_ok' : 'fd_ny_vk')), 'ключ сохранения отдельный для ' + label);
  await p.click('#btn-next'); await p.waitForTimeout(400);
  c = await calls();
  ok(!c.some(x => x.startsWith('VKWebAppShowNativeAds {"ad_format":"interstitial"')), 'нет межстраничной на первых уровнях');
  if (label === 'vk') { await p.evaluate(() => vkBridge.__emit('VKWebAppViewHide')); }
  else { await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); }
  ok(await p.isVisible('#modal-pause.show'), 'сворачивание ставит на паузу');
  if (label === 'vk') await p.evaluate(() => vkBridge.__emit('VKWebAppViewRestore'));
  else await p.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await p.evaluate(() => window.Sound.blocked) === false, 'звук восстановлен после возврата');
  await p.click('#btn-resume');
  await p.evaluate(() => { window.__game.save.hints = 0; });
  await p.click('#btn-hint'); await p.waitForTimeout(600);
  c = await calls();
  ok(c.some(x => x.startsWith('VKWebAppShowNativeAds {"ad_format":"reward"')), 'подсказка за рекламу (reward)');
  ok(await p.isVisible('.mark-hint'), 'подсказка подсвечена после рекламы');
  ok(await p.evaluate(() => window.Sound.blocked) === false, 'звук восстановлен после рекламы');
  await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 400000; window.__game.save.wins = 2; });
  await solve(4); await p.click('#btn-next'); await p.waitForTimeout(700);
  // рост: после 3 побед в VK — избранное, затем межстраничная
  if (await p.isVisible('#modal-fav.show')) { ok(label === 'vk', 'избранное предлагается только в VK, после 3 побед'); await p.click('#btn-fav-later'); await p.waitForTimeout(700); }
  else ok(label === 'ok', 'в OK избранное не предлагается');
  c = await calls();
  ok(c.some(x => x.startsWith('VKWebAppShowNativeAds {"ad_format":"interstitial"')), 'межстраничная между уровнями после 3-го');
  await p.click('#btn-pause'); await p.click('#btn-pause-menu'); await p.waitForTimeout(300);
  await p.click('#btn-invite'); await p.waitForTimeout(300);
  c = await calls();
  const inv = c.find(x => x.startsWith('VKWebAppShowInviteBox'));
  ok(inv && (label === 'vk' || inv.includes('message')), 'приглашение друзей' + (label === 'ok' ? ' с message' : ''));
  await solve(5);
  const h0 = await p.evaluate(() => window.__game.save.hints);
  await p.click('#btn-share'); await p.click('#btn-share-wall'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__game.save.hints) === h0 + 2, 'награда за «Поделиться» +2 подсказки');
  await p.click('#btn-share'); await p.click('#btn-share-story'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__game.save.hints) === h0 + 2, 'награда за «Поделиться» — только раз в день');
  c = await calls();
  const story = c.find(x => x.startsWith('VKWebAppShowStoryBox')) || '';
  ok(story.includes('"background_type":"image"') && (label === 'vk' ? story.includes('vk.com/app54882213') : !story.includes('attachment')), 'история: картинка' + (label === 'vk' ? ' + ссылка на игру' : ', без ссылок (OK)'));
  ok(label === 'vk' || !c.some(x => /vk\.com|https?:\/\/(?!localhost)/.test(x.replace(/"url":"https:\/\/example\.test\/share\/story\.png"/, ''))), 'в OK в вызовах моста нет внешних ссылок');
  ok(label === 'vk' ? c.some(x => x.startsWith('VKWebAppShowWallPostBox')) : c.some(x => x.startsWith('VKWebAppShare')) && !c.some(x => x.startsWith('VKWebAppShowWallPostBox')), 'поделиться: ' + (label === 'vk' ? 'стена' : 'VKWebAppShare'));
  ok(!c.some(x => /AddToFavorites|AddToHomeScreen |ShowLeaderBoardBox/.test(x)) || label === 'vk', 'в OK не вызываются неподдерживаемые методы');
  ok(errs.length === 0, 'ошибок на странице нет ' + JSON.stringify(errs));
  await p.close();
}
(async () => {
  const b = await chromium.launch();
  await run(b, '?vk_app_id=1&vk_platform=mobile_android', 'vk');
  await run(b, '?vk_app_id=1&vk_platform=mobile_android_ok&vk_client=ok', 'ok');
  await b.close();
})();
