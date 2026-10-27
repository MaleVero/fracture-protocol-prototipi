// Effetti di battaglia: le conseguenze si vedono (taglio, scia di spinta, tuffo, voragine) e
// il campo dei tre settori ha la sua scenografia, senza toccare la tavolozza di gioco.
//   node effetti.js [shots]
const C = require('./common'); const { chromium } = C.pw;
const SHOT = process.argv[2] === 'shots';
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 700 } })).newPage(); const errs = [], reqs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
  await p.goto(C.URL); await p.waitForTimeout(500);

  // 1. scenografia per settore
  const sc = {};
  for (const [id, mid] of [['cassandra', 'm1'], ['orvat', 'o3'], ['tarsis', 't3']]) {
    sc[id] = await p.evaluate(async mid => {
      RITMO = 0; activeMission = nodeOf(mid); startBattle(activeMission); await new Promise(r => setTimeout(r, 600));
      const t = document.getElementById('txOk'); if (t) t.click();
      __ISO.paintOnce(100); __ISO.paintOnce(200);
      const kinds = {}; __ISO.props().forEach(q => kinds[q.kind] = (kinds[q.kind] || 0) + 1);
      return { kinds, luci: __ISO.luci().length };
    }, mid);
  }
  const k = id => Object.keys(sc[id].kinds);
  check('Cassandra: scenografia di prima (mast, tank, block, pipes, wreck)', k('cassandra').every(x => ['mast', 'tank', 'block', 'pipes', 'wreck'].includes(x)), sc.cassandra.kinds);
  check('Orvat: ciminiere e forni, niente pilastri teal', (k('orvat').includes('ciminiera') || k('orvat').includes('forno')) && !k('orvat').includes('pilone') && !k('orvat').includes('diga'), sc.orvat.kinds);
  check('Tarsis: piloni e dighe, niente ciminiere ne\' forni, niente faro rosso (mast)', (k('tarsis').includes('pilone') || k('tarsis').includes('diga')) && !k('tarsis').some(x => ['ciminiera', 'forno', 'mast'].includes(x)), sc.tarsis.kinds);
  check('i forni e i piloni illuminano il bordo (sorgenti di luce) come i palazzi', sc.orvat.luci > 0 && sc.tarsis.luci > 0, { o: sc.orvat.luci, t: sc.tarsis.luci });

  // 2. la tavolozza di GIOCO e' identica in tutti i settori: stessa faccia della casella nel centro del campo
  const pix = await p.evaluate(async () => {
    const out = {};
    for (const [id, mid] of [['m', 'm1'], ['o', 'o3'], ['t', 't3']]) {
      RITMO = 0; activeMission = nodeOf(mid); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
      const t = document.getElementById('txOk'); if (t) t.click();
      B.units = B.units.filter(u => u.player && !u.structure); B.terrain.clear(); B.water.clear(); B.corrupt && B.corrupt.clear();
      B.rift = null; mechs().forEach((u, i) => { u.x = 7; u.y = i; u._vx = 7; u._vy = i; });   // fuori dal punto misurato: la sagoma di un mech non e' il pavimento
      __ISO.detect(); for (let i = 0; i < 80; i++) __ISO.paintOnce(50 + i * 40);   // spazza gli effetti di morte dei Kaucha tolti per allestire (e lo scuotimento): senza, il campione dipende dal caso
      __ISO.paintOnce(9000);
      const cv = document.querySelector('#board canvas'), g = cv.getContext('2d'), d = devicePixelRatio || 1;
      // media su 16 caselle (3x3 punti ciascuna): una singola casella puo' portare una decalcomania (grigliato, macchia, pozza) e falserebbe il confronto
      let L = 0, n = 0; for (let gx = 2; gx <= 5; gx++) for (let gy = 2; gy <= 5; gy++) { const c = __ISO.iso(gx, gy); for (const [ox, oy] of [[-10, 0], [-5, -3], [0, -4], [5, -3], [10, 0], [-5, 3], [0, 4], [5, 3], [0, 0]]) { const px = g.getImageData(Math.round((c.x + ox) * d), Math.round((c.y + oy) * d), 1, 1).data; L += 0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]; n++; } }
      out[id] = { lum: Math.round(L / n) };
    }
    return out;
  });
  const dl = Math.max(Math.abs(pix.m.lum - pix.o.lum), Math.abs(pix.m.lum - pix.t.lum));
  check('il pavimento di gioco non cambia di valore (media su 9 punti, ±10 su 255) fra i tre settori: contrasto pedine invariato', dl <= 10, pix);

  // 3. gli effetti: creati, disegnati, consumati, senza errori
  const fxr = await p.evaluate(async () => {
    RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    const out = {}; __ISO.fxAdd.addSplash(3, 3); __ISO.fxAdd.addAbyss(4, 4); __ISO.fxAdd.addSlash(2, 2, 1, 0); __ISO.fxAdd.addPushTrail(1, 1, 2, 1);
    out.tipi = [...new Set(__ISO.fxTipi())].sort();
    for (let i = 0; i < 4; i++) __ISO.paintOnce(100 + i * 40);
    out.dopo = __ISO.fxCount();
    return out;
  });
  check('splash, abisso, taglio e scia creano effetti dei tipi giusti', ['puff', 'ring', 'slash', 'spark', 'streak', 'vortice', 'bloom'].every(x => fxr.tipi.includes(x)), fxr.tipi);

  // 4. il flusso VERO: annegare, cadere, essere spinti, essere colpiti
  const flusso = async (tipo) => p.evaluate(async tipo => {
    RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    B.units = B.units.filter(u => (u.player && !u.structure)); B.terrain.clear(); B.water.clear();
    __ISO.detect(); for (let i = 0; i < 60; i++) __ISO.paintOnce(50 + i * 40);      // spazza gli effetti dei Kaucha tolti per allestire la scena
    const m = mechs()[0]; mechs().slice(1).forEach(o => { o.x = 7; o.y = 6; });
    m.x = 3; m.y = 3; m.hp = m.maxHp; m.noDrown = false; m.bordo = false;
    B.water.add(k(2, 3)); B.water.add(k(1, 3));
    if (tipo === 'voragine') { B.water.clear(); B.terrain.set(k(2, 3), { t: 'voragine' }); }
    __ISO.paintOnce(100); __ISO.detect(); const prima = __ISO.fxCount();
    if (tipo === 'colpo') { floatDmg(3, 3, '−1'); }
    else await push(m, -1, 0, { x: 4, y: 3, knockback: 1 });
    for (let i = 0; i < 3; i++) { __ISO.paintOnce(200 + i * 30); __ISO.detect(); }
    return { tipi: [...new Set(__ISO.fxTipi())].sort(), vivo: m.hp > 0, causa: m._causa };
  }, tipo);
  const spinta = await p.evaluate(async () => {
    RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById('txOk'); if (t) t.click();
    B.units = B.units.filter(u => (u.player && !u.structure)); B.terrain.clear(); B.water.clear();
    __ISO.detect(); for (let i = 0; i < 60; i++) __ISO.paintOnce(50 + i * 40);
    const m = mechs()[0]; mechs().slice(1).forEach(o => { o.x = 7; o.y = 6; }); m.x = 4; m.y = 3; m.hp = m.maxHp;
    __ISO.paintOnce(100); __ISO.detect();
    await push(m, -1, 0, { x: 5, y: 3, knockback: 1 });
    for (let i = 0; i < 3; i++) { __ISO.paintOnce(200 + i * 30); __ISO.detect(); }
    return { tipi: [...new Set(__ISO.fxTipi())].sort(), vivo: m.hp > 0, pos: [m.x, m.y] };
  });
  check('una spinta che non uccide lascia la scia e la polvere dove atterri', spinta.vivo && spinta.pos[0] === 3 && spinta.tipi.includes('streak') && spinta.tipi.includes('puff'), spinta);
  let f = await flusso('acqua');
  check('annegare: tuffo (anelli piatti e gocce), non l\'esplosione generica', !f.vivo && f.causa === 'acqua' && f.tipi.includes('ring') && f.tipi.includes('spark') && !f.tipi.includes('mote'), f);
  f = await flusso('voragine');
  check('cadere: il vortice nero si chiude sul mech', !f.vivo && f.tipi.includes('vortice'), f);
  f = await flusso('colpo');
  check('un colpo lascia il taglio', f.tipi.includes('slash'), f);
  const dopo = await p.evaluate(async () => { for (let i = 0; i < 40; i++) __ISO.paintOnce(500 + i * 40); return __ISO.fxCount(); });
  check('gli effetti si consumano (nessuno resta appeso)', dopo === 0, dopo);

  // 5. col movimento ridotto: nessun errore e nessuna nuvola decorativa
  const rid = await p.evaluate(async () => {
    __ISO.setMotion(false); __ISO.fxAdd.addPushTrail(1, 1, 2, 1); const t = __ISO.fxTipi(); for (let i = 0; i < 3; i++) __ISO.paintOnce(900 + i * 40); __ISO.setMotion(true);
    return t;
  });
  check('movimento ridotto: la scia c\'e\', le nuvole di polvere no', rid.includes('streak') && !rid.includes('puff'), rid);
  if (SHOT) await p.screenshot({ path: C.OUT + '/effetti.png' });
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript o di console', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
