/* Сцены и генерация уровней. Поле сцены: 400 × 340 единиц. */
(function () {
  'use strict';
  var A = window.ART, OUT = A.OUT, PAL = A.PAL;
  var W = 400, H = 340;

  function rect(x, y, w, h, fill, more) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (more || '') + '/>'; }
  function path(d, fill, more) { return '<path d="' + d + '" fill="' + fill + '"' + (more || '') + '/>'; }
  var ST = ' stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
  function skyStars(list) {
    return list.map(function (q) { return '<polygon points="' + A.starPts(q[0], q[1], q[2], q[2] * 0.42) + '" fill="#fff6c2" opacity="0.9"/>'; }).join('');
  }
  function dots(list, r, fill) { return list.map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="' + r + '" fill="' + fill + '"/>'; }).join(''); }

  /* ---------- Фоны ---------- */
  var BG = {
    living: function () {
      var wall = rect(0, 0, W, 250, '#3b5fc0');
      var pat = '', x, y;
      for (y = 20; y < 240; y += 36) for (x = (y / 36 % 2) * 18 + 10; x < W; x += 36) pat += '<path d="M' + x + ',' + (y - 6) + ' L' + (x + 5) + ',' + y + ' L' + x + ',' + (y + 6) + ' L' + (x - 5) + ',' + y + ' Z" fill="#4a6fd0"/>';
      var floor = rect(0, 250, W, 90, '#c07a42') + '<path d="M0,278 L400,278 M0,308 L400,308 M80,250 L80,278 M220,250 L220,278 M150,278 L150,308 M320,278 L320,308 M40,308 L40,340 M260,308 L260,340" stroke="#9c5f30" stroke-width="3"/>' + rect(0, 246, W, 8, '#8a5228');
      var rug = '<ellipse cx="215" cy="300" rx="80" ry="26" fill="#e8423f"' + ST + '/><ellipse cx="215" cy="300" rx="62" ry="18" fill="none" stroke="#ffc233" stroke-width="3" stroke-dasharray="6 6"/>';
      // окно
      var win = rect(140, 26, 92, 98, '#14245e', ST + ' rx="6"') + skyStars([[160, 46, 4], [210, 60, 3], [175, 90, 3], [215, 100, 4]]) +
        '<circle cx="200" cy="48" r="11" fill="#ffe48a"/><circle cx="206" cy="44" r="10" fill="#14245e"/>' +
        '<path d="M186,26 L186,124 M140,74 L232,74" stroke="' + OUT + '" stroke-width="5"/>' + rect(132, 122, 108, 10, '#fff', ST + ' rx="4"') +
        path('M134,20 Q150,70 136,126 L126,126 L126,20 Z', '#e8423f', ST) + path('M238,20 Q222,70 236,126 L246,126 L246,20 Z', '#e8423f', ST) + rect(122, 14, 128, 8, '#ffc233', ST + ' rx="4"');
      // камин
      var fp = rect(262, 142, 128, 112, '#c4573a', ST) +
        '<path d="M262,170 L390,170 M262,198 L390,198 M262,226 L390,226 M290,142 L290,170 M340,142 L340,170 M314,170 L314,198 M366,170 L366,198 M276,198 L276,226 M380,198 L380,226" stroke="#a3422a" stroke-width="3"/>' +
        path('M296,254 L296,196 Q326,168 356,196 L356,254 Z', '#2a1f3d', ST) +
        path('M306,252 Q300,232 314,222 Q312,236 322,236 Q318,218 330,206 Q334,226 344,226 Q352,236 346,252 Z', '#ff8f2b', ' stroke="#ffc233" stroke-width="3" stroke-linejoin="round"') +
        rect(300, 246, 52, 8, '#6b4423', ST + ' rx="3"') + rect(254, 132, 144, 14, '#8a5228', ST + ' rx="4"');
      return wall + pat + win + floor + rug + fp;
    },
    yard: function () {
      var sky = rect(0, 0, W, H, '#1b2f78') + skyStars([[30, 24, 4], [110, 18, 3], [180, 60, 3], [260, 20, 4], [300, 90, 3], [20, 110, 3], [390, 120, 3], [140, 110, 2.5]]);
      var far = path('M0,190 Q80,150 170,180 Q260,150 400,178 L400,340 L0,340 Z', '#b9cdf5', ST);
      var near = path('M0,236 Q100,210 200,232 Q300,250 400,226 L400,340 L0,340 Z', '#f2f7ff', ST);
      var fence = '';
      for (var x = 8; x < 120; x += 18) fence += rect(x, 252, 10, 34, '#a8693a', ST + ' rx="3"');
      fence = rect(0, 260, 124, 7, '#8a5228', ST) + fence;
      return sky + far + near + fence + path('M30,320 Q60,312 90,320 M250,330 Q290,322 330,330', 'none', ' stroke="#b9c9ee" stroke-width="3"');
    },
    kitchen: function () {
      var wall = rect(0, 0, W, 200, '#ffd9a0');
      var tiles = '';
      for (var y = 0; y < 200; y += 40) for (var x = (y / 40 % 2) * 20; x < W; x += 40) tiles += rect(x, y, 20, 20, '#ffcc85');
      var win = rect(130, 18, 140, 110, '#14245e', ST + ' rx="8"') + skyStars([[150, 40, 4], [240, 36, 3], [170, 100, 3], [250, 96, 4], [200, 60, 2.5]]) +
        '<path d="M200,18 L200,128 M130,73 L270,73" stroke="' + OUT + '" stroke-width="5"/>' + rect(122, 124, 156, 10, '#fff', ST + ' rx="4"') +
        path('M120,10 Q130,60 112,140 L100,140 L100,10 Z', '#33b35a', ST) + path('M280,10 Q270,60 288,140 L300,140 L300,10 Z', '#33b35a', ST);
      var shelfL = rect(14, 120, 80, 8, '#a8693a', ST + ' rx="3"');
      var shelfR = rect(306, 120, 80, 8, '#a8693a', ST + ' rx="3"');
      var table = rect(-10, 200, 420, 150, '#e8423f', ST) ;
      var cloth = '';
      for (var i = 0; i < 11; i++) cloth += rect(i * 40 - 10, 200, 20, 150, '#f0605a');
      for (var j = 0; j < 4; j++) cloth += rect(-10, 210 + j * 40, 420, 18, 'rgba(255,255,255,0.18)');
      var edge = path('M-10,200 L410,200', 'none', ST);
      return wall + tiles + win + shelfL + shelfR + table + cloth + edge;
    },
    forest: function () {
      var sky = rect(0, 0, W, H, '#162a6b') + skyStars([[40, 30, 3], [120, 20, 4], [230, 40, 3], [300, 16, 3], [380, 60, 4], [180, 90, 2.5], [70, 100, 2.5]]);
      var far = '';
      [[20, 200], [70, 190], [130, 205], [260, 195], [330, 190], [390, 205]].forEach(function (q) {
        far += path('M' + q[0] + ',' + (q[1] - 70) + ' L' + (q[0] + 26) + ',' + q[1] + ' L' + (q[0] - 26) + ',' + q[1] + ' Z', '#2a4a8c');
      });
      var ground = path('M0,200 Q120,184 220,198 Q320,212 400,194 L400,340 L0,340 Z', '#eef4ff', ST);
      var branch = path('M400,118 Q330,120 286,132 L284,124 Q330,110 400,108 Z', '#7a4c26', ST) + path('M300,126 Q306,112 320,114 Q310,120 304,128 Z', '#fff', ' stroke="' + OUT + '" stroke-width="3"');
      var trunk = rect(386, 0, 30, 220, '#7a4c26', ST);
      var path2 = path('M150,340 Q190,270 230,240 Q250,226 300,222 L320,228 Q260,236 240,256 Q210,290 210,340 Z', '#dfe8fa');
      return sky + far + ground + path2 + trunk + branch;
    },
    rink: function () {
      var sky = rect(0, 0, W, H, '#1f3384') + skyStars([[30, 20, 3], [90, 50, 4], [170, 18, 3], [250, 44, 3], [330, 24, 4], [380, 70, 3]]);
      var city = '';
      [[0, 120, 50], [46, 100, 40], [82, 130, 46], [124, 96, 36], [256, 110, 44], [296, 90, 40], [332, 124, 70]].forEach(function (b) {
        city += rect(b[0], b[1], b[2], 200 - b[1], '#2f4aa8');
      });
      [[12, 140], [30, 160], [60, 120], [96, 150], [136, 110], [270, 130], [310, 104], [350, 140], [370, 160]].forEach(function (q) { city += rect(q[0], q[1], 8, 10, '#ffd75e'); });
      var snow = path('M0,196 Q100,180 200,192 Q300,204 400,186 L400,340 L0,340 Z', '#f2f7ff', ST);
      var ice = '<ellipse cx="200" cy="278" rx="190" ry="50" fill="#bfe6ff"' + ST + '/>' +
        '<path d="M80,270 Q130,258 170,268 M230,292 Q280,282 330,292 M150,300 Q180,296 205,302" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
      return sky + city + snow + ice;
    },
    shelf: function () {
      var wall = rect(0, 0, W, H, '#6a4fc4');
      var pat = '';
      for (var y = 16; y < 320; y += 40) for (var x = 16 + (y / 40 % 2) * 20; x < W; x += 40) pat += '<polygon points="' + A.starPts(x, y, 5, 2.2) + '" fill="#7c62d6"/>';
      var cab = rect(14, 0, 372, 312, '#c98b55', ST + ' rx="6"') + rect(26, 0, 348, 300, '#e0a86e', ST);
      var shelves = rect(20, 104, 360, 12, '#a8693a', ST + ' rx="3"') + rect(20, 210, 360, 12, '#a8693a', ST + ' rx="3"') + rect(20, 296, 360, 14, '#a8693a', ST + ' rx="3"');
      var floor = rect(0, 312, W, 28, '#5a3f9e');
      return wall + pat + floor + cab + shelves;
    }
  };

  function it(type, x, y, s, extra) { var o = { type: type, x: x, y: y, s: s }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }

  /* ---------- Сцены ---------- */
  var SCENES = [
    { id: 'living', name: 'Уютная гостиная', items: [
      it('tree', 70, 196, 1.12), it('clock', 60, 46, 0.55), it('flags', 186, 10, 1.05, { fixed: true }),
      it('gift', 30, 290, 0.6), it('giftround', 120, 288, 0.62), it('gift', 78, 308, 0.5, { c: PAL.blue }),
      it('wreath', 326, 70, 0.62), it('stocking', 290, 166, 0.46), it('stocking', 362, 166, 0.46, { c: PAL.green, flip: true }),
      it('candle', 280, 115, 0.44), it('mug', 326, 120, 0.36), it('holly', 370, 128, 0.46),
      it('bear', 200, 278, 0.66), it('drum', 258, 298, 0.5), it('lantern', 375, 290, 0.56), it('bullfinch', 214, 108, 0.42),
      it('cane', 232, 238, 0.42, { rot: -10 })
    ] },
    { id: 'yard', name: 'Зимний двор', items: [
      it('house', 104, 180, 1.05), it('snowman', 284, 228, 0.82), it('fir', 364, 200, 0.82), it('fir', 238, 180, 0.5),
      it('lamppost', 188, 236, 0.78), it('moon', 340, 54, 0.62), it('cloud', 222, 46, 0.5), it('sled', 132, 300, 0.62),
      it('bullfinch', 50, 244, 0.46), it('bunny', 350, 296, 0.5), it('flake', 60, 50, 0.42), it('flake', 150, 74, 0.32),
      it('gift', 236, 288, 0.42), it('drift', 268, 322, 0.6), it('cone', 22, 316, 0.44), it('star', 278, 108, 0.32)
    ] },
    { id: 'kitchen', name: 'Праздничный стол', items: [
      it('tangerine', 120, 236, 0.62), it('tangerine', 150, 250, 0.55), it('cookie', 60, 300, 0.62), it('cookie', 352, 302, 0.56),
      it('ginger', 250, 280, 0.66), it('mug', 60, 222, 0.62), it('candle', 196, 214, 0.62), it('candle', 330, 220, 0.56, { c: PAL.blue }),
      it('cane', 150, 306, 0.48, { rot: 70 }), it('lollipop', 380, 186, 0.48), it('cracker', 288, 216, 0.48, { rot: 10 }),
      it('holly', 210, 312, 0.6), it('ball', 54, 72, 0.5), it('ball', 346, 72, 0.5, { c: PAL.blue }), it('star', 200, 46, 0.32), it('bell', 30, 102, 0.36), it('giftround', 360, 98, 0.38), it('tangerine', 320, 270, 0.5),
      it('wreath', 54, 164, 0.42), it('clock', 350, 164, 0.46)
    ] },
    { id: 'forest', name: 'Зимний лес', items: [
      it('fir', 70, 176, 1.0), it('fir', 170, 160, 0.6), it('fir', 230, 210, 0.75), it('owl', 334, 92, 0.52),
      it('bunny', 110, 292, 0.62), it('bullfinch', 312, 186, 0.44), it('bullfinch', 30, 290, 0.4, { flip: true }),
      it('cone', 262, 300, 0.48), it('cone', 196, 318, 0.4), it('lantern', 302, 152, 0.5), it('moon', 230, 52, 0.56),
      it('cloud', 120, 40, 0.48), it('drift', 330, 300, 0.7), it('mitten', 360, 248, 0.42), it('scarf', 352, 136, 0.42), it('flake', 30, 40, 0.36)
    ] },
    { id: 'rink', name: 'Каток', items: [
      it('flags', 200, 112, 1.3, { fixed: true }), it('lamppost', 30, 200, 0.82), it('lamppost', 370, 200, 0.82),
      it('penguin', 140, 270, 0.62), it('penguin', 270, 286, 0.56, { flip: true, c: PAL.blue }),
      it('skate', 210, 250, 0.4), it('skate', 68, 300, 0.4, { flip: true }), it('fir', 110, 182, 0.56), it('fir', 300, 180, 0.58),
      it('moon', 200, 54, 0.56), it('hat', 340, 312, 0.42), it('mitten', 196, 312, 0.36), it('star', 112, 34, 0.3), it('flake', 300, 42, 0.36), it('drift', 240, 196, 0.5),
    ] },
    { id: 'shelf', name: 'Полка с игрушками', items: [
      it('soldier', 62, 50, 0.66), it('bell', 134, 60, 0.66), it('star', 204, 58, 0.68), it('clock', 274, 58, 0.72), it('ball', 342, 56, 0.66),
      it('bear', 66, 160, 0.76), it('drum', 146, 172, 0.66), it('lollipop', 212, 160, 0.66), it('cracker', 266, 164, 0.6), it('giftround', 332, 172, 0.7),
      it('gift', 60, 268, 0.66), it('lantern', 130, 258, 0.6), it('ginger', 200, 262, 0.68), it('cane', 262, 256, 0.6), it('sack', 336, 256, 0.62)
    ] }
  ];

  /* ---------- Генератор ---------- */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function pick(R, arr) { return arr[Math.floor(R() * arr.length)]; }
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function colorDist(a, b) { var x = rgb(a), y = rgb(b); return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)); }
  // заметно отличающиеся цвета (слишком похожие оттенки не считаем отличием)
  function farColors(list, from) { return list.filter(function (x) { return colorDist(x, from) > 110; }); }

  function itemRadius(inst) {
    var sp = A.ITEMS[inst.type];
    return Math.max(18, Math.max(sp.w, sp.h) * inst.s * 0.42 + 6);
  }

  var LEVEL_COUNT = 36;
  function diffCount(n) { // n — номер уровня с 1
    if (n === 1) return 3;
    if (n === 2) return 4;
    if (n <= 10) return 5;
    if (n <= 22) return 6;
    return 7;
  }

  function build(levelNum) {
    var scene = SCENES[(levelNum - 1) % SCENES.length];
    var R = rng(levelNum * 7919 + 13);
    // базовая сцена: у всех деталей «есть», цвета слегка перемешаны для разнообразия
    var base = scene.items.map(function (src, idx) {
      var sp = A.ITEMS[src.type];
      var inst = JSON.parse(JSON.stringify(src));
      inst.idx = idx;
      inst.d = {};
      sp.details.forEach(function (k) { inst.d[k] = true; });
      if (!src.c && sp.colors.length > 1 && levelNum > SCENES.length) inst.c = pick(R, sp.colors);
      if (!inst.c) inst.c = sp.colors[0];
      if (sp.colors2) inst.c2 = levelNum > SCENES.length ? pick(R, sp.colors2) : sp.colors2[0];
      return inst;
    });

    var count = diffCount(levelNum);
    var order = base.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }

    var left = base.map(function (q) { return JSON.parse(JSON.stringify(q)); });
    var right = base.map(function (q) { return JSON.parse(JSON.stringify(q)); });
    var diffs = [];

    for (var k = 0; k < order.length && diffs.length < count; k++) {
      var b = base[order[k]];
      if (b.fixed) continue;
      var sp = A.ITEMS[b.type];
      var rad = itemRadius(b);
      var clash = diffs.some(function (d) { var dx = d.x - b.x, dy = d.y - b.y; return Math.sqrt(dx * dx + dy * dy) < (d.r + rad) * 0.8; });
      if (clash) continue;

      var size = Math.max(sp.w, sp.h) * b.s;
      if (size < (levelNum <= 10 ? 40 : 30)) continue; // слишком мелкие предметы не трогаем
      var opts = [];
      if (sp.details.length) opts.push('detail', 'detail', 'detail');
      if (farColors(sp.colors, b.c).length) opts.push('color', 'color');
      if (sp.colors2 && farColors(sp.colors2, b.c2).length) opts.push('color2');
      if (size < 95) opts.push('remove', 'remove');
      if (sp.flip) opts.push('flip');
      if (!opts.length) continue;
      var kind = pick(R, opts);
      var side = R() < 0.65 ? right : left; // отличие чаще на правой картинке, иногда — на левой
      var target = side[order[k]];
      if (kind === 'detail') { var dk = pick(R, sp.details); target.d[dk] = false; }
      else if (kind === 'color') { target.c = pick(R, farColors(sp.colors, b.c)); }
      else if (kind === 'color2') { target.c2 = pick(R, farColors(sp.colors2, b.c2)); }
      else if (kind === 'remove') { target.removed = true; }
      else if (kind === 'flip') { target.flip = !b.flip; }
      diffs.push({ idx: order[k], kind: kind, x: b.x, y: b.y, r: rad });
    }

    return { num: levelNum, scene: scene, left: left, right: right, diffs: diffs };
  }

  function renderSide(scene, items) {
    var bg = BG[scene.id]();
    var body = items.filter(function (q) { return !q.removed; }).map(A.render).join('');
    return bg + body;
  }

  window.LEVELS = { W: W, H: H, SCENES: SCENES, COUNT: LEVEL_COUNT, build: build, renderSide: renderSide, diffCount: diffCount };
})();
