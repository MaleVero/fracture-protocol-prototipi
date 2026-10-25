// Elenca gli elementi con testo sotto una soglia (default 9 px) per schermata.
const C = require('./common'); const { chromium } = C.pw;
const TH = +process.argv[2] || 9;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  await p.goto(C.URL); await p.waitForTimeout(500);
  for (const sc of ['menu','missioni','codice','battle']) {
    if (sc === 'battle') await p.evaluate(() => { RITMO = 0; activeMission = MISSIONS[0]; startBattle(MISSIONS[0]); }); else await p.evaluate(id => go(id), sc);
    await p.waitForTimeout(500);
    const r = await p.evaluate(th => {
      const act = document.querySelector('.screen.active'); const m = {};
      for (const e of act.querySelectorAll('*')) {
        if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize); if (fs >= th) continue;
        const key = (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') || e.tagName;
        const k = e.tagName.toLowerCase() + key + ' ' + fs + 'px';
        m[k] = (m[k] || 0) + 1;
      }
      return m;
    }, TH);
    console.log('==', sc); for (const [k, v] of Object.entries(r)) console.log('  ', v + '×', k);
  }
  await b.close();
})();
