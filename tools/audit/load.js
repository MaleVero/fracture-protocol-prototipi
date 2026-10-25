const C = require('./common'); const { chromium } = C.pw;
const URL = C.URL, OUT = C.OUT;
(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const out = {};
  for (const [name, ctxOpts] of Object.entries({
    desktop: { viewport: { width: 1280, height: 800 } },
    mobile: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  })) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text()); });
    page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
    const t0 = Date.now();
    await page.goto(URL);
    await page.waitForTimeout(1500);
    out[name] = { loadMs: Date.now() - t0, errs, missions: await page.evaluate(() => MISSIONS.map(m => ({id:m.id, name:m.name, sector:m.sector, hasCfg: !!m.cfg, hasSpec: !!m.spec, locked: !!m.locked}))) };
    await page.screenshot({ path: `${OUT}/menu-${name}.png` });
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
