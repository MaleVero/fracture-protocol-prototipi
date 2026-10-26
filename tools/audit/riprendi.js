// Prova di ripresa: la stessa partita, giocata (A) di seguito e (B) fermata a un turno, salvata,
// con la PAGINA RICARICATA e ripresa dal checkpoint, deve dare lo stesso esito.
//   node riprendi.js [--seeds 3] [--turni 2,3] [--missions m3,o3,...]
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const SABOTA = process.argv.includes('--sabota');   // controllo negativo: manomette il checkpoint, il test DEVE fallire
const SEEDS = +arg('seeds', 3), TURNI = arg('turni', '2,3').split(',').map(Number);
const MISS = arg('missions', 'm3,m6,m8,o2,o3,o8,t2,t3,t5,o4,t7').split(',');
const AGENT = fs.readFileSync(require('path').join(__dirname, 'agent.js'), 'utf8');
const KEYS = ['victory', 'reason', 'rounds', 'mechsLeft', 'hpLeft', 'foesLeft', 'pushes', 'terrainKills', 'drowned', 'evacuated', 'relics', 'pylons', 'civic'];
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const init = () => {
    let s = 1; window.__setSeed = n => { s = (n >>> 0) || 1; };
    Math.random = function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  const nuova = async () => { const ctx = await b.newContext({ viewport: { width: 800, height: 600 } }); await ctx.addInitScript(init); const p = await ctx.newPage(); p._e = []; p.on('pageerror', e => p._e.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(400); await p.evaluate(AGENT); return { ctx, p }; };
  let tot = 0, ok = 0, saltati = 0; const male = [];
  for (const id of MISS) for (let seed = 1; seed <= SEEDS; seed++) for (const T of TURNI) {
    // A: partita intera
    let A = await nuova();
    const a = await A.p.evaluate(([id, seed]) => AGENT.play(id, { seed, noise0: true }), [id, seed]); await A.ctx.close();
    if (a.error || a.turns < T) { saltati++; continue; }            // finita prima del turno T: niente da riprendere
    // B1: stessa partita fino al turno T, poi checkpoint
    const B1 = await nuova();
    const s1 = await B1.p.evaluate(([id, seed, T]) => AGENT.play(id, { seed, noise0: true, stopAtTurn: T }), [id, seed, T]);
    let cp = s1.checkpoint; await B1.ctx.close();
    if (SABOTA && cp) { const o = JSON.parse(cp); const m = o.B.units.find(u => u.player && !u.structure); m.hp = 1; cp = JSON.stringify(o); }
    if (!cp) { male.push({ id, seed, T, perche: 'nessun checkpoint', s1 }); tot++; continue; }
    // B2: PAGINA NUOVA (nessuno stato in memoria), ripresa dal solo file
    const B2 = await nuova();
    const r = await B2.p.evaluate(([id, cp]) => AGENT.play(id, { noise0: true, resume: cp }), [id, cp]);
    const errs = B2.p._e.slice(); await B2.ctx.close();
    tot++;
    const diff = KEYS.filter(k => JSON.stringify(a[k]) !== JSON.stringify(r[k])).map(k => k + ': ' + a[k] + ' → ' + r[k]);
    if (!diff.length && !r.error && !errs.length) ok++; else male.push({ id, seed, T, diff, error: r.error, errs, cpBytes: cp.length });
  }
  console.log(`riprese confrontate: ${tot}  identiche: ${ok}  (partite finite prima del turno di checkpoint, saltate: ${saltati})`);
  male.forEach(m => console.log('✗', JSON.stringify(m).slice(0, 400)));
  console.log(male.length ? `\n${male.length} DIVERSE` : '\nogni ripresa coincide con la partita continua');
  await b.close(); process.exit(male.length ? 1 : 0);
})();
