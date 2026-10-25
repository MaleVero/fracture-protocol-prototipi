// Sonda: lo stato di battaglia si clona? Quali campi no? Che aspetto ha una partita a inizio turno?
// Uso: node probe.js [idMissione]
const C = require('./common'); const { chromium } = C.pw;
const ID = process.argv[2] || 'm3';
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(400);
  const r = await p.evaluate(async (id) => {
    RITMO = 0;
    const m = MISSIONS.find(x => x.id === id); activeMission = m; startBattle(m);
    const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 5)); } return true; };
    await wait(() => B.phase === 'player' && !B.busy);
    const out = {};
    try { const t0 = performance.now(); const c = structuredClone(B); out.cloneMs = +(performance.now() - t0).toFixed(2); out.cloneOk = true; out.units = c.units.length; }
    catch (e) { out.cloneErr = e.message; }
    const bad = [];
    for (const [k, v] of Object.entries(B)) { try { structuredClone(v); } catch (e) { bad.push('B.' + k); } }
    B.units.forEach(u => { for (const [k, v] of Object.entries(u)) { try { structuredClone(v); } catch (e) { bad.push('u.' + k); } } });
    out.bad = [...new Set(bad)];
    out.mechs = mechs().map(u => ({ n: u.name, x: u.x, y: u.y, hp: u.hp, mv: u.move, r: u.rmin + '-' + u.rmax, dmg: u.dmg, kb: u.knockback, ab: u.ability && (u.ability.nm || u.ability.id || JSON.stringify(u.ability).slice(0, 40)) }));
    out.foes = kauchas().map(u => ({ n: u.name, t: u.type, x: u.x, y: u.y, hp: u.hp, mv: u.move, plan: u.plan && JSON.stringify(u.plan) }));
    out.terrain = [...B.terrain.entries()].map(([k, v]) => k + ':' + v.t);
    out.water = [...B.water];
    out.rift = B.rift && { x: B.rift.x, y: B.rift.y, hp: B.rift.hp };
    out.goal = B.goal; out.maxRound = B.maxRound;
    out.fn = { celleMinacciate: typeof celleMinacciate, bRender: typeof bRender, floatDmg: typeof floatDmg, blog: typeof blog, atkBanner: typeof atkBanner, commitUndo: typeof commitUndo };
    return out;
  }, ID);
  console.log(JSON.stringify(r, null, 1)); console.log(errs);
  await b.close();
})();
