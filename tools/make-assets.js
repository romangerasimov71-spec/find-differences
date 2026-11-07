// Материалы для каталога VK Игр: node tools/make-assets.js  → vk-assets/
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'vk-assets');
fs.mkdirSync(out, { recursive: true });
const art = fs.readFileSync(path.join(root, 'src/js/art.js'), 'utf8');
const lv = fs.readFileSync(path.join(root, 'src/js/levels.js'), 'utf8');

const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 10%,#2f52bd 0%,#1a2f7a 50%,#101d52 100%)}
svg{position:absolute}
</style></head><body><div class="bg"></div>${body}<script>${art}\n${lv}</script><script>
function it(type,x,y,s,extra){var sp=ART.ITEMS[type],d={};sp.details.forEach(function(k){d[k]=true});var o={type:type,x:x,y:y,s:s,d:d};if(extra)for(var k in extra)o[k]=extra[k];return ART.render(o)}
function snow(n,w,h){var s='';for(var i=0;i<n;i++){var x=(i*137.5)%w,y=(i*89.3)%h;s+='<circle cx="'+x+'" cy="'+y+'" r="'+(1.5+(i%3))+'" fill="rgba(255,255,255,.75)"/>'}return s}
</script><script>__DRAW__</script></body></html>`;

(async () => {
  const b = await chromium.launch();
  async function render(file, w, h, draw, scale = 1) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await p.setContent(page(w, h, '<svg id="s" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"></svg>').replace('__DRAW__', draw));
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, file) });
    await p.close();
  }
  const OUT = '#1d2b5c';
  // Иконка 576×576 — без текста
  await render('icon-576.png', 576, 576, `
    var s=document.getElementById('s');
    s.innerHTML=snow(40,576,576)+
      '<circle cx="288" cy="300" r="230" fill="rgba(255,214,90,0.12)"/>'+
      '<path d="M-10,470 Q150,420 288,436 Q430,420 586,470 L586,600 L-10,600 Z" fill="#f2f7ff" stroke="${OUT}" stroke-width="6"/>'+
      it('tree',288,290,3.1)+it('gift',150,470,1.05)+it('giftround',426,466,1.0)+
      '<g transform="translate(288,95)"><ellipse rx="70" ry="66" fill="none" stroke="${OUT}" stroke-width="16"/><ellipse rx="70" ry="66" fill="none" stroke="#ffc233" stroke-width="8"/></g>';
  `);
  // Фавикон 32×32 — упрощённый
  await render('favicon-32.png', 32, 32, `
    document.querySelector('.bg').style.background='#1f3a8f';
    document.getElementById('s').innerHTML='<path d="M16 3l11 21H5z" fill="#33b35a" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/><rect x="13" y="24" width="6" height="5" fill="#a8693a"/><circle cx="13" cy="17" r="2" fill="#e8423f"/><circle cx="19" cy="20" r="2" fill="#ffc233"/><circle cx="16" cy="4" r="2.4" fill="#ffc233"/>';
  `);
  // Обложка 1120×630 — с названием
  await render('cover-1120x630.png', 1120, 630, `
    var s=document.getElementById('s');
    var L=LEVELS.build(2);
    function card(x,y,w,items,rot){var h=w*340/400;return '<g transform="translate('+x+','+y+') rotate('+rot+')"><rect x="-6" y="-6" width="'+(w+12)+'" height="'+(h+12)+'" rx="22" fill="${OUT}"/><svg x="0" y="0" width="'+w+'" height="'+h+'" viewBox="0 0 400 340"><clipPath id="c'+x+'"><rect width="400" height="340" rx="16"/></clipPath><g clip-path="url(#c'+x+')">'+LEVELS.renderSide(L.scene,items)+'</g></svg></g>'}
    var d=L.diffs[0];
    s.innerHTML=snow(60,1120,630)+card(560,150,330,L.left,-4)+card(790,190,300,L.right,5)+
      '<text x="60" y="190" font-size="84" font-weight="900" fill="#fff" stroke="${OUT}" stroke-width="10" paint-order="stroke" stroke-linejoin="round">Найди</text>'+
      '<text x="60" y="290" font-size="84" font-weight="900" fill="#fff" stroke="${OUT}" stroke-width="10" paint-order="stroke" stroke-linejoin="round">отличия</text>'+
      '<g transform="translate(70,330) rotate(-3)"><rect width="330" height="84" rx="26" fill="#ffc233" stroke="${OUT}" stroke-width="7"/><text x="165" y="58" text-anchor="middle" font-size="50" font-weight="900" fill="${OUT}">Новый год</text></g>'+
      '<path d="M-20,560 Q200,500 420,540 Q700,500 1140,560 L1140,700 L-20,700 Z" fill="#f2f7ff" stroke="${OUT}" stroke-width="6"/>'+
      it('snowman',120,500,1.1)+it('gift',260,540,0.9)+it('giftround',360,536,0.85)+it('bunny',470,540,0.8,{flip:true});
  `);
  // Скриншоты 600×1200 — из реальной игры
  const p = await b.newPage({ viewport: { width: 300, height: 600 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.join(root, 'src/index.html'));
  await p.waitForSelector('#scr-menu.active'); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(out, 'screen-1-menu.png') });
  await p.evaluate(() => { window.__game.save.stars[1] = 3; window.__game.start(7); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(out, 'screen-2-game.png') });
  const boxes = await p.evaluate(() => window.__game.state.boxes);
  const bx = await p.locator('#pic-b svg').boundingBox();
  for (let i = 0; i < 3; i++) { await p.mouse.click(bx.x + boxes[i].cx * bx.width / 400, bx.y + boxes[i].cy * bx.height / 340); await p.waitForTimeout(100); }
  await p.waitForTimeout(800);
  await p.click('#btn-hint'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, 'screen-3-found.png') });
  for (let i = 3; i < boxes.length; i++) { await p.mouse.click(bx.x + boxes[i].cx * bx.width / 400, bx.y + boxes[i].cy * bx.height / 340); await p.waitForTimeout(100); }
  await p.waitForTimeout(1800);
  await p.screenshot({ path: path.join(out, 'screen-4-win.png') });
  await b.close();
  console.log(fs.readdirSync(out).map(f => f + ' ' + fs.statSync(path.join(out, f)).size).join('\n'));
})();
