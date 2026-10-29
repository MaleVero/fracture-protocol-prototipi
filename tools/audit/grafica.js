// Grafica 0.14: testata dell'hangar, codice con sagome, sfondo del menu, icona, carta della mappa, presenze nel briefing, targa di missione.
//   node grafica.js
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs'); const path = require('path');
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. testata dell'hangar: il pulsante dell'officina sta DENTRO il riquadro e non copre il testo
    const hg = await p.evaluate(async () => { activeMission = null; renderHangar(); go('hangar'); await new Promise(r => setTimeout(r, 200));
      const t = document.querySelector('#hangar .missiontag').getBoundingClientRect(), l = document.querySelector('#hangar .linkbay').getBoundingClientRect(), tx = document.createRange(); tx.selectNodeContents(document.querySelector('#hangar .missiontag')); 
      return { dentro: l.top >= t.top - 1 && l.bottom <= t.bottom + 1 && l.right <= t.right + 1 && l.left >= t.left - 1, h: Math.round(l.height) }; });
    check(`${w}×${h}: il pulsante OFFICINA dell'hangar sta dentro la testata e non la copre`, hg.dentro && hg.h >= 36, hg);
    // culla del mech
    const culla = await p.evaluate(() => /repeating-linear-gradient/.test(getComputedStyle(document.querySelector('canvas.mechbig')).backgroundImage));
    check(`${w}×${h}: il ritratto del telaio ha la culla (luce e banda d'ingombro)`, culla);
    // 2. codice: totale coerente col menu, sagome per le schede non viste
    const cx = await p.evaluate(async () => { codexSeen.clear(); codexSeen.add('vorn'); renderCodex(); go('codice'); await new Promise(r => setTimeout(r, 250)); buildMenu(); 
      const reali = CODEX.filter(e => e.type[0] !== '_').length; const sil = document.querySelectorAll('#codexGrid .kg.sil canvas').length, bloc = [...document.querySelectorAll('#codexGrid .kentry.locked .kg:not(.sil)')].map(e => e.textContent.trim());
      const nonBianche = [...document.querySelectorAll('#codexGrid .kg.sil canvas')].filter(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 30) return true; return false; }).length;
      return { conta: document.getElementById('codexCount').textContent + '/' + document.getElementById('codexTot').textContent, menu: (document.querySelector('#menulist .mitem[data-go="codice"] .ds').textContent.match(/(\d+\/\d+) svelate/) || [])[1], reali, sil, nonBianche, bloc }; });
    check(`${w}×${h}: il totale del codice e' quello del menu (${cx.conta}) e le sagome non viste ci sono e sono disegnate`, cx.conta === cx.menu && cx.sil === cx.reali - 3 && cx.nonBianche === cx.sil && cx.bloc.join('') === '▓▓▓', cx);
    // 3. menu: lo sfondo del titolo e' dipinto e cambia con il settore
    const hero = await p.evaluate(async () => { const f = () => { const c = document.getElementById('heroArt'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, s = 0; for (let i = 0; i < d.length; i += 40) { n += d[i + 3] > 0 ? 1 : 0; s += d[i] + d[i + 1] * 2 + d[i + 2]; } return { n, s }; };
      go('menu'); await new Promise(r => setTimeout(r, 300)); const a = f(); currentSector = 'orvat'; go('menu'); await new Promise(r => setTimeout(r, 300)); const o = f(); currentSector = 'cassandra'; return { a, o, w: document.getElementById('heroArt').width }; });
    check(`${w}×${h}: lo sfondo del titolo e' dipinto e cambia con il settore`, hero.a.n > 100 && hero.o.n > 100 && hero.a.s !== hero.o.s, hero);
    // 4. mappa: la carta del settore e la macchia di corruzione
    const mp = await p.evaluate(async () => { go('missioni'); for (const s of SECTORS) s.locked = false; buildMap(); await new Promise(r => setTimeout(r, 200)); const c = document.getElementById('mapcanvas'); return { art: !!c.querySelector('svg.mapart'), corr: parseFloat(c.style.getPropertyValue('--corr')), sec: c.dataset.sec }; });
    check(`${w}×${h}: la mappa ha la carta del settore e la corruzione come variabile (0–1)`, mp.art && mp.corr > 0 && mp.corr <= 1, mp);
    // 5. presenze nel briefing: una sagoma per tipo, colorata se gia' registrata
    const pr = await p.evaluate(async () => { codexSeen.clear(); codexSeen.add('vorn'); codexSeen.add('krull'); const m = nodeOf('t3'); m.locked = false; currentSector = 'tarsis'; buildMap(); selectMission('t3'); await new Promise(r => setTimeout(r, 300));
      const row = document.querySelector('.nodepop .np-pres'); if (!row) return null; const tipi = [...new Set([...(m.spec.guarantee || []), ...m.spec.pool])]; 
      return { n: row.querySelectorAll('.np-k').length, ignoti: row.querySelectorAll('.np-k.unk').length, attesi: tipi.length, noti: tipi.filter(t => codexSeen.has(t)).length, testo: (row.querySelector('em') || {}).textContent, aria: row.getAttribute('aria-label') }; });
    check(`${w}×${h}: il briefing mostra una sagoma per ogni creatura possibile, nere quelle non registrate`, pr && pr.n === pr.attesi && pr.ignoti === pr.attesi - pr.noti && /non registrat/.test(pr.testo || '') && !/neris|risacca/i.test(pr.aria || ''), pr);
    // 6. targa di missione: parte, non prende il tocco, sparisce; non c'e' alla ripresa di un checkpoint
    const bn = await p.evaluate(async () => { RITMO = 0; activeMission = nodeOf('m1'); startBattle(activeMission); await new Promise(r => setTimeout(r, 300)); const e = document.getElementById('missionIntro');
      const a = e ? { pe: getComputedStyle(e).pointerEvents, testo: e.textContent } : null; const t = document.getElementById('txOk'); if (t) t.click();
      salvaBattaglia(); document.getElementById('missionIntro') && document.getElementById('missionIntro').remove(); const ok = ripristinaBattaglia(); await new Promise(r => setTimeout(r, 300)); const dopoRip = !!document.getElementById('missionIntro');
      return { a, ok, dopoRip }; });
    check(`${w}×${h}: la targa compare all'inizio (senza prendere il tocco) e non alla ripresa di un checkpoint`, bn.a && bn.a.pe === 'none' && /AVAMPOSTO KILO/.test(bn.a.testo) && bn.ok && !bn.dopoRip, bn);
    await ctx.close();
  }
  // 7. icona: le tre pagine hanno favicon SVG e icona per la schermata iniziale, tutto inline
  for (const f of ['index.html', 'provare.html', 'builds/v2026-10-26/index.html']) {
    const h = fs.readFileSync(path.join(__dirname, '../..', f), 'utf8');
    check(`${f}: favicon SVG e apple-touch-icon inline (nessun file esterno)`, /<link rel="icon" type="image\/svg\+xml" href="data:image\/svg\+xml,/.test(h) && /<link rel="apple-touch-icon" href="data:image\/png;base64,/.test(h));
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
