// Mappa e campo rifiniti: legenda del fronte a barre con le regole a un tocco, barra dei round e fase in battaglia.
//   node mappa.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. il fronte: una barra per settore sbloccato, larghezza e colore dai numeri veri, globale in fondo
    const l1 = await p.evaluate(async () => {
      for (const s of SECTORS) s.locked = false; MISSIONS.forEach(m => { m.corr = 20 + (m.id.charCodeAt(1) * 7) % 50; }); MISSIONS.find(m => m.id === 'm1').corr = 61;
      renderCorruptionUI(); go('missioni'); await new Promise(r => setTimeout(r, 300));
      const righe = [...document.querySelectorAll('#corrLegend .cl-row')], col = v => v >= 80 ? 'var(--danger)' : v >= 55 ? 'var(--hazard)' : v >= 28 ? 'var(--amber)' : 'var(--ok)';
      const att = SECTORS.filter(s => !s.locked).map(s => [s.nm.replace('SETTORE ', ''), Math.round(sectorCorrOf(s.id)), sectorLost(s.id)]);
      const sett = righe.slice(0, att.length).map((r, i) => r.querySelector('span').textContent === att[i][0] && r.querySelector('.cl-bar i').style.width === (att[i][2] ? 100 : att[i][1]) + '%' && (att[i][2] || r.querySelector('b').textContent === att[i][1] + '%') && /per cento$|perduto$/.test(r.querySelector('.cl-bar').getAttribute('aria-label')));
      const glob = righe[righe.length - 1], marci = MISSIONS.filter(m => (m.corr || 0) >= SPREAD_THRESHOLD).length;
      return { n: righe.length, att: att.length, sett, glob: glob.classList.contains('tot') && glob.querySelector('b').textContent === Math.round(globalCorruption) + '%', chips: document.querySelectorAll('#corrLegend .cl-chip').length, marci,
        prev: document.querySelector('#corrLegend .cl-note.up, #corrLegend .cl-note').textContent, fc: document.getElementById('corrLegend').innerText.includes(String(collapseForecast())), ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: la legenda mostra una barra per ogni settore sbloccato con i valori veri, il globale in fondo, un chip per ogni nodo fuori controllo e la previsione di caduta`,
      l1.n === l1.att + 1 && l1.sett.every(Boolean) && l1.glob && l1.chips === l1.marci && l1.marci > 0 && l1.fc && !l1.ov, l1);
    // 2. un settore perduto: barra piena e scritta PERDUTO
    const l2 = await p.evaluate(async () => {
      const t = sectorNodes('tarsis'); t.forEach(m => { m.corr = 100; }); renderCorruptionUI(); await new Promise(r => setTimeout(r, 100));
      const r = [...document.querySelectorAll('#corrLegend .cl-row')].find(x => x.querySelector('span').textContent === 'TARSIS');
      return { persa: sectorLost('tarsis'), testo: r.querySelector('b').textContent, larg: r.querySelector('.cl-bar i').style.width, cls: r.querySelector('b').className };
    });
    check(`${w}×${h}: un settore perduto mostra la barra piena e PERDUTO`, l2.persa && l2.testo === 'PERDUTO' && l2.larg === '100%' && l2.cls === 'up', l2);
    // 3. le regole stanno a un tocco: chiuse all'inizio, il pulsante e' toccabile, aperte mostrano le costanti
    const l3 = await p.evaluate(async () => {
      const d = document.querySelector('#corrLegend .cl-regole'), s = d.querySelector('summary'); const chiuso = !d.open, h = Math.round(s.getBoundingClientRect().height);
      const vis0 = d.innerText.includes('OGNI NODO'); s.click(); await new Promise(r => setTimeout(r, 100));
      const apre = d.open, testo = d.innerText, vis1 = d.innerText.includes('OGNI NODO');
      return { chiuso, h, vis0, apre, vis1, costanti: testo.includes('−' + REPLAY_REDUCTION) && testo.includes('+' + RETREAT_PENALTY) && testo.includes('+' + LOSS_PENALTY) && testo.includes('+' + OVERTIME_CORR) && testo.includes('+' + SPREAD_LOOSE), ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: le regole della corruzione sono chiuse all'inizio, il titolo e' un bersaglio ≥44 px e aperte riportano le costanti del gioco`, l3.chiuso && !l3.vis0 && l3.h >= 44 && l3.apre && l3.vis1 && l3.costanti && !l3.ov, l3);
    // 4. in battaglia: la barra dei round segue il round, diventa urgente alla fine; la fase ha la sua guida
    const bt = await p.evaluate(async () => {
      MISSIONS.forEach(m => { m.corr = 20; }); RITMO = 0; activeMission = nodeOf('t3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 600)); const t = document.getElementById('txOk'); if (t) t.click(); await new Promise(r => setTimeout(r, 300));
      const rb = document.getElementById('roundBar'), larg = () => rb.firstChild.style.width, out = [];
      for (const r of [1, Math.ceil(B.maxRound / 2), B.maxRound]) { B.round = r; bRender(); out.push({ r, larg: larg(), att: Math.min(100, Math.round(r / B.maxRound * 100)) + '%', urgente: rb.classList.contains('urgent'), attUrg: document.getElementById('roundNum').className === 'urgent' }); }
      const ph = document.getElementById('phasebar'); const bw = getComputedStyle(ph).borderLeftWidth, vis = getComputedStyle(ph).display !== 'none';
      return { out, bw, vis, h: Math.round(rb.getBoundingClientRect().height), ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: la barra dei round in battaglia segue il round (1, metà, ultimo), diventa urgente solo dove il numero lo e' e non causa scorrimento orizzontale`,
      bt.out.every(o => o.larg === o.att && o.urgente === o.attUrg) && bt.h >= 2 && !bt.ov, bt);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
