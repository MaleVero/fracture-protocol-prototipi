// Anteprima della mappa nei tre settori (diagnostica visiva): out/mappa-<id>-<WxH>.png
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [];
  for (const [w, h] of [[390, 844], [1000, 700]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' })).newPage();
    p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(500);
    for (const id of ['cassandra', 'orvat', 'tarsis']) {
      await p.evaluate(async id => { for (const s of SECTORS) s.locked = false; seenComic.add('orvat'); seenComic.add('tarsis'); seenComic.add('cassandra'); go('missioni'); document.querySelector(`#sectorTabs .sectab[data-sec="${id}"]`).click(); await new Promise(r => setTimeout(r, 300)); }, id);
      await p.screenshot({ path: `${C.OUT}/mappa-${id}-${w}x${h}.png` });
    }
  }
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
