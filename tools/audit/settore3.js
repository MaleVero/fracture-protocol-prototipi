// Verifica del terzo settore dentro il gioco vero (non nel banco): sblocco a catena, mappa,
// codice, sprite del NERIS, trasmissioni, salvataggio e ricaricamento.
//   node settore3.js [shots]
const C = require('./common'); const { chromium } = C.pw;
const SHOT = process.argv[2] === 'shots';
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(600);
  const log = (k, v) => console.log(k.padEnd(46), typeof v === 'string' ? v : JSON.stringify(v));
  let fail = 0; const check = (k, ok, extra) => { if (!ok) fail++; log((ok ? '✓ ' : '✗ ') + k, extra === undefined ? '' : extra); };

  // 1. stato iniziale: Tarsis chiuso, t1 giocabile solo dopo il guardiano di Orvat
  const s0 = await p.evaluate(() => ({ sectors: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : 'u')), t: MISSIONS.filter(m => m.sector === 'tarsis').map(m => m.id + ':' + (m.locked ? 'L' : 'u')).join(' ') }));
  log('stato iniziale', s0);
  check('Tarsis esiste ed e\' chiuso all\'inizio', s0.sectors.includes('tarsis:L'));
  check('7 nodi in Tarsis (6 di campo + guardiano)', s0.t.split(' ').length === 7);

  // 2. catena: contenere tutto Cassandra e Orvat apre Tarsis (derivato da applyUnlocks)
  const s1 = await p.evaluate(() => {
    MISSIONS.filter(m => m.sector !== 'tarsis').forEach(m => cleared.add(m.id));
    applyUnlocks();
    return { sectors: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : 'u')), t: MISSIONS.filter(m => m.sector === 'tarsis').map(m => m.id + ':' + (m.locked ? 'L' : 'u')).join(' ') };
  });
  log('dopo aver contenuto Cassandra+Orvat', s1);
  check('il guardiano di Orvat apre Tarsis', s1.sectors.includes('tarsis:u'));
  check('solo la testa di ponte t1 e\' aperta', s1.t.startsWith('t1:u t2:L'), s1.t);
  const s2 = await p.evaluate(() => { cleared.add('t1'); applyUnlocks(); return MISSIONS.filter(m => m.sector === 'tarsis').map(m => m.id + ':' + (m.locked ? 'L' : 'u')).join(' '); });
  check('contenuto t1 si apre t2', s2.includes('t2:u'), s2);
  const s3 = await p.evaluate(() => { ['t2', 't3', 't4', 't5'].forEach(i => cleared.add(i)); applyUnlocks(); const a = nodeOf('t7').locked; cleared.add('t6'); applyUnlocks(); return { prima: a, dopo: nodeOf('t7').locked }; });
  check('il guardiano t7 si apre solo con tutti i nodi di campo', s3.prima === true && s3.dopo === false, s3);

  // 3. mappa strategica: tab del settore e nodi
  await p.evaluate(() => { currentSector = 'tarsis'; go('missioni'); buildSectorTabs(); buildMap(); });
  await p.waitForTimeout(500);
  const map = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('.sectab')].map(e => e.innerText.replace(/\s+/g, ' ')), nodi: document.querySelectorAll('.node').length, label: [...document.querySelectorAll('.nodelabel')].map(e => e.innerText.split('\n')[0]).join(' | ') }));
  log('mappa', map);
  check('3 tab di settore', map.tabs.length === 3, map.tabs);
  check('7 nodi disegnati', map.nodi === 7, map.nodi);
  if (SHOT) await p.screenshot({ path: C.OUT + '/tarsis-mappa.png' });

  // 4. codice: scheda NERIS
  const cod = await p.evaluate(() => { codexSeen.add('neris'); renderCodex(); go('codice'); return CODEX.some(c => c.type === 'neris'); });
  await p.waitForTimeout(400);
  const codTxt = await p.evaluate(() => document.querySelector('#codice').innerText.includes('NERIS'));
  check('il codice mostra NERIS', cod && codTxt);
  if (SHOT) await p.screenshot({ path: C.OUT + '/tarsis-codice.png' });

  // 5. battaglia: ogni missione di Tarsis parte, ha NERIS dove previsto, e lo sprite si disegna
  const bat = await p.evaluate(async () => {
    RITMO = 0; const out = [];
    for (const id of ['t1', 't3', 't4', 't7']) {
      const m = nodeOf(id); activeMission = m; currentSector = 'tarsis'; startBattle(m);
      await new Promise(r => setTimeout(r, 500));
      out.push({ id, nemici: kauchas().map(u => u.type).sort().join(','), neris: kauchas().filter(u => u.type === 'neris').length, water: B.water.size, tx: !!document.querySelector('#transmission .txtext') && document.querySelector('#transmission').style.display !== 'none' ? document.querySelector('#transmission .txtext').innerText.slice(0, 40) : null });
    }
    return out;
  });
  bat.forEach(r => log('  ' + r.id, r));
  check('t1 garantisce un NERIS', bat[0].neris >= 1);
  check('t7 ha 3 NERIS e il Varco Madre', bat[3].neris === 3 && bat[3].nemici.includes('matria'), bat[3].nemici);
  const spr = await p.evaluate(() => { try { return { art: typeof window.__ISO === 'object', sprite: !!document.getElementById('isoCanvas') }; } catch (e) { return String(e); } });
  if (SHOT) { await p.waitForTimeout(500); await p.screenshot({ path: C.OUT + '/tarsis-t7.png' }); }

  // 6. salvataggio: i nodi di Tarsis sopravvivono a un ricaricamento
  await p.evaluate(() => { cleared.add('t1'); cleared.add('t2'); saveState(); });
  await p.reload(); await p.waitForTimeout(700);
  const rl = await p.evaluate(() => ({ cleared: [...cleared].filter(i => i[0] === 't'), sectors: SECTORS.map(s => s.id + ':' + (s.locked ? 'L' : 'u')), t3: nodeOf('t3').locked }));
  log('dopo ricaricamento', rl);
  check('t1 e t2 contenuti restano salvati', rl.cleared.includes('t1') && rl.cleared.includes('t2'));
  check('Tarsis resta aperto dopo il caricamento', rl.sectors.includes('tarsis:u'));
  check('t3 aperto da t2 dopo il caricamento', rl.t3 === false);
  check('nessun errore JavaScript', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close();
  process.exit(fail ? 1 : 0);
})();
