// Автотест всех 100 уровней в браузере:
//  - число отличий верное; рамки отличий не пересекаются;
//  - все предметы целиком в кадре (getBBox);
//  - каждое отличие видно: внутри его рамки достаточно изменившихся пикселей;
//  - вне рамок отличий картинки совпадают (нет случайных отличий).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<html><body style="margin:0"></body></html>');
  for (const f of ['art', 'bounds', 'scenes', 'levels']) await p.addScriptTag({ path: path.join(__dirname, '../src/js/' + f + '.js') });
  const res = await p.evaluate(async () => {
    const L = window.LEVELS, ns = 'http://www.w3.org/2000/svg', K = 2, W = 400 * K, H = 340 * K;
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 400 340'); svg.setAttribute('width', 400); svg.setAttribute('height', 340);
    document.body.appendChild(svg);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d', { willReadFrequently: true });
    async function pix(inner) {
      const s = '<svg xmlns="' + ns + '" width="' + W + '" height="' + H + '" viewBox="0 0 400 340">' + inner + '</svg>';
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); await img.decode();
      cx.clearRect(0, 0, W, H); cx.drawImage(img, 0, 0); return cx.getImageData(0, 0, W, H).data;
    }
    const errors = [], stats = [];
    for (let n = 1; n <= L.COUNT; n++) {
      const lv = L.build(n), P = L.params(n);
      if (lv.diffs.length !== P.diffs) errors.push(n + ': отличий ' + lv.diffs.length + ' вместо ' + P.diffs);
      lv.diffs.forEach((d, i) => lv.diffs.forEach((e, j) => {
        if (j > i && Math.min(d.box.x1, e.box.x1) > Math.max(d.box.x0, e.box.x0) && Math.min(d.box.y1, e.box.y1) > Math.max(d.box.y0, e.box.y0)) errors.push(n + ': отличия ' + i + ' и ' + j + ' пересекаются');
      }));
      for (const side of [lv.left, lv.right]) {
        svg.innerHTML = L.renderSide(lv.sceneId, side);
        svg.querySelectorAll('[data-i]').forEach(g => {
          const bb = g.getBBox();
          if (bb.x < -0.5 || bb.y < -0.5 || bb.x + bb.width > 400.5 || bb.y + bb.height > 340.5) errors.push(n + ': ' + side[+g.dataset.i].type + ' за кадром ' + [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height].map(Math.round));
        });
      }
      const a = await pix(L.renderSide(lv.sceneId, lv.left)), c = await pix(L.renderSide(lv.sceneId, lv.right));
      const mask = new Uint8Array(W * H);
      for (let i = 0, q = 0; i < a.length; i += 4, q++) {
        const d = Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]);
        if (d > 60) mask[q] = 1;
      }
      const inside = new Uint8Array(W * H); let minPx = 1e9;
      lv.diffs.forEach((d, i) => {
        let cnt = 0;
        for (let y = Math.floor(d.box.y0 * K) - 2; y < Math.ceil(d.box.y1 * K) + 2; y++) for (let x = Math.floor(d.box.x0 * K) - 2; x < Math.ceil(d.box.x1 * K) + 2; x++) {
          if (x < 0 || y < 0 || x >= W || y >= H) continue; const q = y * W + x; inside[q] = 1; cnt += mask[q];
        }
        const units = cnt / (K * K); // изменившаяся площадь в квадратных единицах сцены
        minPx = Math.min(minPx, units);
        if (units < P.minArea * 0.5) errors.push(n + ': отличие ' + lv.left[d.idx].type + ':' + d.kind + ' слабо заметно (' + Math.round(units) + ' ед²)');
      });
      let stray = 0; for (let q = 0; q < mask.length; q++) if (mask[q] && !inside[q]) stray++;
      if (stray > 8) errors.push(n + ': случайные различия вне отличий, пикселей ' + stray);
      stats.push(Math.round(minPx));
    }
    return { errors, stats };
  });
  console.log('Минимальная площадь отличия по уровням (ед²):', res.stats.join(' '));
  if (res.errors.length) { console.log('ОШИБКИ:\n' + res.errors.join('\n')); process.exitCode = 1; }
  else console.log('OK: все 100 уровней прошли автотест');
  await b.close();
})();
