// Misura a livello di CAMPAGNA l'effetto dello SFOGO (la risonanza scende di 6 a ogni missione chiusa senza
// usare Lazy J). Le misure di sim.js non lo vedono: ogni missione parte con la risonanza fissata da --ris.
// Qui l'agente gioca la campagna col flusso vero (finish reale) e la barra persiste fra le missioni.
//   node sfogo.js --seeds 8 --jobs 3 [--skill esperto|medio|novizio] [--sfogo on|off|both] [--maxplays 70] [--out out/sfogo.json]
// `off` spegne lo sfogo senza toccare la build (sfogaRisonanza sostituita da una funzione che non fa niente): e' il
// comportamento della build 0.12.0, in cui la funzione non veniva mai chiamata.
const fs = require('fs'); const C = require('./common'); const { chromium } = C.pw;
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = +arg('seeds', 8), JOBS = +arg('jobs', 3), SKILL = arg('skill', 'esperto'), MODE = arg('sfogo', 'both'), MAXPLAYS = +arg('maxplays', 70), OUTF = arg('out', null), SEED0 = +arg('seed0', 1);
const MAXTRY = +arg('maxtry', 6);
const SFOGOVAL = arg('sfogoval', null);   // prova un valore diverso da 6 senza toccare la build (solo variante `on`)
const WEIGHTS = arg('weights', null);   // JSON per A.W: es. '{"risPrezzo":3,"maxLJ":1}' = un giocatore parsimonioso con Lazy J
const AGENT = fs.readFileSync(require('path').join(__dirname, 'agent.js'), 'utf8');
const mulberry = `let s=1;window.__setSeed=n=>{s=(n>>>0)||1;};Math.random=function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};`;

async function campagna(browser, seed, sfogo) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(new Function(mulberry + `__setSeed(${seed});`));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(400); await p.evaluate(AGENT); await p.evaluate(s => AGENT.setSkill(s), SKILL); if (WEIGHTS) await p.evaluate(w => Object.assign(AGENT.W, JSON.parse(w)), WEIGHTS);
  if (!sfogo) await p.evaluate(() => { window.sfogaRisonanza = () => 0; });
  else if (SFOGOVAL) await p.evaluate(n => { window.sfogaRisonanza = () => { const usata = risonanzaUsata || !!(B && B.mission && B.mission.lj > 0); risonanzaUsata = false; if (usata) return 0; const prima = risonanza; risonanza = Math.max(0, risonanza - n); saveState(); return prima - risonanza; }; }, +SFOGOVAL);
  const plays = []; let esito = null, tent = {};
  for (let giro = 0; giro < MAXPLAYS && !esito; giro++) {
    const pr = await p.evaluate(() => {
      if (campaignOver) return { fine: campaignOver };
      const ok = MISSIONS.filter(m => !m.locked && !cleared.has(m.id) && sectorPlayable(m.sector));
      const campo = ok.filter(m => !m.boss), m = campo[0] || ok[0];
      return m ? { id: m.id, boss: !!m.boss } : { bloccata: true };
    });
    if (pr.fine) { esito = pr.fine; break; } if (pr.bloccata) { esito = 'bloccata'; break; }
    const risIn = await p.evaluate(() => Math.round(risonanza));
    const r = await p.evaluate(id => AGENT.play(id, { realFinish: true, noise0: false, mode: 'smart', keepRis: true }), pr.id);
    if (r.error) { esito = 'errore: ' + r.error; break; }
    const st = await p.evaluate(() => ({ ris: Math.round(risonanza), band: bandaIdx(), nem: nemesis.level, cleared: cleared.size, glob: Math.round(globalCorruption) }));
    plays.push({ id: pr.id, win: !!r.victory, risIn, risOut: st.ris, lj: r.lj || 0, band: st.band, nem: st.nem, cleared: st.cleared, glob: st.glob });
    await p.evaluate(() => { try { comicPending = null; comicCoda = []; } catch (e) { } const t = document.getElementById('txOk'); if (t) t.click(); try { go('missioni'); } catch (e) { } });
    tent[pr.id] = (tent[pr.id] || 0) + 1; if (tent[pr.id] >= MAXTRY && !r.victory) { esito = 'troppi tentativi su ' + pr.id; break; }
  }
  const fin = await p.evaluate(() => ({ cleared: cleared.size, over: campaignOver, glob: Math.round(globalCorruption), ris: Math.round(risonanza), nem: nemesis.level }));
  await ctx.close();
  return { seed, sfogo, esito: esito || 'limite giocate', plays, fin, errs };
}

