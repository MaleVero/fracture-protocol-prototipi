// Pannello di Lazy J in battaglia: plancia compatta con barra a soglie, tre tasti in una riga, tasto armato con anteprima del costo.
//   node lazyj.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(async () => { ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)); RITMO = 0; activeMission = nodeOf('m3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 700)); const t = document.getElementById('txOk'); if (t) t.click(); await new Promise(r => setTimeout(r, 300)); });
    // 1. a quattro livelli di risonanza: banda, valore, barra, soglie, stato dei tre tasti
    const r1 = await p.evaluate(async () => {
      const out = [];
      for (const ris of [0, 30, 60, 90]) {
        risonanza = ris; renderLazyJ(); await new Promise(r => setTimeout(r, 80));
        const el = document.getElementById('lazyj'), tiles = [...el.querySelectorAll('.ljbtn')], rect = tiles.map(t => t.getBoundingClientRect());
        out.push({ ris, banda: el.querySelector('.ljbanda').textContent === bandaRisonanza().nome, val: el.querySelector('.ljval').textContent === ris + '/100', larg: el.querySelector('.ljbar > i').style.width === ris + '%',
          soglie: [...el.querySelectorAll('.ljbar s')].map(s => s.style.left).join() === '25%,50%,75%', riga: new Set(rect.map(r => Math.round(r.top))).size === 1 && tiles.length === 3, alti: rect.every(r => r.height >= 43.5),
          stati: tiles.every((t, i) => t.disabled === !interventoPronto(INTERVENTI[i]) && t.classList.contains('off') === t.disabled), costo: tiles.every((t, i) => t.querySelector('.ljcost').textContent === (bandaIdx() < INTERVENTI[i].banda ? 'richiede ' + BANDE[INTERVENTI[i].banda].nome : (ris + INTERVENTI[i].costo > 100 ? 'risonanza al massimo' : '+' + INTERVENTI[i].costo + ' risonanza'))),
          nome: tiles.every((t, i) => t.getAttribute('aria-label').includes(INTERVENTI[i].ds)), ov: document.documentElement.scrollWidth > innerWidth, larghezza: rect.every(r => r.right <= innerWidth + 1) });
      }
      return out;
    });
    check(`${w}×${h}: con risonanza 0, 30, 60 e 90 il pannello mostra banda, valore, barra, tre soglie, tre tasti in una riga (≥44 px) con lo stato e il costo giusti e la descrizione nel nome accessibile`,
      r1.every(o => o.banda && o.val && o.larg && o.soglie && o.riga && o.alti && o.stati && o.costo && o.nome && !o.ov && o.larghezza), r1);
    // 2. armare: il tasto si accende, l'anteprima copre il costo, la riga descrive l'intervento; due tocchi disarmano
    const r2 = await p.evaluate(async () => {
      risonanza = 62; renderLazyJ(); const el = () => document.getElementById('lazyj'), btn = k => el().querySelector(`.ljbtn[data-int="${k}"]`);
      const i = INTERVENTI[1]; btn(i.key).click(); await new Promise(r => setTimeout(r, 100));
      const armato = !!(B.abilityMode && B.abilityMode.lazy && B.abilityMode.lazy.key === i.key), t = btn(i.key), prev = el().querySelector('.ljprev'), riga = el().querySelector('.ljline');
      const dopoArma = { armato, on: t.classList.contains('armed') && t.getAttribute('aria-pressed') === 'true', altri: [...el().querySelectorAll('.ljbtn.armed')].length === 1, prev: prev && prev.style.left === '62%' && prev.style.width === Math.min(38, i.costo) + '%', riga: riga.classList.contains('armed') && riga.textContent.includes(i.nome) && riga.textContent.includes(i.ds) && /annullare/.test(riga.textContent), barra: /costa/.test(el().querySelector('.ljbar').getAttribute('aria-label')) };
      btn(i.key).click(); await new Promise(r => setTimeout(r, 100));
      const disarmato = { stato: !B.abilityMode, tasto: !btn(i.key).classList.contains('armed') && btn(i.key).getAttribute('aria-pressed') === 'false', prev: !el().querySelector('.ljprev'), banda: el().querySelector('.ljline').textContent.includes(bandaRisonanza().ds) };
      // armato un tasto e poi un altro: ne resta uno solo
      btn(INTERVENTI[0].key).click(); btn(INTERVENTI[1].key).click(); await new Promise(r => setTimeout(r, 100));
      const cambio = { key: B.abilityMode && B.abilityMode.lazy && B.abilityMode.lazy.key, uno: el().querySelectorAll('.ljbtn.armed').length === 1 }; B.abilityMode = null; renderLazyJ();
      return { dopoArma, disarmato, cambio, attCambio: INTERVENTI[1].key };
    });
    check(`${w}×${h}: toccare un tasto lo arma (anteprima del costo sulla barra, descrizione nella riga), un secondo tocco lo disarma e armarne un altro ne lascia uno solo`,
      Object.values(r2.dopoArma).every(Boolean) && Object.values(r2.disarmato).every(Boolean) && r2.cambio.key === r2.attCambio && r2.cambio.uno, r2);
    // 3. il gesto non e' cambiato: dopo l'arma, il tocco sul campo chiama l'intervento con la casella scelta; fuori dalla fase del giocatore il pannello e' vuoto
    const r3 = await p.evaluate(async () => {
      risonanza = 62; renderLazyJ(); let chiamata = null; const orig = usaIntervento; usaIntervento = async (k, ber) => { chiamata = [k, ber.x, ber.y]; return true; };
      document.querySelector('#lazyj .ljbtn[data-int="guscio"]').click(); handleAbilityTarget(3, 4); await new Promise(r => setTimeout(r, 150)); usaIntervento = orig;
      const fase = B.phase; B.phase = 'kaucha'; renderLazyJ(); const vuoto = document.getElementById('lazyj').innerHTML === ''; B.phase = fase; renderLazyJ();
      return { chiamata, vuoto, torna: document.querySelectorAll('#lazyj .ljbtn').length === 3 };
    });
    check(`${w}×${h}: dopo aver armato un tasto il tocco su una casella chiama l'intervento giusto con quella casella; il pannello sparisce fuori dalla fase del giocatore e ritorna`,
      r3.chiamata && r3.chiamata.join() === 'guscio,3,4' && r3.vuoto && r3.torna, r3);
    // 4. sul telefono in verticale FINE TURNO resta dentro lo schermo con il pannello armato
    if (h >= 800) {
      const r4 = await p.evaluate(async () => { risonanza = 62; renderLazyJ(); document.querySelector('#lazyj .ljbtn[data-int="guscio"]').click(); await new Promise(r => setTimeout(r, 150)); const t = document.getElementById('txOk'); if (t) t.click();
        const e = document.getElementById('endTurnBtn').getBoundingClientRect(); const out = { fondo: Math.round(e.bottom), alto: innerHeight }; B.abilityMode = null; return out; });
      check(`${w}×${h}: con un intervento armato il tasto FINE TURNO resta dentro lo schermo`, r4.fondo <= r4.alto, r4);
    }
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
