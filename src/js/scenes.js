/* Фоны и слоты сцен. Поле сцены: 400 × 340 единиц. */
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
        path('M306,252 Q300,232 314,222 Q312,236 322,236 Q318,218 330,206 Q334,226 344,226 Q352,236 346,252 Z', '#ff8f2b', ' class="fire" stroke="#ffc233" stroke-width="3" stroke-linejoin="round"') +
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


  /* Улица днём */
  BG.day = function () {
    var sky = rect(0, 0, W, H, '#8fd3ff') + '<circle cx="330" cy="58" r="30" fill="#ffe066"' + ST + '/>' +
      '<path d="M330,14 L330,4 M366,26 L374,18 M374,58 L384,58 M294,26 L286,18" stroke="#ffc233" stroke-width="5" stroke-linecap="round"/>';
    var town = '';
    [[0, 150, 54, '#c9e3ff'], [48, 132, 44, '#b7d6fa'], [86, 160, 50, '#c9e3ff'], [250, 140, 48, '#b7d6fa'], [292, 120, 46, '#c9e3ff'], [334, 150, 70, '#b7d6fa']].forEach(function (b) {
      town += rect(b[0], b[1], b[2], 220 - b[1], b[3]) + path('M' + b[0] + ',' + b[1] + ' L' + (b[0] + b[2] / 2) + ',' + (b[1] - 18) + ' L' + (b[0] + b[2]) + ',' + b[1] + ' Z', '#fff');
    });
    var far = path('M0,206 Q100,184 200,200 Q300,214 400,192 L400,340 L0,340 Z', '#dbe9ff', ST);
    var near = path('M0,246 Q110,228 210,244 Q310,258 400,238 L400,340 L0,340 Z', '#ffffff', ST);
    var track = path('M40,330 Q120,290 210,300 Q300,312 380,286', 'none', ' stroke="#c9d8f5" stroke-width="5" stroke-linecap="round"');
    return sky + town + far + near + track;
  };

  /* Праздничная площадь (каждый 10-й уровень) */
  BG.festive = function () {
    var sky = rect(0, 0, W, H, '#241a6b');
    var fw = '';
    [[70, 60, 34, '#ff74b1'], [330, 50, 40, '#ffc233'], [200, 30, 26, '#5fe0ff'], [130, 120, 22, '#9be15d'], [290, 118, 24, '#ff8f2b']].forEach(function (f, k) {
      var rays = '';
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6, x1 = f[0] + Math.cos(a) * f[2] * 0.35, y1 = f[1] + Math.sin(a) * f[2] * 0.35, x2 = f[0] + Math.cos(a) * f[2], y2 = f[1] + Math.sin(a) * f[2];
        rays += 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ';
      }
      fw += '<path class="burst b' + (k % 3) + '" d="' + rays + '" stroke="' + f[3] + '" stroke-width="4" stroke-linecap="round"/>' + '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="4" fill="#fff"/>';
    });
    var stars = skyStars([[20, 20, 3], [110, 16, 3], [250, 80, 3], [380, 120, 3], [30, 150, 2.5], [370, 14, 3]]);
    var square = path('M0,214 Q200,196 400,214 L400,340 L0,340 Z', '#f2f7ff', ST) +
      '<ellipse cx="200" cy="268" rx="150" ry="22" fill="#dfe8fa"/>';
    var posts = '';
    [30, 370].forEach(function (x) { posts += rect(x - 3, 150, 6, 70, '#33395c', ST) + '<circle cx="' + x + '" cy="146" r="9" fill="#ffe27a" class="glow"' + ST + '/>'; });
    return sky + stars + fw + square + posts;
  };

  /* ---------- Слоты: где на фоне может стоять предмет ----------
     [x, y, размер (наибольшая сторона, ед.), категория, привязка]
     привязка: b — низом к y (по умолчанию), c — центром, t — верхом; req — слот всегда занят */
  var CATS = {
    xtree: ['tree'], house: ['house'], lamp: ['lamppost'], wide: ['lights', 'flags'],
    wall: ['clock', 'wreath', 'ball', 'bell', 'lantern', 'star'],
    hang: ['stocking', 'mitten', 'scarf', 'stocking'],
    table: ['mug', 'candle', 'cookie', 'tangerine', 'ginger', 'cane', 'lollipop', 'cracker', 'holly', 'giftround', 'bell', 'ball'],
    sill: ['bullfinch', 'candle', 'tangerine', 'star', 'cone', 'cookie'],
    floor: ['gift', 'giftround', 'bear', 'drum', 'sack', 'soldier', 'lantern', 'hedgehog', 'bunny', 'cane', 'gift'],
    bigOut: ['snowman', 'deer', 'santa', 'snowmaiden', 'fir', 'snowman'],
    firs: ['fir', 'fir', 'lamppost', 'tree'], woods: ['fir', 'fir', 'tree'],
    skyNight: ['moon', 'cloud', 'star', 'flake', 'flake'],
    skyDay: ['cloud', 'flake', 'cloud', 'flake'],
    ground: ['gift', 'giftround', 'sack', 'sled', 'bunny', 'penguin', 'hedgehog', 'drift', 'cone', 'skate', 'mitten', 'hat', 'lantern'],
    perch: ['bullfinch', 'owl', 'bullfinch'],
    hangOut: ['lantern', 'ball', 'icicle', 'bell', 'scarf'],
    ice: ['penguin', 'skate', 'hat', 'mitten', 'hedgehog', 'bunny', 'penguin'],
    small: ['bell', 'ball', 'star', 'candle', 'tangerine', 'cone', 'cookie', 'lollipop', 'mug'],
    shelf: ['soldier', 'bell', 'star', 'clock', 'ball', 'bear', 'drum', 'lollipop', 'cracker', 'giftround', 'gift', 'lantern', 'ginger', 'cane', 'sack', 'mug', 'candle', 'hedgehog', 'bunny']
  };
  var SCENES = {
    living: { name: 'Гостиная', name_en: 'Living room', slots: [
      [70, 280, 150, 'xtree', 'b', 1], [186, 4, 190, 'wide', 't', 1],
      [58, 50, 46, 'wall', 'c'], [326, 60, 44, 'wall', 'c'], [266, 44, 36, 'wall', 'c'],
      [282, 132, 40, 'table'], [324, 132, 36, 'table'], [370, 132, 36, 'table'],
      [292, 148, 48, 'hang', 't'], [360, 148, 48, 'hang', 't'],
      [162, 122, 28, 'sill'], [212, 122, 28, 'sill'],
      [30, 318, 54, 'floor'], [118, 312, 52, 'floor'], [76, 334, 44, 'floor'], [198, 302, 64, 'floor'],
      [256, 320, 50, 'floor'], [332, 312, 54, 'floor'], [380, 330, 44, 'floor'], [160, 272, 42, 'floor'], [232, 262, 40, 'floor']
    ] },
    yard: { name: 'Двор ночью', name_en: 'Yard at night', slots: [
      [104, 236, 124, 'house', 'b', 1], [284, 274, 118, 'bigOut'], [366, 238, 104, 'firs'], [196, 268, 126, 'firs'],
      [340, 52, 62, 'skyNight', 'c'], [222, 44, 52, 'skyNight', 'c'], [58, 46, 40, 'skyNight', 'c'], [150, 86, 30, 'skyNight', 'c'], [272, 112, 28, 'skyNight', 'c'],
      [48, 256, 32, 'perch'], [100, 256, 30, 'perch'],
      [132, 320, 60, 'ground'], [40, 330, 40, 'ground'], [236, 318, 42, 'ground'], [334, 326, 52, 'ground'], [186, 334, 40, 'ground'], [384, 334, 36, 'ground'], [86, 336, 34, 'ground']
    ] },
    day: { name: 'Улица днём', name_en: 'Snowy street', slots: [
      [84, 254, 128, 'house', 'b', 1], [222, 270, 120, 'bigOut'], [342, 258, 120, 'bigOut'], [160, 236, 86, 'firs'],
      [120, 50, 56, 'skyDay', 'c'], [230, 70, 46, 'skyDay', 'c'], [40, 100, 34, 'skyDay', 'c'], [260, 140, 30, 'skyDay', 'c'],
      [40, 330, 48, 'ground'], [110, 324, 56, 'ground'], [180, 336, 42, 'ground'], [262, 330, 50, 'ground'], [330, 336, 44, 'ground'], [380, 312, 40, 'ground'], [290, 296, 36, 'ground']
    ] },
    forest: { name: 'Зимний лес', name_en: 'Winter forest', slots: [
      [72, 238, 126, 'woods', 'b', 1], [170, 212, 86, 'woods'], [242, 264, 100, 'woods'], [320, 290, 96, 'bigOut'],
      [334, 114, 46, 'perch'], [300, 128, 40, 'hangOut', 't'], [356, 126, 40, 'hangOut', 't'],
      [230, 52, 58, 'skyNight', 'c'], [120, 40, 50, 'skyNight', 'c'], [30, 42, 34, 'skyNight', 'c'], [176, 98, 26, 'skyNight', 'c'],
      [110, 322, 60, 'ground'], [30, 322, 38, 'ground'], [196, 334, 38, 'ground'], [262, 328, 44, 'ground'], [366, 330, 40, 'ground'], [150, 268, 36, 'ground']
    ] },
    rink: { name: 'Каток', name_en: 'Ice rink', slots: [
      [30, 272, 130, 'lamp', 'b', 1], [370, 272, 130, 'lamp', 'b', 1], [200, 96, 250, 'wide', 't', 1],
      [112, 224, 78, 'firs'], [292, 222, 78, 'firs'], [204, 232, 92, 'bigOut'],
      [200, 52, 54, 'skyNight', 'c'], [110, 36, 30, 'skyNight', 'c'], [300, 40, 34, 'skyNight', 'c'], [50, 70, 28, 'skyNight', 'c'], [352, 80, 26, 'skyNight', 'c'],
      [140, 304, 62, 'ice'], [268, 312, 56, 'ice'], [80, 318, 40, 'ice'], [336, 320, 44, 'ice'], [200, 330, 38, 'ice'], [200, 278, 36, 'ice']
    ] },
    kitchen: { name: 'Праздничный стол', name_en: 'Holiday table', slots: [
      [34, 120, 34, 'small'], [74, 120, 34, 'small'], [326, 120, 34, 'small'], [366, 120, 34, 'small'],
      [54, 164, 42, 'wall', 'c'], [350, 164, 42, 'wall', 'c'], [162, 124, 28, 'sill'], [238, 124, 28, 'sill'],
      [56, 238, 54, 'table'], [118, 234, 44, 'table'], [196, 236, 62, 'table'], [264, 238, 46, 'table'], [334, 236, 54, 'table'],
      [52, 318, 48, 'table'], [112, 326, 44, 'table'], [166, 318, 46, 'table'], [222, 328, 50, 'table'], [282, 320, 58, 'table'], [344, 326, 46, 'table']
    ] },
    shelf: { name: 'Полка с игрушками', name_en: 'Toy shelf', slots: [
      [62, 104, 66, 'shelf'], [134, 104, 66, 'shelf'], [204, 104, 66, 'shelf'], [274, 104, 66, 'shelf'], [342, 104, 66, 'shelf'],
      [62, 210, 70, 'shelf'], [134, 210, 70, 'shelf'], [204, 210, 70, 'shelf'], [274, 210, 70, 'shelf'], [342, 210, 70, 'shelf'],
      [62, 296, 66, 'shelf'], [134, 296, 66, 'shelf'], [204, 296, 66, 'shelf'], [274, 296, 66, 'shelf'], [342, 296, 66, 'shelf']
    ] },
    festive: { name: 'Новогодняя площадь', name_en: 'New Year square', slots: [
      [200, 262, 190, 'xtree', 'b', 1], [74, 278, 112, 'bigOut'], [328, 278, 112, 'bigOut'],
      [36, 330, 40, 'ground'], [110, 330, 50, 'ground'], [168, 334, 44, 'ground'], [236, 334, 44, 'ground'], [292, 330, 50, 'ground'], [366, 330, 40, 'ground'],
      [130, 230, 36, 'ground'], [270, 230, 36, 'ground']
    ] }
  };

  window.SCENES = { W: W, H: H, BG: BG, CATS: CATS, LIST: SCENES };
})();
