// Anteprima del campo nei tre settori (diagnostica visiva): out/settore-<id>-<WxH>.png
//   node shot-settori.js [id...]
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['m1', 'o3', 't3'];
  const errs = [];
  for (const [w, h] of [[1000, 700], [390, 844]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, deviceScaleFactor: process.env.DSF ? +process.env.DSF : 1 })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(C.URL); await p.waitForTimeout(500);
    for (const id of ids) {
      await p.evaluate(async id => { RITMO = 0; activeMission = nodeOf(id); startBattle(activeMission); await new Promise(r => setTimeout(r, 700)); const t = document.getElementById('txOk'); if (t) t.click(); await new Promise(r => setTimeout(r, 500)); }, id);
      await p.screenshot({ path: `${C.OUT}/settore-${id}-${w}x${h}.png`, clip: process.env.CLIP ? { x: 40, y: 215, width: 540, height: 370 } : undefined });
    }
  }
  console.log('errori:', JSON.stringify(errs));
  await b.close();
})();
