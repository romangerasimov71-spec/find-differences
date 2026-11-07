/* Основная логика: экраны, карта уровней, игровой процесс, зум, подсказки, подарки, реклама, рост. */
(function () {
  'use strict';
  var A = window.ART, L = window.LEVELS, P = window.Platform, S = window.Sound, T = window.I18N.t;
  var OUT = A.OUT, PAL = A.PAL;
  var $ = function (id) { return document.getElementById(id); };

  var CFG = {
    hearts: 3, startHints: 3,
    interGap: 150000,      // межстраничная — не чаще раза в 2,5 минуты (VK/OK)
    interFromLevel: 3,     // и не на первых трёх уровнях
    gift: [1, 1, 2, 2, 3, 3, 5],
    favAfterWins: 3, zoomFrom: 21, tutorialTo: 3, tapGuard: 350
  };

  /* ---------- Иконки (нарисованные SVG, не эмодзи) ---------- */
  var SW = ' stroke="' + OUT + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  var ICON = {
    sound: '<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#ffc233"' + SW + '/><path d="M21 11q4 5 0 10M24 8q7 8 0 16" fill="none"' + SW + '/></svg>',
    soundOff: '<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#ffc233"' + SW + '/><path d="M21 12l7 8M28 12l-7 8" fill="none" stroke="#e8423f" stroke-width="3" stroke-linecap="round"/></svg>',
    music: '<svg viewBox="0 0 32 32"><path d="M12 22V8l13-3v14" fill="none"' + SW + '/><ellipse cx="9" cy="23" rx="4.5" ry="3.6" fill="#e8423f"' + SW + '/><ellipse cx="22" cy="20" rx="4.5" ry="3.6" fill="#e8423f"' + SW + '/></svg>',
    musicOff: '<svg viewBox="0 0 32 32"><path d="M12 22V8l13-3v14" fill="none"' + SW + '/><ellipse cx="9" cy="23" rx="4.5" ry="3.6" fill="#e8423f"' + SW + '/><ellipse cx="22" cy="20" rx="4.5" ry="3.6" fill="#e8423f"' + SW + '/><path d="M5 5l22 22" stroke="#e8423f" stroke-width="3" stroke-linecap="round"/></svg>',
    pause: '<svg viewBox="0 0 32 32"><rect x="8" y="7" width="6" height="18" rx="2" fill="' + OUT + '"/><rect x="18" y="7" width="6" height="18" rx="2" fill="' + OUT + '"/></svg>',
    back: '<svg viewBox="0 0 32 32"><path d="M20 6L10 16l10 10" fill="none" stroke="' + OUT + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gift: '<svg viewBox="0 0 32 32"><rect x="6" y="13" width="20" height="14" rx="2" fill="#e8423f"' + SW + '/><rect x="4" y="9" width="24" height="6" rx="2" fill="#ff6b62"' + SW + '/><path d="M16 9v18" stroke="#ffc233" stroke-width="4"/><path d="M16 9c-3-6-9-4-6-1M16 9c3-6 9-4 6-1" fill="none"' + SW + '/></svg>',
    friends: '<svg viewBox="0 0 32 32"><circle cx="11" cy="11" r="5" fill="#ffd6b0"' + SW + '/><circle cx="22" cy="12" r="4.4" fill="#ffd6b0"' + SW + '/><path d="M3 27c0-6 4-9 8-9s8 3 8 9z" fill="#3d7bff"' + SW + '/><path d="M17 20c1.5-1.5 3-2 5-2 3.5 0 7 3 7 8h-9" fill="#2fa84f"' + SW + '/></svg>',
    zoomout: '<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="8" fill="#fff"' + SW + '/><path d="M20 20l7 7M10 14h8" fill="none"' + SW + '/></svg>',
    bulb: '<svg viewBox="0 0 32 32"><path d="M16 3a9 9 0 0 0-5.5 16.1c1 .8 1.5 1.8 1.5 2.9h8c0-1.1.5-2.1 1.5-2.9A9 9 0 0 0 16 3z" fill="#fff7c2"' + SW + '/><path d="M12.5 25h7M13.5 28.5h5" fill="none"' + SW + '/><path d="M12 11q1-3 4-4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    ad: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="20" rx="5" fill="#e8423f"' + SW + '/><path d="M13 11v10l9-5z" fill="#fff"' + SW + '/></svg>',
    lock: '<svg viewBox="0 0 32 32"><path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" stroke="' + OUT + '" stroke-width="3.5"/><rect x="6" y="14" width="20" height="14" rx="4" fill="#ffc233"' + SW + '/></svg>',
    finger: '<svg viewBox="0 0 64 64"><path d="M22 30V10a5 5 0 0 1 10 0v16l3-1a5 5 0 0 1 6 3l1 0a5 5 0 0 1 6 3l1 0a5 5 0 0 1 6 4v8c0 10-7 17-17 17h-4c-6 0-10-3-13-8l-8-12a5 5 0 0 1 8-6z" fill="#fff"' + SW.replace('2.6', '3.5') + '/><path d="M35 26v8M42 30v6M49 34v5" fill="none"' + SW + '/></svg>'
  };
  function starSvg(on, big) {
    return '<svg viewBox="-50 -50 100 100"><polygon points="' + A.starPts(0, 4, 44, 20) + '" fill="' + (on ? PAL.gold : '#c9cfe6') + '" stroke="' + OUT + '" stroke-width="7" stroke-linejoin="round"/>' +
      (on ? '<path d="M-6,-28 L-12,-8 L-30,-6 L-14,-2 Z" fill="rgba(255,255,255,.55)"/>' : '') + '</svg>';
  }
  function heartSvg(on) {
    return '<svg viewBox="0 0 32 32"><path d="M16 28S3 20 3 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 3.5C29 20 16 28 16 28z" fill="' + (on ? '#e8423f' : '#c9cfe6') + '"' + SW + '/>' +
      (on ? '<path d="M8 10q2-3 5-2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' : '') + '</svg>';
  }
  function setIcon(el, svg) { var keep = el.querySelector('.dot'); el.innerHTML = svg; if (keep) el.appendChild(keep); }

  /* ---------- Сохранение ---------- */
  var save;
  function defaults() { return { v: 2, unlocked: 1, stars: {}, hints: CFG.startHints, sfx: true, music: true, vm: 0.7, vs: 0.9, last: 1, wins: 0, gift: { day: -1, date: '' }, inv: '', fav: 0, tipZoom: 0 }; }
  function vol(v, d) { return typeof v === 'number' && v >= 0 && v <= 1 ? Math.round(v * 100) / 100 : d; }
  function sanitize(s) {
    var o = defaults();
    if (!s || typeof s !== 'object') return o;
    o.unlocked = Math.max(1, Math.min(L.COUNT, s.unlocked | 0 || 1));
    if (s.stars) for (var k in s.stars) { var v = s.stars[k] | 0; if (v >= 1 && v <= 3 && +k >= 1 && +k <= L.COUNT) o.stars[k] = v; }
    o.hints = typeof s.hints === 'number' ? Math.max(0, Math.min(999, s.hints | 0)) : CFG.startHints;
    o.sfx = s.sfx !== false; o.music = s.music !== false;
    o.vm = vol(s.vm, o.vm); o.vs = vol(s.vs, o.vs);
    o.last = Math.max(1, Math.min(o.unlocked, s.last | 0 || o.unlocked));
    o.wins = s.wins | 0;
    if (s.gift && typeof s.gift.date === 'string') o.gift = { day: s.gift.day | 0, date: s.gift.date };
    o.inv = typeof s.inv === 'string' ? s.inv : ''; o.fav = s.fav | 0; o.tipZoom = s.tipZoom | 0;
    return o;
  }
  function score(s) { if (!s) return -1; var t = 0; for (var k in s.stars) t += s.stars[k]; return (s.unlocked | 0) * 1000 + t; }
  function persist() { P.save(save); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function yesterday() { var d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ---------- Экраны ---------- */
  var current = 'scr-splash';
  function show(id) {
    if (current === id) return;
    $(current).classList.remove('active'); $(id).classList.add('active'); current = id;
    snow.setActive(id !== 'scr-game');
    if (id === 'scr-game') layout();
  }
  function modal(id, on) { $(id).classList.toggle('show', !!on); }
  function anyModal() { return document.querySelector('.modal.show'); }
  var toastT;
  function toast(text, ms) {
    var t = $('toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2300);
  }

  /* ---------- Снег ---------- */
  var snow = (function () {
    var cv = $('snow'), cx = cv.getContext('2d'), fl = [], on = true, vis = true, w = 0, h = 0, last = 0, raf = 0;
    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, w * h / 8000)); fl = [];
      for (var i = 0; i < n; i++) fl.push({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.8, v: 14 + Math.random() * 28, p: Math.random() * 6 });
    }
    function frame(t) {
      raf = 0;
      if (!on || !vis) { cx.clearRect(0, 0, w, h); return; }
      var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      cx.clearRect(0, 0, w, h); cx.fillStyle = 'rgba(255,255,255,0.85)';
      for (var i = 0; i < fl.length; i++) {
        var f = fl[i]; f.y += f.v * dt; f.p += dt; f.x += Math.sin(f.p) * 9 * dt;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && on && vis) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    window.addEventListener('resize', resize); resize(); kick();
    return { setActive: function (a) { on = a; if (a) kick(); else cx.clearRect(0, 0, w, h); }, setVisible: function (v) { vis = v; kick(); } };
  })();

  /* ---------- Конфетти ---------- */
  var confetti = (function () {
    var cv = $('confetti'), cx = cv.getContext('2d'), parts = [], raf = 0, w, h;
    var cols = [PAL.red, PAL.gold, PAL.green, PAL.blue, PAL.pink, '#fff'];
    function frame() {
      cx.clearRect(0, 0, w, h);
      parts.forEach(function (p) { p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life--; });
      parts = parts.filter(function (p) { return p.life > 0 && p.y < h + 20; });
      parts.forEach(function (p) {
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore();
      });
      raf = parts.length ? requestAnimationFrame(frame) : 0;
      if (!raf) cx.clearRect(0, 0, w, h);
    }
    return function () {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (var i = 0; i < 120; i++) {
        var side = i % 2 ? w * 0.15 : w * 0.85;
        parts.push({ x: side, y: h * 0.35, vx: (Math.random() - 0.5) * 12 + (i % 2 ? 3 : -3), vy: -8 - Math.random() * 9, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, s: 8 + Math.random() * 8, c: cols[i % cols.length], life: 150 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
  })();

  /* ---------- Декор: гирлянда, меню ---------- */
  function lightsSvg() { return '<svg viewBox="-100 -22 200 62">' + A.render({ type: 'lights', x: 0, y: 0, s: 1, d: { all: true }, c: PAL.red }) + '</svg>'; }
  function full(type, x, y, s, extra) {
    var sp = A.ITEMS[type], d = {}; sp.details.forEach(function (k) { d[k] = true; });
    var o = { type: type, x: x, y: y, s: s, d: d }; if (extra) for (var k in extra) o[k] = extra[k];
    return A.render(o);
  }
  function menuArt() {
    return '<svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid meet">' +
      '<circle cx="200" cy="170" r="150" fill="rgba(255,214,90,0.10)"/><circle cx="200" cy="170" r="105" fill="rgba(255,214,90,0.10)"/>' +
      '<ellipse cx="200" cy="304" rx="186" ry="30" fill="rgba(8,16,48,0.35)"/>' +
      '<path d="M16,292 Q30,256 110,252 Q200,238 290,252 Q370,256 384,292 Q384,320 200,324 Q16,320 16,292 Z" fill="#f2f7ff" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
      full('tree', 200, 162, 1.7) + full('santa', 76, 228, 0.82) + full('snowmaiden', 326, 230, 0.8) +
      full('gift', 146, 284, 0.6) + full('giftround', 256, 282, 0.6) + full('gift', 200, 300, 0.48, { c: PAL.blue, c2: '#fff' }) +
      full('hedgehog', 120, 300, 0.42) + full('bullfinch', 316, 112, 0.42, { flip: true }) + full('flake', 44, 96, 0.4) + full('flake', 360, 60, 0.32) +
      '</svg>';
  }

  /* ---------- Карта уровней ---------- */
  var MAP = { step: 96, top: 110, w: 400 };
  function nodePos(i) { return { x: 200 + 112 * Math.sin(i * 0.85), y: MAP.top + (i - 1) * MAP.step }; }
  function buildMap() {
    var H = MAP.top * 2 + (L.COUNT - 1) * MAP.step, pts = [], i;
    for (i = 1; i <= L.COUNT; i++) pts.push(nodePos(i));
    var d = 'M' + pts[0].x + ',' + (pts[0].y - 80);
    d += ' L' + pts[0].x + ',' + pts[0].y;
    for (i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], my = (p0.y + p1.y) / 2;
      d += ' C' + p0.x + ',' + my + ' ' + p1.x + ',' + my + ' ' + p1.x + ',' + p1.y;
    }
    d += ' L' + pts[pts.length - 1].x + ',' + (pts[pts.length - 1].y + 80);
    var deco = '', kinds = ['fir', 'snowman', 'gift', 'house', 'fir', 'deer', 'bunny', 'giftround', 'fir', 'hedgehog', 'lamppost', 'penguin', 'santa', 'fir', 'sled', 'snowmaiden', 'owl', 'sack'];
    for (i = 1; i <= L.COUNT; i += 2) {
      var p = nodePos(i), side = p.x > 200 ? -1 : 1, t = kinds[(i / 2 | 0) % kinds.length];
      var sz = t === 'house' || t === 'lamppost' || t === 'fir' ? 84 : 58, b = window.BOUNDS[t].b;
      var s = sz / Math.max(b[2] - b[0], b[3] - b[1]);
      var x = p.x + side * 120; x = Math.max(44, Math.min(356, x));
      deco += full(t, x - (b[0] + b[2]) / 2 * s, p.y + 30 - b[3] * s, s, { flip: side < 0 && A.ITEMS[t].flip });
    }
    var snowBg = '<rect x="0" y="0" width="400" height="' + H + '" fill="#e9f1ff"/>';
    var bumps = '';
    for (i = 0; i < L.COUNT * 2; i++) bumps += '<circle cx="' + ((i * 97) % 400) + '" cy="' + (40 + i * 48) + '" r="' + (6 + i % 5) + '" fill="#d6e3fb"/>';
    var path = '<path d="' + d + '" fill="none" stroke="' + OUT + '" stroke-width="40" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="32" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="none" stroke="#b9cdf5" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>';
    $('map').innerHTML = '<svg viewBox="0 0 400 ' + H + '" id="map-svg">' + snowBg + bumps + path + deco + '<g id="map-nodes"></g></svg>';
  }
  function renderNodes() {
    var html = '';
    for (var i = 1; i <= L.COUNT; i++) {
      var p = nodePos(i), locked = i > save.unlocked, st = save.stars[i] || 0, fest = L.isFestive(i), cur = i === save.unlocked && !st;
      var r = fest ? 33 : 28;
      var fill = locked ? '#8e9bc9' : cur ? PAL.gold : fest ? '#9d5cf0' : [PAL.red, PAL.blue, PAL.green][i % 3];
      var g = '<g class="lvl-node" data-l="' + i + '">';
      g += '<g' + (cur ? ' class="lvl-current"' : '') + '>';
      if (fest) g += '<polygon points="' + A.starPts(p.x, p.y + 2, r + 16, r + 4, 10) + '" fill="' + (locked ? '#b4bede' : PAL.gold) + '" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>';
      g += '<circle cx="' + p.x + '" cy="' + (p.y + 4) + '" r="' + r + '" fill="' + OUT + '"/>';
      g += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '" fill="' + fill + '" stroke="' + OUT + '" stroke-width="4"/>';
      g += '<ellipse cx="' + (p.x - r * 0.3) + '" cy="' + (p.y - r * 0.45) + '" rx="' + r * 0.45 + '" ry="' + r * 0.22 + '" fill="rgba(255,255,255,.35)"/>';
      if (locked) g += '<g transform="translate(' + (p.x - 14) + ',' + (p.y - 15) + ') scale(0.88)">' + ICON.lock.replace('<svg viewBox="0 0 32 32">', '').replace('</svg>', '') + '</g>';
      else g += '<text x="' + p.x + '" y="' + (p.y + 9) + '" text-anchor="middle" font-size="' + (i > 99 ? 22 : 26) + '" font-weight="900" fill="' + (cur ? OUT : '#fff') + '" stroke="' + (cur ? 'none' : OUT) + '" stroke-width="5" paint-order="stroke" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + i + '</text>';
      g += '</g>';
      if (st) for (var k = 0; k < 3; k++) g += '<polygon points="' + A.starPts(p.x + (k - 1) * 20, p.y + r + 10 - (k === 1 ? 4 : 0), 10, 4.4) + '" fill="' + (k < st ? PAL.gold : '#c9cfe6') + '" stroke="' + OUT + '" stroke-width="3" stroke-linejoin="round"/>';
      html += g + '</g>';
    }
    $('map-nodes').innerHTML = html;
    var t = 0; for (var k2 in save.stars) t += save.stars[k2];
    $('total-stars').textContent = t;
  }
  function openMap() {
    if (!$('map-svg')) buildMap();
    renderNodes(); show('scr-map');
    var sc = $('map-scroll'), svg = $('map-svg');
    var k = svg.clientWidth / MAP.w, p = nodePos(Math.min(save.unlocked, L.COUNT));
    sc.scrollTop = Math.max(0, p.y * k - sc.clientHeight / 2);
  }

  /* ---------- Меню ---------- */
  function refreshMenu() {
    $('play-sub').textContent = T('levelOf', { n: Math.min(save.last, save.unlocked), total: L.COUNT });
    $('gift-dot').classList.toggle('on', giftAvailable());
    $('btn-invite').hidden = !P.caps.invite;
    updateAudioUi();
  }

  /* ---------- Звук: громкость музыки и эффектов (кнопка «Звук» в меню, на карте, в игре; ползунки и в паузе) ---------- */
  var VOL = { music: { flag: 'music', v: 'vm', on: ICON.music, off: ICON.musicOff },
              sfx: { flag: 'sfx', v: 'vs', on: ICON.sound, off: ICON.soundOff } };
  document.querySelectorAll('[data-vol]').forEach(function (box) {
    box.innerHTML = ['music', 'sfx'].map(function (k) {
      return '<div class="vol-row" data-k="' + k + '"><button class="btn-round vol-ic" data-t-aria="' + k + '"></button>' +
        '<div class="vol-main"><div class="vol-head"><span data-t="' + k + '"></span><b class="vol-val"></b></div>' +
        '<input type="range" min="0" max="100" step="1" data-t-aria="' + k + '"></div></div>';
    }).join('');
  });
  function audible(k) { return save[VOL[k].flag] && save[VOL[k].v] > 0; }
  function applyAudio() {
    S.setVolume('music', save.vm); S.setVolume('sfx', save.vs);
    S.setMusic(save.music); S.setSfx(save.sfx);
  }
  function updateAudioUi(skip) {
    document.querySelectorAll('.vol-row').forEach(function (row) {
      var k = row.getAttribute('data-k'), c = VOL[k], on = audible(k), pct = Math.round(save[c.v] * 100);
      var ic = row.querySelector('.vol-ic'), r = row.querySelector('input');
      setIcon(ic, on ? c.on : c.off); ic.classList.toggle('off', !on); row.classList.toggle('off', !on);
      if (r !== skip) r.value = pct;
      r.style.setProperty('--p', pct + '%');
      row.querySelector('.vol-val').textContent = on ? pct + '%' : T('off');
    });
    var any = audible('music') || audible('sfx');
    ['btn-audio', 'btn-audio-map', 'btn-audio-game'].forEach(function (id) { setIcon($(id), any ? ICON.sound : ICON.soundOff); $(id).classList.toggle('off', !any); });
  }
  document.addEventListener('click', function (e) { // значок слева от ползунка — выключить/включить
    var ic = e.target.closest('.vol-ic'); if (!ic) return;
    var c = VOL[ic.parentNode.getAttribute('data-k')];
    save[c.flag] = !audible(ic.parentNode.getAttribute('data-k'));
    if (save[c.flag] && save[c.v] === 0) save[c.v] = 0.5;
    applyAudio(); updateAudioUi(); persist(); S.play('click');
  });
  document.addEventListener('input', function (e) { // ползунок: громкость сразу слышна
    var r = e.target; if (!r.matches || !r.matches('.vol-row input')) return;
    var c = VOL[r.closest('.vol-row').getAttribute('data-k')];
    save[c.v] = Math.round(r.value) / 100;
    if (save[c.v] > 0) save[c.flag] = true;
    applyAudio(); updateAudioUi(r);
  });
  document.addEventListener('change', function (e) { // отпустили ползунок: сохранить, у эффектов — образец звука
    var r = e.target; if (!r.matches || !r.matches('.vol-row input')) return;
    persist(); if (r.closest('.vol-row').getAttribute('data-k') === 'sfx') S.play('found');
  });
  function openSound() { modal('modal-sound', true); }

  /* ---------- Ежедневный подарок ---------- */
  function giftAvailable() { return save.gift.date !== today(); }
  function giftDayIndex() { return save.gift.date === yesterday() ? (save.gift.day + 1) % CFG.gift.length : 0; }
  function openGift() {
    var idx = giftAvailable() ? giftDayIndex() : save.gift.day, html = '';
    CFG.gift.forEach(function (n, i) {
      var cls = i < idx ? 'done' : i === idx ? 'today' : '';
      html += '<div class="gday ' + cls + '"><span>' + T('giftDay', { n: i + 1 }) + '</span>' + ICON.gift.replace('<svg ', '<svg ') + '<b>+' + n + '</b></div>';
    });
    $('gift-days').innerHTML = html;
    var av = giftAvailable();
    $('btn-gift-take').hidden = !av; $('btn-gift-x2').hidden = !av || !P.caps.rewarded;
    modal('modal-gift', true);
  }
  function claimGift(mult) {
    if (!giftAvailable()) return;
    var idx = giftDayIndex(), n = CFG.gift[idx] * mult;
    save.gift = { day: idx, date: today() }; save.hints += n; persist();
    modal('modal-gift', false); refreshMenu(); S.play('gift');
    toast(T('giftGot', { n: n, w: window.I18N.word('hint', n) }));
  }

  /* ---------- Игра ---------- */
  var G = null, cache = null, lastAd = Date.now(), view = { z: 1, x: 0, y: 0 };
  var picA = $('pic-a').querySelector('svg'), picB = $('pic-b').querySelector('svg');

  function prepare(n) {
    var lv = L.build(n);
    return { n: n, lv: lv, a: side(lv, lv.left), b: side(lv, lv.right) };
  }
  function side(lv, items) { return L.renderSide(lv.sceneId, items) + '<g class="marks"></g>'; }

  function startLevel(n) {
    var c = cache && cache.n === n ? cache : prepare(n);
    cache = null;
    clearTimeout(fingerTimer); $('finger').hidden = true; fingerTarget = -1;
    var lv = c.lv;
    G = { n: n, lv: lv, found: {}, count: 0, miss: 0, hearts: CFG.hearts, done: false, lastTap: 0, lastX: 0, lastY: 0 };
    save.last = n; persist();
    $('game-title').textContent = T('level', { n: n });
    picA.innerHTML = c.a; picB.innerHTML = c.b;
    resetView();
    updateFound(); updateHearts(); updateHintBadge();
    document.querySelectorAll('.modal.show').forEach(function (m) { m.classList.remove('show'); });
    show('scr-game');
    if (P.levelEvent) P.levelEvent('level_started', n);
    if (lv.festive) toast(T('festive'));
    if (n <= CFG.tutorialTo) { if (n === 1) toast(T('tut', { n: lv.diffs.length, w: window.I18N.word('diff', lv.diffs.length) }), 3200); scheduleFinger(900); }
    if (n === CFG.zoomFrom && !save.tipZoom) { save.tipZoom = 1; persist(); setTimeout(function () { toast(T('zoomTip'), 3200); }, 500); }
    // следующий уровень готовим заранее
    setTimeout(function () { if (G && G.n === n && n < L.COUNT) cache = prepare(n + 1); }, 700);
  }

  function layout() {
    var board = $('board'), W = board.clientWidth, H = board.clientHeight, ratio = L.W / L.H, gap = 10, br = 8;
    if (!W || !H) return;
    var wStack = Math.min(W - 4, ((H - gap) / 2 - br) * ratio + br);
    var wSide = Math.min((W - gap) / 2 - 2, (H - br - 6) * ratio + br);
    var wide = wSide > wStack * 1.05, w = Math.floor(wide ? wSide : wStack), h = Math.floor((w - br) / ratio + br);
    board.classList.toggle('wide', wide);
    [$('pic-a'), $('pic-b')].forEach(function (el) { el.style.width = w + 'px'; el.style.height = h + 'px'; });
  }
  window.addEventListener('resize', function () { if (current === 'scr-game') { layout(); placeFinger(); } });

  function updateFound() {
    var el = $('found'); el.textContent = T('found', { a: G.count, b: G.lv.diffs.length });
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function updateHearts(lostIdx) {
    var h = '';
    for (var i = 0; i < CFG.hearts; i++) h += '<span' + (i === lostIdx ? ' class="lost"' : '') + '>' + heartSvg(i < G.hearts) + '</span>';
    $('hearts').innerHTML = h;
  }
  function updateHintBadge() {
    var b = $('hint-badge');
    if (save.hints > 0) { b.textContent = save.hints; b.classList.remove('ad'); }
    else { b.innerHTML = ICON.ad; b.classList.add('ad'); }
  }

  /* ----- Зум и перетаскивание (с 21-го уровня), обе картинки синхронно ----- */
  function resetView() { view = { z: 1, x: 0, y: 0 }; applyView(); }
  function applyView() {
    var vw = L.W / view.z, vh = L.H / view.z;
    view.x = Math.max(0, Math.min(L.W - vw, view.x)); view.y = Math.max(0, Math.min(L.H - vh, view.y));
    var vb = view.x.toFixed(2) + ' ' + view.y.toFixed(2) + ' ' + vw.toFixed(2) + ' ' + vh.toFixed(2);
    picA.setAttribute('viewBox', vb); picB.setAttribute('viewBox', vb);
    $('btn-zoom-reset').hidden = view.z <= 1.01;
    placeFinger();
  }
  function zoomAt(svg, clientX, clientY, newZ) {
    var r = svg.getBoundingClientRect(), fx = (clientX - r.left) / r.width, fy = (clientY - r.top) / r.height;
    var sx = view.x + fx * L.W / view.z, sy = view.y + fy * L.H / view.z;
    view.z = Math.max(1, Math.min(3, newZ));
    view.x = sx - fx * L.W / view.z; view.y = sy - fy * L.H / view.z; applyView();
  }
  var ptrs = {}, gesture = null;
  function onDown(ev) {
    if (!G || G.done || anyModal()) return;
    S.unlock();
    var svg = ev.currentTarget;
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, svg: svg };
    var ids = Object.keys(ptrs);
    if (ids.length === 1) gesture = { type: 'tap', moved: false };
    else if (ids.length === 2 && G.lv.zoom) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: view.z, svg: svg };
    } else gesture = { type: 'none' };
  }
  function onMove(ev) {
    var p = ptrs[ev.pointerId]; if (!p || !gesture) return;
    var dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY;
    if (gesture.type === 'pinch') {
      var ids = Object.keys(ptrs); if (ids.length < 2) return;
      var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(gesture.svg, (a.x + b.x) / 2, (a.y + b.y) / 2, gesture.z0 * d / gesture.d0);
    } else if (gesture.type === 'tap' || gesture.type === 'pan') {
      if (Math.hypot(p.x - p.x0, p.y - p.y0) > 10) gesture.type = 'pan';
      if (gesture.type === 'pan' && view.z > 1) {
        var r = p.svg.getBoundingClientRect();
        view.x -= dx / r.width * L.W / view.z; view.y -= dy / r.height * L.H / view.z; applyView();
      }
    }
  }
  function onUp(ev) {
    var p = ptrs[ev.pointerId]; if (!p) return;
    delete ptrs[ev.pointerId];
    if (gesture && gesture.type === 'tap' && !Object.keys(ptrs).length) tapAt(p.svg, ev.clientX, ev.clientY);
    if (!Object.keys(ptrs).length) gesture = null;
  }
  [picA, picB].forEach(function (svg) {
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', function (ev) { delete ptrs[ev.pointerId]; gesture = null; });
    svg.addEventListener('wheel', function (ev) {
      if (!G || !G.lv.zoom) return; ev.preventDefault();
      zoomAt(svg, ev.clientX, ev.clientY, view.z * (ev.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });
  });

  function toScene(svg, x, y) {
    var pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    var m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : null;
  }
  function hitBox(b) {
    var pad = 9, w = b.x1 - b.x0, h = b.y1 - b.y0;
    var hw = Math.max(w / 2 + pad, 24), hh = Math.max(h / 2 + pad, 24);
    return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, hw: hw, hh: hh };
  }
  function tapAt(svg, x, y) {
    if (!G || G.done || anyModal()) return;
    var now = Date.now();
    // защита от двойных тапов: повторное касание рядом с предыдущим в течение 350 мс не считается
    if (now - G.lastTap < CFG.tapGuard && Math.hypot(x - G.lastX, y - G.lastY) < 30) return;
    G.lastTap = now; G.lastX = x; G.lastY = y;
    hideFinger();
    var p = toScene(svg, x, y); if (!p) return;
    var best = -1, bestD = 1e9, onFound = false;
    G.lv.diffs.forEach(function (d, i) {
      var h = hitBox(d.box), dx = Math.abs(p.x - h.cx), dy = Math.abs(p.y - h.cy);
      if (dx <= h.hw && dy <= h.hh) {
        if (G.found[i]) { onFound = true; return; }
        var q = dx / h.hw + dy / h.hh; if (q < bestD) { bestD = q; best = i; }
      }
    });
    if (best >= 0) found(best);
    else if (!onFound) miss(svg, p);
  }

  function ring(b, cls, color) {
    var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    var rx = Math.max(20, (b.x1 - b.x0) / 2 + 8), ry = Math.max(20, (b.y1 - b.y0) / 2 + 8);
    return '<g class="' + cls + '"><ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + OUT + '" stroke-width="9"/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="' + color + '" stroke-width="4.5"/></g>';
  }
  function flakes(b) { // всплеск снежинок
    var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, out = '<g>', n = 7;
    for (var k = 0; k < n; k++) {
      var a = k / n * 6.283 + 0.4, dist = Math.max(32, Math.min(b.x1 - b.x0, b.y1 - b.y0) / 2 + 24);
      out += '<g style="--dx:' + (Math.cos(a) * dist).toFixed(1) + 'px;--dy:' + (Math.sin(a) * dist).toFixed(1) + 'px"><g class="spark">' +
        A.render({ type: 'flake', x: cx, y: cy, s: 0.22, d: { tips: true }, c: k % 2 ? '#ffffff' : '#bfe6ff' }) + '</g></g>';
    }
    return out + '</g>';
  }
  function found(i) {
    G.found[i] = true; G.count++;
    clearHint();
    var b = G.lv.diffs[i].box;
    [picA, picB].forEach(function (svg) { svg.querySelector('.marks').insertAdjacentHTML('beforeend', ring(b, 'mark-found', PAL.gold) + flakes(b)); });
    updateFound(); S.play('found'); P.haptic('success');
    if (G.count === G.lv.diffs.length) { G.done = true; hideFinger(); setTimeout(win, 700); }
    else if (G.n <= CFG.tutorialTo) scheduleFinger(6000);
  }
  function miss(svg, p) {
    G.miss++; G.hearts--;
    var x = p.x, y = p.y, k = 12 / view.z;
    var d = 'M' + (x - k) + ',' + (y - k) + ' L' + (x + k) + ',' + (y + k) + ' M' + (x + k) + ',' + (y - k) + ' L' + (x - k) + ',' + (y + k);
    var marks = svg.querySelector('.marks');
    marks.insertAdjacentHTML('beforeend', '<g class="mark-miss"><path d="' + d + '" stroke="' + OUT + '" stroke-width="' + 11 / view.z + '" stroke-linecap="round"/><path d="' + d + '" stroke="' + PAL.red + '" stroke-width="' + 6 / view.z + '" stroke-linecap="round"/></g>');
    var node = marks.lastChild; setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 950);
    var pic = svg.parentNode; pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
    updateHearts(G.hearts); S.play('miss'); P.haptic('error');
    if (G.hearts <= 0) { G.done = true; setTimeout(lose, 600); }
  }

  /* ----- Подсказка ----- */
  function clearHint() { document.querySelectorAll('.pic .mark-hint').forEach(function (m) { m.remove(); }); }
  function revealHint() {
    var left = []; G.lv.diffs.forEach(function (d, i) { if (!G.found[i]) left.push(i); });
    if (!left.length) return;
    var b = G.lv.diffs[left[0]].box;
    clearHint();
    [picA, picB].forEach(function (svg) { svg.querySelector('.marks').insertAdjacentHTML('beforeend', ring(b, 'mark-hint', '#ffffff')); });
    // при зуме — показываем место подсказки
    if (view.z > 1) { view.x = (b.x0 + b.x1) / 2 - L.W / view.z / 2; view.y = (b.y0 + b.y1) / 2 - L.H / view.z / 2; applyView(); }
    setTimeout(clearHint, 3500);
  }
  function useHint() {
    if (!G || G.done || anyModal()) return;
    S.unlock(); hideFinger();
    if (save.hints > 0) { save.hints--; persist(); updateHintBadge(); revealHint(); S.play('click'); return; }
    var btn = $('btn-hint'); btn.disabled = true;
    P.showRewarded().then(function (ok) {
      btn.disabled = false;
      if (ok) revealHint(); else toast(T('adNo'));
    });
  }

  /* ----- Обучающий пальчик ----- */
  var fingerTimer = 0, fingerTarget = -1;
  function scheduleFinger(ms) {
    clearTimeout(fingerTimer);
    fingerTimer = setTimeout(function () {
      if (!G || G.done || G.n > CFG.tutorialTo || anyModal()) return;
      fingerTarget = -1;
      for (var i = 0; i < G.lv.diffs.length; i++) if (!G.found[i]) { fingerTarget = i; break; }
      if (fingerTarget >= 0) { $('finger').hidden = false; placeFinger(); }
    }, ms);
  }
  function placeFinger() {
    var f = $('finger'); if (f.hidden || !G || fingerTarget < 0) return;
    var b = G.lv.diffs[fingerTarget].box, m = picB.getScreenCTM(); if (!m) return;
    var pt = picB.createSVGPoint(); pt.x = (b.x0 + b.x1) / 2; pt.y = (b.y0 + b.y1) / 2; pt = pt.matrixTransform(m);
    f.style.left = pt.x + 'px'; f.style.top = pt.y + 'px';
  }
  function hideFinger() { clearTimeout(fingerTimer); $('finger').hidden = true; if (G && !G.done && G.n <= CFG.tutorialTo) scheduleFinger(8000); }

  /* ----- Победа / проигрыш ----- */
  function starsFor(m) { return m === 0 ? 3 : m <= 2 ? 2 : 1; }
  function win() {
    var n = G.n, st = starsFor(G.miss), first = !save.stars[n];
    save.stars[n] = Math.max(save.stars[n] || 0, st);
    if (n >= save.unlocked && n < L.COUNT) save.unlocked = n + 1;
    save.wins++; save.last = Math.min(n + 1, save.unlocked); persist();
    if (P.levelEvent) P.levelEvent('level_completed', n);
    $('win-stars').innerHTML = starSvg(st > 0) + starSvg(st > 1) + starSvg(st > 2);
    var svgs = $('win-stars').children;
    for (var i = 0; i < 3; i++) if (i < st) svgs[i].classList.add('on');
    $('win-text').textContent = n === L.COUNT ? T('winLast') : T(st === 3 ? 'win3' : st === 2 ? 'win2' : 'win1');
    $('btn-share').hidden = !P.caps.share;
    G.stars = st;
    modal('modal-win', true); confetti();
    S.play('win'); P.haptic('success');
    for (var k = 0; k < st; k++) (function (k) { setTimeout(function () { S.play('star', [1, 1.26, 1.5][k]); }, 450 + k * 350); })(k);
  }
  function lose() {
    if (P.levelEvent) P.levelEvent('level_failed', G.n);
    $('btn-continue').hidden = !P.caps.rewarded;
    modal('modal-lose', true);
  }
  function continueAfterLose() {
    var btn = $('btn-continue'); btn.disabled = true;
    P.showRewarded().then(function (ok) {
      btn.disabled = false;
      if (!ok) { toast(T('adNo')); return; }
      G.hearts = CFG.hearts; G.done = false; updateHearts(); modal('modal-lose', false);
    });
  }
  function next() {
    modal('modal-win', false);
    var n = G.n;
    if (n >= L.COUNT) { openMap(); return; }
    // рост: предложить избранное / главный экран после нескольких побед (только VK)
    if (P.caps.favorites && !save.fav && save.wins >= CFG.favAfterWins) { save.fav = 1; persist(); openFav(function () { goNext(n); }); return; }
    goNext(n);
  }
  function goNext(n) {
    var go = function () { startLevel(n + 1); };
    var allowed = P.caps.interstitialManaged || (n >= CFG.interFromLevel && Date.now() - lastAd >= CFG.interGap);
    if (allowed) { lastAd = Date.now(); P.showInterstitial().then(go); } else go();
  }

  /* ----- Рост: избранное, друзья, поделиться ----- */
  var favDone = null;
  function openFav(cb) {
    favDone = cb; $('btn-home').hidden = true;
    P.social.homeScreenSupported && P.social.homeScreenSupported().then(function (ok) { $('btn-home').hidden = !ok; });
    modal('modal-fav', true);
  }
  function closeFav() { modal('modal-fav', false); var f = favDone; favDone = null; if (f) f(); }
  function invite() {
    P.social.invite(T('inviteMsg')).then(function (ok) {
      if (ok && save.inv !== today()) { save.inv = today(); save.hints += 3; persist(); toast(T('inviteReward')); S.play('gift'); }
    });
  }

  /* ---------- Пауза, сворачивание, реклама ---------- */
  function pauseGame() { if (current === 'scr-game' && G && !G.done && !anyModal()) { modal('modal-pause', true); if (P.levelEvent) P.levelEvent('level_paused', G.n); } }
  P.onPause(function (why) {
    S.suspend(why);
    if (why === 'hide' || why === 'platform') { snow.setVisible(false); pauseGame(); }
  });
  P.onResume(function (why) {
    if (why === 'show') why = 'hide'; // VK/OK: возврат из свёрнутого состояния снимает паузу 'hide'
    if (why === 'hide' || why === 'platform') snow.setVisible(true);
    S.restore(why); // единая функция «восстановить звук»
  });

  /* ---------- Кнопки ---------- */
  function on(id, fn, silent) { $(id).addEventListener('click', function (e) { S.unlock(); if (!silent) S.play('click'); fn(e); }); }
  on('btn-play', function () { startLevel(Math.min(save.last, save.unlocked)); });
  on('btn-levels', openMap);
  on('btn-map-back', function () { refreshMenu(); show('scr-menu'); });
  $('map').addEventListener('click', function (e) {
    var g = e.target.closest('.lvl-node'); if (!g) return;
    S.unlock(); var n = +g.getAttribute('data-l');
    if (n > save.unlocked) { S.play('miss'); toast(T('locked', { n: save.unlocked })); return; }
    S.play('click'); startLevel(n);
  });
  on('btn-pause', function () { modal('modal-pause', true); });
  on('btn-resume', function () { modal('modal-pause', false); if (P.levelEvent) P.levelEvent('level_resumed', G.n); });
  on('btn-restart', function () { modal('modal-pause', false); startLevel(G.n); });
  on('btn-pause-menu', function () { modal('modal-pause', false); refreshMenu(); show('scr-menu'); });
  on('btn-next', next);
  on('btn-win-menu', function () { modal('modal-win', false); refreshMenu(); show('scr-menu'); });
  on('btn-share', function () { modal('modal-share', true); });
  on('btn-share-wall', function () { modal('modal-share', false); P.social.share(T('shareMsg', { n: G.n, s: G.stars })); });
  on('btn-share-story', function () { modal('modal-share', false); P.social.story(); });
  on('btn-share-close', function () { modal('modal-share', false); });
  on('btn-continue', continueAfterLose);
  on('btn-lose-restart', function () { modal('modal-lose', false); startLevel(G.n); });
  $('btn-hint').addEventListener('click', useHint);
  on('btn-zoom-reset', resetView);
  on('btn-gift', openGift);
  on('btn-gift-take', function () { claimGift(1); }, true);
  on('btn-gift-x2', function () {
    var b = $('btn-gift-x2'); b.disabled = true;
    P.showRewarded().then(function (ok) { b.disabled = false; if (ok) claimGift(2); else toast(T('adNo')); });
  });
  on('btn-invite', invite);
  on('btn-fav', function () { P.social.favorites().then(closeFav); });
  on('btn-home', function () { P.social.homeScreen().then(closeFav); });
  on('btn-fav-later', closeFav);
  on('btn-audio', openSound); on('btn-audio-map', openSound); on('btn-audio-game', openSound);
  on('btn-sound-ok', function () { modal('modal-sound', false); });
  $('modal-sound').addEventListener('click', function (e) { if (e.target === this) modal('modal-sound', false); });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  /* ---------- Запуск ---------- */
  setIcon($('btn-pause'), ICON.pause); setIcon($('btn-map-back'), ICON.back); setIcon($('btn-gift'), ICON.gift);
  setIcon($('btn-invite'), ICON.friends); setIcon($('btn-zoom-reset'), ICON.zoomout);
  document.querySelector('.hint-ic').innerHTML = ICON.bulb;
  document.querySelectorAll('.ad-ic').forEach(function (e) { e.innerHTML = ICON.ad; });
  document.querySelector('.star-ic').innerHTML = starSvg(true);
  $('finger').innerHTML = ICON.finger;
  $('splash-lights').innerHTML = lightsSvg(); $('menu-lights').innerHTML = lightsSvg();
  $('lose-art').innerHTML = '<svg viewBox="0 0 96 32">' + [0, 1, 2].map(function (i) { return '<g transform="translate(' + i * 32 + ',0)">' + heartSvg(false).replace(/<\/?svg[^>]*>/g, '') + '</g>'; }).join('') + '</svg>';

  var t0 = Date.now();
  P.ready.then(function () {
    window.I18N.setLang(P.language || 'ru'); window.I18N.apply();
    document.title = T('title1') + ': ' + T('title2');
    if (!P.audioAllowed()) S.suspend('audio'); // платформа запретила звук на старте (Playgama)
    return P.load();
  }).then(function (list) {
    var best = null;
    (list || []).forEach(function (s) { if (score(s) > score(best)) best = s; });
    save = sanitize(best);
    applyAudio(); updateAudioUi();
    $('menu-art').innerHTML = menuArt();
    refreshMenu();
    setTimeout(function () {
      show('scr-menu'); P.gameReady();
      S.preload(); // звук грузится сразу; музыка — с открытия, если браузер разрешит, иначе с первого касания
      if (giftAvailable()) setTimeout(function () { if (current === 'scr-menu' && !anyModal()) openGift(); }, 350);
      setTimeout(function () { if (!$('map-svg')) buildMap(); }, 300);
    }, Math.max(0, 1200 - (Date.now() - t0)));
  });

  window.__game = { start: startLevel, get state() { return G; }, get save() { return save; }, openMap: openMap, get view() { return view; } };
})();
