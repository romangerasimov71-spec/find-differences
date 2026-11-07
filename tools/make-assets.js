// Материалы для карточек: node tools/make-assets.js   (нужен сервер python3 -m http.server 8123 в src/)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const VK = path.join(root, 'vk-assets'), PG = path.join(root, 'playgama-assets');
[VK, PG].forEach(d => fs.mkdirSync(d, { recursive: true }));
const js = ['art', 'bounds', 'scenes', 'levels'].map(f => fs.readFileSync(path.join(root, 'src/js/' + f + '.js'), 'utf8')).join('\n');
const OUT = '#1d2b5c';
const page = (w, h, draw) => `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 10%,#2f52bd 0%,#1a2f7a 50%,#101d52 100%)} svg{position:absolute;left:0;top:0}
</style></head><body><div class="bg"></div><svg id="s" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg><script>${js}</script><script>
function it(type,x,y,s,extra){var sp=ART.ITEMS[type],d={};sp.details.forEach(function(k){d[k]=true});var o={type:type,x:x,y:y,s:s,d:d};if(extra)for(var k in extra)o[k]=extra[k];return ART.render(o)}
function snow(n,w,h){var s='';for(var i=0;i<n;i++){s+='<circle cx="'+((i*137.5)%w)+'" cy="'+((i*89.3)%h)+'" r="'+(1.5+(i%3)*1.2)+'" fill="rgba(255,255,255,.75)"/>'}return s}
function title(x,y,size,t1,t2,anchor,maxW){anchor=anchor||'middle';if(maxW)size=Math.min(size,maxW/(t1.length*0.6));var w2=t2.length*size*0.36+60;var bx=anchor==='middle'?x-w2/2:x;
 return '<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+size+'" font-weight="900" fill="#fff" stroke="${OUT}" stroke-width="'+size/8+'" paint-order="stroke" stroke-linejoin="round">'+t1+'</text>'+
 '<g transform="translate('+bx+','+(y+size*0.35)+') rotate(-3)"><rect width="'+w2+'" height="'+size*0.85+'" rx="'+size*0.28+'" fill="#ffc233" stroke="${OUT}" stroke-width="'+size/12+'"/><text x="'+w2/2+'" y="'+size*0.6+'" text-anchor="middle" font-size="'+size*0.55+'" font-weight="900" fill="${OUT}">'+t2+'</text></g>'}
function lights(x,y,s){return it('lights',x,y,s,{c:'#e8423f'})}
function hill(w,h,y){return '<path d="M-20,'+y+' Q'+w*0.25+','+(y-40)+' '+w*0.5+','+(y-20)+' Q'+w*0.75+','+(y-44)+' '+(w+20)+','+y+' L'+(w+20)+','+(h+20)+' L-20,'+(h+20)+' Z" fill="#f2f7ff" stroke="${OUT}" stroke-width="6"/>'}
function card(lv,x,y,w,items,rot,id){var h=w*340/400;return '<g transform="translate('+x+','+y+') rotate('+rot+')"><rect x="-7" y="-7" width="'+(w+14)+'" height="'+(h+14)+'" rx="24" fill="${OUT}"/><svg x="0" y="0" width="'+w+'" height="'+h+'" viewBox="0 0 400 340"><clipPath id="c'+id+'"><rect width="400" height="340" rx="16"/></clipPath><g clip-path="url(#c'+id+')">'+LEVELS.renderSide(lv.sceneId,items)+'</g></svg></g>'}
document.getElementById('s').innerHTML=(function(){${draw}})();
</script></body></html>`;
(async () => {
  const b = await chromium.launch();
  async function render(dir, file, w, h, draw) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(page(w, h, draw)); await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(dir, file) }); await p.close();
  }
  // Иконка 576 — без текста
  const icon = `return snow(40,576,576)+'<circle cx="288" cy="300" r="230" fill="rgba(255,214,90,0.12)"/>'+hill(576,576,470)+it('tree',288,282,3.0)+it('gift',150,476,1.0)+it('giftround',428,472,0.95)+
    '<g transform="translate(288,92)"><ellipse rx="66" ry="62" fill="none" stroke="${OUT}" stroke-width="16"/><ellipse rx="66" ry="62" fill="none" stroke="#ffc233" stroke-width="8"/></g>';`;
  await render(VK, 'icon-576.png', 576, 576, icon);
  await render(PG, 'cover-800x800.png', 800, 800, `return snow(50,800,800)+lights(400,60,3.6)+'<circle cx="400" cy="470" r="280" fill="rgba(255,214,90,0.10)"/>'+hill(800,800,690)+it('tree',400,470,2.9)+it('santa',150,610,1.35)+it('snowmaiden',650,612,1.3)+it('gift',300,700,0.9)+it('giftround',510,696,0.9)+title(400,190,96,'Spot the Difference','New Year','middle',740);`);
  await render(VK, 'favicon-32.png', 32, 32, `document.querySelector('.bg').style.background='#1f3a8f';return '<path d="M16 3l11 21H5z" fill="#33b35a" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/><rect x="13" y="24" width="6" height="5" fill="#a8693a"/><circle cx="13" cy="17" r="2" fill="#e8423f"/><circle cx="19" cy="20" r="2" fill="#ffc233"/><circle cx="16" cy="4" r="2.4" fill="#ffc233"/>';`);
  const wide = (w, h, t1, t2) => `var L=LEVELS.build(10);return snow(80,${w},${h})+lights(${w * 0.25},40,2.6)+lights(${w * 0.75},40,2.6)+card(L,${w * 0.56},${h * 0.2},${w * 0.25},L.left,-4,1)+card(L,${w * 0.73},${h * 0.28},${w * 0.235},L.right,5,2)+
    title(${w * 0.05},${h * 0.36},${h * 0.13},'${t1}','${t2}','start',${w * 0.5})+hill(${w},${h},${h * 0.9})+it('santa',${w * 0.1},${h * 0.8},${h / 600})+it('gift',${w * 0.21},${h * 0.86},${h / 800})+it('giftround',${w * 0.29},${h * 0.86},${h / 820})+it('hedgehog',${w * 0.38},${h * 0.88},${h / 900})+it('deer',${w * 0.46},${h * 0.84},${h / 760},{flip:true});`;
  await render(VK, 'cover-1120x630.png', 1120, 630, wide(1120, 630, 'Найди отличия', 'Новый год'));
  await render(PG, 'cover-1920x1080.png', 1920, 1080, wide(1920, 1080, 'Spot the Difference', 'New Year'));
  const tall = (t1, t2, sub) => `var L=LEVELS.build(10);return snow(90,1080,1920)+lights(540,90,5)+title(540,250,120,'${t1}','${t2}','middle',1000)+card(L,160,470,760,L.left,-2,1)+card(L,160,1250,760,L.right,2,2)+
    '<text x="540" y="1215" text-anchor="middle" font-size="54" font-weight="900" fill="#fff" stroke="${OUT}" stroke-width="8" paint-order="stroke">${sub}</text>';`;
  await render(PG, 'cover-1080x1920.png', 1080, 1920, tall('Spot the Difference', 'New Year', 'Find 4 differences!'));
  await render(VK, 'story-1080x1920.png', 1080, 1920, tall('Найди отличия', 'Новый год', 'Найдёшь 4 отличия?'));

  // 4 скриншота 600×1200 из реальной игры: начало уровня, находки, победа, праздничный уровень
  for (const f of fs.readdirSync(VK)) if (/^screen-/.test(f)) fs.unlinkSync(path.join(VK, f));
  const p = await b.newPage({ viewport: { width: 360, height: 720 }, deviceScaleFactor: 600 / 360 });
  await p.goto('http://localhost:8123/index.html'); await p.waitForSelector('#scr-menu.active'); await p.waitForTimeout(700);
  if (await p.isVisible('#modal-gift.show')) { await p.click('#btn-gift-take'); }
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__game.save.unlocked = 31; for (let n = 1; n <= 30; n++) window.__game.save.stars[n] = n % 4 ? 3 : 2; window.__game.start(8); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: path.join(VK, 'screen-1-game.png') });
  let boxes = await p.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
  let bx = await p.locator('#pic-b svg').boundingBox();
  const tap = async (r) => { await p.mouse.click(bx.x + (r.x0 + r.x1) / 2 * bx.width / 400, bx.y + (r.y0 + r.y1) / 2 * bx.height / 340); await p.waitForTimeout(400); };
  for (let i = 0; i < boxes.length - 2; i++) await tap(boxes[i]);
  await p.waitForTimeout(1000); await tap(boxes[boxes.length - 2]); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(VK, 'screen-2-found.png') });
  await tap(boxes[boxes.length - 1]); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(VK, 'screen-3-win.png') });
  await p.click('#btn-win-menu'); await p.waitForTimeout(300);
  await p.evaluate(() => window.__game.start(30)); await p.waitForTimeout(3500);
  boxes = await p.evaluate(() => window.__game.state.lv.diffs.map(d => d.box));
  bx = await p.locator('#pic-b svg').boundingBox();
  for (let i = 0; i < 3; i++) await tap(boxes[i]);
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(VK, 'screen-4-festive.png') });
  await b.close();
  for (const d of [VK, PG]) console.log(fs.readdirSync(d).map(f => f + ' ' + Math.round(fs.statSync(path.join(d, f)).size / 1024) + 'K').join('  '));
})();
