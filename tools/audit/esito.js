// Schermata di fine missione: pannelli con righe allineate, barre della corruzione, campioni, valutazione in una riga.
//   node esito.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. sconfitta con costi di ogni tipo: le righe ci sono, coi valori che il gioco ha calcolato
    const r1 = await p.evaluate(async () => {
      RITMO = 0; risonanza = 40; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500)); const t = document.getElementById('txOk'); if (t) t.click();
      B.mission.civic = 4; B.mission.perdite = 3; B.mission.ktech = 2; const ci = civicCorruption(), pe = perditeCorruption(), kt = B.mission.ktech;
      const nome = activeMission.name, sett = sectorDef(activeMission.sector || currentSector).nm; finish(false, 'wipe'); await new Promise(r => setTimeout(r, 400));
      const el = document.getElementById('ovCorruption'), txt = el.innerText.replace(/\s+/g, ' ');
      const gauges = [...el.querySelectorAll('.ov-gauge')].map(g => { const m = g.querySelector('.ov-gl b').textContent.match(/(\d+)% → (\d+)%/); const a = +m[1], c = +m[2], bb = g.querySelector('.b'), d = g.querySelector('.d');
        return { a, c, base: bb.style.width === Math.min(a, c) + '%', delta: a === c ? !d : !!d && d.style.width === Math.abs(c - a) + '%' && d.classList.contains(c > a ? 'up' : 'dn') && d.style.left === Math.min(a, c) + '%', aria: /per cento$/.test(g.querySelector('.ov-gbar').getAttribute('aria-label')) }; });
      const marci = MISSIONS.filter(x => x.id !== activeMission.id && (x.corr || 0) >= SPREAD_THRESHOLD).length;
      return { kick: document.getElementById('ovKick').textContent, attesoKick: sett + ' · ' + nome, gauges, civ: txt.includes('COLLATERALE CIVILE · 4') && txt.includes('+' + fmtCorr(ci) + '%'), per: txt.includes('PERDITE AI KAUCHA · 3') && txt.includes('+' + fmtCorr(pe) + '%'), kt: txt.includes('INNESTI KAUCHA SCHIERATI') && txt.includes('+' + kt + '%'),
        chips: el.querySelectorAll('.ov-chip').length, marci, sfogo: /Lazy J non è intervenuto/.test(txt), panel: document.querySelectorAll('#outcome .ov-panel').length, anim: getComputedStyle(document.querySelector('#outcome .ov-panel')).animationName };
    });
    check(`${w}×${h}: la sconfitta ha il settore e la missione in testa, due barre con la parte cambiata nel colore giusto, una riga per ogni costo con il valore calcolato, i nodi fuori controllo e lo sfogo`,
      r1.kick === r1.attesoKick && r1.gauges.length === 2 && r1.gauges.every(g => g.base && g.delta && g.aria) && r1.civ && r1.per && r1.kt && r1.chips === r1.marci && r1.sfogo && r1.panel >= 2 && r1.anim === 'none', r1);
    // 2. la valutazione sta in UNA riga di tre bottoni toccabili; il pulsante principale e' pieno; niente scorrimento orizzontale
    const r2 = await p.evaluate(() => { const bs = [...document.querySelectorAll('#ovVal button')].map(x => x.getBoundingClientRect()); const bt = getComputedStyle(document.getElementById('ovBtn'));
      return { n: bs.length, stessaRiga: new Set(bs.map(x => Math.round(x.top))).size === 1, minH: Math.round(Math.min(...bs.map(x => x.height))), minW: Math.round(Math.min(...bs.map(x => x.width))), pieno: bt.backgroundColor !== 'rgba(0, 0, 0, 0)', ov: document.documentElement.scrollWidth > innerWidth, sc: document.getElementById('outcome').scrollWidth > document.getElementById('outcome').clientWidth }; });
    check(`${w}×${h}: i tre bottoni della valutazione stanno su una riga (≥44 px), il pulsante per tornare alla mappa e' pieno, niente scorrimento orizzontale`, r2.n === 3 && r2.stessaRiga && r2.minH >= 44 && r2.minW >= 44 && r2.pieno && !r2.ov && !r2.sc, r2);
    // 3. vittoria: le righe sommano al totale, il saldo e' quello vero, i campioni coincidono
    const r3 = await p.evaluate(async () => {
      go('missioni'); RITMO = 0; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500)); const t = document.getElementById('txOk'); if (t) t.click();
      const bio0 = samples.bio, tec0 = samples.tec; const prima = frammenti; B.units.filter(u => !u.player && !u.structure).forEach(u => { u.hp = 0; u.dead = true; });
      finish(true, 'ok'); await new Promise(r => setTimeout(r, 400));
      const righe = [...document.querySelectorAll('#ovReward .ov-row')], somma = righe.filter(r => !r.classList.contains('miss')).reduce((s, r) => s + (+(r.textContent.match(/\+(\d+)\s*$/) || [0, 0])[1]), 0);
      const tot = +document.querySelector('#ovReward .ov-tot b').textContent.replace(/\D/g, ''), saldo = +document.querySelector('#ovReward .ov-tot small').textContent.replace(/\D/g, '');
      const cp = [...document.querySelectorAll('.ov-samp b')].map(e => +e.textContent.replace(/\D/g, '')), ct = [...document.querySelectorAll('.ov-samp span')].map(e => +e.textContent.match(/\d+/)[0]);
      return { titolo: document.getElementById('ovTitle').textContent, righe: righe.length, somma, tot, saldo, guadagno: frammenti - prima, attSaldo: frammenti, cp, ct, dBio: samples.bio - bio0, dTec: samples.tec - tec0, totBio: samples.bio, totTec: samples.tec };
    });
    check(`${w}×${h}: la vittoria mostra base e bonus, la somma delle righe e' il totale (${r3.tot}), il saldo e' quello vero e i campioni coincidono con quelli incassati`,
      /ZONA CONTENUTA/.test(r3.titolo) && r3.righe >= 2 && r3.somma === r3.tot && r3.tot === r3.guadagno && r3.saldo === r3.attSaldo && (r3.cp.length === 0 || (r3.cp[0] === r3.dBio && r3.cp[1] === r3.dTec && r3.ct[0] === r3.totBio && r3.ct[1] === r3.totTec)), r3);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
