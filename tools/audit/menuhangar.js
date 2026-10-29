// Menu e Hangar rifiniti: voci che dicono lo stato vero, badge calcolato, quadro di squadra, statistiche a barre, intestazione di baia pulita.
//   node menuhangar.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500, reducedMotion: 'reduce' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
    await p.goto(C.URL); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 1. menu: riga di sistema su una riga sola, badge e note vengono dallo stato
    const m1 = await p.evaluate(async () => {
      frammenti = 321; sigilli = 2; samples.bio = 7; samples.tec = 3; risonanza = 65; go('menu'); await new Promise(r => setTimeout(r, 200));
      const sys = document.querySelector('.sysline'), lh = parseFloat(getComputedStyle(sys).lineHeight) || 14;
      const voce = id => document.querySelector(`#menulist .mitem[data-go="${id}"]`);
      const disp = MISSIONS.filter(x => !x.locked && !cleared.has(x.id)).length;
      const meta = id => (voce(id).querySelector('.meta') || {}).textContent;
      return { righe: Math.round(sys.getBoundingClientRect().height / lh), sys2: getComputedStyle(sys.querySelector('.sys2')).display, badge: (voce('missioni').querySelector('.badge') || {}).textContent, disp,
        hangar: meta('hangar'), attHangar: CHASSIS.filter(c => c.unlocked).length + ' TELAI', off: meta('protocolli'), ric: meta('ricerca'), cmd: meta('comando'), banda: bandaRisonanza().nome, opz: !voce('opzioni').querySelector('.meta'),
        ov: document.documentElement.scrollWidth > innerWidth };
    });
    check(`${w}×${h}: la riga di sistema sta su una riga, il badge delle missioni e' il numero vero (${m1.disp}), le voci riportano telai, frammenti e sigilli, campioni e banda di Lazy J`,
      m1.righe <= 1 && m1.badge === m1.disp + (m1.disp === 1 ? ' DISPONIBILE' : ' DISPONIBILI') && m1.hangar === m1.attHangar && m1.off === '321 fr · ◈ 2' && m1.ric === 'BIO 7 · TEC 3' && m1.cmd === 'LAZY J · ' + m1.banda && m1.opz && !m1.ov
      && (w < 431 ? m1.sys2 === 'none' : m1.sys2 !== 'none'), m1);
    // 2. il menu si aggiorna da solo tornando indietro, e senza missioni aperte non c'e' badge
    const m2 = await p.evaluate(async () => {
      go('opzioni'); frammenti = 55; samples.bio = 1; MISSIONS.forEach(x => cleared.add(x.id)); MISSIONS.forEach(x => x.locked = false); document.querySelector('#opzioni [data-back]').click(); await new Promise(r => setTimeout(r, 200));
      const v = id => document.querySelector(`#menulist .mitem[data-go="${id}"]`);
      return { attivo: document.querySelector('.screen.active').id, off: v('protocolli').querySelector('.meta').textContent, ric: v('ricerca').querySelector('.meta').textContent, badge: !!v('missioni').querySelector('.badge') };
    });
    check(`${w}×${h}: tornando al menu le voci mostrano lo stato di adesso e a campagna chiusa il badge delle missioni sparisce`, m2.attivo === 'menu' && /^55 fr/.test(m2.off) && /^BIO 1 /.test(m2.ric) && !m2.badge, m2);
    await p.reload(); await p.waitForTimeout(500);
    await p.evaluate(() => ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)));
    // 3. Hangar: il quadro della squadra e' calcolato, le statistiche sono barre in scala
    const h1 = await p.evaluate(async () => {
      activeMission = null; sigilli = 4; ownedModules.length = 0; ownedModules.push({ iid: 901, type: 'armor' }, { iid: 902, type: 'power' }); frammenti = 100;
      renderHangar(); go('hangar'); await new Promise(r => setTimeout(r, 300));
      const cel = () => [...document.querySelectorAll('#hangarScroll .hg-quadro .cm-cella b')].map(e => e.textContent.replace(/\s+/g, ''));
      const prima = cel(), pot0 = squadPower(), slotTot = squad.reduce((n, cid) => n + chassisById(cid).slots, 0);
      setSlot(squad[1], 0, 901); setSlot(squad[1], 1, 902); await new Promise(r => setTimeout(r, 100));
      const dopo = cel(), pieni = squad.reduce((n, cid) => n + (loadout[cid] || []).filter(x => x != null).length, 0);
      scudoDi[squad[0]] = scudiPosseduti[0]; renderHangar(); const conScudo = cel()[2];
      const MX = { hp: Math.max(...CHASSIS.map(x => x.maxHp)), mov: Math.max(...CHASSIS.map(x => x.move)), dmg: Math.max(...CHASSIS.map(x => x.dmg)), rng: Math.max(...CHASSIS.map(x => x.rmax)) };
      const bay = [...document.querySelectorAll('#hangarScroll .baylite')].map((el, i) => { const eff = effectiveMech(chassisById(squad[i]), i), v = [...el.querySelectorAll('.hg-st')];
        const w = k => parseInt(v[k].querySelector('u').style.width); const att = (x, mx) => Math.max(6, Math.min(100, Math.round(x / mx * 100)));
        return v.length === 4 && v[0].querySelector('b').textContent == eff.maxHp && v[1].querySelector('b').textContent == eff.move && v[2].querySelector('b').textContent == eff.dmg && v[3].querySelector('b').textContent === eff.rmin + '–' + eff.rmax
          && w(0) === att(eff.maxHp, MX.hp) && w(1) === att(eff.move, MX.mov) && w(2) === att(eff.dmg, MX.dmg) && w(3) === att(eff.rmax, MX.rng) && +el.querySelector('.hg-ex .powtag b').textContent === combatPower(eff); });
      return { prima, dopo, slotTot, pieni, conScudo, potenza: pot0, potenza1: squadPower(), bay, nBay: bay.length };
    });
    check(`${w}×${h}: il quadro della squadra mostra potenza, slot pieni, scudi e sigilli veri e si aggiorna installando moduli e agganciando uno scudo; le statistiche di ogni baia sono barre in scala con i valori effettivi`,
      +h1.prima[0] === h1.potenza && h1.prima[1] === '0/' + h1.slotTot && h1.dopo[0] === String(h1.potenza1) && h1.dopo[1] === h1.pieni + '/' + h1.slotTot && h1.pieni >= 1 && h1.conScudo === '1/' + 3 && h1.prima[3] === '4' && h1.nBay === 3 && h1.bay.every(Boolean), h1);
    // 4. intestazione di baia: l'etichetta degli slot non invade la sagoma; niente scorrimento orizzontale; il ponte verso l'Officina sta sotto il testo
    const h2 = await p.evaluate(() => { const bay = document.querySelector('#hangarScroll .baylite'), tag = bay.querySelector('.slottag').getBoundingClientRect(), pic = bay.querySelector('.baypic').getBoundingClientRect(), name = bay.querySelector('.bayname').getBoundingClientRect(), mt = document.querySelector('#hangar .missiontag'), lk = mt.querySelector('.linkbay').getBoundingClientRect();
      const tx = document.createRange(); tx.selectNodeContents(mt.firstChild); const tr = tx.getBoundingClientRect();
      return { tagSopra: Math.round(tag.bottom) <= Math.round(pic.top), nomeSopra: Math.round(name.bottom) <= Math.round(pic.top), lkSotto: lk.top >= tr.bottom - 1, lkH: Math.round(lk.height), ov: document.documentElement.scrollWidth > innerWidth }; });
    check(`${w}×${h}: l'etichetta degli slot sta sopra la sagoma, il pulsante Officina sta sotto il testo (≥44 px), niente scorrimento orizzontale`, h2.tagSopra && h2.nomeSopra && h2.lkSotto && h2.lkH >= 44 && !h2.ov, h2);
    await ctx.close();
  }
  check('nessuna richiesta di rete', reqs.length === 0, reqs);
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
