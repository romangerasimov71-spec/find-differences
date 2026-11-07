/* Генератор уровней: детерминирован по номеру уровня (seed). Использует ART, SCENES и BOUNDS. */
(function () {
  'use strict';
  var A = window.ART, S = window.SCENES, B = window.BOUNDS;
  var W = S.W, H = S.H, COUNT = 100;
  var ORDER = ['living', 'yard', 'day', 'kitchen', 'forest', 'rink', 'shelf'];

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function pick(R, a) { return a[Math.floor(R() * a.length)]; }
  function shuffle(R, a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function cdist(a, b) { var x = rgb(a), y = rgb(b); return Math.sqrt((x[0] - y[0]) * (x[0] - y[0]) + (x[1] - y[1]) * (x[1] - y[1]) + (x[2] - y[2]) * (x[2] - y[2])); }
  function farColors(list, from) { return (list || []).filter(function (x) { return cdist(x, from) > 110; }); }

  /* Сложность по номеру уровня */
  function params(n) {
    if (n <= 5) return { diffs: 3, items: [9, 11], minArea: 900, minSize: 44, kinds: ['remove', 'add', 'color', 'remove', 'add'] };
    if (n <= 20) return { diffs: n <= 12 ? 4 : 5, items: [11, 14], minArea: 450, minSize: 36, kinds: ['remove', 'add', 'color', 'detail', 'detail', 'flip', 'move', 'size'] };
    if (n <= 50) return { diffs: n <= 35 ? 5 : 6, items: [13, 16], minArea: 260, minSize: 30, kinds: ['remove', 'add', 'color', 'color2', 'detail', 'detail', 'detail', 'flip', 'move', 'size'] };
    return { diffs: n <= 75 ? 6 : 7, items: [15, 20], minArea: 150, minSize: 26, kinds: ['remove', 'add', 'color', 'color2', 'detail', 'detail', 'detail', 'detail', 'flip', 'move', 'size'] };
  }
  function diffCount(n) { return params(n).diffs; }
  function isFestive(n) { return n % 10 === 0; }
  function sceneOf(n) { return isFestive(n) ? 'festive' : ORDER[(n - 1 - Math.floor(n / 10)) % ORDER.length]; }

  /* Рамка экземпляра в координатах сцены */
  function box(it) {
    var b = B[it.type].b, s = it.s;
    var x0 = b[0] * s, x1 = b[2] * s;
    if (it.flip) { var t = -x1; x1 = -x0; x0 = t; }
    return { x0: it.x + x0, y0: it.y + b[1] * s, x1: it.x + x1, y1: it.y + b[3] * s };
  }
  function inter(a, b, pad) {
    pad = pad || 0;
    var w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + pad, h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) + pad;
    return w > 0 && h > 0 ? w * h : 0;
  }
  function area(b) { return (b.x1 - b.x0) * (b.y1 - b.y0); }
  function inFrame(b) { return b.x0 >= 3 && b.y0 >= 3 && b.x1 <= W - 3 && b.y1 <= H - 3; }
  function union(a, b) { return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }; }
  function maxDim(type) { var b = B[type].b; return Math.max(b[2] - b[0], b[3] - b[1]); }

  /* Поставить предмет в слот: подобрать масштаб и положение по привязке */
  function place(type, slot, R, jitter) {
    var b = B[type].b, size = slot[2] * (jitter ? 0.92 + R() * 0.16 : 1);
    var s = size / maxDim(type);
    var anchor = slot[4] || 'b';
    var x = slot[0] + (jitter ? (R() - 0.5) * 10 : 0) - (b[0] + b[2]) / 2 * s;
    var y = anchor === 't' ? slot[1] - b[1] * s : anchor === 'c' ? slot[1] - (b[1] + b[3]) / 2 * s : slot[1] - b[3] * s;
    var it = { type: type, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, s: Math.round(s * 1000) / 1000 };
    // если вылезает за край — сдвигаем внутрь
    var bx = box(it);
    if (bx.x0 < 3) it.x += 3 - bx.x0;
    if (bx.x1 > W - 3) it.x -= bx.x1 - (W - 3);
    if (bx.y0 < 3) it.y += 3 - bx.y0;
    if (bx.y1 > H - 3) it.y -= bx.y1 - (H - 3);
    return it;
  }

  function dressItem(it, R, n) {
    var sp = A.ITEMS[it.type];
    it.d = {}; sp.details.forEach(function (k) { it.d[k] = true; });
    it.c = sp.colors.length > 1 ? pick(R, sp.colors) : sp.colors[0];
    if (sp.colors2) it.c2 = pick(R, sp.colors2);
    if (sp.flip && R() < 0.5) it.flip = true;
    return it;
  }

  // уровень строится детерминированно; если раскладка не дала нужного числа отличий — следующая попытка с другим сидом
  function build(n) {
    var lv;
    for (var attempt = 0; attempt < 40; attempt++) {
      lv = buildTry(n, attempt);
      if (lv.diffs.length === lv.need) break;
    }
    return lv;
  }
  var BIG = { snowman: 1, deer: 1, santa: 1, snowmaiden: 1, house: 1, tree: 1, lamppost: 2, moon: 1, sack: 1, owl: 1 };

  function buildTry(n, attempt) {
    var R = rng(n * 7919 + 17 + attempt * 104729), P = params(n), sceneId = sceneOf(n), scene = S.LIST[sceneId];
    var slots = scene.slots.map(function (s, i) { return { s: s, i: i }; });
    var req = slots.filter(function (q) { return q.s[5]; }), opt = shuffle(R, slots.filter(function (q) { return !q.s[5]; }));
    var want = P.items[0] + Math.floor(R() * (P.items[1] - P.items[0] + 1));
    var items = [], used = {}, counts = {};
    function tryPut(q) {
      var cat = S.CATS[q.s[3]], tries = 0;
      while (tries++ < 6) {
        var type = pick(R, cat);
        var lim = BIG[type] || 2;
        if ((counts[type] || 0) >= lim) continue;
        var it = dressItem(place(type, q.s, R, true), R, n);
        if (type === 'lights' || type === 'flags') it.flip = false;
        var bx = box(it);
        if (!inFrame(bx)) continue;
        var clash = items.some(function (o) { var ov = inter(bx, o.box); return ov > 0.05 * Math.min(area(bx), area(o.box)); });
        if (clash) continue;
        it.box = bx; it.slot = q.i;
        if (q.s[3] === 'wide') it.fixed = true;
        items.push(it); used[q.i] = true; counts[type] = (counts[type] || 0) + 1;
        return true;
      }
      return false;
    }
    req.forEach(tryPut);
    for (var k = 0; k < opt.length && items.length < want; k++) tryPut(opt[k]);

    // крупные сзади, мелкие спереди
    items.sort(function (a, b) { return area(b.box) - area(a.box) || a.box.y1 - b.box.y1; });

    /* ---------- Отличия ---------- */
    var left = items.map(function (q) { return JSON.parse(JSON.stringify(q)); });
    var right = items.map(function (q) { return JSON.parse(JSON.stringify(q)); });
    var diffs = [];
    function freeOf(bx, skipIdx) { // не пересекается ни с другими отличиями, ни с предметами
      if (diffs.some(function (d) { return inter(bx, d.box, 8) > 0; })) return false;
      return items.every(function (o, i) { return i === skipIdx || inter(bx, o.box, 4) === 0; });
    }
    function scale(it) { return it.s * it.s; }

    var order = shuffle(R, items.map(function (_, i) { return i; }));
    var freeSlots = shuffle(R, slots.filter(function (q) { return !used[q.i]; }));
    var guard = 0;
    while (diffs.length < P.diffs && guard++ < 400) {
      var kind = pick(R, P.kinds);
      var side = R() < 0.6 ? right : left;
      if (kind === 'add') {
        var q = freeSlots.shift();
        if (!q) continue;
        var type = pick(R, S.CATS[q.s[3]]);
        if (type === 'lights' || type === 'flags' || type === 'house' || type === 'tree') continue;
        var it = dressItem(place(type, q.s, R, false), R, n);
        var bx = box(it);
        if (!inFrame(bx) || maxDim(type) * it.s < P.minSize || B[type].area * scale(it) < P.minArea || !freeOf(bx, -1)) continue;
        it.box = bx;
        var a2 = JSON.parse(JSON.stringify(it)), b2 = JSON.parse(JSON.stringify(it));
        (side === right ? a2 : b2).removed = true; // предмет есть только на одной картинке
        left.push(a2); right.push(b2); items.push(it);
        diffs.push({ idx: items.length - 1, kind: 'add', box: bx });
        continue;
      }
      var idx = -1;
      for (var o = 0; o < order.length; o++) {
        var c = order[o];
        if (diffs.some(function (d) { return d.idx === c; }) || items[c].fixed) continue;
        if (maxDim(items[c].type) * items[c].s < P.minSize) continue;
        if (!freeOf(items[c].box, c)) continue;
        idx = c; break;
      }
      if (idx < 0) break;
      var base = items[idx], sp = A.ITEMS[base.type], m = B[base.type], tg = side[idx], sc = scale(base), dbox = base.box, ok = false;
      var big = area(base.box) > 9000 || base.slot !== undefined && scene.slots[base.slot][5];
      if (kind === 'remove' && !big && m.area * sc >= P.minArea) { tg.removed = true; ok = true; }
      else if (kind === 'color') {
        var cs = farColors(sp.colors, base.c);
        if (cs.length && m.col * sc >= P.minArea) { tg.c = pick(R, cs); ok = true; }
      } else if (kind === 'color2') {
        var c2 = farColors(sp.colors2, base.c2);
        if (c2.length && m.col2 * sc >= P.minArea) { tg.c2 = pick(R, c2); ok = true; }
      } else if (kind === 'detail') {
        var dk = shuffle(R, sp.details.slice()).filter(function (k) { return m.det[k] * sc >= P.minArea && (base.type !== 'flags'); });
        if (dk.length) { tg.d[dk[0]] = false; ok = true; }
      } else if (kind === 'flip' && sp.flip && m.flip * sc >= P.minArea) { tg.flip = !base.flip; ok = true; dbox = box(tg); dbox = union(dbox, base.box); }
      else if (kind === 'move' && !big && m.area * sc >= P.minArea) {
        var dx = (R() < 0.5 ? -1 : 1) * (maxDim(base.type) * base.s * 0.45 + 12);
        [dx, -dx].some(function (ddx) {
          var t2 = { type: base.type, x: base.x + ddx, y: base.y, s: base.s, flip: base.flip }, nb = box(t2);
          if (inFrame(nb) && freeOf(nb, idx)) { tg.x = t2.x; dbox = union(nb, base.box); ok = true; return true; }
          return false;
        });
      } else if (kind === 'size' && !big && m.area * sc >= P.minArea) {
        var f = maxDim(base.type) * base.s < 60 ? 1.35 : 0.72;
        var cx = (base.box.x0 + base.box.x1) / 2, by = base.box.y1;
        var t3 = { type: base.type, s: base.s * f, flip: base.flip, x: 0, y: 0 }, b3 = box(t3);
        t3.x = cx - (b3.x0 + b3.x1) / 2; t3.y = by - b3.y1;
        var nb3 = box(t3);
        if (inFrame(nb3) && freeOf(union(nb3, base.box), idx)) { tg.s = t3.s; tg.x = t3.x; tg.y = t3.y; dbox = union(nb3, base.box); ok = true; }
      }
      if (!ok) { order.push(order.splice(order.indexOf(idx), 1)[0]); continue; }
      if (!freeOf(dbox, idx)) { // отличие задело соседа или другое отличие — откатываем
        side[idx] = JSON.parse(JSON.stringify(base)); order.push(order.splice(order.indexOf(idx), 1)[0]); continue;
      }
      diffs.push({ idx: idx, kind: kind, box: dbox });
    }
    return { num: n, need: P.diffs, sceneId: sceneId, scene: scene, festive: isFestive(n), left: left, right: right, diffs: diffs, zoom: n >= 21 };
  }

  function renderSide(sceneId, items) {
    var body = '';
    (items || []).forEach(function (q, i) { if (!q.removed) body += '<g data-i="' + i + '">' + A.render(q) + '</g>'; });
    return S.BG[sceneId]() + body;
  }

  window.LEVELS = { W: W, H: H, COUNT: COUNT, build: build, renderSide: renderSide, diffCount: diffCount, params: params, sceneOf: sceneOf, isFestive: isFestive, box: box };
})();
