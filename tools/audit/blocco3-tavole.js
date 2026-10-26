// Anteprima delle tavole di Tarsis e del finale: un PNG per tavola (diagnostica visiva, non un test).
//   node blocco3-tavole.js        -> out/b3-<id>-<n>.png
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(600);
  for (const id of ['orvat', 'tarsis', 'catena']) {
    const n = await p.evaluate(i => { playComic(i, 'menu'); return COMIC[i].tavole.length; }, id);
    for (let k = 0; k < n; k++) {
      await p.waitForTimeout(250);
      await p.screenshot({ path: `${C.OUT}/b3-${id}-${k + 1}.png` });
      await p.evaluate(() => comicAdvance());
    }
  }
  console.log('errori:', JSON.stringify(errs));
  await b.close();
})();
