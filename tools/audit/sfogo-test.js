// Lo SFOGO della risonanza: scende di 6 a ogni missione chiusa senza usare Lazy J, e solo allora.
//   node sfogo-test.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(500);
  // una missione: ris iniziale, se usare Lazy J, come chiuderla (vinta / persa / sganciata)
  const gioca = (ris, usa, esito) => p.evaluate(async ([ris, usa, esito]) => {
    RITMO = 0; ['hangar', 'palinsesto', 'cassandra', 'lazyj', 'lazyj_simbiosi', 'lazyj_convergenza'].forEach(x => seenComic.add(x));
    risonanza = ris; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    let fatto = null; if (usa) { const k0 = kauchas()[0]; fatto = await usaIntervento('scossa', { x: k0.x, y: k0.y }); }
    const durante = risonanza;
    if (esito === 'vinta') { B.units.forEach(u => { if (!u.player && !u.structure) u.hp = 0; }); checkEnd(); }
    else if (esito === 'persa') { B.units.forEach(u => { if (u.player && !u.structure) u.hp = 0; }); checkEnd(); }
    else finish(false, 'timeout', true);
    await new Promise(r => setTimeout(r, 500));
    return { fatto, durante, dopo: risonanza, riga: (document.getElementById('ovCorruption').innerText.match(/Lazy J non è intervenuto[^\n]*/) || [null])[0], over: B.over };
  }, [ris, usa, esito]);
  let r = await gioca(30, false, 'vinta');
  check('vinta senza Lazy J: 30 → 24, e il resoconto lo dice', r.over && r.dopo === 24 && /scende di 6 \(ora 24\)/.test(r.riga || ''), r);
  r = await gioca(30, false, 'persa');
  check('persa senza Lazy J: scende comunque (30 → 24)', r.over && r.dopo === 24, r);
  r = await gioca(30, false, 'sganciata');
  check('sganciata senza Lazy J: scende comunque (30 → 24)', r.over && r.dopo === 24, r);
  r = await gioca(30, true, 'vinta');
  check('con un intervento (+8): non scende, resta 38, e nessuna riga di sfogo', r.fatto && r.durante === 38 && r.dopo === 38 && !r.riga, r);
  r = await gioca(4, false, 'vinta');
  check('non va sotto zero: 4 → 0, e il resoconto dice 4, non 6', r.dopo === 0 && /scende di 4 \(ora 0\)/.test(r.riga || ''), r);
  r = await gioca(0, false, 'vinta');
  check('a zero: niente da scaricare, nessuna riga', r.dopo === 0 && !r.riga, r);
  // lo sfogo viene DOPO l'evoluzione della nemesi: la banda della missione conta, non quella scaricata
  const evo = await p.evaluate(async () => {
    RITMO = 0; nemesis.awake = true; nemesis.dead = false; nemesis.wounded = false; nemesis.adaptations = []; nemesis.stolen = []; nemesis.level = 0; nemesis.fled = 0; nemesis.strappata = false;
    risonanza = 76; activeMission = nodeOf('o1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    B.units.forEach(u => { if (!u.player && !u.structure) u.hp = 0; B.mission.nemesisRepelled = false; }); checkEnd(); await new Promise(r => setTimeout(r, 500));
    return { band: bandaIdx(), ris: risonanza, adatt: nemesis.adaptations.length };
  });
  check('la nemesi evolve con la banda DURANTE la missione (76 = convergenza: 3 adattamenti), poi la barra scende a 70', evo.adatt === 3 && evo.ris === 70 && evo.band === 2, evo);
  // il checkpoint: un ricaricamento a meta' missione non fa perdere il «l'ho usato»
  const ck = await p.evaluate(async () => {
    RITMO = 0; seenComic.add('lazyj'); risonanza = 30; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    const k0 = kauchas()[0]; await usaIntervento('scossa', { x: k0.x, y: k0.y });
    const lj = B.mission.lj; salvaBattaglia();
    risonanzaUsata = false;                                 // come dopo un ricaricamento: il flag globale non c'e' piu'
    const ok = ripristinaBattaglia(); await new Promise(r => setTimeout(r, 400));
    const dopoRip = { ok, lj: B.mission.lj, ris: risonanza };
    B.units.forEach(u => { if (!u.player && !u.structure) u.hp = 0; }); checkEnd(); await new Promise(r => setTimeout(r, 400));
    return { lj, dopoRip, finale: risonanza };
  });
  check('dopo un ricaricamento a meta\' missione l\'intervento gia\' fatto conta ancora: nessuno sfogo', ck.lj === 1 && ck.dopoRip.ok && ck.dopoRip.lj === 1 && ck.finale === ck.dopoRip.ris, ck);
  check('nessun errore JavaScript', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
