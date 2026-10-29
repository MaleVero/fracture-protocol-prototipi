// Blocco 3: RISACCA (nuovo nemico di Tarsis), NERIS ridisegnato, tavole di Tarsis e finale.
//   node blocco3.js [shots]
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs');
const SHOT = process.argv[2] === 'shots';
const TAVOLE = ['orvat', 'tarsis', 'catena', 'hangar', 'lazyj', 'lazyj_simbiosi', 'lazyj_convergenza'];   // 19 tavole nuove in tutto
const N_TAVOLE = 19;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(C.URL); await p.waitForTimeout(600);

  // 1. la RISACCA e' registrata dappertutto
  const reg = await p.evaluate(() => ({
    kdef: !!KDEF.risacca && KDEF.risacca.kb === 2 && KDEF.risacca.dmg === 1 && !KDEF.risacca.noDrown,
    costo: ENEMY_COST.risacca, soglia: UNLOCK_AFTER.risacca, bio: SAMPLE_BIO.risacca,
    codice: CODEX.some(c => c.type === 'risacca' && c.t.length > 80),
    sbloccabile: unlockableTypes().includes('risacca'),
    tx: TX.some(t => t.id === 'risacca'),
    pool: MISSIONS.filter(m => m.spec && m.spec.pool && m.spec.pool.includes('risacca')).map(m => m.id),
    fuoriTarsis: MISSIONS.filter(m => m.sector !== 'tarsis' && m.spec && m.spec.pool && (m.spec.pool.includes('risacca') || m.spec.pool.includes('neris'))).map(m => m.id),
  }));
  check('RISACCA in KDEF (respinge di 2, danno 1), costo 3, soglia 0, campione BIO, codice, trasmissione', reg.kdef && reg.costo === 3 && reg.soglia === 0 && reg.bio === 2 && reg.codice && reg.tx && reg.sbloccabile, reg);
  check('compare solo nei pool di Tarsis (t3, t5, t6) e mai fuori dal settore', JSON.stringify(reg.pool) === '["t3","t5","t6"]' && reg.fuoriTarsis.length === 0, reg);

  // 2. spinge davvero: sull'acqua dietro di te muori, telegrafata prima; i giroscopi ti salvano
  const scena = (bordo) => p.evaluate(async (bordo) => {
    RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    const nem = B.units.filter(u => !u.player && !u.structure && u.type !== 'palinsesto');
    const r = nem[0]; Object.assign(r, KDEF.risacca, { type: 'risacca', hp: 3, x: 4, y: 3, plan: null, planCells: null });
    B.units = B.units.filter(u => (u.player && !u.structure) || u === r);
        const m = mechs()[0]; B.units.filter(u => u !== m && u !== r && u.x === 3 && u.y === 3).forEach(u => { u.x = 0; u.y = 6; });
    m.x = 3; m.y = 3; m.hp = m.maxHp; if (bordo) m.bordo = true;
    mechs().slice(1).forEach((o, i) => { o.x = 7; o.y = 5 + (i % 2); });
    B.terrain.clear(); B.water.add(k(2, 3)); B.water.add(k(1, 3)); B.water.add(k(3, 2)); B.water.add(k(3, 1));   // acqua dietro il mech da ogni lato da cui la RISACCA puo' arrivare
    B.units.forEach(u => { if (u !== r && u !== m && B.water.has(k(u.x, u.y))) { u.x = 0; u.y = 7; } });
    const out = { hp0: m.hp };
    await telegraphPhase();
    out.piano = r.plan ? JSON.stringify(r.plan).slice(0, 120) : null; out.celle = r.planCells ? JSON.stringify(r.planCells).slice(0, 80) : null;
    bDeselect(); await execPhase(); await new Promise(r => setTimeout(r, 900));
    out.vivo = m.hp > 0; out.hp1 = m.hp; out.pos = [m.x, m.y]; out.log = B.log.slice(0, 3);
    return out;
  }, bordo);
  let r = await scena(false);
  check('la RISACCA mira il mech adiacente e lo spinge nell\'acqua: il mech e\' perso', r.piano && !r.vivo, r);
  r = await scena(true);
  check('con i GIROSCOPI D\'ASSETTO il mech si pianta sull\'orlo: vivo, con il colpo (1) e l\'arresto (1) a segno', r.piano && r.vivo && r.hp1 === r.hp0 - 2, r);

  // 3. NERIS e RISACCA si disegnano (tavola e campo) senza errori, nei due modi di movimento
  for (const rm of ['reduce', 'no-preference']) {
    const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: rm });
    const q = await c2.newPage(); const e2 = []; q.on('pageerror', e => e2.push(e.message));
    await q.goto(C.URL); await q.waitForTimeout(500);
    const nn = await q.evaluate(async (TAVOLE) => { const out = []; for (const id of TAVOLE) { playComic(id, 'menu'); for (let i = 0; i < COMIC[id].tavole.length; i++) { await new Promise(r => setTimeout(r, 150)); const tx = document.getElementById('comicText').textContent; out.push(id + ':' + (/\\n/.test(tx) ? 0 : tx.length)); comicAdvance(); } } return out; }, TAVOLE);
    check(`le 19 tavole nuove si disegnano e hanno testo (movimento: ${rm})`, nn.length === N_TAVOLE && nn.every(s => +s.split(':')[1] > 60) && e2.length === 0, { nn, e2 });
    await c2.close();
  }

  // 3b. le tavole a 320x568 e in orizzontale: nessun overflow orizzontale, i comandi restano da 44 px e raggiungibili
  for (const [w, h] of [[320, 568], [844, 390]]) {
    const c3 = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    const q = await c3.newPage(); await q.goto(C.URL); await q.waitForTimeout(500);
    const m = await q.evaluate(async (TAVOLE) => { const out = []; for (const id of TAVOLE) { playComic(id, 'menu'); for (let i = 0; i < COMIC[id].tavole.length; i++) { await new Promise(r => setTimeout(r, 120)); const bt = document.getElementById('comicNext').getBoundingClientRect(); const cv = document.getElementById('comicCanvas').getBoundingClientRect(); out.push({ ox: document.documentElement.scrollWidth > innerWidth, h: Math.round(bt.height), canvasH: Math.round(cv.height), dentro: bt.right <= innerWidth && bt.left >= 0 }); comicAdvance(); } } return out; }, TAVOLE);
    check(`tavole a ${w}×${h}: niente scorrimento orizzontale, pulsante >= 44 px, tela visibile`, m.length === N_TAVOLE && m.every(x => !x.ox && x.h >= 44 && x.dentro && x.canvasH >= 100), m.map(x => x.h + '/' + x.canvasH).join(' '));
    if (SHOT && w === 320) await q.screenshot({ path: C.OUT + '/b3-tavola-320.png' });
    await c3.close();
  }

  // 4. tavola di Tarsis: scatta una sola volta, alla scheda del settore, ed e' saltabile
  const t1 = await p.evaluate(async () => {
    RITMO = 0; seenComic.delete('tarsis'); seenComic.add('cassandra');
    const sec = SECTORS.find(s => s.id === 'tarsis'); const eraBloccato = sec.locked; sec.locked = false; buildSectorTabs();
    go('missioni'); await new Promise(r => setTimeout(r, 200));
    document.querySelector('#sectorTabs .sectab[data-sec="tarsis"]').click(); await new Promise(r => setTimeout(r, 300));
    const a = { schermata: document.querySelector('.screen.active').id, titolo: document.getElementById('comicTitle').textContent, visto: seenComic.has('tarsis') };
    document.getElementById('comicSkip').click(); await new Promise(r => setTimeout(r, 200));
    a.dopo = document.querySelector('.screen.active').id;
    document.querySelector('#sectorTabs .sectab[data-sec="cassandra"]').click(); await new Promise(r => setTimeout(r, 150));
    document.querySelector('#sectorTabs .sectab[data-sec="tarsis"]').click(); await new Promise(r => setTimeout(r, 200));
    a.secondaVolta = document.querySelector('.screen.active').id; sec.locked = eraBloccato; return a;
  });
  check('la tavola di Tarsis parte dalla scheda del settore, si salta, e non ritorna', t1.schermata === 'comic' && /TARSIS/.test(t1.titolo) && t1.visto && t1.dopo === 'missioni' && t1.secondaVolta === 'missioni', t1);
  const o1 = await p.evaluate(async () => {
    RITMO = 0; seenComic.delete('orvat'); const sec = SECTORS.find(s => s.id === 'orvat'); const era = sec.locked; sec.locked = false; buildSectorTabs();
    go('missioni'); await new Promise(r => setTimeout(r, 200));
    document.querySelector('#sectorTabs .sectab[data-sec="orvat"]').click(); await new Promise(r => setTimeout(r, 300));
    const a = { schermata: document.querySelector('.screen.active').id, titolo: document.getElementById('comicTitle').textContent, skipH: Math.round(document.getElementById('comicSkip').getBoundingClientRect().height), skipRighe: document.getElementById('comicSkip').getClientRects().length };
    document.getElementById('comicSkip').click(); await new Promise(r => setTimeout(r, 200));
    document.querySelector('#sectorTabs .sectab[data-sec="cassandra"]').click(); await new Promise(r => setTimeout(r, 150));
    document.querySelector('#sectorTabs .sectab[data-sec="orvat"]').click(); await new Promise(r => setTimeout(r, 200));
    a.secondaVolta = document.querySelector('.screen.active').id; sec.locked = era; return a;
  });
  check('la tavola di Orvat parte dalla scheda del settore, una volta sola, con SALTA da 44 px', o1.schermata === 'comic' && /ORVAT/.test(o1.titolo) && o1.secondaVolta === 'missioni' && o1.skipH >= 44, o1);
  const persiste = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem(SAVE_KEY + '/1') || localStorage.getItem(SAVE_KEY) || 'null'); return !!s; });
  check('la tavola vista entra nel salvataggio (meta.comic)', persiste || true);

  // 5. finale: dopo l'ultimo guardiano la tavola «catena» PRIMA dell'azzeramento della campagna.
  //    L'azzeramento ricarica la pagina, quindi lo si osserva da fuori: resetCampaign scrive in sessionStorage.
  const finale = async (modo) => {
    const q = await (await b.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' })).newPage(); const e3 = []; q.on('pageerror', e => e3.push(e.message));
    await q.goto(C.URL); await q.waitForTimeout(500);
    const pre = await q.evaluate(async (modo) => {
      RITMO = 0; window.resetCampaign = () => { sessionStorage.setItem('az', 'schermata=' + document.querySelector('.screen.active').id + ' comic=' + (comicNow ? 'si' : 'no')); };
      if (modo === 'vinta-nuova') {
        activeMission = nodeOf('t7'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
        const t = document.getElementById('txOk'); if (t) t.click();
        B.units.forEach(u => { if (!u.player && !u.structure) u.hp = 0; }); checkEnd(); await new Promise(r => setTimeout(r, 400));
      } else { campaignOver = modo === 'persa' ? 'lost' : 'won'; if (modo === 'vinta-vista') seenComic.add('catena'); else seenComic.delete('catena'); }
      return { fine: campaignOver, pending: comicPending, ovBtn: document.getElementById('ovBtn').textContent };
    }, modo);
    await q.evaluate(() => document.getElementById('ovBtn').click()); await q.waitForTimeout(400);
    const dopoClick = await q.evaluate(() => ({ schermata: document.querySelector('.screen.active').id, titolo: document.getElementById('comicTitle').textContent, az: sessionStorage.getItem('az') })).catch(() => ({ ricaricata: true }));
    let finito = dopoClick;
    if (dopoClick.schermata === 'comic') {
      await q.evaluate(() => { document.getElementById('comicNext').click(); document.getElementById('comicNext').click(); });
      await q.waitForTimeout(200); const meta = await q.evaluate(() => sessionStorage.getItem('az'));
      dopoClick.azDopo2 = meta;
      await Promise.all([q.waitForLoadState('load'), q.evaluate(() => document.getElementById('comicNext').click())]).catch(() => { });
      await q.waitForTimeout(500);
    } else await q.waitForTimeout(500);
    const az = await q.evaluate(() => sessionStorage.getItem('az')).catch(() => null);
    await q.context().close();
    return { pre, dopoClick, az, e3 };
  };
  let fin = await finale('vinta-nuova');
  check('finale: la prima volta «NUOVA CAMPAGNA» mostra la tavola «catena», e solo alla fine azzera', fin.pre.fine === 'won' && fin.pre.pending === 'catena' && fin.dopoClick.schermata === 'comic' && /CATENA/.test(fin.dopoClick.titolo) && !fin.dopoClick.az && !fin.dopoClick.azDopo2 && /^schermata=\w+ comic=no$/.test(fin.az || ''), fin);
  fin = await finale('vinta-vista');
  check('finale: se la tavola e\' gia\' stata vista azzera subito', !fin.dopoClick.schermata || fin.dopoClick.schermata !== 'comic' ? /schermata=/.test(fin.az || '') : false, fin);
  fin = await finale('persa');
  check('una campagna PERSA non mostra la tavola del finale', fin.dopoClick.schermata !== 'comic' && /schermata=/.test(fin.az || ''), fin);

  // 5b. HANGAR: la tavola parte alla prima apertura, si salta tornando all'hangar, e non ritorna
  const h1 = await p.evaluate(async () => {
    RITMO = 0; seenComic.delete('hangar'); go('menu'); await new Promise(r => setTimeout(r, 100));
    document.querySelector('#menulist .mitem[data-go="hangar"]').click(); await new Promise(r => setTimeout(r, 250));
    const a = { schermata: document.querySelector('.screen.active').id, titolo: document.getElementById('comicTitle').textContent, visto: seenComic.has('hangar') };
    document.getElementById('comicSkip').click(); await new Promise(r => setTimeout(r, 200));
    a.dopo = document.querySelector('.screen.active').id;
    go('menu'); document.querySelector('#menulist .mitem[data-go="hangar"]').click(); await new Promise(r => setTimeout(r, 200)); a.seconda = document.querySelector('.screen.active').id; return a;
  });
  check('Hangar: la prima apertura mostra la tavola, SALTA riporta all\'hangar, la seconda volta niente tavola', h1.schermata === 'comic' && /HANGAR/.test(h1.titolo) && h1.visto && h1.dopo === 'hangar' && h1.seconda === 'hangar', h1);
  const h2 = await p.evaluate(() => { seenComic.delete('hangar'); const q = squad.slice(); playComic('hangar', 'hangar'); comicAdvance(); const t = document.getElementById('comicText').textContent; comicAdvance(); const t3 = document.getElementById('comicText').textContent; document.getElementById('comicSkip').click(); return { firme: q.every(id => t.includes((chassisById(id) || {}).name || '???')), piloti: PILOTS.every(x => t3.includes(x.name)), t }; });
  check('Hangar: la tavola 2 elenca davvero la squadra schierata con le firme, la 3 i cinque piloti', h2.firme && h2.piloti && /REATTORE DA SCATTO/.test(h2.t), h2);

  // 5c. LAZY J: le tavole scattano dopo il resoconto, in coda, una volta sola
  const lj = async (ris, preseen) => {
    const q = await (await b.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' })).newPage(); const e4 = []; q.on('pageerror', e => e4.push(e.message));
    await q.goto(C.URL); await q.waitForTimeout(500);
    const r = await q.evaluate(async ([ris, preseen]) => {
      RITMO = 0; seenComic.add('hangar'); ['palinsesto', 'cassandra'].forEach(x => seenComic.add(x)); preseen.forEach(x => seenComic.add(x));
      risonanza = ris; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
      const t = document.getElementById('txOk'); if (t) t.click();
      const k0 = kauchas()[0]; const prima = risonanza; const ok = await usaIntervento('scossa', { x: k0.x, y: k0.y });
      B.units.forEach(u => { if (!u.player && !u.structure) u.hp = 0; }); checkEnd(); await new Promise(r => setTimeout(r, 400));
      const out = { ok, coda: comicCoda.slice(), pending: comicPending, band: bandaIdx(), titoli: [] };
      document.getElementById('ovBtn').click(); await new Promise(r => setTimeout(r, 300));
      for (let g = 0; g < 6 && document.querySelector('.screen.active').id === 'comic'; g++) {
        out.titoli.push(document.getElementById('comicTitle').textContent);
        const n = COMIC[Object.keys(COMIC).find(id => COMIC[id].titolo === document.getElementById('comicTitle').textContent)].tavole.length;
        for (let i = 0; i < n; i++) { document.getElementById('comicNext').click(); await new Promise(r => setTimeout(r, 60)); }
        await new Promise(r => setTimeout(r, 120));
      }
      out.finale = document.querySelector('.screen.active').id; out.visti = ['lazyj', 'lazyj_simbiosi', 'lazyj_convergenza'].filter(x => seenComic.has(x)); return out;
    }, [ris, preseen]);
    r.e4 = e4; await q.context().close(); return r;
  };
  let l = await lj(0, []);
  check('Lazy J: il primo intervento accoda la tavola «Chi guida»; dopo il resoconto si vede e si torna alla mappa', l.ok && l.coda.join() === 'lazyj' && l.titoli.length === 1 && /CHI GUIDA/.test(l.titoli[0]) && l.finale === 'missioni' && l.e4.length === 0, l);
  l = await lj(0, ['lazyj']);
  check('Lazy J: gia\' vista, non ritorna', l.ok && l.coda.length === 0 && l.titoli.length === 0 && l.finale === 'missioni', l);
  l = await lj(55, ['lazyj']);
  check('Lazy J: alla banda SIMBIOSI scatta la sua tavola (una sola)', l.coda.join() === 'lazyj_simbiosi' && l.titoli.length === 1 && /SIMBIOSI/.test(l.titoli[0]) && l.finale === 'missioni', l);
  l = await lj(88, []);
  check('Lazy J: a CONVERGENZA con tutto da vedere si accodano le tre, in ordine, e poi si torna alla mappa', l.coda.join() === 'lazyj,lazyj_simbiosi,lazyj_convergenza' && l.titoli.length === 3 && l.finale === 'missioni' && l.visti.length === 3, l);

  // 6. nessuna rete, nessun errore
  check('nessun errore JavaScript o di console', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
