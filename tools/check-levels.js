// Проверка: все уровни строятся, число отличий верное, каждое отличие реально меняет картинку.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['art.js', 'levels.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8'), ctx);
const { ART, LEVELS } = ctx.window;
let bad = 0;
// детали предметов действительно меняют рисунок
for (const [id, sp] of Object.entries(ART.ITEMS)) {
  const all = {}; sp.details.forEach(k => all[k] = true);
  const base = ART.render({ type: id, x: 0, y: 0, s: 1, d: all });
  for (const k of sp.details) {
    const d = Object.assign({}, all, { [k]: false });
    if (ART.render({ type: id, x: 0, y: 0, s: 1, d }) === base) { console.log('ДЕТАЛЬ НЕ ВИДНА', id, k); bad++; }
  }
  for (const c of sp.colors.slice(1)) if (ART.render({ type: id, x: 0, y: 0, s: 1, d: all, c }) === ART.render({ type: id, x: 0, y: 0, s: 1, d: all, c: sp.colors[0] })) { console.log('ЦВЕТ НЕ ВИДЕН', id, c); bad++; }
}
const kinds = {};
for (let n = 1; n <= LEVELS.COUNT; n++) {
  const L = LEVELS.build(n);
  if (L.diffs.length !== LEVELS.diffCount(n)) { console.log('Уровень', n, 'отличий', L.diffs.length, 'нужно', LEVELS.diffCount(n)); bad++; }
  for (const d of L.diffs) {
    kinds[d.kind] = (kinds[d.kind] || 0) + 1;
    const a = L.left[d.idx], b = L.right[d.idx];
    const ra = a.removed ? '' : ART.render(a), rb = b.removed ? '' : ART.render(b);
    if (ra === rb) { console.log('Уровень', n, 'отличие не видно', a.type, d.kind); bad++; }
  }
}
console.log('Типы отличий:', JSON.stringify(kinds));
console.log(bad ? 'ОШИБОК: ' + bad : 'OK: ' + LEVELS.COUNT + ' уровней, предметов ' + Object.keys(ART.ITEMS).length);
process.exit(bad ? 1 : 0);
