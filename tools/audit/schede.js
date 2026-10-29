// Codice, Officina e Ricerca rifiniti: avanzamento del bestiario, accenti per tipo, «mancano N», catena della ricerca, sagome degli innesti.
//   node schede.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    // 1. Codice: avanzamento e accenti di rango
    const cd = await p.evaluate(async () => {
      RITMO = 0; ['vorn', 'krull', 'sahir', 'grumo'].forEach(t => codexSeen.add(t)); renderCodex(); go('codice'); await new Promise(r => setTimeout(r, 300));
      const reali = CODEX.filter(e => e.type[0] !== '_').length, pr = document.getElementById('codexProg');
      const vistiRk = [...document.querySelectorAll('#codexGrid .kentry:not(.locked)')].map(e => (e.className.match(/rk\d/) || ['-'])[0]);
      const attesi = CODEX.filter(e => codexSeen.has(e.type)).map(e => { const t = KDEF[e.type].tier; return typeof t === 'number' && t <= 2 ? 'rk' + t : 'rk3'; });
      const bloccate = [...document.querySelectorAll('#codexGrid .kentry.locked')].every(e => !/rk\d/.test(e.className));
      return { testo: pr.textContent, attesoTesto: `${codexSeen.size} REGISTRATE · ${reali - codexSeen.size} DA INCONTRARE`, larg: pr.querySelector('i').style.width, attesa: Math.round(codexSeen.size / reali * 100) + '%', vistiRk, attesi, bloccate, ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: il Codice dice quante schede sono registrate (barra e testo), i rango seguono il tipo e le schede chiuse non hanno accento`,
      cd.testo.includes(cd.attesoTesto) && cd.larg === cd.attesa && cd.vistiRk.join() === cd.attesi.join() && cd.bloccate && !cd.ov, cd);
    // 2. Officina
    const of = await p.evaluate(async () => {
      frammenti = 165; sigilli = 3; ganglio = 1; renderProtocols(); go('protocolli'); await new Promise(r => setTimeout(r, 300));
      const cel = [...document.querySelectorAll('#protoScroll .rs-strip .cm-cella b')].map(e => e.textContent);
      const carte = [...document.querySelectorAll('#protoScroll .protocard')].filter(c => c.querySelector('.pbuy,.cbuy'));
      const err = []; let senza = 0, con = 0;
      for (const c of carte) {
        const bt = c.querySelector('.pbuy,.cbuy'), costo = parseInt(bt.textContent), m = c.querySelector('.manca');
        if (bt.disabled) { con++; if (!m || m.textContent !== `mancano ${costo - frammenti} fr`) err.push(bt.textContent + '|' + (m && m.textContent)); } else { senza++; if (m) err.push('inatteso ' + bt.textContent); }
      }
      const tipi = [...document.querySelectorAll('#protoScroll .protocard.t-arma,.t-difesa,.t-utility')].length;
      const nome = document.querySelector('#protoScroll .pbuy:disabled').getAttribute('aria-label');
      return { cel, nCarte: carte.length, con, senza, err, tipi, attesiTipi: carte.length, nome, ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: l'Officina mostra frammenti, sigilli e gangli veri; ogni carta ha l'accento del tipo; «mancano N fr» solo dove non basta e con la differenza esatta; il nome accessibile resta`,
      of.cel.join() === '165,3,1' && of.err.length === 0 && of.con > 0 && of.senza > 0 && of.tipi === of.attesiTipi && /^Compra .+, \d+ frammenti$/.test(of.nome) && !of.ov, of);
    // 3. Ricerca
    const rs = await p.evaluate(async () => {
      samples.bio = 13; samples.tec = 4; researched.clear(); researched.add('bio1'); slain.clear(); renderResearch(); go('ricerca'); await new Promise(r => setTimeout(r, 300));
      const cel = [...document.querySelectorAll('#researchScroll .rs-strip .cm-cella b')].map(e => e.textContent.replace(/\s+/g, ''));
      const rami = [...document.querySelectorAll('#researchScroll .resbranch')].map(r => r.querySelectorAll('.resnode').length);
      const att = RESEARCH.filter(n => n.br === 'BIO').length + ',' + RESEARCH.filter(n => n.br === 'TEC').length;
      const manca = [...document.querySelectorAll('#researchScroll .resnode:not(.ktech) .resmanca')].map(e => e.textContent);
      const attesiManca = RESEARCH.filter(n => researchOpen(n) && !researched.has(n.id) && !researchAfford(n)).map(n => 'mancano ' + [Math.max(0, (n.cost.bio || 0) - samples.bio) ? Math.max(0, n.cost.bio - samples.bio) + ' BIO' : '', Math.max(0, (n.cost.tec || 0) - samples.tec) ? Math.max(0, n.cost.tec - samples.tec) + ' TEC' : ''].filter(Boolean).join(' · '));
      const pieni = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++; return n > 20; };
      const kt = [...document.querySelectorAll('#researchScroll .ktech')]; const sagome = kt.every(e => e.querySelector('.kg.sil canvas') && pieni(e.querySelector('canvas')));
      slain.add('grumo'); renderResearch(); const aperto = document.querySelector('#researchScroll .ktech'); const colore = !aperto.querySelector('.kg.sil') && pieni(aperto.querySelector('canvas')) && /\+\d+%/.test(aperto.textContent);
      return { cel, esp: `${samples.bio},${samples.tec},${researched.size}/${RESEARCH.length}`, rami: rami.join(), att, manca, attesiManca, nKt: kt.length, nKtTot: Object.keys(KTECH).length, sagome, colore, ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: la Ricerca mostra campioni e acquisite veri, i due rami sono catene con tutti i nodi, «mancano N» esatto, ogni innesto ha la sagoma e, sbloccato, il colore e il costo di corruzione`,
      rs.cel.join() === rs.esp && rs.rami === rs.att && rs.manca.join() === rs.attesiManca.join() && rs.manca.length > 0 && rs.nKt === rs.nKtTot && rs.sagome && rs.colore && !rs.ov, rs);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
