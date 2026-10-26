// Compatibilita' dei salvataggi fra build: le build stanno sulla stessa origine e condividono SAVE_KEY.
//  avanti: una campagna scritta dalla 0.8.0 si apre nella build nuova senza perdere niente.
//  indietro: una campagna scritta dalla build nuova (con Tarsis) non rompe la 0.8.0 se ci si torna.
const C = require('./common'); const { chromium } = C.pw; const path = require('path');
const root = path.resolve(__dirname, '../..');
const VECCHIA = 'file://' + path.join(root, 'builds/v2026-09-16/index.html'), NUOVA = C.URL;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // ── avanti
  await p.goto(VECCHIA); await p.waitForTimeout(600);
  const v0 = await p.evaluate(() => { ['m2', 'm3', 'm4', 'm6', 'm7', 'm8'].forEach(i => cleared.add(i)); frammenti = 1234; sigilli = 5; applyUnlocks(); seenTx.add('apertura'); saveState(); return { cleared: [...cleared].sort(), fr: frammenti, sg: sigilli, ver: document.querySelector('#menu .footer').textContent.slice(0, 20) }; });
  log('salvataggio scritto dalla build 0.8.0', v0);
  await p.goto(NUOVA); await p.waitForTimeout(800);
  const v1 = await p.evaluate(() => ({ cleared: [...cleared].sort(), fr: frammenti, sg: sigilli, sectors: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : 'u')).join(' '), tx: seenTx.has('apertura'), cp: !!leggiBattaglia(), vociMenu: [...document.querySelectorAll('#menulist .nm')].map(e => e.textContent)[0], ver: document.querySelector('#menu .footer').textContent.slice(0, 20) }));
  log('stesso salvataggio aperto dalla build nuova', v1);
  check('avanti: nodi contenuti, frammenti e sigilli identici', JSON.stringify(v1.cleared) === JSON.stringify(v0.cleared) && v1.fr === 1234 && v1.sg === 5);
  check('avanti: la conoscenza (trasmissioni viste) resta', v1.tx);
  check('avanti: Tarsis esiste ma e\' chiuso, e non compare nessuna missione da riprendere', v1.sectors.includes('tarsis:L') && !v1.cp && v1.vociMenu === 'MISSIONI', v1.sectors);
  // contenere i guardiani dei due settori vecchi apre Tarsis (derivato, anche su un salvataggio vecchio)
  const v2 = await p.evaluate(() => { MISSIONS.filter(m => m.sector !== 'tarsis').forEach(m => cleared.add(m.id)); applyUnlocks(); saveState(); return { sectors: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : 'u')).join(' '), t1: nodeOf('t1').locked }; });
  check('avanti: contenuti i due guardiani, Tarsis si apre su un salvataggio nato prima', v2.sectors.includes('tarsis:u') && v2.t1 === false, v2);
  // si gioca una missione di Tarsis e si salva
  const v3 = await p.evaluate(async () => { cleared.add('t1'); currentSector = 'tarsis'; frammenti = 4321; applyUnlocks(); saveState(); activeMission = nodeOf('t2'); RITMO = 0; startBattle(activeMission); await new Promise(r => setTimeout(r, 600)); return { cp: !!leggiBattaglia(), sec: currentSector }; });
  check('nuova build: checkpoint di una missione di Tarsis salvato', v3.cp, v3);
  // ── indietro: si riapre la build vecchia sopra il salvataggio della nuova
  errs.length = 0;
  await p.goto(VECCHIA); await p.waitForTimeout(900);
  const v4 = await p.evaluate(() => { try { buildMenu(); buildMap(); return { ok: true, sector: currentSector, cleared: cleared.size, fr: frammenti, nodi: document.querySelectorAll('.node').length, menu: [...document.querySelectorAll('#menulist .nm')].map(e => e.textContent)[0] }; } catch (e) { return { ok: false, e: e.message }; } });
  log('build 0.8.0 riaperta sul salvataggio della nuova', v4);
  check('indietro: la build vecchia si apre senza errori', v4.ok && errs.length === 0, errs);
  // LIMITE NOTO: la build vecchia non conosce il settore «tarsis» e apre la mappa vuota. Non si perde niente:
  // scegliendo una scheda di settore la mappa torna e i progressi (nodi, frammenti) sono quelli di prima.
  await p.evaluate(() => { go('missioni'); buildSectorTabs(); });
  await p.click('#sectorTabs .sectab >> nth=0'); await p.waitForTimeout(400);
  const v5 = await p.evaluate(() => { saveState(); return { settore: currentSector, nodi: document.querySelectorAll('.node').length, cleared: cleared.size, fr: frammenti }; });
  check('indietro: la mappa e\' vuota finche\' non si sceglie una scheda (limite noto), poi torna e i progressi restano', v4.nodi === 0 && v5.nodi === 8 && v5.cleared >= 17 && v5.fr === 4321, { appena_aperta: v4.nodi, dopo: v5 });
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
  function log(k, v) { console.log(k.padEnd(48), JSON.stringify(v)); }
})();
