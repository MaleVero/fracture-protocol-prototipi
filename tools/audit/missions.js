const C = require('./common'); const { chromium } = C.pw;
const URL = C.URL, OUT = C.OUT;
const MODE = process.argv[2] || 'idle';
const SHOT = process.argv[3] === 'shots';
(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(['PAGEERROR', e.message, (e.stack||'').split('\n').slice(0,3).join(' | ')]));
  page.on('console', m => { if (m.type()==='error') errs.push(['console.error', m.text()]); });
  await page.goto(URL);
  await page.waitForTimeout(800);
  const ids = await page.evaluate(() => MISSIONS.map(m => m.id));
  const results = [];
  for (const id of ids) {
    const before = errs.length;
    const t0 = Date.now();
    const r = await page.evaluate(async ({ id, mode }) => {
      RITMO = 0;
      const m = MISSIONS.find(x => x.id === id);
      const info = { id, name: m.name, goal: null, rounds: 0, units: null, outcome: null, error: null, steps: 0 };
      try {
        activeMission = m; startBattle(m);
        if (!B) { info.error = 'startBattle: B null'; return info; }
        info.goal = B.goal; info.maxRound = B.maxRound;
        info.units = { mechs: mechs().length, kauchas: kauchas().length, civ: (B.units||[]).filter(u=>u.civil).length };
        const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
        let guard = 0;
        while (!B.over && guard++ < 40) {
          if (!(await wait(() => B.over || (B.phase === 'player' && !B.busy), 8000))) { info.error = 'stuck waiting for player phase (phase=' + B.phase + ',busy=' + B.busy + ',round=' + B.round + ')'; break; }
          if (B.over) break;
          if (mode === 'aggro') {
            for (const mech of mechs().slice()) {
              if (B.over) break;
              if (mech.attacked || mech.hp <= 0) continue;
              onUnitTap(mech); info.steps++;
              const foes = kauchas();
              if (!foes.length) break;
              const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
              const near = () => foes.slice().sort((a, b) => dist(mech, a) - dist(mech, b))[0];
              if (!inAtk(mech, near().x, near().y) && B.selRange) {
                // move to the reachable cell that minimizes distance to nearest foe, preferring one in attack range
                let best = null, bs = 1e9;
                for (const key of B.selRange.keys()) {
                  const [x, y] = key.split(',').map(Number);
                  const tgt = near(); const d = Math.abs(x - tgt.x) + Math.abs(y - tgt.y);
                  const inr = d >= mech.rmin && d <= mech.rmax;
                  const s = inr ? -100 + d : d;
                  if (s < bs) { bs = s; best = [x, y]; }
                }
                if (best) { onCellTap(best[0], best[1]); info.steps++; onUnitTap(mech); }
              }
              const t = foes.find(f => inAtk(mech, f.x, f.y));
              if (t && !mech.attacked) { onUnitTap(t); onUnitTap(t); info.steps++; await wait(() => !B.busy || B.over, 3000); }
              if (!B.over && B.selected) bDeselect();
            }
          }
          if (B.over) break;
          endPlayer();
          await wait(() => B.over || (B.phase === 'player' && !B.busy) || B.phase !== 'player', 3000);
          await new Promise(r => setTimeout(r, 10));
        }
        info.rounds = B.round; info.over = B.over;
        info.outcome = B.over ? (document.querySelector('#outcome.active') ? 'outcome-screen' : 'over-no-outcome-screen') : 'NOT_OVER';
        info.survMech = mechs().length; info.survKau = kauchas().length;
        info.outcomeText = (document.querySelector('#outcome')||{}).innerText?.slice(0, 120);
      } catch (e) { info.error = 'EXC ' + e.message + ' @ ' + (e.stack||'').split('\n')[1]; }
      return info;
    }, { id, mode: MODE });
    r.ms = Date.now() - t0;
    r.newErrs = errs.slice(before);
    if (SHOT) await page.screenshot({ path: `${OUT}/m-${MODE}-${id}.png` });
    results.push(r);
    // reset to menu
    await page.evaluate(() => { try { go('menu'); } catch(e){} });
  }
  console.log(JSON.stringify(results.map(r => ({ id: r.id, name: r.name, goal: r.goal, units: r.units && `${r.units.mechs}m/${r.units.kauchas}k/${r.units.civ}c`, rounds: r.rounds + '/' + r.maxRound, steps: r.steps, outcome: r.outcome, mechsLeft: r.survMech, kauLeft: r.survKau, ms: r.ms, error: r.error, errs: r.newErrs.length ? r.newErrs : undefined, text: (r.outcomeText||'').replace(/\s+/g,' ').slice(0,80) })), null, 1));
  await browser.close();
})();
