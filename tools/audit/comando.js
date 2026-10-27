// Comando e Opzioni rifiniti: quadro della campagna, profilo di Lazy J, dossier della nemesi, piloti, interruttori e cursori.
//   node comando.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. quadro della campagna: i numeri sono quelli veri
    const q = await p.evaluate(async () => {
      for (const s of SECTORS) s.locked = false; ['m1', 'm2', 'm3', 'o1'].forEach(id => cleared.add(id)); frammenti = 777; sigilli = 5; ganglio = 2;
      renderComando(); go('comando'); await new Promise(r => setTimeout(r, 300));
      const sec = [...document.querySelectorAll('.cm-sec')].map(e => ({ nm: e.querySelector('.cm-nm').textContent, n: e.querySelector('.cm-anello').textContent, aria: e.querySelector('.cm-anello').getAttribute('aria-label') }));
      const attesi = SECTORS.map(s => { const n = sectorNodes(s.id); return n.filter(m => cleared.has(m.id)).length + '/' + n.length; });
      const celle = [...document.querySelectorAll('.cm-cella')].map(e => e.querySelector('b').textContent.replace(/\s+/g, ''));
      return { sec, attesi, celle, mis: cleared.size + '/' + MISSIONS.length, telai: CHASSIS.filter(c => c.unlocked).length + '/' + CHASSIS.length, ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: tre schede di settore con i nodi contenuti veri, sei numeri della campagna corretti, niente scorrimento orizzontale`,
      q.sec.length === 3 && q.sec.every((s, i) => s.n === q.attesi[i]) && q.celle.length === 6 && q.celle[0] === q.mis && q.celle[1] === q.telai && q.celle[3] === '777' && q.celle[4] === '5' && q.celle[5] === '2' && !q.ov, q);
    // 2. Lazy J: banda, barra, tacche, interventi coerenti con la regola
    const lj = await p.evaluate(async () => {
      const out = [];
      for (const ris of [0, 30, 60, 90]) {
        risonanza = ris; renderComando(); await new Promise(r => setTimeout(r, 120));
        const el = document.getElementById('lazyProfilo'); const on = [...el.querySelectorAll('.lj-int')].map(e => e.classList.contains('on'));
        const cv = el.querySelector('canvas.lj-ritratto'); const d = cv ? cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data : []; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++;
        out.push({ ris, banda: el.querySelector('.lj-hdr').textContent.replace(/\d.*/, '').trim(), attesaBanda: bandaRisonanza().nome, larg: el.querySelector('.lj-bar > i').style.width, tacche: el.querySelectorAll('.lj-tick').length,
          on: on.join(), attesi: INTERVENTI.map(i => bandaIdx() >= i.banda).join(), dipinto: n > 40, nota: el.querySelector('.lj-nota').textContent.includes('scendere di ' + SFOGO) });
      }
      return out;
    });
    check(`${w}×${h}: il profilo di Lazy J segue la banda a 0, 30, 60 e 90 (barra, 3 tacche, interventi sbloccati, ritratto dipinto, nota sullo sfogo)`,
      lj.every(r => r.banda === r.attesaBanda && r.larg === r.ris + '%' && r.tacche === 3 && r.on === r.attesi && r.dipinto && r.nota), lj);
    // 3. dossier: vuoto prima che si manifesti, poi livello a punti, adattamenti a pillole
    const ds = await p.evaluate(async () => {
      nemesis.awake = false; renderComando(); const vuoto = document.getElementById('nemesisDossier').textContent.includes('Nessuna anomalia') && !!document.querySelector('#nemesisDossier canvas');
      nemesis.awake = true; nemesis.dead = false; nemesis.level = 3; nemesis.adaptations = ['anchor', 'phase', 'accel']; nemesis.stolen = []; tend.push = 6; tend.drown = 1; tend.ranged = 1; tend.defense = 2; renderComando();
      const el = document.getElementById('nemesisDossier');
      return { vuoto, pip: el.querySelectorAll('.nem-pip i.on').length, pipTot: el.querySelectorAll('.nem-pip i').length, chips: [...el.querySelectorAll('.nem-chips')[0].querySelectorAll('.nem-chip')].map(c => c.textContent).join(), righe: el.querySelectorAll('.tendrow').length, testo: el.textContent.includes('relitto resta sul campo') };
    });
    check(`${w}×${h}: il dossier e' vuoto col suo ritratto prima della nemesi; poi livello 3 su 5 a punti, tre adattamenti a pillole, quattro misure e il testo di sempre`,
      ds.vuoto && ds.pip === 3 && ds.pipTot === 5 && ds.chips === 'ANCORAGGIO,FASE,ACCELERAZIONE' && ds.righe === 4 && ds.testo, ds);
    // 4. piloti: XP letta e barra
    const pl = await p.evaluate(async () => { PILOTS[0].xp = 40; PILOTS[1].xp = 100; PILOTS[2].xp = 250; renderComando(); const r = [...document.querySelectorAll('#pilotRoster .rosterrow')];
      return { n: r.length, xp: r.map(e => e.querySelector('.xplab').textContent), larg: r.slice(0, 3).map(e => e.querySelector('.xpbar > i').style.width), aria: r[0].querySelector('.xpbar').getAttribute('aria-label') }; });
    check(`${w}×${h}: i cinque piloti mostrano l'XP verso il livello dopo (40/100 → LV2, 0/100 → LV3, livello massimo) e la barra la segue`,
      pl.n === 5 && pl.xp[0] === 'XP 40 / 100 · prossimo LV2' && pl.xp[1] === 'XP 0 / 100 · prossimo LV3' && pl.xp[2] === 'LIVELLO MASSIMO' && pl.larg.join() === '40%,0%,100%' && /40 per cento/.test(pl.aria), pl);
    // 5. Opzioni: interruttori veri, cursori col riempimento, schede con avanzamento, info
    const op = await p.evaluate(async () => {
      renderOpzioni(); go('opzioni'); await new Promise(r => setTimeout(r, 300));
      const sw = [...document.querySelectorAll('.optsw')]; const prima = sw.map(b => b.getAttribute('aria-checked') + ':' + b.getAttribute('role') + ':' + b.classList.contains('on'));
      const k0 = sw[1].dataset.opt, v0 = OPZ[k0]; sw[1].click(); await new Promise(r => setTimeout(r, 150));
      const sw2 = [...document.querySelectorAll('.optsw')][1]; const dopo = { stato: OPZ[k0] === !v0, aria: sw2.getAttribute('aria-checked') === String(!v0), testo: sw2.textContent.trim() }; sw2.click(); await new Promise(r => setTimeout(r, 100));
      const vol = document.getElementById('optVol'); vol.value = 40; vol.dispatchEvent(new Event('input')); const f1 = vol.style.getPropertyValue('--f'), v1 = document.getElementById('optVolVal').textContent;
      const tx = document.getElementById('optTesto'); tx.value = 160; tx.dispatchEvent(new Event('input')); const f2 = tx.style.getPropertyValue('--f'); tx.value = 100; tx.dispatchEvent(new Event('input')); vol.value = 85; vol.dispatchEvent(new Event('input'));
      const barra = document.querySelector('.slotbar > i'); const info = document.querySelector('.opt-info').textContent;
      return { prima: prima.every(s => /^(true|false):switch:(true|false)$/.test(s)), n: sw.length, dopo, f1, v1, f2, barra: barra && barra.style.width, info: info.includes(BUILD_VER) && /nessuna connessione/.test(info), titoli: [...document.querySelectorAll('#optScroll h3')].length, glifi: document.querySelectorAll('#optScroll h3 .opt-i').length, ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: gli interruttori sono veri (switch, aria-checked, si accendono e spengono), i cursori riempiono la traccia, la scheda campagna ha l'avanzamento, c'e' il piede con la build, niente scorrimento orizzontale`,
      op.prima && op.n === 4 && op.dopo.stato && op.dopo.aria && op.f1 === '40%' && op.v1 === '40' && op.f2 === '100%' && op.barra && op.info && op.titoli === op.glifi && !op.ov, op);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
