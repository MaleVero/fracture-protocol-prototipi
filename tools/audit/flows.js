const C = require('./common'); const { chromium } = C.pw;
const URL = C.URL, OUT = C.OUT;
(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL); await page.waitForTimeout(600);
  const log = (k, v) => console.log(k.padEnd(34), JSON.stringify(v));

  // --- 1. Salvataggio dopo vittoria + reload
  await page.evaluate(() => { RITMO = 0; });
  const pre = await page.evaluate(() => ({ cleared: [...cleared], fr: frammenti, keys: Object.keys(localStorage) }));
  log('pre-win state', pre);
  const win = await page.evaluate(async () => {
    const m = MISSIONS[0]; activeMission = m; startBattle(m);
    const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
    let g = 0;
    while (!B.over && g++ < 30) {
      await wait(() => B.over || (B.phase === 'player' && !B.busy), 5000);
      if (B.over) break;
      for (const mech of mechs().slice()) {
        if (B.over || mech.attacked) continue;
        onUnitTap(mech);
        const foes = kauchas(); if (!foes.length) break;
        const d = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        const near = () => foes.slice().sort((a, b) => d(mech, a) - d(mech, b))[0];
        if (!inAtk(mech, near().x, near().y) && B.selRange) {
          let best = null, bs = 1e9;
          for (const key of B.selRange.keys()) { const [x, y] = key.split(',').map(Number); const t = near(); const dd = Math.abs(x - t.x) + Math.abs(y - t.y); const s = (dd >= mech.rmin && dd <= mech.rmax) ? -100 + dd : dd; if (s < bs) { bs = s; best = [x, y]; } }
          if (best) { onCellTap(best[0], best[1]); onUnitTap(mech); }
        }
        const t = foes.find(f => inAtk(mech, f.x, f.y));
        if (t && !mech.attacked) { onUnitTap(t); onUnitTap(t); await wait(() => !B.busy || B.over, 3000); }
        if (!B.over && B.selected) bDeselect();
      }
      if (B.over) break;
      endPlayer(); await wait(() => B.phase !== 'player' || B.over, 3000);
    }
    return { over: B.over, mechs: mechs().length };
  });
  log('m1 won by agent', win);
  await page.waitForTimeout(300);
  const post = await page.evaluate(() => ({ cleared: [...cleared], fr: frammenti, keys: Object.keys(localStorage), locked: MISSIONS.filter(m => m.sector==='cassandra').map(m => m.id + ':' + (m.locked ? 'L' : 'u')).join(' ') }));
  log('post-win state', post);
  await page.reload(); await page.waitForTimeout(800);
  const reloaded = await page.evaluate(() => ({ cleared: [...cleared], fr: frammenti, locked: MISSIONS.filter(m => m.sector==='cassandra').map(m => m.id + ':' + (m.locked ? 'L' : 'u')).join(' ') }));
  log('after reload', reloaded);
  log('save persisted?', JSON.stringify(reloaded.cleared) === JSON.stringify(post.cleared) && reloaded.fr === post.fr);

  // --- 2. Tempo scaduto -> tieni il campo / sganciati (UI reale)
  await page.evaluate(() => { RITMO = 0; });
  const ret = await page.evaluate(async () => {
    const m = MISSIONS.find(x => x.id === 'm1'); activeMission = m; startBattle(m);
    const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
    await wait(() => B.phase === 'player' && !B.busy);
    // lascio vivi i nemici ma rendo innocui i Kaucha per arrivare al timeout senza perdere
    kauchas().forEach(k => { k.noAttack = true; k.dmg = 0; });
    B.round = B.maxRound; endPlayer();
    const ok = await wait(() => B.awaitRetreat || B.over, 6000);
    const r = { reachedPrompt: !!B.awaitRetreat, over: B.over, busy: B.busy, panelHasButtons: !!document.getElementById('holdBtn') && !!document.getElementById('retreatNowBtn') };
    if (!B.awaitRetreat) return r;
    document.getElementById('holdBtn').click();
    await wait(() => B.phase === 'player' && !B.busy, 4000);
    r.afterHold = { round: B.round, max: B.maxRound, phase: B.phase, overtime: B.mission.overtime, over: B.over };
    kauchas().forEach(k => { k.noAttack = true; k.dmg = 0; });
    B.round = B.maxRound; endPlayer();
    await wait(() => B.awaitRetreat || B.over, 6000);
    document.getElementById('retreatNowBtn').click();
    await new Promise(r => setTimeout(r, 300));
    r.afterRetreat = { over: B.over, outcomeScreen: !!document.querySelector('#outcome.active'), text: document.querySelector('#outcome').innerText.replace(/\s+/g,' ').slice(0, 110) };
    return r;
  });
  log('timeout prompt flow', ret);

  // --- 3. Missione lasciata aperta: ⌂ poi ritorno
  await page.evaluate(async () => { RITMO = 0; activeMission = MISSIONS.find(x => x.id === 'm1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 400)); });
  await page.click('#menuBtn'); await page.waitForTimeout(300);
  const menuState = await page.evaluate(() => ({ active: document.querySelector('.screen.active').id, bOpen: !!B && !B.over, menuText: document.querySelector('#menulist').innerText.replace(/\s+/g, ' ').slice(0, 200) }));
  log('after ⌂ menu', menuState);
  await page.screenshot({ path: OUT + '/flow-menu-after-home.png' });
  log('errors', errs);
  await browser.close();
})();
