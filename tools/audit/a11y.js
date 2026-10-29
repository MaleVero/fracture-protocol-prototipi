// Accessibilità: nomi dei controlli, mappa da tastiera, lettura di ogni casella, e una missione
// intera giocata SOLO con la tastiera (eventi reali di tastiera, nessun click).
//   node a11y.js [shots]
const C = require('./common'); const { chromium } = C.pw;
const SHOT = process.argv[2] === 'shots';
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 760 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  await p.goto(C.URL); await p.waitForTimeout(700); await p.evaluate(() => seenComic.add('hangar'));   // idem: la tavola della prima apertura coprirebbe l'hangar

  // 1. nomi accessibili su ogni schermata
  const senzaNome = await p.evaluate(async () => {
    const out = {}; const sc = ['menu', 'missioni', 'hangar', 'codice', 'protocolli', 'ricerca', 'comando', 'opzioni'];
    RITMO = 0;
    for (const id of sc) {
      if (id === 'hangar') { activeMission = null; renderHangar(); } else if (id === 'opzioni') renderOpzioni(); else if (id === 'codice') renderCodex(); else if (id === 'protocolli') renderProtocols(); else if (id === 'ricerca') renderResearch(); else if (id === 'comando') renderComando();
      go(id);
      const el = document.getElementById(id);
      // I nomi li assegna un MutationObserver, quindi arrivano dopo il disegno: con la macchina sotto carico (batteria lanciata in parallelo)
      // 120 ms non bastavano e il controllo falliva a caso. Si ripete fino a 2 s: se a 2 s manca ancora un nome, e' un difetto vero.
      const mancanti = () => [...el.querySelectorAll('button,[role=button],input,select')].filter(e => e.offsetParent !== null).filter(e => {
        const n = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
        const lab = e.id && document.querySelector(`label[for="${e.id}"]`);
        return !(lab || /[A-Za-zÀ-ÿ]{3}/.test(n));
      }).map(e => (e.id || e.className || e.tagName) + ':' + (e.textContent || '').trim().slice(0, 8));
      await new Promise(r => setTimeout(r, 120)); let m = mancanti();
      for (let i = 0; m.length && i < 16; i++) { await new Promise(r => setTimeout(r, 125)); m = mancanti(); }
      out[id] = m;
    }
    activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    out.battle = [...document.getElementById('battle').querySelectorAll('button,[role=button],input')].filter(e => e.offsetParent !== null).filter(e => !/[A-Za-zÀ-ÿ]{3}/.test((e.getAttribute('aria-label') || e.textContent || '').trim())).map(e => (e.id || e.className) + ':' + (e.textContent || '').trim().slice(0, 6));
    return out;
  });
  const tot = Object.values(senzaNome).reduce((a, v) => a + v.length, 0);
  check('ogni controllo visibile ha un nome in lettere (8 schermate + battaglia)', tot === 0, tot ? senzaNome : undefined);

  // 2. mappa da tastiera
  const mappa = await p.evaluate(() => { go('missioni'); buildMap(); const n = [...document.querySelectorAll('.node')]; return { n: n.length, focus: n.filter(e => e.tabIndex === 0 && e.getAttribute('role') === 'button' && e.getAttribute('aria-label')).length, esempio: n[0] && n[0].getAttribute('aria-label') }; });
  check('i nodi della mappa sono pulsanti con nome', mappa.n > 0 && mappa.n === mappa.focus, mappa);
  await p.focus('.node'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  const sel = await p.evaluate(() => selMissionId);
  check('Invio su un nodo lo seleziona', !!sel, sel);

  // 3. descrizione di ogni casella + riepilogo, su missioni diverse
  const lettura = await p.evaluate(async () => {
    RITMO = 0; const res = [];
    for (const id of ['m1', 'o3', 'm8', 'o8', 't7', 'm6']) {
      activeMission = nodeOf(id); startBattle(activeMission); await new Promise(r => setTimeout(r, 450));
      let ok = 0, vuote = 0, err = null;
      try { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = descriviCasella(x, y); if (typeof t === 'string' && t.startsWith(x + ',' + y + '.')) ok++; else vuote++; } } catch (e) { err = e.message; }
      let riep = ''; try { riep = riepilogoCampo(); } catch (e) { err = e.message; }
      res.push({ id, ok, vuote, err, riepilogo: riep.length, ha: /Round 1 di/.test(riep) });
    }
    return res;
  });
  check('64 caselle descritte senza errori in 6 missioni (m1 o3 m8 o8 t7 m6)', lettura.every(r => r.ok === 64 && !r.err && r.ha), lettura.map(r => r.id + ':' + r.ok));

  // 4. una missione intera con la sola tastiera
  await p.evaluate(async () => { RITMO = 0; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 600)); const t = document.getElementById('txOk'); if (t) t.click(); document.getElementById('sr').innerHTML = ''; });
  await p.waitForTimeout(300);
  const stato = () => p.evaluate(() => ({ over: B.over, phase: B.phase, busy: B.busy, kb: kbCella, mechs: mechs().map(m => ({ id: m.id, x: m.x, y: m.y, att: m.attacked, mov: m.moved, rmin: m.rmin, rmax: m.rmax })), foes: kauchas().map(f => ({ x: f.x, y: f.y })), sel: B.selected && B.selected.id, range: B.selRange ? [...B.selRange.keys()] : [] }));
  const key = async k => { await p.keyboard.press(k); await p.waitForTimeout(25); };
  const vai = async (x, y) => { let s = await stato(); if (!s.kb) { await key('m'); s = await stato(); } let guard = 0; while (guard++ < 20 && (s.kb[0] !== x || s.kb[1] !== y)) { if (s.kb[0] < x) await key('ArrowRight'); else if (s.kb[0] > x) await key('ArrowLeft'); else if (s.kb[1] < y) await key('ArrowDown'); else await key('ArrowUp'); s = await stato(); } };
  const aspetta = async () => { for (let i = 0; i < 400; i++) { const s = await stato(); if (s.over || (s.phase === 'player' && !s.busy)) return s; await p.waitForTimeout(25); } return stato(); };
  let tasti = 0, turni = 0, s = await aspetta();
  while (!s.over && turni++ < 12) {
    for (const m0 of s.mechs) {
      let st = await aspetta(); if (st.over) break;
      const m = st.mechs.find(x => x.id === m0.id); if (!m || m.att) continue;
      await vai(m.x, m.y); await key('Enter');                              // seleziona
      st = await stato(); const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const piu = f => st.foes.slice().sort((a, c) => dist(m, a) - dist(m, c))[0];
      if (!st.foes.length) break;
      let foe = piu(); const inR = (c) => { const d = Math.abs(c.x - foe.x) + Math.abs(c.y - foe.y); return d >= m.rmin && d <= m.rmax; };
      if (!inR(m)) {
        const cand = st.range.map(k => k.split(',').map(Number)).map(([x, y]) => ({ x, y, d: Math.abs(x - foe.x) + Math.abs(y - foe.y) }));
        const best = cand.sort((a, c) => (inR(a) ? -100 : 0) + a.d - ((inR(c) ? -100 : 0) + c.d))[0];
        if (best) { await vai(best.x, best.y); await key('Enter'); await aspetta(); }
        const mm = (await stato()).mechs.find(x => x.id === m0.id); if (mm && !(await stato()).sel) { await vai(mm.x, mm.y); await key('Enter'); }
      }
      st = await stato(); const me = st.mechs.find(x => x.id === m0.id); foe = st.foes.slice().sort((a, c) => dist(me, a) - dist(me, c))[0];
      const d = foe ? Math.abs(me.x - foe.x) + Math.abs(me.y - foe.y) : 99;
      if (foe && d >= me.rmin && d <= me.rmax) { await vai(foe.x, foe.y); await key('Enter'); await key('Enter'); await aspetta(); }
      else await key('Escape');
      tasti++;
    }
    s = await aspetta(); if (s.over) break;
    await key('e'); s = await aspetta();
  }
  const fin = await p.evaluate(() => ({ over: B.over, vittoria: /ZONA CONTENUTA/.test(document.getElementById('ovTitle').textContent), titolo: document.getElementById('ovTitle').textContent, mechs: mechs().length, foes: kauchas().length, round: B.round, sr: [...document.querySelectorAll('#sr div')].map(d => d.textContent) }));
  check('missione m1 vinta usando solo la tastiera', fin.over && fin.vittoria, { titolo: fin.titolo, mech: fin.mechs, nemici: fin.foes, round: fin.round, turni });
  if (SHOT) await p.screenshot({ path: C.OUT + '/a11y-fine.png' });
  const sr = await p.evaluate(() => document.getElementById('sr').textContent);
  check("la regione per lettori di schermo ha ricevuto gli annunci", /ZONA CONTENUTA|Obiettivo raggiunto/.test(sr), sr.slice(-120));

  // 5. gli annunci coprono selezione, mira, fase
  await p.evaluate(async () => { RITMO = 0; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 600)); const t = document.getElementById('txOk'); if (t) t.click(); document.getElementById('sr').innerHTML = ''; });
  await p.waitForTimeout(300); await key('m'); await key('Enter'); await key('n'); await key('r'); await key('?');
  const ann = await p.evaluate(() => [...document.querySelectorAll('#sr div')].map(d => d.textContent));
  check('M, Invio, N, R e ? producono annunci distinti', ann.some(t => /^Selezionato/.test(t)) && ann.some(t => /^Round 1 di/.test(t)) && ann.some(t => /^Frecce:/.test(t)) && ann.length >= 4, ann.map(t => t.slice(0, 40)));
  if (SHOT) { await p.screenshot({ path: C.OUT + '/a11y-cursore.png' }); }
  // 6. un'abilita' a bersaglio da tastiera: pulsante -> il focus torna al campo -> frecce -> Invio sulla casella
  await p.evaluate(async () => { RITMO = 0; activeMission = nodeOf('m3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 600)); const t = document.getElementById('txOk'); if (t) t.click(); });
  await p.waitForTimeout(300);
  const nla = await p.evaluate(() => { const u = mechs().find(m => m.id && m.ability && m.ability.target && m.ability.key === 'barrage'); return u ? { x: u.x, y: u.y, id: u.id } : null; });
  check('nel campione c\'e\' un mech con abilita\' a bersaglio (BOMBARDAMENTO)', !!nla);
  if (nla) {
    await vai(nla.x, nla.y); await key('Enter');                                        // seleziona
    await p.waitForSelector('.abilbtn', { timeout: 3000 }).catch(() => {});
    await p.focus('.abilbtn'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const dopo = await p.evaluate(() => ({ modo: !!B.abilityMode, fuoco: document.activeElement && document.activeElement.id }));
    check("attivata col pulsante: modalita' bersaglio e focus sul campo", dopo.modo && dopo.fuoco === 'isoCanvas', dopo);
    const bersaglio = await p.evaluate((id) => { const u = mechs().find(m => m.id === id); const f = kauchas().map(f => ({ x: f.x, y: f.y, d: Math.abs(f.x - u.x) + Math.abs(f.y - u.y) })).filter(f => f.d >= 2 && f.d <= 4)[0]; return f || null; }, nla.id);
    if (bersaglio) {
      await vai(bersaglio.x, bersaglio.y); await key('Enter'); await aspetta();
      const usata = await p.evaluate((id) => { const u = B.units.find(m => m.id === id); return { usata: !!(u && (u.abilityUsed || u.attacked)), modo: !!B.abilityMode }; }, nla.id);
      check("Invio sulla casella risolve l'abilita'", usata.usata && !usata.modo, usata);
    } else console.log('  (nessun nemico a gittata 2-4 da questo seme: passo non verificato)');
  }
  check('nessun errore JavaScript', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
