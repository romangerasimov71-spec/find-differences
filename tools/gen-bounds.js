// Замеряет рамки предметов (getBBox) и площадь изменения для каждой детали/цвета → src/js/bounds.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ path: path.join(__dirname, '../src/js/art.js') });
  const res = await p.evaluate(async () => {
    const A = window.ART, out = {};
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('width', 300); svg.setAttribute('height', 300); svg.setAttribute('viewBox', '-150 -150 300 300');
    document.body.appendChild(svg);
    const K = 2, SZ = 300 * K;
    const cv = document.createElement('canvas'); cv.width = SZ; cv.height = SZ; const cx = cv.getContext('2d', { willReadFrequently: true });
    async function pix(inst, bg) {
      const s = '<svg xmlns="' + ns + '" width="' + SZ + '" height="' + SZ + '" viewBox="-150 -150 300 300">' + A.render(inst) + '</svg>';
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      await img.decode(); cx.clearRect(0, 0, SZ, SZ); if (bg) { cx.fillStyle = bg; cx.fillRect(0, 0, SZ, SZ); } cx.drawImage(img, 0, 0); return cx.getImageData(0, 0, SZ, SZ).data;
    }
    async function dd(i1, i2) { let m = 1e9; for (const bg of ['#ffffff', '#1b2f78', '#ffd9a0']) m = Math.min(m, diff(await pix(i1, bg), await pix(i2, bg))); return m; }
    function diff(a, c) { let n = 0; for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) + Math.abs(a[i + 3] - c[i + 3]); if (d > 60) n++; } return Math.round(n / (K * K)); }
    function pixBox(d) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) { if (d[(y * SZ + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return [x0 / K - 150, y0 / K - 150, (x1 + 1) / K - 150, (y1 + 1) / K - 150]; }
    for (const [id, sp] of Object.entries(A.ITEMS)) {
      const all = {}; sp.details.forEach(k => all[k] = true);
      const base = { type: id, x: 0, y: 0, s: 1, d: all };
      const none = {}; sp.details.forEach(k => none[k] = false);
      const pb1 = pixBox(await pix(base)), pb2 = pixBox(await pix({ type: id, x: 0, y: 0, s: 1, d: none }));
      const x0 = Math.min(pb1[0], pb2[0]), y0 = Math.min(pb1[1], pb2[1]), x1 = Math.max(pb1[2], pb2[2]), y1 = Math.max(pb1[3], pb2[3]);
      const p0 = await pix(base);
      const det = {};
      for (const k of sp.details) det[k] = await dd(base, Object.assign({}, base, { d: Object.assign({}, all, { [k]: false }) }));
      const col = sp.colors.length > 1 ? await dd(base, Object.assign({}, base, { c: sp.colors[1] })) : 0;
      const col2 = sp.colors2 && sp.colors2.length > 1 ? await dd(base, Object.assign({}, base, { c2: sp.colors2[1] })) : 0;
      let total = 0; for (let i = 3; i < p0.length; i += 4) if (p0[i] > 40) total++;
      total = Math.round(total / (K * K));
      const flipA = sp.flip ? await dd(base, Object.assign({}, base, { flip: true })) : 0;
      out[id] = { b: [x0, y0, x1, y1].map(v => Math.round(v * 10) / 10), area: total, det, col, col2, flip: flipA };
    }
    return out;
  });
  fs.writeFileSync(path.join(__dirname, '../src/js/bounds.js'), '/* Сгенерировано tools/gen-bounds.js: рамки предметов при s=1 и площадь изменений (в пикселях) */\nwindow.BOUNDS = ' + JSON.stringify(res) + ';\n');
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(11), JSON.stringify(v.b), 'area', v.area, 'det', JSON.stringify(v.det), 'col', v.col, v.col2);
  await b.close();
})();
