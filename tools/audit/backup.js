// Copia di sicurezza: esporta, svuota, ripristina; file sbagliati rifiutati senza toccare il salvataggio.
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs'); const os = require('os'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, acceptDownloads: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : JSON.stringify(x)); };
  await p.goto(C.URL); await p.waitForTimeout(600);
  // progressi riconoscibili + un checkpoint di battaglia
  await p.evaluate(async () => {
    RITMO = 0; ['m2', 'm3'].forEach(i => cleared.add(i)); frammenti = 777; applyUnlocks(); saveState();
    activeMission = nodeOf('m3'); startBattle(activeMission); await new Promise(r => setTimeout(r, 600));
  });
  const prima = await p.evaluate(() => ({ cleared: [...cleared].sort(), fr: frammenti, cp: !!leggiBattaglia(), chiavi: Object.keys(localStorage).filter(k => k.indexOf(SAVE_KEY) === 0).length }));
  check('stato prima della copia', prima.cp && prima.fr === 777, prima);
  // 1. esporta dalla schermata vera
  await p.evaluate(() => { renderOpzioni(); go('opzioni'); });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bkExport')]);
  const file = path.join(os.tmpdir(), 'fp-backup-test.json'); await dl.saveAs(file);
  const contenuto = fs.readFileSync(file, 'utf8');
  const bk = JSON.parse(contenuto);
  check('il file ha formato, versione e chiavi del gioco', bk.formato === 'fracture-protocol-backup' && bk.v === 1 && Object.keys(bk.chiavi).length === prima.chiavi, { chiavi: Object.keys(bk.chiavi).length, nome: dl.suggestedFilename() });
  check('include il checkpoint di battaglia', Object.keys(bk.chiavi).some(k => k.indexOf('/battaglia/') > 0));
  // 2. file sbagliati: nessun cambiamento al salvataggio
  const sbagliati = {
    'testo qualunque': 'ciao', 'json di altro': '{"a":1}', 'formato giusto, dati vuoti': JSON.stringify({ formato: 'fracture-protocol-backup', v: 1, chiavi: {} }),
    'chiave estranea': JSON.stringify({ formato: 'fracture-protocol-backup', v: 1, chiavi: { 'altro-sito/x': '1', 'fracture-protocol/v1': '{"v":2}' } }),
    'salvataggio corrotto': JSON.stringify({ formato: 'fracture-protocol-backup', v: 1, chiavi: { 'fracture-protocol/v1': '{non json' } }),
    'versione sconosciuta': JSON.stringify({ formato: 'fracture-protocol-backup', v: 9, chiavi: { 'fracture-protocol/v1': '{"v":2}' } }),
    'senza salvataggio principale': JSON.stringify({ formato: 'fracture-protocol-backup', v: 1, chiavi: { 'fracture-protocol/v1/battaglia/0': '{}' } }),
  };
  const snap = () => p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  const s0 = await snap(); let rifiutati = 0, dettagli = {};
  p.on('dialog', d => d.accept());
  for (const [nome, txt] of Object.entries(sbagliati)) {
    const f = path.join(os.tmpdir(), 'fp-bad-' + Object.keys(sbagliati).indexOf(nome) + '.json'); fs.writeFileSync(f, txt);   // nome diverso: lo stesso nome non rilancia 'change'
    await p.evaluate(() => { document.getElementById('toast').textContent = ''; });
    await p.setInputFiles('#bkFile', f); await p.waitForTimeout(350);
    const toast = await p.evaluate(() => document.getElementById('toast').textContent);
    const s1 = await snap(); if (s1 === s0) rifiutati++; dettagli[nome] = toast.slice(0, 50);
  }
  check('7 file sbagliati rifiutati, salvataggio intatto', rifiutati === 7 && Object.values(dettagli).every(t => t.length > 5), dettagli);
  check('ogni file sbagliato ha un messaggio proprio', new Set(Object.values(dettagli)).size === 7, [...new Set(Object.values(dettagli))].length);
  // 3. svuota tutto (come farebbe il browser) e ripristina dal file
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(600);
  const vuoto = await p.evaluate(() => ({ cleared: [...cleared].sort(), fr: frammenti, cp: !!leggiBattaglia() }));
  check('dopo lo svuotamento il progresso e\' perso', vuoto.fr !== 777 && !vuoto.cp, vuoto);
  await p.evaluate(() => { renderOpzioni(); go('opzioni'); });
  await Promise.all([p.waitForEvent('load'), p.setInputFiles('#bkFile', file)]);
  await p.waitForTimeout(700);
  const dopo = await p.evaluate(() => ({ cleared: [...cleared].sort(), fr: frammenti, cp: !!leggiBattaglia(), menu: [...document.querySelectorAll('#menulist .nm')].map(e => e.textContent)[0] }));
  check('ripristino: progressi identici', JSON.stringify(dopo.cleared) === JSON.stringify(prima.cleared) && dopo.fr === 777, dopo);
  check('ripristino: la missione salvata e\' di nuovo offerta', dopo.cp && dopo.menu === 'RIPRENDI LA MISSIONE', dopo.menu);
  // 4. e la ripresa della battaglia funziona dopo il ripristino
  const rip = await p.evaluate(async () => { const ok = ripristinaBattaglia(); await new Promise(r => setTimeout(r, 300)); return { ok, battle: document.querySelector('.screen.active').id, round: B.round, mechs: mechs().length, foes: kauchas().length }; });
  check('ripresa della missione dopo il ripristino', rip.ok && rip.battle === 'battle' && rip.mechs === 3, rip);
  check('nessun errore JavaScript', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
