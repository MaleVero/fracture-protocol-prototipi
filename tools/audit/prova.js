// Blocco 4: diario di prova, valutazione a fine missione, rapporto, segnalazione.
//   node prova.js [shots]
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs');
const SHOT = process.argv[2] === 'shots';
const AGENT = fs.readFileSync(require('path').join(__dirname, 'agent.js'), 'utf8');
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const errs = [], reqs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) reqs.push(u); });
  await p.goto(C.URL); await p.waitForTimeout(600); await p.evaluate(AGENT);

  // 1. due missioni vere: una vinta, una persa
  const r1 = await p.evaluate(() => AGENT.play('m1', { realFinish: true }));
  const v1 = await p.evaluate(() => ({ titolo: document.getElementById('ovTitle').textContent, val: document.getElementById('ovVal').style.display, attivo: document.querySelector('.screen.active').id }));
  check('a fine missione compare la valutazione sulla schermata di esito', v1.attivo === 'outcome' && v1.val !== 'none' && r1.victory, v1);
  let d = await p.evaluate(() => leggiDiario());
  check('il diario registra la missione con i campi utili', d.length === 1 && d[0].id === 'm1' && d[0].esito === 'vittoria' && d[0].val === null && typeof d[0].esc === 'number' && Array.isArray(d[0].mech) && d[0].round >= 1, d[0]);
  if (SHOT) await p.screenshot({ path: C.OUT + '/prova-esito.png' });
  await p.click('#ovVal button[data-v="dura"]'); await p.waitForTimeout(150);
  const g = await p.evaluate(() => ({ val: leggiDiario().slice(-1)[0].val, on: [...document.querySelectorAll('#ovVal button.on')].map(x => x.dataset.v), grazie: document.getElementById('ovGrazie').textContent, sr: [...document.querySelectorAll('#sr div')].slice(-1)[0].textContent }));
  check('toccare «DURA» registra il giudizio e lo annuncia', g.val === 'dura' && g.on.join() === 'dura' && /DURA/.test(g.grazie) && /dura/.test(g.sr), g);
  await p.click('#ovVal button[data-v="giusta"]'); await p.waitForTimeout(100);
  check('si puo\' cambiare idea: resta un solo giudizio', await p.evaluate(() => leggiDiario().slice(-1)[0].val) === 'giusta');
  // una sconfitta (squadra ferma)
  await p.evaluate(async () => { activeMission = nodeOf('m2'); RITMO = 0; startBattle(activeMission); await new Promise(r => setTimeout(r, 400)); const t = document.getElementById('txOk'); if (t) t.click(); for (let i = 0; i < 12 && !B.over; i++) { bDeselect(); execPhase(); await new Promise(r => setTimeout(r, 350)); } });
  d = await p.evaluate(() => leggiDiario());
  check('una sconfitta e\' registrata senza giudizio', d.length === 2 && d[1].esito !== 'vittoria' && d[1].val === null, d.map(x => x.id + ':' + x.esito + ':' + x.val));

  // 2. rapporto
  await p.evaluate(() => { window.dispatchEvent(new ErrorEvent('error', { message: 'prova errore finto' })); });
  const rap = await p.evaluate(() => creaRapporto());
  check('il rapporto contiene build, dispositivo, campagna, diario e giudizio', /build: 0\.22\.0/.test(rap) && /dispositivo: /.test(rap) && /campagna: slot 1/.test(rap) && /DIARIO/.test(rap) && /m1 AVAMPOSTO KILO · vittoria/.test(rap) && /giudizio: GIUSTA/.test(rap));
  check('include gli errori recenti', /ERRORI RECENTI: .*prova errore finto/.test(rap));
  check('non contiene indirizzi email ne\' dati personali', !/[\w.+-]+@[\w-]+\.[\w.]+/.test(rap) && !/are\.spider|gmail/i.test(rap), rap.length + ' caratteri');
  check('lascia lo spazio per le note della persona', /COSA È SUCCESSO/.test(rap));
  // missione aperta nel rapporto
  await p.evaluate(async () => { activeMission = nodeOf('o3'); RITMO = 0; startBattle(activeMission); await new Promise(r => setTimeout(r, 500)); });
  const rap2 = await p.evaluate(() => creaRapporto());
  check('a missione aperta il rapporto descrive il campo', /MISSIONE IN CORSO: POZZO VENTRAL/.test(rap2) && /Round 1 di/.test(rap2) && /log: /.test(rap2));

  // 3. pannello opzioni: copia, scarica, anteprima, link
  await p.evaluate(() => { renderOpzioni(); go('opzioni'); });
  await p.click('#rpCopia'); await p.waitForTimeout(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  check('«copia rapporto» mette il rapporto negli appunti', /FRACTURE PROTOCOL — RAPPORTO DI PROVA/.test(clip) && /MISSIONE IN CORSO/.test(clip), clip.length + ' caratteri');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#rpScarica')]);
  check('«scarica rapporto» produce un .txt datato', /^fracture-protocol-rapporto-\d{4}-\d\d-\d\d\.txt$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  await p.click('#opzioni details summary'); await p.waitForTimeout(150);
  const an = await p.evaluate(() => ({ t: document.getElementById('rpAnteprima').textContent.length, vis: document.getElementById('rpAnteprima').offsetParent !== null }));
  check('l\'anteprima mostra cosa verrebbe condiviso', an.vis && an.t > 200, an);
  const href = await p.getAttribute('#rpGithub', 'href'); const u = new URL(href);
  check('il link di segnalazione apre una issue precompilata (< 7000 caratteri)', u.origin + u.pathname === 'https://github.com/MaleVero/fracture-protocol-prototipi/issues/new' && /^\[prova 0\.22\.0\]/.test(u.searchParams.get('title')) && /Ultime missioni/.test(u.searchParams.get('body')) && href.length < 7000, { len: href.length, titolo: u.searchParams.get('title') });
  check('il link si apre in una scheda nuova senza collegare la pagina (noopener)', await p.getAttribute('#rpGithub', 'target') === '_blank' && /noopener/.test(await p.getAttribute('#rpGithub', 'rel')));
  if (SHOT) await p.screenshot({ path: C.OUT + '/prova-opzioni.png', fullPage: false });

  // 4. tetto del diario e copia di sicurezza
  const tetto = await p.evaluate(() => { const a = []; for (let i = 0; i < 130; i++) a.push({ t: new Date().toISOString(), id: 'x' + i, nm: 'X', esito: 'vittoria', round: 1, max: 5, mech: [3, 3], nemLv: -1, esc: 1, val: null }); scriviDiario(a); return leggiDiario().length; });
  check('il diario si ferma a 80 righe', tetto === 80, tetto);
  const bk = await p.evaluate(() => { const o = JSON.parse(creaBackup()); const v = validaBackup(JSON.stringify(o)); return { chiavi: Object.keys(o.chiavi).filter(k => /diario/.test(k)).length, ok: v.ok, err: v.errore }; });
  check('il diario entra nella copia di sicurezza e la copia resta valida', bk.chiavi === 1 && bk.ok, bk);

  // 5. schermata di esito su telefoni piccoli
  for (const [w, h] of [[320, 568], [390, 844], [844, 390]]) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })).newPage();
    await pg.goto(C.URL); await pg.waitForTimeout(500); await pg.evaluate(AGENT); await pg.evaluate(() => AGENT.play('m1', { realFinish: true }));
    await pg.waitForTimeout(300);
    const m = await pg.evaluate(() => { const bs = [...document.querySelectorAll('#ovVal button')].map(b => b.getBoundingClientRect()); const sc = document.getElementById('outcome'); return { n: bs.length, minH: Math.round(Math.min(...bs.map(r => r.height))), maxRight: Math.round(Math.max(...bs.map(r => r.right))), vw: innerWidth, scroll: sc.scrollHeight > sc.clientHeight + 2 || document.querySelector('.obox').scrollHeight > document.querySelector('.obox').clientHeight + 2 }; });
    check(`esito ${w}×${h}: tre pulsanti da >= 44 px dentro lo schermo`, m.n === 3 && m.minH >= 44 && m.maxRight <= m.vw, m);
    if (SHOT) await pg.screenshot({ path: `${C.OUT}/prova-esito-${w}x${h}.png` });
  }
  check('nessuna richiesta di rete in tutta la prova', reqs.length === 0, reqs);
  check('nessun errore JavaScript (a parte quello iniettato di proposito)', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
