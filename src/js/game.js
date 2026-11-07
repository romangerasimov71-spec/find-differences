/* Основная логика игры: экраны, уровни, тапы, подсказки, сохранения, реклама. */
(function () {
  'use strict';
  var A = window.ART, L = window.LEVELS, P = window.Platform, S = window.Sound;
  var OUT = A.OUT;
  var $ = function (id) { return document.getElementById(id); };

  var INTERSTITIAL_GAP = 180000;  // не чаще раза в 3 минуты
  var FIRST_AD_LEVEL = 3;         // межстраничная — не раньше перехода с 3-го уровня
  var START_HINTS = 3;

  /* ---------- Сохранение ---------- */
  var save = { v: 1, unlocked: 1, stars: {}, hints: START_HINTS, sfx: true, music: true, last: 1 };
  function score(s) { if (!s) return -1; var t = 0; for (var k in s.stars) t += s.stars[k]; return (s.unlocked || 0) * 10 + t; }
  function sanitize(s) {
    var out = { v: 1, unlocked: 1, stars: {}, hints: START_HINTS, sfx: true, music: true, last: 1 };
    if (!s || typeof s !== 'object') return out;
    out.unlocked = Math.max(1, Math.min(L.COUNT, s.unlocked | 0 || 1));
    if (s.stars && typeof s.stars === 'object') for (var k in s.stars) { var v = s.stars[k] | 0; if (v > 0 && v <= 3) out.stars[k] = v; }
    out.hints = typeof s.hints === 'number' ? Math.max(0, Math.min(99, s.hints | 0)) : START_HINTS;
    out.sfx = s.sfx !== false; out.music = s.music !== false;
    out.last = Math.max(1, Math.min(out.unlocked, s.last | 0 || out.unlocked));
    return out;
  }
  function persist() { P.save(save); }

  /* ---------- Экраны ---------- */
  var current = 'scr-loading';
  function show(id) {
    if (current === id) return;
    $(current).classList.remove('active');
    $(id).classList.add('active');
    current = id;
    if (id === 'scr-game') layout();
  }
  function modal(id, on) { $(id).classList.toggle('show', !!on); }
  function anyModal() { return document.querySelector('.modal.show'); }

  var toastTimer;
  function toast(text) {
    var t = $('toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- Снег на фоне ---------- */
  var snow = (function () {
    var cv = $('snow'), cx = cv.getContext('2d'), flakes = [], running = true, w = 0, h = 0, dpr = 1;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, w * h / 9000));
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.6, v: 12 + Math.random() * 26, p: Math.random() * 6 });
    }
    var last = 0;
    function frame(t) {
      if (!running) return;
      var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      cx.clearRect(0, 0, w, h);
      cx.fillStyle = 'rgba(255,255,255,0.8)';
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.v * dt; f.p += dt; f.x += Math.sin(f.p) * 8 * dt;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fill();
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', resize);
    resize(); requestAnimationFrame(frame);
    return {
      stop: function () { running = false; },
      start: function () { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
    };
  })();

  /* ---------- Мелкие SVG ---------- */
  function starSvg(on) {
    return '<svg viewBox="-50 -50 100 100"><polygon points="' + A.starPts(0, 4, 44, 20) + '" fill="' + (on ? A.PAL.gold : '#c9cfe6') + '" stroke="' + OUT + '" stroke-width="7" stroke-linejoin="round"/>' +
      (on ? '<path d="M-6,-28 L-12,-8 L-30,-6 L-14,-2 Z" fill="rgba(255,255,255,.55)"/>' : '') + '</svg>';
  }
  var lockSvg = '<svg class="lock" viewBox="0 0 32 32"><path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" stroke="' + OUT + '" stroke-width="3.5"/><rect x="6" y="14" width="20" height="14" rx="4" fill="#ffc233" stroke="' + OUT + '" stroke-width="3"/></svg>';

  function menuArt() {
    var it = function (type, x, y, s, extra) {
      var sp = A.ITEMS[type], d = {};
      sp.details.forEach(function (k) { d[k] = true; });
      var o = { type: type, x: x, y: y, s: s, d: d };
      if (extra) for (var k in extra) o[k] = extra[k];
      return A.render(o);
    };
    var hill = '<ellipse cx="200" cy="318" rx="186" ry="34" fill="rgba(8,16,48,0.35)"/>' +
      '<path d="M18,306 Q30,270 110,266 Q200,252 290,266 Q370,270 382,306 Q382,334 200,338 Q18,334 18,306 Z" fill="#f2f7ff" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M60,300 Q120,292 160,300 M250,306 Q300,298 340,304" fill="none" stroke="#b9c9ee" stroke-width="3" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 400 360" preserveAspectRatio="xMidYMid meet">' +
      '<circle cx="200" cy="190" r="150" fill="rgba(255,214,90,0.10)"/><circle cx="200" cy="190" r="110" fill="rgba(255,214,90,0.10)"/>' +
      hill +
      it('tree', 200, 176, 1.85) +
      it('snowman', 78, 262, 0.84) + it('bunny', 326, 282, 0.62, { flip: true }) +
      it('gift', 148, 300, 0.66) + it('giftround', 252, 298, 0.66) + it('gift', 198, 314, 0.52, { c: A.PAL.blue, c2: '#fff' }) +
      it('bullfinch', 330, 216, 0.5, { flip: true }) + it('flake', 46, 120, 0.42) + it('flake', 360, 80, 0.34) +
      '</svg>';
  }

  /* ---------- Меню и уровни ---------- */
  function totalStars() { var t = 0; for (var k in save.stars) t += save.stars[k]; return t; }
  function refreshMenu() {
    var n = Math.min(save.last, save.unlocked);
    $('btn-play').textContent = 'Играть';
    $('menu-sub').textContent = 'Уровень ' + n + ' из ' + L.COUNT;
    updateToggles();
  }
  function buildLevelGrid() {
    var html = '';
    for (var i = 1; i <= L.COUNT; i++) {
      var locked = i > save.unlocked, st = save.stars[i] || 0;
      html += '<button class="lvl' + (locked ? ' locked' : '') + (i === save.unlocked && !st ? ' current' : '') + '" data-l="' + i + '">' +
        (locked ? '<span>' + i + '</span>' + lockSvg : '<span>' + i + '</span><span class="s">' + starSvg(st > 0) + starSvg(st > 1) + starSvg(st > 2) + '</span>') + '</button>';
    }
    $('levels-grid').innerHTML = html;
    $('total-stars').textContent = '★ ' + totalStars();
  }
  function updateToggles() {
    ['btn-sound', 'btn-sound2'].forEach(function (id) { $(id).classList.toggle('off', !save.sfx); });
    ['btn-music', 'btn-music2'].forEach(function (id) { $(id).classList.toggle('off', !save.music); });
  }

  /* ---------- Игра ---------- */
  var G = null; // текущий уровень
  var lastAdAt = Date.now();

  function startLevel(n) {
    var lv = L.build(n);
    G = { lv: lv, found: {}, foundCount: 0, mistakes: 0, hintsUsed: 0, boxes: [], done: false, t0: Date.now() };
    save.last = n; persist();
    $('game-title').textContent = 'Уровень ' + n;
    var picA = $('pic-a').querySelector('svg'), picB = $('pic-b').querySelector('svg');
    picA.innerHTML = sideSvg(lv.scene, lv.left);
    picB.innerHTML = sideSvg(lv.scene, lv.right);
    var dots = '';
    for (var i = 0; i < lv.diffs.length; i++) dots += '<i></i>';
    $('found').innerHTML = dots;
    updateHintBadge();
    show('scr-game');
    // зоны попадания — по реальной рамке предмета на той картинке, где он нарисован
    G.boxes = lv.diffs.map(function (d) {
      var el = picA.querySelector('[data-i="' + d.idx + '"]') || picB.querySelector('[data-i="' + d.idx + '"]');
      var bb = null;
      try { bb = el.getBBox(); } catch (e) {}
      if (!bb || !bb.width) bb = { x: d.x - d.r, y: d.y - d.r, width: d.r * 2, height: d.r * 2 };
      var elB = picB.querySelector('[data-i="' + d.idx + '"]');
      if (elB && elB !== el) { try { var b2 = elB.getBBox(); if (b2.width) bb = union(bb, b2); } catch (e) {} }
      return { cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, w: bb.width, h: bb.height };
    });
  }
  function union(a, b) {
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x: x, y: y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
  }
  function sideSvg(scene, items) {
    // фон + предметы, каждый в своей группе (для getBBox) + слой отметок
    var body = '';
    items.forEach(function (q, i) { if (!q.removed) body += '<g data-i="' + i + '">' + A.render(q) + '</g>'; });
    return '<g class="bg">' + bgOf(scene) + '</g>' + body + '<g class="marks"></g>';
  }
  function bgOf(scene) { return L.renderSide(scene, []); }

  function layout() {
    var board = $('board');
    var W = board.clientWidth, H = board.clientHeight, ratio = L.W / L.H, gap = 12, border = 8;
    if (!W || !H) return;
    var wStack = Math.min(W - 4, ((H - gap) / 2 - border) * ratio + border);
    var wSide = Math.min((W - gap) / 2 - 2, (H - border) * ratio + border);
    var wide = wSide > wStack * 1.05;
    var w = Math.floor(wide ? wSide : wStack);
    var h = Math.floor((w - border) / ratio + border);
    board.classList.toggle('wide', wide);
    ['pic-a', 'pic-b'].forEach(function (id) { var el = $(id); el.style.width = w + 'px'; el.style.height = h + 'px'; });
  }
  window.addEventListener('resize', function () { if (current === 'scr-game') layout(); });

  function toScene(svg, ev) {
    var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    var m = svg.getScreenCTM();
    if (!m) return null;
    return pt.matrixTransform(m.inverse());
  }

  function hitTest(x, y) {
    var best = -1, bestD = 1e9;
    G.boxes.forEach(function (b, i) {
      if (G.found[i]) return;
      var hw = Math.max(b.w / 2 + 10, 24), hh = Math.max(b.h / 2 + 10, 24); // минимум ~ 48×48 единиц
      var dx = Math.abs(x - b.cx), dy = Math.abs(y - b.cy);
      if (dx <= hw && dy <= hh) {
        var d = dx / hw + dy / hh;
        if (d < bestD) { bestD = d; best = i; }
      }
    });
    return best;
  }

  function ringFor(b, cls, color) {
    var rx = Math.max(22, Math.min(b.w / 2 + 8, 90)), ry = Math.max(22, Math.min(b.h / 2 + 8, 90));
    return '<g class="' + cls + '"><ellipse cx="' + b.cx + '" cy="' + b.cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + OUT + '" stroke-width="9"/>' +
      '<ellipse cx="' + b.cx + '" cy="' + b.cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + color + '" stroke-width="4.5"/></g>';
  }

  function onTap(ev) {
    if (!G || G.done || anyModal()) return;
    S.unlock();
    var svg = ev.currentTarget;
    var p = toScene(svg, ev);
    if (!p) return;
    var i = hitTest(p.x, p.y);
    if (i >= 0) {
      G.found[i] = true; G.foundCount++;
      document.querySelectorAll('.pic .marks .mark-hint').forEach(function (m) { m.remove(); });
      ['pic-a', 'pic-b'].forEach(function (id) {
        $(id).querySelector('.marks').insertAdjacentHTML('beforeend', ringFor(G.boxes[i], 'mark-found', A.PAL.gold));
      });
      var dots = $('found').children; dots[G.foundCount - 1].classList.add('on');
      S.play('found'); P.haptic('success');
      if (G.foundCount === G.lv.diffs.length) { G.done = true; setTimeout(win, 650); }
    } else {
      G.mistakes++;
      var x = p.x, y = p.y;
      var cross = '<g class="mark-miss"><path d="M' + (x - 12) + ',' + (y - 12) + ' L' + (x + 12) + ',' + (y + 12) + ' M' + (x + 12) + ',' + (y - 12) + ' L' + (x - 12) + ',' + (y + 12) + '" stroke="' + OUT + '" stroke-width="11" stroke-linecap="round"/>' +
        '<path d="M' + (x - 12) + ',' + (y - 12) + ' L' + (x + 12) + ',' + (y + 12) + ' M' + (x + 12) + ',' + (y - 12) + ' L' + (x - 12) + ',' + (y + 12) + '" stroke="' + A.PAL.red + '" stroke-width="6" stroke-linecap="round"/></g>';
      var marks = svg.querySelector('.marks');
      marks.insertAdjacentHTML('beforeend', cross);
      var node = marks.lastChild;
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 950);
      var pic = svg.parentNode; pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
      S.play('miss'); P.haptic('error');
    }
  }

  function updateHintBadge() {
    var b = $('hint-count');
    if (save.hints > 0) { b.textContent = save.hints; b.classList.remove('ad'); }
    else { b.textContent = '+'; b.classList.add('ad'); }
  }

  function useHint() {
    if (!G || G.done || anyModal()) return;
    S.unlock();
    if (save.hints <= 0) { modal('modal-hint', true); S.play('click'); return; }
    var left = [];
    G.boxes.forEach(function (b, i) { if (!G.found[i]) left.push(i); });
    if (!left.length) return;
    var i = left[Math.floor(Math.random() * left.length)];
    save.hints--; G.hintsUsed++; persist(); updateHintBadge();
    document.querySelectorAll('.pic .marks .mark-hint').forEach(function (m) { m.remove(); });
    ['pic-a', 'pic-b'].forEach(function (id) {
      $(id).querySelector('.marks').insertAdjacentHTML('beforeend', ringFor(G.boxes[i], 'mark-hint', '#ffffff'));
    });
    setTimeout(function () { document.querySelectorAll('.pic .marks .mark-hint').forEach(function (m) { m.remove(); }); }, 3200);
    S.play('hint');
  }

  function starsFor(mistakes) { return mistakes <= 2 ? 3 : mistakes <= 5 ? 2 : 1; }

  function win() {
    var n = G.lv.num, st = starsFor(G.mistakes);
    var first = !save.stars[n];
    save.stars[n] = Math.max(save.stars[n] || 0, st);
    if (n >= save.unlocked && n < L.COUNT) save.unlocked = n + 1;
    if (first) save.hints = Math.min(99, save.hints + 1);
    save.last = Math.min(n + 1, save.unlocked);
    persist(); updateHintBadge();

    $('win-stars').innerHTML = starSvg(st > 0) + starSvg(st > 1) + starSvg(st > 2);
    var svgs = $('win-stars').children;
    for (var i = 0; i < 3; i++) if (i < st) svgs[i].classList.add('on');
    var txt = st === 3 ? 'Все отличия найдены — и почти без ошибок!' : st === 2 ? 'Все отличия найдены! Ошибок: ' + G.mistakes + '.' : 'Готово! В следующий раз — меньше лишних касаний.';
    if (first) txt += '<br>+1 подсказка в подарок';
    if (n === L.COUNT) txt = 'Вы прошли все уровни! С Новым годом!' + (first ? '<br>+1 подсказка в подарок' : '');
    $('win-text').innerHTML = txt;
    $('btn-next').textContent = n < L.COUNT ? 'Дальше' : 'К уровням';
    modal('modal-win', true);
    S.play('win'); P.haptic('success');
    for (var k = 0; k < st; k++) (function (k) { setTimeout(function () { S.play('star'); }, 300 + k * 250); })(k);
  }

  function canInterstitial(fromLevel) {
    return P.canShowAds() && fromLevel >= FIRST_AD_LEVEL && Date.now() - lastAdAt >= INTERSTITIAL_GAP;
  }

  function next() {
    modal('modal-win', false);
    var n = G.lv.num;
    if (n >= L.COUNT) { buildLevelGrid(); show('scr-levels'); return; }
    var go = function () { startLevel(n + 1); };
    if (canInterstitial(n)) {
      lastAdAt = Date.now();
      P.showInterstitial().then(go);
    } else go();
  }

  /* ---------- Пауза и сворачивание ---------- */
  function pause() { if (current === 'scr-game' && !anyModal()) modal('modal-pause', true); }

  P.onHide(function () { S.suspend(); snow.stop(); pause(); });
  P.onShow(function () { snow.start(); if (!adActive) S.restore(); });
  var adActive = false;
  P.onAdStart(function () { adActive = true; S.suspend(); });
  P.onAdEnd(function () { adActive = false; if (!P.isHidden()) S.restore(); });

  /* ---------- Кнопки ---------- */
  function tap(id, fn) {
    $(id).addEventListener('click', function (e) { S.unlock(); S.play('click'); fn(e); });
  }
  tap('btn-play', function () { startLevel(Math.min(save.last, save.unlocked)); });
  tap('btn-levels', function () { buildLevelGrid(); show('scr-levels'); });
  tap('btn-levels-back', function () { refreshMenu(); show('scr-menu'); });
  $('levels-grid').addEventListener('click', function (e) {
    var b = e.target.closest('.lvl'); if (!b) return;
    S.unlock();
    var n = +b.getAttribute('data-l');
    if (n > save.unlocked) { S.play('miss'); toast('Сначала пройдите уровень ' + save.unlocked); return; }
    S.play('click'); startLevel(n);
  });
  tap('btn-pause', function () { modal('modal-pause', true); });
  tap('btn-resume', function () { modal('modal-pause', false); });
  tap('btn-restart', function () { modal('modal-pause', false); startLevel(G.lv.num); });
  tap('btn-pause-menu', function () { modal('modal-pause', false); refreshMenu(); show('scr-menu'); });
  tap('btn-next', next);
  tap('btn-win-menu', function () { modal('modal-win', false); refreshMenu(); show('scr-menu'); });
  $('btn-hint').addEventListener('click', useHint);
  tap('btn-hint-close', function () { modal('modal-hint', false); });
  tap('btn-hint-ad', function () {
    var btn = $('btn-hint-ad'); btn.disabled = true;
    if (!P.canShowAds()) { // вне VK рекламы нет — даём подсказки, чтобы не блокировать игру
      btn.disabled = false; save.hints += 3; persist(); updateHintBadge(); modal('modal-hint', false); toast('+3 подсказки'); return;
    }
    P.showRewarded().then(function (ok) {
      btn.disabled = false;
      if (ok) { save.hints += 3; persist(); updateHintBadge(); modal('modal-hint', false); toast('+3 подсказки'); S.play('hint'); }
      else toast('Реклама сейчас недоступна. Попробуйте чуть позже');
    });
  });
  function toggleSfx() { save.sfx = !save.sfx; S.setSfx(save.sfx); updateToggles(); persist(); }
  function toggleMusic() { save.music = !save.music; S.setMusic(save.music); updateToggles(); persist(); }
  tap('btn-sound', toggleSfx); tap('btn-sound2', toggleSfx);
  tap('btn-music', toggleMusic); tap('btn-music2', toggleMusic);

  ['pic-a', 'pic-b'].forEach(function (id) { $(id).querySelector('svg').addEventListener('pointerdown', onTap); });
  document.addEventListener('pointerdown', function () { S.unlock(); }, { once: true });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  /* ---------- Запуск ---------- */
  $('menu-art').innerHTML = menuArt();
  $('hint-art').innerHTML = '<svg viewBox="-50 -50 100 100">' + A.render({ type: 'lantern', x: 0, y: 4, s: 0.95, d: { light: true } }) + '</svg>';

  P.ready.then(function () { return P.load(); }).then(function (r) {
    var a = r && r.local, b = r && r.cloud;
    var best = score(b) > score(a) ? b : a;
    save = sanitize(best);
    S.setSfx(save.sfx); S.setMusic(save.music);
    refreshMenu();
    show('scr-menu');
  });

  window.__game = { start: startLevel, get state() { return G; }, get save() { return save; } }; // для автотестов
})();
