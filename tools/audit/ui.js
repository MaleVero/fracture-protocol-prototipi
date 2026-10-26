const C = require('./common'); const { chromium } = C.pw;
const URL = C.URL, OUT = C.OUT;
const VPS = {
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 },
  small: { viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 },
  land:  { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 },
  desk:  { viewport: { width: 1280, height: 800 } },
};
const SCREENS = ['menu','missioni','hangar','codice','protocolli','ricerca','comando','opzioni','battle'];
(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const report = [];
  for (const [vn, o] of Object.entries(VPS)) {
    const ctx = await browser.newContext(o); const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(URL); await page.waitForTimeout(600); await page.evaluate(() => seenComic.add('hangar'));   // la tavola della prima apertura coprirebbe la schermata da misurare
    await page.evaluate(() => { RITMO = 0; });
    for (const sc of SCREENS) {
      if (sc === 'battle') await page.evaluate(() => { activeMission = MISSIONS[0]; startBattle(MISSIONS[0]); });
      else await page.evaluate(id => go(id), sc);
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const vw = innerWidth, vh = innerHeight;
        const act = document.querySelector('.screen.active');
        const docOverflowX = document.documentElement.scrollWidth - vw;
        const scrollers = [...act.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0);
        // elements poking past viewport right edge
        const out = [...act.querySelectorAll('button,a,input,select,.btn,[role=button],canvas')].filter(e => {
          const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && (r.right > vw + 1 || r.left < -1);
        }).map(e => (e.id || e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right));
        const small = [...act.querySelectorAll('button,a,input,select,[role=button]')].filter(e => {
          const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
          return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && (r.width < 32 || r.height < 32);
        }).map(e => ((e.id || e.className || e.textContent || e.tagName) + '').trim().slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
        const fs = [...act.querySelectorAll('*')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) ).map(e => parseFloat(getComputedStyle(e).fontSize)).filter(x => x < 10);
        const sh = act.scrollHeight - vh;
        return { docOverflowX, out: out.slice(0, 6), small: small.slice(0, 8), tinyTextCount: fs.length, minFont: fs.length ? Math.min(...fs) : null, bodyScrollY: document.documentElement.scrollHeight - vh, actScrollH: sh };
      });
      await page.screenshot({ path: `${OUT}/${vn}-${sc}.png` });
      report.push({ vp: vn, screen: sc, ...m });
    }
    report.push({ vp: vn, errs });
    await ctx.close();
  }
  for (const r of report) console.log(JSON.stringify(r));
  await browser.close();
})();
