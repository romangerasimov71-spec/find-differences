// Звук на телефоне (эмуляция Pixel 7 и iPhone 13, касания): эффекты и музыка из файлов, бесшовная петля,
// музыка продолжает играть после рекламы, сворачивания, повторных событий платформы и остановки звука браузером.
// Сервер: (cd src && python3 -m http.server 8123 &)
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8123/index.html';

async function run(b, device, forceMp3) {
  const label = device + (forceMp3 ? ' / mp3' : ' / ogg');
  const ctx = await b.newContext({ ...devices[device] });
  const p = await ctx.newPage();
  await p.addInitScript((forceMp3) => {
    if (forceMp3) { // как Safari: ogg не поддерживается
      const c = HTMLMediaElement.prototype.canPlayType;
      HTMLMediaElement.prototype.canPlayType = function (t) { return /ogg/.test(t) ? '' : c.call(this, t); };
    }
    // анализатор на выходе: всё, что подключается к destination, идёт через него
    const conn = AudioNode.prototype.connect;
    window.__ctxs = []; window.__starts = [];
    AudioNode.prototype.connect = function (d, ...a) {
      if (d instanceof AudioDestinationNode) {
        const c = this.context;
        if (!c.__an) { c.__an = c.createAnalyser(); c.__an.fftSize = 2048; conn.call(c.__an, d); window.__ctxs.push(c); }
        return conn.call(this, c.__an, ...a);
      }
      return conn.call(this, d, ...a);
    };
    const st = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (w, off) {
      window.__starts.push({ dur: this.buffer.duration, loop: this.loop, a: this.loopStart, b: this.loopEnd, off: off || 0 });
      return st.apply(this, arguments);
    };
    window.__level = () => { const c = window.__ctxs[0]; if (!c) return 0; const d = new Float32Array(2048); c.__an.getFloatTimeDomainData(d); let s = 0; for (const v of d) s += v * v; return Math.sqrt(s / d.length); };
    // подставной VK Bridge: реклама длится 1,5 с
    const subs = [];
    const mock = {
      send(m, d) {
        if (m === 'VKWebAppStorageGet') return Promise.resolve({ keys: d.keys.map(k => ({ key: k, value: '' })) });
        if (m === 'VKWebAppShowNativeAds') return new Promise(r => setTimeout(() => r({ result: true }), 1500));
        return Promise.resolve({ result: true });
      },
      subscribe(f) { subs.push(f); }, __emit(type) { subs.forEach(f => f({ detail: { type, data: {} } })); }
    };
    Object.defineProperty(window, 'vkBridge', { get: () => mock, set: () => {}, configurable: true });
  }, forceMp3);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + label + ': ' + m); if (!c) process.exitCode = 1; };
  const S = () => p.evaluate(() => window.Sound.state);
  const level = async () => { let m = 0; for (let i = 0; i < 6; i++) { m = Math.max(m, await p.evaluate(() => window.__level())); await p.waitForTimeout(80); } return m; };
  const playing = async (why) => {
    const s = await S(), l = await level();
    ok(s.ctx === 'running' && s.music && l > 0.003, 'музыка играет ' + why + ' (ctx=' + s.ctx + ', уровень ' + l.toFixed(4) + ')');
  };
  const setHidden = (h) => p.evaluate(h => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, h);

  await p.goto(BASE + '?vk_app_id=1&vk_platform=mobile_android');
  await p.waitForSelector('#scr-menu.active');
  ok(await p.evaluate(() => window.Sound.ext) === (forceMp3 ? 'mp3' : 'ogg'), 'формат ' + (forceMp3 ? 'mp3' : 'ogg'));
  await p.waitForTimeout(800);
  // первое касание разблокирует звук (подарок дня или пустое место меню)
  if (await p.isVisible('#modal-gift.show')) { await p.tap('#btn-gift-take'); await p.waitForTimeout(400); }
  else await p.tap('#scr-menu', { position: { x: 20, y: 120 } });
  await p.waitForTimeout(3500);
  const music = (await p.evaluate(() => window.__starts)).find(x => x.loop);
  ok(music && Math.abs(music.dur - 80) < 0.1, 'музыка загружена, ' + (music && music.dur.toFixed(3)) + ' с');
  ok(music && Math.abs(music.b - music.a - 80) < 0.002 && music.a < 0.06, 'петля ровно 80 с: [' + (music && music.a.toFixed(4)) + ', ' + (music && music.b.toFixed(4)) + ']');
  await playing('после первого касания');

  // эффекты: все шесть загружаются и звучат
  const sfx = await p.evaluate(async () => {
    const out = {};
    for (const n of ['click', 'found', 'miss', 'win', 'star', 'gift']) {
      const k = window.__starts.length; window.Sound.play(n);
      await new Promise(r => setTimeout(r, 60));
      out[n] = window.__starts.length > k ? +window.__starts[k].dur.toFixed(2) : 0;
    }
    return out;
  });
  ok(Object.values(sfx).every(d => d > 0), 'эффекты звучат: ' + JSON.stringify(sfx));

  // реклама за вознаграждение: тишина во время, музыка продолжает после (тот же источник, не с начала)
  const starts0 = (await p.evaluate(() => window.__starts)).filter(x => x.loop).length;
  const adP = p.evaluate(() => window.Platform.showRewarded());
  await p.waitForTimeout(700);
  let s = await S();
  ok(s.ctx === 'suspended', 'во время рекламы тихо: контекст остановлен (ctx=' + s.ctx + ', причины: ' + s.reasons.join(',') + ')');
  await adP; await p.waitForTimeout(1500);
  await playing('после рекламы за вознаграждение');
  // межстраничная
  await p.evaluate(() => window.Platform.showInterstitial()); await p.waitForTimeout(1500);
  await playing('после межстраничной рекламы');
  ok((await p.evaluate(() => window.__starts)).filter(x => x.loop).length === starts0, 'после рекламы музыка продолжается с того же места');

  // сворачивание: VK ViewHide + visibilitychange (два события на одно сворачивание), повторные события
  await p.evaluate(() => { vkBridge.__emit('VKWebAppViewHide'); vkBridge.__emit('VKWebAppViewHide'); }); await setHidden(true);
  await p.waitForTimeout(300);
  ok((await S()).ctx === 'suspended', 'свёрнуто — тихо, причины: ' + (await S()).reasons.join(','));
  await setHidden(false); await p.evaluate(() => vkBridge.__emit('VKWebAppViewRestore'));
  await p.waitForTimeout(1500);
  await playing('после возврата из свёрнутого состояния');
  // реклама, во время которой свернули и вернули приложение
  const adQ = p.evaluate(() => window.Platform.showRewarded());
  await p.waitForTimeout(300); await setHidden(true); await p.waitForTimeout(300); await setHidden(false);
  await p.waitForTimeout(200);
  ok((await S()).ctx === 'suspended', 'вернулись во время рекламы — ещё тихо');
  await adQ; await p.waitForTimeout(1500);
  await playing('после рекламы со сворачиванием');

  // браузер сам остановил звук (iOS после рекламы/звонка): сторож поднимает
  await p.evaluate(() => window.__ctxs[0].suspend()); await p.waitForTimeout(400);
  ok((await S()).ctx === 'suspended', 'звук остановлен «браузером»');
  await p.waitForTimeout(2000);
  await playing('после остановки браузером (сторож, без касания)');
  await p.evaluate(() => window.__ctxs[0].suspend()); await p.waitForTimeout(200);
  await p.tap('#scr-menu', { position: { x: 20, y: 120 } }); await p.waitForTimeout(1300);
  await playing('после остановки браузером (касание)');

  // выключить/включить музыку: продолжает с того же места
  await p.evaluate(() => window.Sound.setMusic(false)); await p.waitForTimeout(300);
  ok(!(await S()).music, 'музыка выключается');
  await p.evaluate(() => window.Sound.setMusic(true)); await p.waitForTimeout(1300);
  const last = (await p.evaluate(() => window.__starts)).filter(x => x.loop).pop();
  ok(last.off > last.a + 5, 'после включения — с того же места (смещение ' + last.off.toFixed(1) + ' с)');
  await playing('после включения музыки');

  // игровой экран на телефоне: тап по отличию — эффект «found»
  await p.evaluate(() => window.__game.start(1)); await p.waitForTimeout(500);
  const box = (await p.evaluate(() => window.__game.state.lv.diffs[0].box));
  const bx = await p.locator('#pic-b svg').boundingBox();
  const k = await p.evaluate(() => window.__starts.length);
  await p.tap('#pic-b svg', { position: { x: (box.x0 + box.x1) / 2 * bx.width / 400, y: (box.y0 + box.y1) / 2 * bx.height / 340 } });
  await p.waitForTimeout(150);
  const after = await p.evaluate(k => window.__starts.slice(k).map(x => +x.dur.toFixed(2)), k);
  ok(after.includes(+sfx.found), 'тап по отличию на телефоне — звук находки');
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT + '/' + device.replace(/\W+/g, '_') + (forceMp3 ? '_mp3' : '') + '.png' });
  await playing('во время игры');
  ok(errs.length === 0, 'ошибок на странице нет ' + JSON.stringify(errs));
  await ctx.close();
}

(async () => {
  const b = await chromium.launch();
  await run(b, 'Pixel 7', false);
  await run(b, 'iPhone 13', true);
  await b.close();
})();
