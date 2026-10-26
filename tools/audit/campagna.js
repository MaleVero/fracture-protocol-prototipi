// Campagna intera col flusso VERO del gioco (finish reale: ricompense, sblocchi, settori, fumetti, finale).
// Gioca con l'agente esperto e riprova le missioni perse; alla fine ricarica la pagina per vedere cosa e' salvato.
//
// ⚠ NON E' UN COLLAUDO CHE «DEVE VINCERE». L'agente non spende i frammenti, non usa abilita' ne' Lazy J, e con
// PALINSESTO sveglia la sua media di vittoria e' ~50% per missione (vedi RAPPORTO-FASE5): la campagna intera con
// lui di solito si ferma e la corruzione travolge un settore. Cio' che il test controlla e' l'INTEGRITA' del flusso:
// sblocchi in catena coerenti, nessun errore, e il salvataggio che sopravvive a un ricaricamento.
//   node campagna.js [--max 14] [--verbose]
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs');
const MAX = +(process.argv.includes('--max') ? process.argv[process.argv.indexOf('--max') + 1] : 14);
const AGENT = fs.readFileSync(require('path').join(__dirname, 'agent.js'), 'utf8');
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { let s = 7; Math.random = function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(700); await p.evaluate(AGENT);
  const diario = []; let tentativi = 0, esito = null;
  for (let giro = 0; giro < 120 && !esito; giro++) {
    // prossima missione: la prima di campo giocabile e non contenuta; il guardiano quando tutto il campo e' contenuto
    const prossima = await p.evaluate(() => {
      if (campaignOver) return { fine: campaignOver };
      const ok = MISSIONS.filter(m => !m.locked && !cleared.has(m.id) && sectorPlayable(m.sector));
      const campo = ok.filter(m => !m.boss), m = campo[0] || ok[0];
      return m ? { id: m.id, sector: m.sector, boss: !!m.boss } : { bloccata: true, cleared: [...cleared], sec: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : sectorLost(s.id) ? 'X' : 'u')).join(' ') };
    });
    if (prossima.fine) { esito = prossima.fine; break; }
    if (prossima.bloccata) { esito = 'BLOCCATA ' + JSON.stringify(prossima); break; }
    const r = await p.evaluate(id => AGENT.play(id, { realFinish: true, noise0: false, mode: 'smart' }), prossima.id);
    tentativi++;
    const ov = await p.evaluate(() => ({ titolo: document.getElementById('ovTitle').textContent, fine: document.getElementById('ovCorruption').innerText.replace(/\s+/g, ' ').slice(0, 160), corr: Math.round(globalCorruption), screen: document.querySelector('.screen.active') && document.querySelector('.screen.active').id }));
    const nodi = await p.evaluate(() => MISSIONS.filter(m => m.sector === 'cassandra').map(m => m.id + ':' + Math.round(m.corr)).join(' '));
    diario.push({ id: prossima.id, vinta: r.victory, titolo: ov.titolo, corr: ov.corr, err: r.error, nodi, round: r.rounds });
    if (process.argv.includes('--verbose')) console.log('  ' + prossima.id + ' ' + (r.victory ? 'VINTA' : 'persa ') + ' glob ' + ov.corr + '%  [' + nodi + ']');
    if (r.error) { esito = 'ERRORE ' + r.error; break; }
    // chiude eventuali fumetti/trasmissioni in coda e torna alla mappa come farebbe il pulsante
    await p.evaluate(() => { try { comicPending = null; } catch (e) {} const t = document.getElementById('txOk'); if (t) t.click(); try { go('missioni'); } catch (e) {} });
    const n = diario.filter(d => d.id === prossima.id).length; if (n >= MAX && !r.victory) { esito = 'TROPPI TENTATIVI su ' + prossima.id; break; }
  }
  const vinte = diario.filter(d => d.vinta).map(d => d.id), perse = diario.filter(d => !d.vinta).length;
  const per = {}; diario.forEach(d => { per[d.id] = per[d.id] || [0, 0]; per[d.id][d.vinta ? 0 : 1]++; });
  console.log('tentativi per missione [vinte, perse]:', JSON.stringify(per));
  const fin = await p.evaluate(() => ({ over: campaignOver, cleared: cleared.size, tot: MISSIONS.length, sec: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : sectorLost(s.id) ? 'X' : 'u')).join(' '), nemesisMorta: !!nemesis.dead, finale: document.getElementById('ovCorruption').innerText.replace(/\s+/g, ' ').slice(0, 200), fr: frammenti, sg: sigilli }));
  console.log('stato finale:', JSON.stringify(fin));
  console.log(`campagna: ${esito === 'won' ? 'CONCLUSA (CATENA RECISA)' : 'ferma a ' + fin.cleared + '/' + fin.tot + ' nodi — ' + (esito || '')}`);
  // integrita' della catena: un guardiano contenuto implica tutto il campo del suo settore contenuto, e il settore dopo aperto
  const cat = await p.evaluate(() => SECTORS.map((s, i) => { const campo = sectorNodes(s.id).filter(m => !m.boss), g = sectorGuardian(s.id);
    return { s: s.id, campo: campo.filter(m => cleared.has(m.id)).length + '/' + campo.length, guardiano: g ? cleared.has(g.id) : null, apertoDopo: SECTORS[i + 1] ? !SECTORS[i + 1].locked : null,
      incoerente: (g && cleared.has(g.id) && !campo.every(m => cleared.has(m.id))) || (g && cleared.has(g.id) && SECTORS[i + 1] && SECTORS[i + 1].locked) }; }));
  console.log('catena dei settori:', JSON.stringify(cat));
  check('catena coerente: nessun guardiano contenuto senza il suo campo, nessun settore successivo rimasto chiuso', cat.every(c => !c.incoerente));
  // Il finale scatta alla caduta del Varco Madre; `nemesis.dead` solo se l'unita' PALINSESTO e' stata abbattuta in quella battaglia.
  // Possono quindi divergere (incoerenza del gioco originale, senza conseguenze: la campagna e' chiusa): si riporta, non si pretende.
  if (esito === 'won') { check('campagna conclusa: finale CATENA RECISA', /CATENA RECISA/.test(fin.finale)); console.log('  (informativo) PALINSESTO abbattuta in quella battaglia:', fin.nemesisMorta); }
  // ricarica: il salvataggio conserva la fine
  await p.reload(); await p.waitForTimeout(800);
  const dopo = await p.evaluate(() => ({ over: campaignOver, cleared: cleared.size, fr: frammenti, cp: !!leggiBattaglia(), voce: document.querySelector('#menulist .nm').textContent }));
  check('dopo il ricaricamento lo stato e\' identico (nodi, frammenti, fine) e non restano missioni fantasma', dopo.over === fin.over && dopo.cleared === fin.cleared && dopo.fr === fin.fr && !dopo.cp && dopo.voce === 'MISSIONI', { prima: [fin.over, fin.cleared, fin.fr], dopo });
  check('nessun errore JavaScript in tutta la campagna', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