(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  const variants = MODE === 'both' ? [false, true] : [MODE === 'on']; const tasks = [];
  for (let i = 0; i < SEEDS; i++) for (const v of variants) tasks.push({ seed: SEED0 + i, sfogo: v });
  const res = []; let next = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: JOBS }, async () => { while (next < tasks.length) { const t = tasks[next++]; try { res.push(await campagna(browser, t.seed, t.sfogo)); } catch (e) { res.push({ seed: t.seed, sfogo: t.sfogo, esito: 'ECCEZIONE ' + e.message.slice(0, 80), plays: [], fin: {}, errs: [] }); } process.stderr.write(`  ${res.length}/${tasks.length} (${Math.round((Date.now() - t0) / 1000)}s)\n`); } }));
  if (OUTF) fs.writeFileSync(OUTF, JSON.stringify(res));
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, pct = (n, d) => d ? Math.round(100 * n / d) + '%' : '-';
  console.log(`agente=${SKILL}${WEIGHTS ? ' pesi=' + WEIGHTS : ''} campagne=${SEEDS} per variante, max ${MAXPLAYS} giocate, ${MAXTRY} tentativi per missione  (${Math.round((Date.now() - t0) / 1000)}s)`);
  for (const v of variants) {
    const R = res.filter(r => r.sfogo === v), P = R.flatMap(r => r.plays);
    const by = (f) => P.filter(f);
    const prime = R.flatMap(r => r.plays.slice(0, 20));
    console.log(`\n── sfogo ${v ? 'ATTIVO (' + (SFOGOVAL ? 'valore ' + SFOGOVAL : '0.13.0, valore 6') + ')' : 'SPENTO (comportamento 0.12.0)'} ──`);
    console.log('esiti:', JSON.stringify(R.reduce((o, r) => (o[r.esito.split(':')[0].split(' su')[0]] = (o[r.esito.split(':')[0].split(' su')[0]] || 0) + 1, o), {})));
    console.log(`giocate ${P.length} · vittorie ${pct(by(x => x.win).length, P.length)} (prime 20 giocate: ${pct(prime.filter(x => x.win).length, prime.length)}) · nodi contenuti a fine: ${avg(R.map(r => r.fin.cleared || 0)).toFixed(1)}/23 · corruzione globale ${avg(R.map(r => r.fin.glob || 0)).toFixed(0)}%`);
    console.log(`Lazy J: interventi per giocata ${avg(P.map(x => x.lj)).toFixed(2)} · giocate con almeno un intervento ${pct(by(x => x.lj > 0).length, P.length)} · giocate col tetto raggiunto (risonanza a 100 in uscita) ${pct(by(x => x.risOut >= 100).length, P.length)}`);
    console.log(`risonanza in entrata (media) ${avg(P.map(x => x.risIn)).toFixed(0)} · in uscita ${avg(P.map(x => x.risOut)).toFixed(0)} · a fine campagna ${avg(R.map(r => r.fin.ris || 0)).toFixed(0)}`);
    const bd = [0, 1, 2, 3].map(b => pct(by(x => x.band === b).length, P.length)).join(' / ');
    console.log(`banda in uscita (latente / innesto / simbiosi / convergenza): ${bd} · livello medio della nemesi a fine: ${avg(R.map(r => r.fin.nem || 0)).toFixed(1)}`);
    // traiettoria: risonanza media alla giocata n
    const traj = []; for (let n = 0; n < 40; n += 5) { const xs = R.filter(r => r.plays[n]).map(r => r.plays[n].risOut); if (xs.length) traj.push(`#${n + 1}:${avg(xs).toFixed(0)}`); }
    console.log('traiettoria della risonanza (media, per numero di giocata):', traj.join('  '));
  }
  const errs = res.flatMap(r => r.errs); if (errs.length) console.log('\nERRORI JS', errs.length, errs.slice(0, 3));
  await browser.close();
})();
