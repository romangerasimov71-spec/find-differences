/* Библиотека новогодних предметов в SVG.
   Каждый предмет рисуется в локальных координатах вокруг (0,0), примерно в квадрате -50..50.
   Параметры: o.c — основной цвет, o.c2 — второй цвет, o.d — набор деталей (true = есть). */
(function () {
  'use strict';

  var OUT = '#1d2b5c';         // тёмно-синий контур
  var HL = 'rgba(255,255,255,0.45)'; // блик
  var SH = 'rgba(16,24,64,0.18)';    // мягкая тень

  var PAL = {
    red: '#e8423f', gold: '#ffc233', green: '#33b35a', blue: '#3d8bff', purple: '#9d5cf0',
    pink: '#ff74b1', orange: '#ff8f2b', teal: '#22c7b8', white: '#ffffff', brown: '#a8693a',
    sky: '#8fd3ff', navy: '#2b3f8c', lime: '#9be15d', dkgreen: '#1f8a52'
  };

  function g(inner, extra) {
    return '<g stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"' + (extra || '') + '>' + inner + '</g>';
  }
  function p(d, fill, more) { return '<path d="' + d + '" fill="' + fill + '"' + (more || '') + '/>'; }
  function c(cx, cy, r, fill, more) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (more || '') + '/>'; }
  function e(cx, cy, rx, ry, fill, more) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (more || '') + '/>'; }
  function r(x, y, w, h, rx, fill, more) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '"' + (more || '') + '/>'; }
  var NS = ' stroke="none"';
  function hl(d) { return p(d, HL, NS); }
  function shadow(cx, cy, rx, ry) { return e(cx, cy, rx, ry, SH, NS); }
  function starPts(cx, cy, R, rr, n, rot) {
    n = n || 5; rot = rot === undefined ? -Math.PI / 2 : rot;
    var pts = [];
    for (var i = 0; i < n * 2; i++) {
      var a = rot + i * Math.PI / n, rad = i % 2 ? rr : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return pts.join(' ');
  }
  function star(cx, cy, R, rr, fill, more) {
    return '<polygon points="' + starPts(cx, cy, R, rr) + '" fill="' + fill + '"' + (more || '') + '/>';
  }
  function shade(hex, k) { // k<0 темнее, k>0 светлее
    var n = parseInt(hex.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }
    return '#' + ((1 << 24) + (f(R) << 16) + (f(G) << 8) + f(B)).toString(16).slice(1);
  }
  function eyes(x1, x2, y, rad) {
    rad = rad || 3.2;
    return c(x1, y, rad, OUT, NS) + c(x2, y, rad, OUT, NS) + c(x1 + 1, y - 1.2, 1, '#fff', NS) + c(x2 + 1, y - 1.2, 1, '#fff', NS);
  }
  function smile(x, y, w) { return '<path d="M' + (x - w) + ',' + y + ' Q' + x + ',' + (y + w * 0.9) + ' ' + (x + w) + ',' + y + '" fill="none" stroke-width="3"/>'; }
  function cheeks(x1, x2, y) { return e(x1, y, 4, 2.6, 'rgba(255,105,140,0.55)', NS) + e(x2, y, 4, 2.6, 'rgba(255,105,140,0.55)', NS); }

  var ITEMS = {};
  function def(id, spec) { spec.id = id; ITEMS[id] = spec; }

  /* ===== Ёлка ===== */
  def('tree', {
    name: 'ёлка', w: 104, h: 128, colors: [PAL.green, PAL.dkgreen], colors2: [PAL.red, PAL.blue, PAL.gold, PAL.purple],
    details: ['star', 'balls'],
    draw: function (o) {
      var s = shadow(0, 58, 44, 7) + r(-9, 40, 18, 18, 3, '#8b5a2b');
      var t = p('M0,-12 L48,42 Q0,54 -48,42 Z', o.c) + p('M0,-36 L38,10 Q0,19 -38,10 Z', o.c) + p('M0,-58 L28,-20 Q0,-12 -28,-20 Z', o.c);
      var h = hl('M0,-8 L-38,38 Q-30,42 -22,43 Z') + hl('M0,-32 L-30,8 Q-23,11 -16,12 Z') + hl('M0,-54 L-20,-22 Q-15,-19 -10,-18 Z');
      var garland = '<path d="M-36,30 Q0,40 34,22 M-26,-2 Q0,8 26,-6" fill="none" stroke="' + PAL.gold + '" stroke-width="3.5"/>';
      var balls = '';
      if (o.d.balls) {
        [[-22, 34], [18, 30], [-12, 4], [16, 0], [0, -24], [32, 42], [-36, 42]].forEach(function (q, i) {
          balls += c(q[0], q[1], 5.5, i % 2 ? o.c2 : PAL.gold, ' stroke-width="3"') + c(q[0] - 1.7, q[1] - 1.7, 1.6, '#fff', NS);
        });
      }
      var st = o.d.star ? star(0, -62, 15, 6.5, PAL.gold) + c(-3, -66, 2.5, '#fff', NS) : '';
      return g(s + t + h + garland + balls + st);
    }
  });

  /* ===== Ёлка в снегу (улица) ===== */
  def('fir', {
    name: 'ель', w: 84, h: 120, colors: [PAL.dkgreen, '#2a9d6a'], details: ['snow'],
    draw: function (o) {
      var s = shadow(0, 56, 34, 6) + r(-7, 40, 14, 16, 3, '#7a4c26');
      var t = p('M0,-10 L40,44 Q0,52 -40,44 Z', o.c) + p('M0,-36 L30,8 Q0,15 -30,8 Z', o.c) + p('M0,-60 L22,-22 Q0,-16 -22,-22 Z', o.c);
      var sn = o.d.snow ? p('M-26,26 Q-14,20 -2,27 Q10,20 24,25 L30,32 Q0,38 -32,33 Z', '#fff', ' stroke-width="3"') +
        p('M-18,-6 Q-8,-11 2,-6 Q12,-11 20,-6 L24,0 Q0,5 -24,0 Z', '#fff', ' stroke-width="3"') +
        p('M-9,-46 Q0,-52 9,-46 L13,-40 Q0,-36 -13,-40 Z', '#fff', ' stroke-width="3"') : '';
      return g(s + t + hl('M0,-6 L-32,40 Q-26,43 -20,44 Z') + sn);
    }
  });

  /* ===== Подарок ===== */
  def('gift', {
    name: 'подарок', w: 76, h: 76, colors: [PAL.red, PAL.blue, PAL.purple, PAL.teal, PAL.pink], colors2: [PAL.gold, '#fff', PAL.lime],
    details: ['bow'],
    draw: function (o) {
      var s = shadow(0, 34, 38, 6);
      var box = r(-30, -12, 60, 46, 5, o.c) + r(-35, -24, 70, 16, 5, shade(o.c, 0.12));
      var rib = r(-7, -12, 14, 46, 0, o.c2) + r(-7, -24, 14, 16, 0, o.c2);
      var h = hl('M-26,-8 L-18,-8 L-18,30 L-26,30 Z');
      var bow = o.d.bow ? p('M0,-24 C-10,-44 -32,-40 -22,-28 C-18,-24 -8,-24 0,-24 Z', o.c2) + p('M0,-24 C10,-44 32,-40 22,-28 C18,-24 8,-24 0,-24 Z', o.c2) + c(0, -25, 5, o.c2) : '';
      return g(s + box + rib + h + bow);
    }
  });

  /* ===== Ёлочный шар ===== */
  def('ball', {
    name: 'шар', w: 66, h: 80, colors: [PAL.red, PAL.blue, PAL.purple, PAL.pink, PAL.teal], colors2: [PAL.gold, '#fff'],
    details: ['band'],
    draw: function (o) {
      var hook = '<path d="M0,-38 Q-6,-48 0,-50 Q6,-48 0,-38" fill="none" stroke-width="3"/>';
      var cap = r(-9, -38, 18, 10, 2, PAL.gold);
      var body = c(0, 4, 32, o.c);
      var band = o.d.band ? p('M-31,-2 Q-16,-12 0,-2 Q16,8 31,-2 L31,10 Q16,20 0,10 Q-16,0 -31,10 Z', o.c2, ' stroke-width="3"') : '';
      var h = e(-13, -10, 8, 12, HL, NS + ' transform="rotate(30 -13 -10)"') + c(-20, 6, 3, HL, NS);
      return g(hook + cap + body + band + h);
    }
  });

  /* ===== Звезда ===== */
  def('star', {
    name: 'звезда', w: 84, h: 80, colors: [PAL.gold, '#ffe066', PAL.orange],
    details: ['face'],
    draw: function (o) {
      var s = star(0, 4, 42, 19, o.c);
      var h = hl('M-4,-30 L-10,-10 L-28,-8 L-12,-4 Z');
      var f = o.d.face ? eyes(-8, 8, 2, 3) + smile(0, 10, 6) + cheeks(-14, 14, 11) : '';
      return g(s + h + f);
    }
  });

  /* ===== Снеговик ===== */
  def('snowman', {
    name: 'снеговик', w: 84, h: 124, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple],
    details: ['hat', 'nose', 'buttons'],
    draw: function (o) {
      var s = shadow(0, 58, 38, 7);
      var arms = '<path d="M-22,-2 L-44,-18 M-38,-14 L-44,-8 M22,-2 L44,-18 M38,-14 L42,-24" fill="none" stroke="#6b4423" stroke-width="4"/>';
      var body = c(0, 30, 30, '#fff') + c(0, -10, 22, '#fff') + c(0, -40, 17, '#fff');
      var h = e(-10, 18, 6, 10, 'rgba(160,200,255,0.0)', NS) + p('M14,10 Q26,26 18,46 Q30,30 14,10', 'rgba(140,180,240,0.35)', NS) +
        p('M10,-24 Q18,-14 12,-2 Q22,-12 10,-24', 'rgba(140,180,240,0.35)', NS);
      var scarf = p('M-17,-28 Q0,-20 17,-28 L18,-20 Q0,-12 -18,-20 Z', o.c) + p('M8,-22 L14,-4 L6,-4 L2,-20 Z', o.c);
      var face = eyes(-6, 6, -44, 2.8) + smile(0, -36, 5);
      var nose = o.d.nose ? p('M0,-41 L16,-38 L0,-36 Z', PAL.orange, ' stroke-width="2.5"') : '';
      var btn = o.d.buttons ? c(0, -12, 2.8, OUT, NS) + c(0, -2, 2.8, OUT, NS) + c(0, 22, 3, OUT, NS) + c(0, 34, 3, OUT, NS) : '';
      var hat = o.d.hat ? r(-15, -58, 30, 4, 2, '#33395c') + r(-10, -76, 20, 20, 2, '#33395c') + r(-10, -64, 20, 5, 0, o.c, ' stroke-width="2.5"') : '';
      return g(s + arms + body + h + scarf + face + nose + btn + hat);
    }
  });

  /* ===== Карамельная трость ===== */
  def('cane', {
    name: 'леденец-трость', w: 50, h: 100, colors: [PAL.red, PAL.green, PAL.blue], flip: true, details: ['bow'],
    draw: function (o) {
      var d = 'M10,46 L10,-24 A16,16 0 0 0 -22,-24';
      var base = '<path d="' + d + '" fill="none" stroke="' + OUT + '" stroke-width="18"/>' +
        '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="11"/>' +
        '<path d="' + d + '" fill="none" stroke="' + o.c + '" stroke-width="11" stroke-dasharray="7 8" stroke-linecap="butt"/>';
      var h = '<path d="M7,40 L7,-22" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>';
      var bow = o.d.bow ? p('M10,8 C0,-4 -14,4 -4,12 Z', PAL.green) + p('M10,8 C20,-4 34,4 24,12 Z', PAL.green) + c(10, 9, 4.5, PAL.green) : '';
      return g(base + h + bow);
    }
  });

  /* ===== Носок ===== */
  def('stocking', {
    name: 'носок', w: 70, h: 92, colors: [PAL.red, PAL.green, PAL.blue, PAL.purple], flip: true, details: ['star'],
    draw: function (o) {
      var body = p('M-14,-30 L16,-30 L16,14 Q16,22 22,26 L30,32 Q38,42 28,46 Q22,48 12,44 L-10,34 Q-22,28 -18,14 Z', o.c);
      var h = hl('M-10,-26 L-4,-26 L-4,20 Q-6,26 -10,24 Z');
      var heel = p('M16,26 Q24,30 30,34 Q36,42 28,45 Q22,46 16,42 Z', shade(o.c, -0.25), NS);
      var cuff = r(-20, -44, 42, 16, 6, '#fff');
      var st = o.d.star ? star(-1, 2, 10, 4.5, PAL.gold, ' stroke-width="2.5"') : '';
      var loop = '<path d="M-14,-44 Q-22,-56 -10,-56 Q-6,-52 -8,-44" fill="none" stroke-width="3"/>';
      return g(loop + body + heel + h + cuff + st);
    }
  });

  /* ===== Колокольчик ===== */
  def('bell', {
    name: 'колокольчик', w: 70, h: 80, colors: [PAL.gold, '#ffd56a', '#e8b04a'], colors2: [PAL.red, PAL.green, PAL.blue], details: ['bow'],
    draw: function (o) {
      var clapper = c(0, 32, 7, shade(o.c, -0.2));
      var body = p('M0,-28 C-18,-28 -20,-10 -22,6 C-24,20 -32,22 -32,28 L32,28 C32,22 24,20 22,6 C20,-10 18,-28 0,-28 Z', o.c);
      var h = hl('M-8,-22 C-16,-12 -16,4 -18,16 L-12,16 C-11,2 -10,-10 -4,-20 Z');
      var bow = o.d.bow ? p('M0,-30 C-10,-46 -32,-42 -22,-30 Z', o.c2) + p('M0,-30 C10,-46 32,-42 22,-30 Z', o.c2) + c(0, -31, 5, o.c2) : c(0, -32, 5, o.c);
      return g(clapper + body + h + bow);
    }
  });

  /* ===== Свеча ===== */
  def('candle', {
    name: 'свеча', w: 54, h: 96, colors: [PAL.red, '#fff6e0', PAL.blue, PAL.green], details: ['flame', 'drip'],
    draw: function (o) {
      var glow = o.d.flame ? c(0, -38, 20, 'rgba(255,214,90,0.35)', NS) : '';
      var plate = e(0, 40, 26, 8, PAL.gold);
      var body = r(-12, -22, 24, 62, 4, o.c);
      var drip = o.d.drip ? p('M-12,-18 Q-6,-14 -6,-6 Q-6,0 -2,-6 L0,-16 Q4,-12 6,-14 L12,-18 L12,-22 L-12,-22 Z', shade(o.c, 0.35), ' stroke-width="2.5"') : '';
      var h = hl('M-8,-16 L-3,-16 L-3,34 L-8,34 Z');
      var wick = '<path d="M0,-22 L0,-28" stroke-width="3"/>';
      var fl = o.d.flame ? p('M0,-50 C8,-40 8,-30 0,-28 C-8,-30 -8,-40 0,-50 Z', PAL.orange, ' stroke-width="3"') + p('M0,-42 C4,-36 4,-32 0,-31 C-4,-32 -4,-36 0,-42 Z', '#ffec80', NS) : '';
      return g(glow + plate + body + drip + h + wick + fl);
    }
  });

  /* ===== Пряничный человечек ===== */
  def('ginger', {
    name: 'пряник', w: 76, h: 90, colors: [PAL.red, PAL.green, PAL.blue, PAL.pink],
    details: ['buttons', 'smile'],
    draw: function (o) {
      var b = '#c97b3c';
      var body = p('M0,-44 C12,-44 16,-34 14,-26 L34,-18 C42,-14 38,-4 30,-6 L16,-10 L18,10 L28,34 C32,44 20,48 16,40 L0,20 L-16,40 C-20,48 -32,44 -28,34 L-18,10 L-16,-10 L-30,-6 C-38,-4 -42,-14 -34,-18 L-14,-26 C-16,-34 -12,-44 0,-44 Z', b);
      var icing = '<path d="M-32,-14 q2,-3 4,0 q2,3 4,0 M24,-14 q2,-3 4,0 q2,3 4,0 M-24,36 q2,-3 4,0 q2,3 4,0 M20,36 q2,-3 4,0 q2,3 4,0" fill="none" stroke="#fff" stroke-width="2.5"/>';
      var face = eyes(-5, 5, -32, 2.6) + (o.d.smile ? '<path d="M-6,-24 Q0,-19 6,-24" fill="none" stroke="#fff" stroke-width="2.5"/>' : '');
      var btn = o.d.buttons ? c(0, -12, 3.6, o.c, ' stroke-width="2"') + c(0, -1, 3.6, o.c, ' stroke-width="2"') + c(0, 10, 3.6, o.c, ' stroke-width="2"') : '';
      var h = hl('M-8,-40 C-12,-38 -12,-32 -10,-30 Z');
      return g(body + h + icing + face + btn);
    }
  });

  /* ===== Варежка ===== */
  def('mitten', {
    name: 'варежка', w: 60, h: 78, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple, PAL.pink], flip: true, details: ['pattern'],
    draw: function (o) {
      var body = p('M-18,24 L-20,-14 C-21,-30 -10,-38 2,-38 C16,-38 20,-28 20,-14 L20,-4 L26,-12 C32,-18 40,-12 34,-4 L22,12 L20,24 Z', o.c);
      var cuff = r(-23, 22, 46, 16, 5, '#fff');
      var h = hl('M-14,-20 C-14,-28 -8,-32 -2,-32 C-8,-28 -10,-22 -10,-14 L-10,14 L-14,14 Z');
      var pat = o.d.pattern ? '<path d="M0,-18 L0,6 M-10,-6 L10,-6 M-7,-13 L7,1 M7,-13 L-7,1" fill="none" stroke="#fff" stroke-width="3"/>' : '';
      var dots = '<path d="M-16,30 L16,30" stroke="' + shade(o.c, 0) + '" stroke-width="3" stroke-dasharray="1 6"/>';
      return g(body + h + pat + cuff + dots);
    }
  });

  /* ===== Шапка Деда Мороза ===== */
  def('hat', {
    name: 'колпак', w: 80, h: 70, colors: [PAL.red, PAL.blue, PAL.green], flip: true, details: ['pompom'],
    draw: function (o) {
      var cone = p('M-30,18 C-26,-14 -6,-30 14,-28 C26,-27 34,-18 34,-6 C28,-14 22,-14 18,-8 C26,0 28,10 30,18 Z', o.c);
      var h = hl('M-22,12 C-18,-8 -6,-20 6,-22 C-4,-14 -12,-2 -14,12 Z');
      var fur = r(-36, 14, 72, 16, 8, '#fff');
      var pom = o.d.pompom ? c(34, -8, 9, '#fff') : '';
      return g(cone + h + fur + pom);
    }
  });

  /* ===== Снежинка ===== */
  def('flake', {
    name: 'снежинка', w: 70, h: 70, colors: ['#bfe6ff', '#ffffff', '#a6c8ff'],
    details: ['tips'],
    draw: function (o) {
      var arm = 'M0,0 L0,-30 M0,-16 L-8,-24 M0,-16 L8,-24' + (o.d.tips ? ' M0,-26 L-5,-31 M0,-26 L5,-31' : '');
      var all = '', i;
      for (i = 0; i < 6; i++) all += '<path d="' + arm + '" transform="rotate(' + (i * 60) + ')"/>';
      return '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="' + OUT + '" stroke-width="9">' + all + '</g><g stroke="' + o.c + '" stroke-width="4.5">' + all + '</g></g>' +
        c(0, 0, 6, o.c, ' stroke="' + OUT + '" stroke-width="3"');
    }
  });

  /* ===== Фонарь ===== */
  def('lantern', {
    name: 'фонарик', w: 56, h: 90, colors: [PAL.red, PAL.navy, PAL.green, PAL.gold], details: ['light'],
    draw: function (o) {
      var glow = o.d.light ? c(0, 6, 28, 'rgba(255,214,90,0.35)', NS) : '';
      var ring = '<path d="M0,-42 m-7,0 a7,7 0 1 1 14,0" fill="none" stroke-width="3.5"/>';
      var top = p('M-18,-26 L0,-38 L18,-26 Z', o.c) + r(-20, -28, 40, 6, 3, o.c);
      var glass = r(-15, -22, 30, 44, 4, o.d.light ? '#ffe27a' : '#5c6ea8');
      var fl = o.d.light ? p('M0,-8 C6,0 6,8 0,10 C-6,8 -6,0 0,-8 Z', PAL.orange, ' stroke-width="2.5"') : '';
      var bars = '<path d="M-6,-22 L-6,22 M6,-22 L6,22" stroke-width="3"/>';
      var base = r(-20, 22, 40, 8, 3, o.c) + r(-14, 30, 28, 6, 3, shade(o.c, -0.2));
      var h = hl('M-12,-18 L-9,-18 L-9,18 L-12,18 Z');
      return g(glow + ring + top + glass + fl + bars + base + h);
    }
  });

  /* ===== Венок ===== */
  def('wreath', {
    name: 'венок', w: 84, h: 90, colors: [PAL.red, PAL.gold, PAL.blue], details: ['bow', 'berries'],
    draw: function (o) {
      var ring = c(0, 0, 32, 'none', ' stroke="' + OUT + '" stroke-width="22"') + c(0, 0, 32, PAL.dkgreen === o.c ? PAL.green : 'none', ' stroke="' + PAL.green + '" stroke-width="15"');
      var leaves = '', i;
      for (i = 0; i < 12; i++) {
        leaves += '<path d="M0,-38 Q7,-32 0,-24 Q-7,-32 0,-38 Z" fill="' + PAL.dkgreen + '" stroke-width="2.5" transform="rotate(' + (i * 30 + 10) + ')"/>';
      }
      var ber = '';
      if (o.d.berries) [[-24, 18], [26, 14], [-30, -10], [22, -24], [0, 32]].forEach(function (q) { ber += c(q[0], q[1], 4.5, PAL.red, ' stroke-width="2.5"'); });
      var bow = o.d.bow ? p('M0,30 C-12,18 -30,26 -18,38 Z', o.c) + p('M0,30 C12,18 30,26 18,38 Z', o.c) + p('M-2,32 L-10,50 L-4,48 L0,34 Z', o.c, ' stroke-width="3"') + p('M2,32 L10,50 L4,48 L0,34 Z', o.c, ' stroke-width="3"') + c(0, 31, 5.5, o.c) : '';
      return g(ring + leaves + ber + bow);
    }
  });

  /* ===== Остролист ===== */
  def('holly', {
    name: 'остролист', w: 76, h: 56, colors: [PAL.red, PAL.gold, PAL.purple], flip: true, details: ['third'],
    draw: function (o) {
      var leaf = 'M0,0 Q-6,-6 -12,-4 Q-14,-10 -20,-10 Q-22,-16 -30,-16 Q-26,-4 -18,2 Q-22,8 -16,12 Q-8,8 0,0 Z';
      var l1 = p(leaf, PAL.green, ' transform="translate(2,4) scale(1.2)"');
      var l2 = p(leaf, PAL.dkgreen, ' transform="translate(-2,4) scale(-1.2,1.2)"');
      var b = c(-6, 0, 7, o.c) + c(6, 0, 7, o.c) + (o.d.third ? c(0, -9, 7, o.c) : '');
      var h = c(-8, -2, 2, '#fff', NS) + c(4, -2, 2, '#fff', NS) + (o.d.third ? c(-2, -11, 2, '#fff', NS) : '');
      return g(l1 + l2 + b + h);
    }
  });

  /* ===== Печенье ===== */
  def('cookie', {
    name: 'печенье', w: 64, h: 64, colors: ['#fff', PAL.pink, PAL.sky], details: ['sprinkles'],
    draw: function (o) {
      var base = c(0, 0, 28, '#d99a52');
      var icing = p('M-20,-6 Q-22,-20 -6,-22 Q10,-26 18,-14 Q26,-2 18,10 Q8,22 -6,18 Q-22,14 -20,-6 Z', o.c, ' stroke-width="3"');
      var spr = '';
      if (o.d.sprinkles) [[-8, -8, PAL.red, 20], [6, -12, PAL.green, -30], [10, 4, PAL.blue, 60], [-6, 8, PAL.gold, 10], [0, -2, PAL.purple, -60]].forEach(function (q) {
        spr += r(q[0] - 4, q[1] - 1.5, 8, 3, 1.5, q[2], NS + ' transform="rotate(' + q[3] + ' ' + q[0] + ' ' + q[1] + ')"');
      });
      return g(shadow(0, 26, 26, 5) + base + icing + spr + c(-14, 18, 2, '#8a5a2c', NS) + c(18, 16, 2, '#8a5a2c', NS));
    }
  });

  /* ===== Кружка какао ===== */
  def('mug', {
    name: 'кружка', w: 72, h: 84, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple], flip: true, details: ['steam', 'marsh'],
    draw: function (o) {
      var steam = o.d.steam ? '<path d="M-10,-30 Q-16,-38 -10,-46 Q-4,-54 -10,-62 M6,-30 Q0,-38 6,-46 Q12,-54 6,-62" fill="none" stroke="#fff" stroke-width="4" opacity="0.85"/>' : '';
      var handle = '<path d="M22,-8 C40,-8 40,22 22,22" fill="none" stroke="' + OUT + '" stroke-width="13"/><path d="M22,-8 C40,-8 40,22 22,22" fill="none" stroke="' + o.c + '" stroke-width="6"/>';
      var body = p('M-26,-22 L26,-22 L22,30 Q22,36 16,36 L-16,36 Q-22,36 -22,30 Z', o.c);
      var top = e(0, -22, 26, 7, '#7a4527');
      var marsh = o.d.marsh ? r(-14, -28, 10, 9, 3, '#fff', ' stroke-width="2.5"') + r(2, -27, 10, 9, 3, '#ffd7e6', ' stroke-width="2.5"') : '';
      var heart = p('M0,4 C-4,-2 -12,0 -10,6 C-8,12 0,16 0,16 C0,16 8,12 10,6 C12,0 4,-2 0,4 Z', '#fff', ' stroke-width="2.5"');
      var h = hl('M-20,-14 L-15,-14 L-14,28 L-17,28 Z');
      return g(shadow(0, 36, 30, 5) + steam + handle + body + h + top + marsh + heart);
    }
  });

  /* ===== Санки ===== */
  def('sled', {
    name: 'санки', w: 100, h: 56, colors: [PAL.red, PAL.blue, PAL.green, PAL.orange], flip: true, details: ['rope'],
    draw: function (o) {
      var run = '<path d="M-42,18 L34,18 Q48,18 46,4" fill="none" stroke="' + OUT + '" stroke-width="10"/><path d="M-42,18 L34,18 Q48,18 46,4" fill="none" stroke="#c0cae8" stroke-width="4.5"/>';
      var legs = r(-32, 0, 6, 18, 2, '#c0cae8', ' stroke-width="3"') + r(20, 0, 6, 18, 2, '#c0cae8', ' stroke-width="3"');
      var seat = r(-44, -12, 84, 14, 6, o.c);
      var slats = '<path d="M-24,-12 L-24,2 M-4,-12 L-4,2 M16,-12 L16,2" stroke-width="3"/>';
      var h = hl('M-40,-9 L36,-9 L36,-6 L-40,-6 Z');
      var rope = o.d.rope ? '<path d="M40,-6 Q56,-20 50,-34" fill="none" stroke="' + PAL.gold + '" stroke-width="4"/>' : '';
      return g(shadow(0, 24, 46, 5) + legs + run + seat + slats + h + rope);
    }
  });

  /* ===== Мишка ===== */
  def('bear', {
    name: 'мишка', w: 76, h: 90, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple], details: ['bow', 'ears'],
    draw: function (o) {
      var b = '#c98b55', bl = '#efc79a';
      var ears = o.d.ears ? c(-18, -36, 9, b) + c(18, -36, 9, b) + c(-18, -36, 4, bl, NS) + c(18, -36, 4, bl, NS) : c(-18, -36, 9, b) + c(-18, -36, 4, bl, NS);
      var body = e(0, 18, 26, 26, b) + c(-22, 36, 10, b) + c(22, 36, 10, b) + e(0, 22, 14, 15, bl, NS) + c(-26, 6, 9, b) + c(26, 6, 9, b);
      var head = c(0, -20, 22, b) + e(0, -12, 10, 7, bl, ' stroke-width="2.5"');
      var face = eyes(-8, 8, -22, 2.8) + e(0, -15, 4, 3, OUT, NS) + '<path d="M-4,-8 Q0,-5 4,-8" fill="none" stroke-width="2.5"/>';
      var bow = o.d.bow ? p('M0,2 L-14,-6 L-14,10 Z', o.c, ' stroke-width="3"') + p('M0,2 L14,-6 L14,10 Z', o.c, ' stroke-width="3"') + c(0, 2, 4, o.c, ' stroke-width="3"') : '';
      return g(shadow(0, 44, 32, 5) + ears + body + head + hl('M-14,-30 Q-8,-38 2,-38 Q-8,-34 -12,-26 Z') + face + bow);
    }
  });

  /* ===== Барабан ===== */
  def('drum', {
    name: 'барабан', w: 80, h: 76, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple], details: ['sticks'],
    draw: function (o) {
      var sticks = o.d.sticks ? '<path d="M-8,-22 L-34,-44 M8,-22 L34,-44" stroke="' + OUT + '" stroke-width="7"/><path d="M-8,-22 L-34,-44 M8,-22 L34,-44" stroke="#e0b07a" stroke-width="3"/>' + c(-35, -45, 5, '#fff') + c(35, -45, 5, '#fff') : '';
      var body = p('M-32,-14 L-32,24 Q0,36 32,24 L32,-14 Z', o.c);
      var zig = '<path d="M-30,-8 L-18,22 L-6,-6 L6,26 L18,-6 L30,22" fill="none" stroke="' + PAL.gold + '" stroke-width="3.5"/>';
      var rim = e(0, 22, 33, 9, 'none', ' stroke-width="0"') + p('M-32,20 Q0,34 32,20 L32,26 Q0,40 -32,26 Z', PAL.gold, ' stroke-width="3"');
      var top = e(0, -14, 32, 10, '#fff7e8') + p('M-32,-14 Q0,-2 32,-14 L32,-8 Q0,4 -32,-8 Z', PAL.gold, ' stroke-width="3"');
      return g(shadow(0, 32, 36, 5) + body + zig + rim + top + sticks + hl('M-26,-2 L-22,-2 L-22,20 L-26,18 Z'));
    }
  });

  /* ===== Часы ===== */
  def('clock', {
    name: 'часы', w: 74, h: 74, colors: [PAL.red, PAL.gold, PAL.blue, PAL.green], details: ['late'],
    draw: function (o) {
      var face = c(0, 0, 33, o.c) + c(0, 0, 25, '#fffaf0', ' stroke-width="3"');
      var ticks = '', i;
      for (i = 0; i < 12; i++) ticks += '<path d="M0,-21 L0,' + (i % 3 ? -19 : -16) + '" stroke-width="2.5" transform="rotate(' + i * 30 + ')"/>';
      // без «late» стрелки показывают почти полночь (11:55), с «late» — 12:15
      var hands = o.d.late ? '<path d="M0,0 L0,-15 M0,0 L14,0" stroke-width="3.5"/>' : '<path d="M0,0 L-2,-15 M0,0 L-6,-17" stroke-width="3.5"/>';
      return g(face + ticks + hands + c(0, 0, 3, PAL.red, ' stroke-width="2"') + hl('M-26,-14 Q-22,-26 -10,-30 Q-22,-22 -24,-10 Z'));
    }
  });

  /* ===== Домик ===== */
  def('house', {
    name: 'домик', w: 110, h: 110, colors: [PAL.red, '#c2793d', PAL.blue, PAL.teal], details: ['chimney', 'light', 'wreath'],
    draw: function (o) {
      var chim = o.d.chimney ? r(18, -46, 14, 26, 2, '#8a5a3a') + r(15, -50, 20, 7, 3, '#fff') : '';
      var wall = r(-40, -8, 80, 60, 3, o.c);
      var roof = p('M-52,-4 L0,-48 L52,-4 Z', '#4a5da8');
      var snow = p('M-54,-4 L0,-50 L54,-4 Q44,2 36,-2 Q26,6 16,-2 Q6,4 -6,-2 Q-18,6 -28,-2 Q-40,4 -54,-4 Z', '#fff');
      var win = r(-32, 6, 24, 22, 3, o.d.light ? '#ffe27a' : '#5c6ea8') + '<path d="M-20,6 L-20,28 M-32,17 L-8,17" stroke-width="3"/>';
      var door = r(6, 12, 22, 40, 3, '#7a4527') + c(23, 32, 2, PAL.gold, NS);
      var wr = o.d.wreath ? c(17, 22, 6, 'none', ' stroke="' + PAL.green + '" stroke-width="4"') : '';
      return g(shadow(0, 54, 54, 6) + chim + wall + hl('M-36,-4 L-30,-4 L-30,48 L-36,48 Z') + roof + snow + win + door + wr);
    }
  });

  /* ===== Луна ===== */
  def('moon', {
    name: 'луна', w: 70, h: 76, colors: ['#ffe48a', '#fff2b8', PAL.gold], details: ['face'],
    draw: function (o) {
      var m = p('M10,-36 A38,38 0 1 0 22,30 A30,30 0 1 1 10,-36 Z', o.c);
      var f = o.d.face ? '<path d="M-8,-6 Q-4,-2 0,-6" fill="none" stroke-width="3"/>' + cheeks(-12, -12, 4).slice(0, 0) + e(-10, 6, 4, 2.6, 'rgba(255,105,140,0.55)', NS) + '<path d="M-14,14 Q-8,18 -2,14" fill="none" stroke-width="3"/>' : '';
      return g(m + hl('M-20,-20 Q-28,-4 -22,14 Q-30,-2 -20,-20 Z') + f);
    }
  });

  /* ===== Облачко ===== */
  def('cloud', {
    name: 'облако', w: 100, h: 54, colors: ['#ffffff', '#dde8ff'], details: [],
    draw: function (o) {
      return g(p('M-40,16 Q-50,16 -48,4 Q-46,-8 -32,-6 Q-30,-22 -12,-20 Q0,-32 16,-20 Q34,-24 36,-6 Q50,-4 48,8 Q46,18 36,16 Z', o.c));
    }
  });

  /* ===== Пингвин ===== */
  def('penguin', {
    name: 'пингвин', w: 70, h: 96, colors: [PAL.red, PAL.blue, PAL.green, PAL.gold], flip: true, details: ['scarf', 'hat'],
    draw: function (o) {
      var feet = e(-10, 44, 9, 5, PAL.orange) + e(10, 44, 9, 5, PAL.orange);
      var body = p('M0,-40 C22,-40 28,-14 28,10 C28,34 18,44 0,44 C-18,44 -28,34 -28,10 C-28,-14 -22,-40 0,-40 Z', '#2c3a6e');
      var wings = p('M-26,-2 Q-40,16 -30,28 Q-26,14 -24,4 Z', '#2c3a6e') + p('M26,-2 Q40,16 30,28 Q26,14 24,4 Z', '#2c3a6e');
      var belly = p('M0,-22 C14,-22 18,-4 18,12 C18,30 12,38 0,38 C-12,38 -18,30 -18,12 C-18,-4 -14,-22 0,-22 Z', '#fff', NS);
      var face = eyes(-7, 7, -22, 3) + p('M-5,-15 L5,-15 L0,-9 Z', PAL.orange, ' stroke-width="2.5"') + cheeks(-13, 13, -12);
      var scarf = o.d.scarf ? p('M-20,-6 Q0,2 20,-6 L20,2 Q0,10 -20,2 Z', o.c, ' stroke-width="3"') + p('M10,0 L16,18 L8,18 L4,2 Z', o.c, ' stroke-width="3"') : '';
      var hat = o.d.hat ? p('M-16,-34 Q0,-56 16,-34 Z', o.c, ' stroke-width="3"') + c(0, -50, 5, '#fff', ' stroke-width="3"') + r(-17, -38, 34, 7, 3, '#fff', ' stroke-width="3"') : '';
      return g(shadow(0, 46, 28, 5) + feet + wings + body + belly + hl('M-18,-28 Q-12,-36 -4,-38 Q-14,-30 -16,-20 Z') + face + scarf + hat);
    }
  });

  /* ===== Сова ===== */
  def('owl', {
    name: 'сова', w: 70, h: 84, colors: ['#9a6a45', '#7d6bb0', '#5f86b8'], details: ['tufts', 'open'],
    draw: function (o) {
      var tufts = o.d.tufts ? p('M-24,-28 L-28,-44 L-12,-34 Z', o.c) + p('M24,-28 L28,-44 L12,-34 Z', o.c) : '';
      var body = p('M0,-38 C24,-38 30,-16 30,8 C30,30 18,40 0,40 C-18,40 -30,30 -30,8 C-30,-16 -24,-38 0,-38 Z', o.c);
      var belly = e(0, 16, 16, 20, shade(o.c, 0.45), NS) + '<path d="M-8,8 q4,4 8,0 q4,4 8,0 M-10,18 q5,4 10,0 q5,4 10,0" fill="none" stroke="' + shade(o.c, -0.2) + '" stroke-width="2.5"/>';
      var eyeW = c(-11, -16, 11, '#fff') + c(11, -16, 11, '#fff');
      var pup = o.d.open ? c(-10, -16, 5, OUT, NS) + c(12, -16, 5, OUT, NS) + c(-9, -18, 1.6, '#fff', NS) + c(13, -18, 1.6, '#fff', NS) :
        '<path d="M-17,-16 Q-11,-11 -5,-16 M5,-16 Q11,-11 17,-16" fill="none" stroke-width="3"/>';
      var beak = p('M-4,-6 L4,-6 L0,2 Z', PAL.orange, ' stroke-width="2.5"');
      var feet = '<path d="M-10,40 l-3,5 M-10,40 l0,6 M-10,40 l3,5 M10,40 l-3,5 M10,40 l0,6 M10,40 l3,5" stroke="' + PAL.orange + '" stroke-width="3"/>';
      return g(tufts + body + belly + eyeW + pup + beak + feet + hl('M-22,-20 Q-22,-30 -14,-34 Q-20,-26 -18,-16 Z'));
    }
  });

  /* ===== Зайчик ===== */
  def('bunny', {
    name: 'зайчик', w: 70, h: 100, colors: [PAL.red, PAL.blue, PAL.green, PAL.pink], flip: true, details: ['scarf', 'ear'],
    draw: function (o) {
      var earL = p('M-12,-30 C-20,-56 -12,-66 -6,-58 C-2,-50 -2,-40 -4,-30 Z', '#fff') + p('M-10,-34 C-14,-52 -10,-58 -7,-54 C-5,-48 -5,-40 -6,-34 Z', '#ffc2d6', NS);
      var earR = o.d.ear ? p('M12,-30 C20,-56 12,-66 6,-58 C2,-50 2,-40 4,-30 Z', '#fff') + p('M10,-34 C14,-52 10,-58 7,-54 C5,-48 5,-40 6,-34 Z', '#ffc2d6', NS)
        : p('M6,-32 C10,-48 26,-52 32,-44 C26,-42 18,-38 10,-28 Z', '#fff');
      var body = e(0, 20, 24, 26, '#fff') + e(-14, 44, 10, 5, '#fff') + e(14, 44, 10, 5, '#fff');
      var head = c(0, -16, 20, '#fff');
      var face = eyes(-7, 7, -18, 2.8) + e(0, -11, 3, 2.2, '#ff7aa0', NS) + '<path d="M-4,-7 Q0,-4 0,-8 Q0,-4 4,-7" fill="none" stroke-width="2.5"/>' + cheeks(-12, 12, -10);
      var scarf = o.d.scarf ? p('M-17,-2 Q0,6 17,-2 L18,6 Q0,14 -18,6 Z', o.c, ' stroke-width="3"') + p('M-12,4 L-16,22 L-8,22 L-6,6 Z', o.c, ' stroke-width="3"') : '';
      return g(shadow(0, 46, 28, 5) + earL + earR + body + head + face + scarf + p('M14,14 Q24,20 18,32 Q26,22 14,14', 'rgba(140,180,240,0.35)', NS));
    }
  });

  /* ===== Снегирь ===== */
  def('bullfinch', {
    name: 'снегирь', w: 72, h: 60, colors: [PAL.red, '#ff6b4a', PAL.pink], flip: true, details: ['cap'],
    draw: function (o) {
      var tail = p('M-24,2 L-44,-6 L-40,10 Z', '#33395c');
      var body = p('M-28,4 C-28,-18 -8,-26 8,-24 C24,-22 30,-10 30,2 C30,18 16,26 0,26 C-16,26 -28,18 -28,4 Z', '#8b97b8');
      var breast = p('M30,0 C30,18 16,26 0,26 C-10,26 -16,22 -18,16 C-6,18 10,10 14,-8 C22,-10 30,-6 30,0 Z', o.c, ' stroke-width="3"');
      var wing = p('M-20,-4 Q-4,-10 8,2 Q-6,10 -20,6 Z', '#5a6488', ' stroke-width="3"') + '<path d="M-16,2 L4,2" stroke="#fff" stroke-width="2.5"/>';
      var cap = o.d.cap ? p('M6,-24 C20,-24 30,-14 30,-4 L20,-6 C14,-12 8,-14 2,-14 Z', '#33395c', ' stroke-width="3"') : '';
      var face = c(18, -8, 3, OUT, NS) + c(19, -9, 1, '#fff', NS) + p('M28,-6 L36,-2 L28,2 Z', '#33395c', ' stroke-width="2.5"');
      var legs = '<path d="M-4,26 L-6,34 M6,26 L6,34" stroke-width="3"/>';
      return g(legs + tail + body + breast + wing + cap + face + hl('M-20,-8 Q-14,-20 -2,-22 Q-14,-16 -18,-4 Z'));
    }
  });

  /* ===== Шишка ===== */
  def('cone', {
    name: 'шишка', w: 46, h: 66, colors: ['#a8693a', '#8c5a34', '#c08048'], details: ['snow'],
    draw: function (o) {
      var body = p('M0,-30 C18,-24 22,0 14,18 C8,30 -8,30 -14,18 C-22,0 -18,-24 0,-30 Z', o.c);
      var rows = [[-18, [-6, 6]], [-6, [-12, 0, 12]], [6, [-14, -2, 10]], [18, [-8, 4]]], dd = '';
      rows.forEach(function (rw) { rw[1].forEach(function (x) { dd += 'M' + (x - 6) + ',' + rw[0] + ' Q' + x + ',' + (rw[0] + 9) + ' ' + (x + 6) + ',' + rw[0] + ' '; }); });
      var sc = '<path d="' + dd + '" fill="' + shade(o.c, 0.18) + '" stroke-width="2.5"/>';
      var stem = r(-3, -38, 6, 9, 2, '#7a4527', ' stroke-width="3"');
      var sn = o.d.snow ? p('M-12,-22 Q0,-34 12,-22 Q6,-18 0,-22 Q-6,-17 -12,-22 Z', '#fff', ' stroke-width="2.5"') : '';
      return g(stem + body + sc + sn + hl('M-10,-14 Q-12,0 -10,10 L-6,10 Q-8,0 -6,-14 Z'));
    }
  });

  /* ===== Мандарин ===== */
  def('tangerine', {
    name: 'мандарин', w: 62, h: 62, colors: [PAL.orange, '#ffa63d', '#ff7a1a'], details: ['leaf'],
    draw: function (o) {
      var body = e(0, 4, 26, 23, o.c);
      var dots = c(-10, 10, 1.4, shade(o.c, -0.25), NS) + c(8, 14, 1.4, shade(o.c, -0.25), NS) + c(12, 0, 1.4, shade(o.c, -0.25), NS) + c(-2, 18, 1.4, shade(o.c, -0.25), NS);
      var leaf = o.d.leaf ? p('M2,-18 Q14,-34 28,-26 Q16,-14 2,-18 Z', PAL.green, ' stroke-width="3"') : '';
      return g(shadow(0, 26, 24, 4) + body + dots + e(-10, -6, 7, 5, HL, NS) + c(0, -18, 2.5, '#5a7a2a', ' stroke-width="2"') + leaf);
    }
  });

  /* ===== Сосулька ===== */
  def('icicle', {
    name: 'сосулька', w: 30, h: 70, colors: ['#bfe6ff', '#d9f1ff', '#a6c8ff'], details: ['drop'],
    draw: function (o) {
      return g(p('M-12,-32 L12,-32 Q10,0 0,30 Q-10,0 -12,-32 Z', o.c) + hl('M-7,-28 L-3,-28 L-2,6 Z') +
        (o.d.drop ? p('M0,36 C3,40 3,44 0,44 C-3,44 -3,40 0,36 Z', o.c, ' stroke-width="2.5"') : ''));
    }
  });

  /* ===== Мешок с подарками ===== */
  def('sack', {
    name: 'мешок', w: 84, h: 92, colors: [PAL.red, '#b0703a', PAL.blue], details: ['toys'],
    draw: function (o) {
      var toys = o.d.toys ? r(-22, -44, 20, 20, 3, PAL.blue, ' stroke-width="3"') + '<path d="M-12,-44 L-12,-24" stroke="' + PAL.gold + '" stroke-width="4"/>' + c(10, -36, 11, PAL.green, ' stroke-width="3"') + star(14, -50, 10, 4.5, PAL.gold, ' stroke-width="3"') : '';
      var top = p('M-24,-26 Q0,-40 24,-26 L18,-16 L-18,-16 Z', shade(o.c, -0.15));
      var body = p('M-18,-16 Q-40,4 -36,26 Q-32,46 0,46 Q32,46 36,26 Q40,4 18,-16 Z', o.c);
      var tie = r(-20, -20, 40, 8, 4, PAL.gold, ' stroke-width="3"');
      var patch = r(10, 12, 14, 14, 2, PAL.gold, ' stroke-width="2.5" stroke-dasharray="3 3"');
      return g(shadow(0, 46, 36, 5) + toys + top + body + hl('M-24,0 Q-30,16 -26,32 Q-22,18 -16,4 Z') + tie + patch);
    }
  });

  /* ===== Конёк ===== */
  def('skate', {
    name: 'конёк', w: 80, h: 76, colors: ['#fff', PAL.pink, PAL.sky], colors2: [PAL.red, PAL.blue, PAL.green], flip: true, details: ['pompom'],
    draw: function (o) {
      var blade = '<path d="M-30,30 L30,30 Q40,30 38,22" fill="none" stroke="' + OUT + '" stroke-width="8"/><path d="M-30,30 L30,30 Q40,30 38,22" fill="none" stroke="#d6dcf0" stroke-width="3.5"/>' +
        r(-24, 18, 5, 12, 1, '#d6dcf0', ' stroke-width="3"') + r(16, 18, 5, 12, 1, '#d6dcf0', ' stroke-width="3"');
      var boot = p('M-24,18 L-24,-30 Q-24,-38 -14,-38 L4,-38 L6,-6 Q24,-6 30,6 Q34,18 26,18 Z', o.c);
      var lace = '<path d="M-2,-30 L8,-26 M-2,-22 L8,-18 M-2,-14 L8,-10" stroke="' + o.c2 + '" stroke-width="3"/>';
      var pom = o.d.pompom ? c(-4, -42, 7, o.c2, ' stroke-width="3"') : '';
      return g(blade + boot + hl('M-20,-30 L-15,-30 L-15,14 L-20,14 Z') + lace + pom);
    }
  });

  /* ===== Хлопушка ===== */
  def('cracker', {
    name: 'хлопушка', w: 46, h: 86, colors: [PAL.purple, PAL.red, PAL.blue, PAL.teal], details: ['confetti'],
    draw: function (o) {
      var conf = '';
      if (o.d.confetti) [[-10, -44, PAL.red], [6, -50, PAL.gold], [14, -40, PAL.green], [-2, -56, PAL.blue], [-16, -54, PAL.pink]].forEach(function (q, i) {
        conf += r(q[0], q[1], 6, 6, 1.5, q[2], ' stroke-width="2" transform="rotate(' + (i * 25) + ' ' + q[0] + ' ' + q[1] + ')"');
      });
      var body = p('M-14,-30 L14,-30 L10,40 L-10,40 Z', o.c);
      var stripes = '<path d="M-13,-12 L13,-12 M-12,8 L12,8 M-11,26 L11,26" stroke="' + PAL.gold + '" stroke-width="4"/>';
      var top = e(0, -30, 14, 5, shade(o.c, 0.3));
      return g(conf + body + stripes + top + hl('M-10,-24 L-6,-24 L-6,34 L-8,34 Z'));
    }
  });

  /* ===== Гирлянда-флажки (широкая) ===== */
  def('flags', {
    name: 'флажки', w: 190, h: 50, colors: [PAL.red, PAL.blue, PAL.purple], details: ['extra'],
    draw: function (o) {
      var rope = '<path d="M-92,-16 Q0,8 92,-16" fill="none" stroke-width="3"/>';
      var cols = [o.c, PAL.gold, PAL.green, o.c, PAL.gold, PAL.green, o.c];
      var out = '', n = o.d.extra ? 7 : 6;
      for (var i = 0; i < n; i++) {
        var t = (i + 0.5) / n, x = -92 + t * 184, y = -16 + 4 * 24 * t * (1 - t) - 1;
        out += p('M' + (x - 10) + ',' + y + ' L' + (x + 10) + ',' + y + ' L' + x + ',' + (y + 22) + ' Z', cols[i], ' stroke-width="3"');
      }
      return g(rope + out);
    }
  });

  /* ===== Леденец на палочке ===== */
  def('lollipop', {
    name: 'леденец', w: 52, h: 90, colors: [PAL.pink, PAL.red, PAL.purple, PAL.teal], details: ['ribbon'],
    draw: function (o) {
      var stick = r(-3, 0, 6, 44, 3, '#fff', ' stroke-width="3"');
      var candy = c(0, -16, 22, '#fff') + '<path d="M0,-16 m-3,0 a3,3 0 1 1 6,0 a7,7 0 1 1 -12,0 a11,11 0 1 1 18,0 a15,15 0 1 1 -24,0" fill="none" stroke="' + o.c + '" stroke-width="5"/>' + c(0, -16, 22, 'none');
      var rib = o.d.ribbon ? p('M0,8 L-12,2 L-12,14 Z', PAL.gold, ' stroke-width="3"') + p('M0,8 L12,2 L12,14 Z', PAL.gold, ' stroke-width="3"') : '';
      return g(stick + candy + hl('M-14,-24 Q-10,-34 0,-36 Q-10,-30 -12,-20 Z') + rib);
    }
  });

  /* ===== Оловянный солдатик ===== */
  def('soldier', {
    name: 'солдатик', w: 46, h: 110, colors: [PAL.red, PAL.blue, PAL.green], details: ['plume'],
    draw: function (o) {
      var plume = o.d.plume ? p('M0,-50 C-10,-60 -4,-70 4,-64 C10,-60 6,-54 0,-50 Z', PAL.gold, ' stroke-width="3"') : '';
      var hat = r(-11, -50, 22, 22, 4, '#33395c');
      var head = c(0, -20, 10, '#ffd6b0');
      var body = r(-14, -10, 28, 30, 5, o.c) + '<path d="M-14,-10 L14,20 M14,-10 L-14,20" stroke="#fff" stroke-width="3"/>';
      var legs = r(-12, 20, 10, 30, 3, '#33395c') + r(2, 20, 10, 30, 3, '#33395c') + r(-14, 47, 28, 6, 3, '#1d2b5c');
      var belt = r(-15, 12, 30, 6, 2, PAL.gold, ' stroke-width="3"');
      return g(shadow(0, 54, 18, 4) + plume + legs + body + belt + head + eyes(-3.5, 3.5, -21, 1.8) + cheeks(-6, 6, -16) + hat + r(-13, -32, 26, 5, 2, PAL.gold, ' stroke-width="3"'));
    }
  });

  /* ===== Уличный фонарь ===== */
  def('lamppost', {
    name: 'фонарь', w: 50, h: 150, colors: ['#33395c', '#2b5c4a', '#5a3a6e'], details: ['light', 'ribbon'],
    draw: function (o) {
      var glow = o.d.light ? c(0, -52, 34, 'rgba(255,214,90,0.30)', NS) : '';
      var pole = r(-4, -36, 8, 104, 3, o.c) + r(-12, 62, 24, 10, 3, o.c);
      var head = p('M-16,-38 L16,-38 L12,-66 L-12,-66 Z', o.d.light ? '#ffe27a' : '#5c6ea8') + p('M-18,-66 L0,-80 L18,-66 Z', o.c) + r(-18, -40, 36, 6, 3, o.c);
      var rib = o.d.ribbon ? '<path d="M-4,-10 L4,-2 M-4,6 L4,14 M-4,22 L4,30" stroke="' + PAL.red + '" stroke-width="4"/>' + p('M0,-30 L-10,-36 L-10,-24 Z', PAL.red, ' stroke-width="2.5"') + p('M0,-30 L10,-36 L10,-24 Z', PAL.red, ' stroke-width="2.5"') : '';
      var snow = p('M-20,-66 Q0,-86 20,-66 Q10,-70 0,-68 Q-10,-71 -20,-66 Z', '#fff', ' stroke-width="2.5"');
      return g(glow + pole + head + snow + rib);
    }
  });

  /* ===== Сугроб ===== */
  def('drift', {
    name: 'сугроб', w: 110, h: 40, colors: ['#ffffff', '#eef4ff'], details: [],
    draw: function (o) { return g(p('M-54,18 Q-48,-10 -20,-8 Q-6,-22 14,-12 Q40,-18 54,18 Z', o.c) + p('M10,4 Q26,-4 42,10', 'none', ' stroke="#b9c9ee" stroke-width="3"')); }
  });

  /* ===== Подарочная коробка-цилиндр ===== */
  def('giftround', {
    name: 'коробка', w: 64, h: 74, colors: [PAL.teal, PAL.pink, PAL.gold, PAL.blue], details: ['dots'],
    draw: function (o) {
      var body = p('M-26,-12 L-26,26 Q0,38 26,26 L26,-12 Z', o.c);
      var lid = e(0, -14, 30, 10, shade(o.c, 0.15)) + p('M-30,-14 L-30,-6 Q0,6 30,-6 L30,-14', shade(o.c, 0.15));
      var dt = o.d.dots ? c(-14, 10, 4, '#fff', ' stroke-width="2"') + c(4, 16, 4, '#fff', ' stroke-width="2"') + c(16, 4, 4, '#fff', ' stroke-width="2"') : '';
      var bow = p('M0,-20 C-8,-36 -24,-30 -14,-20 Z', PAL.red) + p('M0,-20 C8,-36 24,-30 14,-20 Z', PAL.red) + c(0, -20, 4.5, PAL.red);
      return g(shadow(0, 32, 30, 5) + body + hl('M-22,-4 L-17,-2 L-17,26 L-22,24 Z') + dt + lid + bow);
    }
  });

  /* ===== Шарф (висящий) — для вешалки/каток ===== */
  def('scarf', {
    name: 'шарф', w: 50, h: 92, colors: [PAL.red, PAL.blue, PAL.green, PAL.purple], details: ['stripes'],
    draw: function (o) {
      var b = p('M-14,-40 L10,-40 L12,40 L-12,40 Z', o.c);
      var st = o.d.stripes ? '<path d="M-14,-20 L11,-20 M-13,0 L11,0 M-13,20 L12,20" stroke="#fff" stroke-width="5"/>' : '';
      var fr = '<path d="M-10,40 L-11,48 M-4,40 L-4,48 M2,40 L2,48 M8,40 L9,48" stroke-width="3"/>';
      return g(fr + b + st + hl('M-10,-36 L-6,-36 L-6,36 L-9,36 Z'));
    }
  });

  window.ART = {
    ITEMS: ITEMS, PAL: PAL, OUT: OUT, shade: shade, star: star, starPts: starPts,
    /* Отрисовать предмет на месте: inst = {type,x,y,s,c,c2,flip,rot,d} */
    render: function (inst) {
      var spec = ITEMS[inst.type];
      var o = { c: inst.c || spec.colors[0], c2: inst.c2 || (spec.colors2 ? spec.colors2[0] : PAL.gold), d: inst.d || {} };
      var sx = (inst.flip ? -1 : 1) * inst.s;
      var tr = 'translate(' + inst.x + ',' + inst.y + ')' + (inst.rot ? ' rotate(' + inst.rot + ')' : '') + ' scale(' + sx + ',' + inst.s + ')';
      return '<g transform="' + tr + '">' + spec.draw(o) + '</g>';
    }
  };
})();
