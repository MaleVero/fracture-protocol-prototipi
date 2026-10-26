// Banco di bilanciamento: gioca ogni missione N volte (semi diversi) con l'agente
// di agent.js e riassume vittorie, perdite e durata.
//
//   node sim.js --seeds 10 --jobs 4                   # tutte le missioni
//   node sim.js --missions m1,m3 --seeds 20 --mode idle
//   node sim.js --seeds 5 --out out/base.json         # salva anche i dati grezzi
//   BUILD=v2026-09-16 node sim.js ...                 # su un'altra build
const fs = require('fs');
const C = require('./common'); const { chromium } = C.pw;
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = +arg('seeds', 8), JOBS = +arg('jobs', 3), MODE = arg('mode', 'smart'), OUTF = arg('out', null);
const ONLY = arg('missions', 'all');
const SEED0 = +arg('seed0', 1);
const SKILL = arg('skill', 'esperto');
const NEMESI = arg('nemesi', null);   // -1 dormiente (default storico) | 0 sveglia | N evoluzioni
const PROGRESS = arg('progress', 'campagna');   // campagna | ultimo | inizio  (ultimo = tutti gli altri nodi del settore gia' contenuti: il caso peggiore)
const AGENT = fs.readFileSync(require('path').join(__dirname, 'agent.js'), 'utf8');
const WEIGHTS = arg('weights', null);   // JSON per sovrascrivere A.W, es. '{"approach":4}'

(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const pages = [];
  for (let j = 0; j < JOBS; j++) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    await ctx.addInitScript(() => {
      let s = 1;
      window.__setSeed = n => { s = (n >>> 0) || 1; };
      Math.random = function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    });
    const page = await ctx.newPage();
    page.on('pageerror', e => { page._errs = (page._errs || []); page._errs.push(e.message); });
    await page.goto(C.URL); await page.waitForTimeout(500);
    await page.evaluate(AGENT);
    if (WEIGHTS) await page.evaluate(w => Object.assign(AGENT.W, JSON.parse(w)), WEIGHTS);
    await page.evaluate(s => AGENT.setSkill(s), SKILL);
    // --guard off: spegne il controllo d'apertura del generatore, per misurare i campi «grezzi»
    if (arg('guard', 'on') === 'off') await page.evaluate(() => { window.aperturaProtetti = () => null; });
    pages.push(page);
  }
  const ids = ONLY === 'all' ? await pages[0].evaluate(() => MISSIONS.map(m => m.id)) : ONLY.split(',');
  const tasks = []; for (let s = 0; s < SEEDS; s++) for (const id of ids) tasks.push({ id, seed: SEED0 + s });
  const results = []; let next = 0; const t0 = Date.now();
  await Promise.all(pages.map(async page => {
    while (next < tasks.length) {
      const t = tasks[next++];
      const t1 = Date.now();
      let r;
      try { r = await page.evaluate(([id, seed, mode, progress, nemesi]) => AGENT.play(id, { seed, mode, progress, nemesi }), [t.id, t.seed, MODE, PROGRESS, NEMESI === null ? null : +NEMESI]); }
      catch (e) { r = { id: t.id, seed: t.seed, error: 'PLAYWRIGHT ' + e.message.slice(0, 120) }; }
      r.ms = Date.now() - t1; results.push(r);
      if (results.length % 10 === 0) process.stderr.write(`  ${results.length}/${tasks.length} (${Math.round((Date.now() - t0) / 1000)}s)\n`);
    }
  }));
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(results));
  // ── riassunto per missione ──
  const by = {}; for (const r of results) (by[r.id] = by[r.id] || []).push(r);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  console.log(`modo=${MODE} abilita=${SKILL} progresso=${PROGRESS} nemesi=${NEMESI === null ? 'dormiente' : NEMESI} semi=${SEEDS} build=${C.URL.split('/').slice(-2, -1)[0]}  (${Math.round((Date.now() - t0) / 1000)}s)`);
  console.log('id  goal         n  vittorie  round   mech persi  hp% resta  nemici  motivi sconfitta                  ms   err');
  for (const id of ids) {
    const rs = by[id] || []; const ok = rs.filter(r => !r.error);
    const win = ok.filter(r => r.victory).length;
    const lost = ok.map(r => r.mechs0 - r.mechsLeft);
    const hpp = ok.map(r => r.hp0 ? r.hpLeft / r.hp0 : 0);
    const reasons = {}; ok.filter(r => !r.victory).forEach(r => reasons[r.reason] = (reasons[r.reason] || 0) + 1);
    console.log([id.padEnd(3), (ok[0] && ok[0].goal || '?').padEnd(12), String(rs.length).padStart(2),
      (Math.round(100 * win / Math.max(1, ok.length)) + '%').padStart(8),
      (avg(ok.map(r => r.rounds)).toFixed(1) + '/' + (ok[0] ? ok[0].maxRound : '?')).padStart(8),
      avg(lost).toFixed(2).padStart(10), (Math.round(100 * avg(hpp)) + '%').padStart(10),
      avg(ok.map(r => r.foesLeft)).toFixed(1).padStart(7),
      JSON.stringify(reasons).padEnd(32), String(Math.round(avg(rs.map(r => r.ms)))).padStart(6),
      rs.filter(r => r.error).length ? rs.filter(r => r.error).map(r => r.error).slice(0, 1) : ''].join(' '));
  }
  const errs = results.filter(r => r.error); if (errs.length) console.log('\nERRORI', errs.length, JSON.stringify(errs.slice(0, 3)));
  const pe = pages.flatMap(p => p._errs || []); if (pe.length) console.log('PAGEERRORS', pe.length, pe.slice(0, 3));
  await browser.close();
})();
