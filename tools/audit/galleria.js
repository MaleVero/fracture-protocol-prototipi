// Galleria arte: confronto di telai, creature e strutture con il motore vero del campo.
//   node galleria.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. ogni tipo di telaio, creatura e struttura ha la sua scheda, disegnata
    const r1 = await p.evaluate(async () => {
      go('galleria'); await new Promise(r => setTimeout(r, 900));
      const T = __galleria.galTipi(), attesi = [].concat(T.mech, T.kauBase, T.kauAlto, T.str);
      const celle = [...document.querySelectorAll('canvas[data-gk]')];
      const nonVuote = celle.filter(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 60) n++; return n > 120; }).length;
      return { attesi: attesi.length, celle: celle.length, nonVuote, chiavi: celle.map(c => c.dataset.gk).sort().join() === attesi.slice().sort().join(), mech: __galleria.conteggi().mech, kau: __galleria.conteggi().kau, ridotti: celle.filter(c => c.dataset.fit !== '1').map(c => c.dataset.gk + ':' + c.dataset.fit) };
    });
    check(`${w}×${h}: una scheda per ogni telaio (${r1.mech}), creatura (${r1.kau}) e struttura (3), tutte disegnate`, r1.celle === r1.attesi && r1.nonVuote === r1.celle && r1.chiavi && r1.attesi === r1.mech + r1.kau + 3, r1);
    // 2. posa, pavimento e scala cambiano davvero il disegno
    const r2 = await p.evaluate(async () => {
      const px = k => { const c = document.querySelector(`canvas[data-gk="${k}"]`); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s = (s * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; return s; };
      const clic = (g, v) => document.querySelector(`.gal-bar button[data-g="${g}"][data-v="${v}"]`).click();
      const idle = px('vorn'); clic('posa', 'colpo'); const colpo = px('vorn'); clic('posa', 'ferito'); const ferito = px('vorn'); clic('posa', 'crollo'); const crollo = px('vorn'); clic('posa', 'idle');
      const cass = px('jaeger'); clic('tema', 'orvat'); const orv = px('jaeger'); clic('tema', 'tarsis'); const tar = px('jaeger'); clic('tema', 'cassandra'); const cass2 = px('jaeger');
      clic('zoom', 1); const campo = px('civile'); clic('zoom', 2.2); const grande = px('civile'); clic('zoom', 1.6); const medio = px('civile');   // un civile e' piccolo: le sagome grandi vengono ridotte per starci e a ×1,6 e ×2,2 coinciderebbero
      return { pose: new Set([idle, colpo, ferito, crollo]).size, tema: new Set([cass, orv, tar]).size, torna: cass === cass2, scala: new Set([campo, grande, medio]).size };
    });
    check(`${w}×${h}: le quattro pose, i tre pavimenti e le tre scale danno disegni diversi, e tornando indietro si ritrova lo stesso`, r2.pose === 4 && r2.tema === 3 && r2.torna && r2.scala === 3, r2);
    // 3. il confronto a due
    const r3 = await p.evaluate(async () => {
      const clic = k => document.querySelector(`.gal-card[data-k="${k}"]`).click();
      clic('behemoth'); const una = document.getElementById('galConf').textContent.includes('Scelta'); clic('matria'); await new Promise(r => setTimeout(r, 150));
      const due = { tab: !!document.querySelector('#galConfT table'), nomi: document.getElementById('galConfT').textContent.includes('BHM-02') && document.getElementById('galConfT').textContent.includes('VARCO MADRE'), rapp: /rapporto/.test(document.getElementById('galConfT').textContent), sel: document.querySelectorAll('.gal-card.sel').length };
      clic('jaeger'); await new Promise(r => setTimeout(r, 150)); const terza = { sel: [...document.querySelectorAll('.gal-card.sel')].map(c => c.dataset.k).join(), nomi: document.getElementById('galConfT').textContent.includes('JGR-01') && !document.getElementById('galConfT').textContent.includes('BHM-02') };
      clic('jaeger'); clic('matria'); await new Promise(r => setTimeout(r, 100)); const vuoto = document.getElementById('galConf').textContent.includes('Tocca due schede');
      return { una, due, terza, vuoto };
    });
    check(`${w}×${h}: toccare due schede le mette a confronto (tabella, rapporto), la terza sostituisce la prima, deselezionando si torna al suggerimento`, r3.una && r3.due.tab && r3.due.nomi && r3.due.rapp && r3.due.sel === 2 && r3.terza.sel.split(',').sort().join() === 'jaeger,matria' && r3.terza.nomi && r3.vuoto, r3);
    await ctx.close();
  }
  // 4. confronti: altezze, sagome, somiglianze
  const ctx = await b.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(500);
  const r4 = await p.evaluate(async () => { go('galleria'); await new Promise(r => setTimeout(r, 1300));
    const piena = id => { const c = document.getElementById(id); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 80) n++; return n; };
    const G = window.__GAL || {}; const fam = k => ({ vorn: 'vorn', vornelite: 'vorn', krull: 'krull', krullelite: 'krull', lancer: 'lancer', lancerjet: 'lancer' }[k] || k);
    const inter = (G.tuttiSim || []).filter(p => fam(p.a) !== fam(p.b));
    return { altezze: piena('galAltezze'), sagome: piena('galSagome'), righe: document.querySelectorAll('#galSim tr').length, top: G.tuttiSim && G.tuttiSim.slice(0, 3).map(p => p.a + '~' + p.b + ' ' + p.rischio.toFixed(2)), primaFamiglia: G.tuttiSim && fam(G.tuttiSim[0].a) === fam(G.tuttiSim[0].b), maxFra: inter.length ? +inter[0].rischio.toFixed(2) : null, maxFraCoppia: inter.length ? inter[0].a + '~' + inter[0].b : null, n: (G.tuttiSim || []).length }; });
  check('altezze a confronto, sagome a grandezza di pedina e tabella delle somiglianze sono disegnate', r4.altezze > 300 && r4.sagome > 300 && r4.righe >= 11, r4);
  check('la coppia piu\' simile e\' una stessa famiglia (VORN ~ VORN APEX: voluto) e fra famiglie diverse il rischio di confusione resta sotto 0,65', r4.primaFamiglia && r4.maxFra < 0.65 && r4.n === 25 * 24 / 2, { top: r4.top, maxFra: r4.maxFra, coppia: r4.maxFraCoppia });
  // 5. lo stato del gioco non viene toccato: B, contesto e luci tornano come prima
  const r5 = await p.evaluate(async () => {
    RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500)); const t = document.getElementById('txOk'); if (t) t.click();
    const B0 = B, n0 = B.units.length, round0 = B.round, luci0 = __ISO.luci().length, am0 = activeMission;
    go('galleria'); await new Promise(r => setTimeout(r, 900)); document.querySelector('.gal-card[data-k="neris"]').click(); document.querySelector('.gal-card[data-k="risacca"]').click(); await new Promise(r => setTimeout(r, 200));
    const intatto = B === B0 && B.units.length === n0 && B.round === round0 && activeMission === am0 && __ISO.luci().length === luci0;
    go('battle'); await new Promise(r => setTimeout(r, 200)); let ok = true; try { __ISO.paintOnce(5000); __ISO.paintOnce(5040); } catch (e) { ok = false; }
    return { intatto, ok, TW: __ISO.TW };
  });
  check('con una battaglia in corso, aprire la galleria non cambia B, la missione attiva ne\' le luci, e il campo continua a disegnarsi', r5.intatto && r5.ok && r5.TW > 20, r5);
  // 6. entrata dalle Opzioni, ritorno, animazione che si spegne uscendo
  const r6 = await p.evaluate(async () => {
    renderOpzioni(); go('opzioni'); await new Promise(r => setTimeout(r, 200)); document.getElementById('apriGalleria').click(); await new Promise(r => setTimeout(r, 800));
    const dentro = document.querySelector('.screen.active').id; document.querySelector('.gal-bar button[data-g="anima"][data-v="true"]').click(); await new Promise(r => setTimeout(r, 300)); const acceso = __galleria.stato.raf !== null && __galleria.stato.anima;
    document.querySelector('#galleria [data-back]').click(); await new Promise(r => setTimeout(r, 300)); const ritorno = document.querySelector('.screen.active').id; const spento = __galleria.stato.raf === null && !__galleria.stato.anima;
    return { dentro, acceso, ritorno, spento };
  });
  check('si apre dalle Opzioni, ANIMA accende il loop, e uscendo si torna alle Opzioni con il loop spento', r6.dentro === 'galleria' && r6.acceso && r6.ritorno === 'opzioni' && r6.spento, r6);
  // 7. #galleria nell'indirizzo la apre all'avvio
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })).newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto(C.URL + '#galleria'); await q.waitForTimeout(1200);
  const r7 = await q.evaluate(() => ({ schermata: document.querySelector('.screen.active').id, celle: document.querySelectorAll('canvas[data-gk]').length }));
  check('l\'indirizzo con #galleria apre direttamente la galleria', r7.schermata === 'galleria' && r7.celle === 25, r7);
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
