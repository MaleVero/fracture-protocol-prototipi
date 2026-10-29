// Rifinitura finale: nessun pulsante, collegamento o cursore sotto i 44 px e nessun testo sotto 8,5 px, su tutte le schermate a 320, 390 e 1000.
// Eccezioni dichiarate: i pin dei nodi della mappa (42 px, vincolati dalla geometria), i pulsanti di zoom della mappa (34 px: si ingrandisce anche a due dita),
// i comandi della camera su schermo largo con il mouse (34 px) e i cinque tasti secondari della battaglia a 320 px (38 px di larghezza, 54 di altezza).
//   node bersagli.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    const out = await p.evaluate(async () => {
      for (const s of SECTORS) s.locked = false; ['hangar', 'cassandra', 'orvat', 'tarsis', 'palinsesto', 'guardiano'].forEach(x => seenComic.add(x)); RITMO = 0;
      frammenti = 420; sigilli = 5; ganglio = 1; samples.bio = 14; samples.tec = 6; risonanza = 58; ['m1', 'm2', 'm3'].forEach(id => cleared.add(id)); ['vorn', 'krull', 'sahir'].forEach(t => codexSeen.add(t)); nemesis.awake = true; nemesis.level = 2;
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const scan = root => { const piccoli = [], testo = [];
        for (const e of root.querySelectorAll('button,a,summary,input')) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (r.width <= 0 || r.height <= 0 || cs.visibility === 'hidden' || cs.display === 'none' || e.closest('.mapzoom') || e.closest('.node') || (innerWidth >= 500 && e.closest('#camCtl'))) continue; if (r.height < 43.5 || r.width < 43.5) piccoli.push((e.id || e.className || e.tagName) + ':' + Math.round(r.width) + 'x' + Math.round(r.height)); }
        for (const e of root.querySelectorAll('*')) { if (e.children.length || !(e.textContent || '').trim()) continue; const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0 || getComputedStyle(e).display === 'none') continue; if (parseFloat(getComputedStyle(e).fontSize) < 8.5) testo.push(e.textContent.trim().slice(0, 12)); }
        return { piccoli: [...new Set(piccoli)], testo: [...new Set(testo)] }; };
      const prep = { menu: () => buildMenu(), missioni: () => { renderCorruptionUI(); buildMap(); }, hangar: () => { activeMission = null; renderHangar(); }, codice: () => renderCodex(), protocolli: () => renderProtocols(), ricerca: () => renderResearch(), comando: () => renderComando(), opzioni: () => renderOpzioni(), galleria: () => {} };
      const rep = {};
      for (const id of Object.keys(prep)) { prep[id](); go(id); await wait(450); rep[id] = scan(document.getElementById(id)); }
      activeMission = nodeOf('m3'); startBattle(activeMission); await wait(800); const t = document.getElementById('txOk'); if (t) t.click(); await wait(400);
      rep.battaglia = scan(document.getElementById('battle'));
      B.units.filter(x => !x.player && !x.structure).forEach(x => { x.hp = 0; x.dead = true; }); finish(true, 'ok'); await wait(500); rep.esito = scan(document.getElementById('outcome'));
      return rep; });
    for (const [id, r] of Object.entries(out)) {
      const eccezione = id === 'battaglia' && w === 320;
      const p2 = eccezione ? r.piccoli.filter(x => !/^(undoBtn|deselBtn|menuBtn|abortBtn|optBtn):38x\d+$/.test(x)) : r.piccoli;
      check(`${w}×${h} ${id}: nessun controllo sotto i 44 px e nessun testo sotto 8,5 px${eccezione ? ' (esclusi i cinque tasti secondari a 38 px)' : ''}`, p2.length === 0 && r.testo.length === 0, { piccoli: p2, testo: r.testo });
    }
    await ctx.close();
  }
  // Testo al 160%: niente deve uscire dallo schermo e FINE TURNO deve restare visibile
  for (const [w, h] of [[320, 568], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(500);
    const out = await p.evaluate(async () => {
      for (const s of SECTORS) s.locked = false; ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)); RITMO = 0; setOpzione('testo', 160); frammenti = 300; sigilli = 3; risonanza = 60; ['m1', 'm2'].forEach(id => cleared.add(id)); ['vorn', 'krull'].forEach(t => codexSeen.add(t)); nemesis.awake = true; nemesis.level = 2;
      const wait = ms => new Promise(r => setTimeout(r, ms)); const rep = {};
      const fuori = id => { const sc = document.getElementById(id), area = sc.querySelector('.scroll') || sc, R = area.getBoundingClientRect().right;
        const e = [...area.querySelectorAll('*')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > R + 1 && !x.closest('canvas,.mapworld,.hero') && getComputedStyle(x).display !== 'none'; }).length; return { fuori: e, orizzontale: document.documentElement.scrollWidth > innerWidth }; };
      const prep = { menu: () => buildMenu(), missioni: () => { renderCorruptionUI(); buildMap(); }, hangar: () => { activeMission = null; renderHangar(); }, codice: () => renderCodex(), protocolli: () => renderProtocols(), ricerca: () => renderResearch(), comando: () => renderComando(), opzioni: () => renderOpzioni() };
      for (const id of Object.keys(prep)) { prep[id](); go(id); await wait(400); rep[id] = fuori(id); }
      activeMission = nodeOf('m3'); startBattle(activeMission); await wait(800); const t = document.getElementById('txOk'); if (t) t.click(); await wait(400);
      rep.battaglia = Object.assign(fuori('battle'), { fine: Math.round(document.getElementById('endTurnBtn').getBoundingClientRect().bottom) <= innerHeight });
      B.units.filter(x => !x.player && !x.structure).forEach(x => { x.hp = 0; x.dead = true; }); finish(true, 'ok'); await wait(500); rep.esito = fuori('outcome'); return rep; });
    for (const [id, r] of Object.entries(out)) check(`${w}×${h} con testo al 160% ${id}: niente esce dallo schermo${id === 'battaglia' ? ' e FINE TURNO resta visibile' : ''}`, r.fuori === 0 && !r.orizzontale && (r.fine === undefined || r.fine), r);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
