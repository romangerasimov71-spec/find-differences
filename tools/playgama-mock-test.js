// Сборка Playgama на подставном Bridge SDK. Сервер: python3 -m http.server 8124 в dist/playgama
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
  await ctx.route('https://bridge.playgama.com/**', r => r.fulfill({ contentType: 'text/javascript', body: `
    (function(){ var ev={}, log=[], store=JSON.parse(sessionStorage.getItem('__mockStore')||'{}');
      function on(o){ o.on=function(n,f){(ev[n]=ev[n]||[]).push(f)}; o.off=function(n,f){ev[n]=(ev[n]||[]).filter(x=>x!==f)}; return o; }
      function emit(n,v){(ev[n]||[]).forEach(f=>f(v))}
      window.bridge = { EVENT_NAME:{PAUSE_STATE_CHANGED:'p',AUDIO_STATE_CHANGED:'a',REWARDED_STATE_CHANGED:'r',INTERSTITIAL_STATE_CHANGED:'i'},
        initialize(){ log.push('initialize'); return Promise.resolve(); },
        platform: on({ language:'en', isAudioEnabled:true, sendMessage(m){ log.push('msg:'+m); } }),
        storage: { get(k){ log.push('get:'+k); return Promise.resolve(k.map(x=>store[x]||null)); }, set(k,v){ log.push('set:'+k); k.forEach((x,i)=>store[x]=v[i]); window.__mockSave&&window.__mockSave(store); return Promise.resolve(); } },
        advertisement: on({ isRewardedSupported:true, interstitialState:'closed',
          showRewarded(){ log.push('rewarded'); emit('r','opened'); setTimeout(()=>{emit('r','rewarded');emit('r','closed')},200); },
          showInterstitial(){ log.push('inter'); emit('i','opened'); setTimeout(()=>emit('i','closed'),200); } }),
        __log:log, __emit:emit, __store:store };
    })();` }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let lsUsed = false;
  await p.exposeFunction('__lsUsed', () => { lsUsed = true; });
  await p.addInitScript(() => { const s = Storage.prototype.setItem; window.__mockSave = st => s.call(sessionStorage, '__mockStore', JSON.stringify(st)); Storage.prototype.setItem = function () { window.__lsUsed(); return s.apply(this, arguments); }; });
  await p.goto('http://localhost:8124/index.html');
  await p.waitForSelector('#scr-menu.active'); await p.waitForTimeout(500);
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const log = () => p.evaluate(() => bridge.__log.slice());
  let l = await log();
  ok(l[0] === 'initialize', 'bridge.initialize() — первым');
  ok(l.indexOf('get:progress') > 0, 'прогресс читается через storage.get одним вызовом');
  ok(l.includes('msg:game_ready'), 'game_ready отправлен, когда меню готово');
  ok((await p.textContent('#btn-play span')) === 'Play', 'язык EN по platform.language');
  ok(await p.isHidden('#btn-invite'), 'кнопки VK/OK (друзья) скрыты');
  if (await p.isVisible('#modal-gift.show')) await p.click('#btn-gift-x2'), await p.waitForTimeout(500);
  await p.evaluate(() => window.__game.start(1)); await p.waitForTimeout(400);
  const st = await p.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
  const bx = await p.locator('#pic-b svg').boundingBox();
  for (const r of st) { await p.mouse.click(bx.x + (r.x0 + r.x1) / 2 * bx.width / 400, bx.y + (r.y0 + r.y1) / 2 * bx.height / 340); await p.waitForTimeout(80); }
  await p.waitForSelector('#modal-win.show'); await p.waitForTimeout(800);
  l = await log();
  ok(l.includes('set:progress'), 'сохранение через storage.set');
  ok(!lsUsed, 'localStorage не используется');
  ok(await p.isHidden('#btn-share'), '«Поделиться» скрыто');
  await p.click('#btn-next'); await p.waitForTimeout(600);
  ok((await log()).includes('inter'), 'interstitial на переходе между уровнями (Bridge решает сам)');
  await p.evaluate(() => bridge.__emit('p', true));
  ok(await p.isVisible('#modal-pause.show'), 'PAUSE_STATE_CHANGED ставит на паузу');
  ok(await p.evaluate(() => window.Sound.blocked) > 0, 'звук выключен на паузе');
  await p.evaluate(() => bridge.__emit('p', false));
  ok(await p.evaluate(() => window.Sound.blocked) === 0, 'звук восстановлен');
  await p.click('#btn-resume');
  await p.evaluate(() => { window.__game.save.hints = 0; }); await p.click('#btn-hint'); await p.waitForTimeout(500);
  ok(await p.isVisible('.mark-hint'), 'подсказка после rewarded только в состоянии rewarded');
  const t = await p.evaluate(() => document.body.innerText);
  ok(!/VK|ВКонтакте|Одноклассники/i.test(t), 'в тексте нет упоминаний VK/OK');
  ok(errs.length === 0, 'ошибок нет ' + JSON.stringify(errs));
  await p.reload(); await p.waitForSelector('#scr-menu.active');
  ok(await p.evaluate(() => window.__game.save.unlocked) >= 2, 'прогресс восстановлен из storage после перезагрузки');
  await b.close();
})();
