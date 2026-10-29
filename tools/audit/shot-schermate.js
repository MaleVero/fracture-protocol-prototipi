// Anteprima di tutte le schermate (diagnostica visiva): out/sch-<id>-<WxH>.png
//   node shot-schermate.js [WxH] [id...]
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const [w, h] = (process.argv[2] || '390x844').split('x').map(Number);
  const ids = process.argv.slice(3).length ? process.argv.slice(3) : ['menu', 'missioni', 'hangar', 'codice', 'protocolli', 'ricerca', 'comando', 'opzioni'];
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [];
  const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' })).newPage();
  p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(600);
  await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis', 'palinsesto', 'guardiano'].forEach(x => seenComic.add(x)));
  for (const id of ids) {
    await p.evaluate(async id => { RITMO = 0; for (const s of SECTORS) s.locked = false;
      if (id === 'hangar') { activeMission = null; renderHangar(); } else if (id === 'opzioni') renderOpzioni(); else if (id === 'codice') renderCodex(); else if (id === 'protocolli') renderProtocols(); else if (id === 'comando') renderComando(); else if (id === 'ricerca') renderResearch();
      go(id); await new Promise(r => setTimeout(r, 300)); }, id);
    await p.screenshot({ path: `${C.OUT}/sch-${id}-${w}x${h}.png` });
  }
  console.log('errori:', JSON.stringify(errs)); await b.close();
})();
