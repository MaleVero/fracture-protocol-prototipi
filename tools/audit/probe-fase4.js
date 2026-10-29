// Sonda della fase 4: cosa serve per salvare una battaglia, e com'è la prima partita.
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    RITMO = 0;
    const out = {};
    const m = MISSIONS.find(x => x.id === 'o3'); activeMission = m; startBattle(m);
    const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
    await wait(() => B.phase === 'player' && !B.busy);
    // 1. clonabilità di B
    const bad = [];
    for (const [k, v] of Object.entries(B)) { try { structuredClone(v); } catch (e) { bad.push('B.' + k); } }
    const ubad = {};
    B.units.forEach(u => { for (const [k, v] of Object.entries(u)) { try { structuredClone(v); } catch (e) { ubad[k] = typeof v; } } });
    out.badB = bad; out.badUnitFields = ubad;
    out.unitKeys = [...new Set(B.units.flatMap(u => Object.keys(u)))].length;
    out.pilotShape = B.units.find(u => u.pilot) && Object.keys(B.units.find(u => u.pilot).pilot);
    out.abilityShape = B.units.find(u => u.ability) && Object.keys(B.units.find(u => u.ability).ability);
    out.Bkeys = Object.keys(B);
    // 2. chi chiama audioInit, c'è visibilitychange?
    out.audioInitSrc = String(window.__ISO && window.__ISO.audioInit || '').slice(0, 60);
    out.isoKeys = Object.keys(window.__ISO || {});
    // 3. accessibilita': bottoni senza nome utile
    out.nameless = [...document.querySelectorAll('button')].filter(e => { const t = (e.getAttribute('aria-label') || e.innerText || '').trim(); return t.length <= 2; }).map(e => (e.id || e.className) + ':' + (e.innerText || '').trim() + ' title=' + (e.title || '-')).slice(0, 14);
    out.live = [...document.querySelectorAll('[aria-live],[role=status],[role=alert]')].length;
    out.canvasLabel = document.getElementById('isoCanvas').getAttribute('aria-label');
    out.focusableCount = [...document.querySelectorAll('button,[tabindex],a,input')].filter(e => e.offsetParent !== null).length;
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs);
  const vis = await p.evaluate(() => typeof document.onvisibilitychange);
  console.log('visibilitychange handler inline:', vis);
  await b.close();
})();
