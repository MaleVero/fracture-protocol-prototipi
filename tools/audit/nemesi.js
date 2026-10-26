// PALINSESTO nelle condizioni di vittoria e nel tetto dei nemici.
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(C.URL); await p.waitForTimeout(500);
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : JSON.stringify(x)); };
  const scenario = (id, azione) => p.evaluate(async ([id, azione]) => {
    RITMO = 0; nemesis.awake = true; nemesis.dead = false; nemesis.adaptations = []; nemesis.level = 1; nemesis.wounded = false;
    activeMission = nodeOf(id); startBattle(activeMission); await new Promise(r => setTimeout(r, 500));
    const out = { nem: living().filter(u => u.type === 'palinsesto').length };
    const ammazza = f => B.units.forEach(u => { if (!u.player && f(u)) u.hp = 0; });
    if (azione === 'tutti-tranne-nemesi') ammazza(u => u.type !== 'palinsesto');
    if (azione === 'solo-matria-resta-con-nemesi') ammazza(u => u.type !== 'palinsesto' && u.type !== 'matria');
    if (azione === 'abbatti-matria') ammazza(u => u.type === 'matria');
    if (azione === 'tutti-tranne-un-vorn') { let tenuto = false; ammazza(u => { if (u.type !== 'palinsesto' && !tenuto) { tenuto = true; return false; } return u.type !== 'palinsesto'; }); }
    checkEnd(); await new Promise(r => setTimeout(r, 200));
    out.over = B.over; out.vittoria = B.over && /ZONA CONTENUTA/.test(document.getElementById('ovTitle').textContent);
    out.nemViva = living().some(u => u.type === 'palinsesto'); out.riftAperto = B.rift ? B.rift.open : null; out.kaucha = kauchas().length;
    return out;
  }, [id, azione]);
  let r;
  r = await scenario('o1', 'tutti-tranne-nemesi'); check('eliminazione: vinta con PALINSESTO ancora sul campo', r.nem === 1 && r.vittoria && r.nemViva, r);
  r = await scenario('o1', 'tutti-tranne-un-vorn'); check('eliminazione: NON vinta se resta un Kaucha qualunque', r.nem === 1 && !r.over, r);
  r = await scenario('o3', 'tutti-tranne-nemesi'); check('rift: si richiude e la missione e\' vinta con PALINSESTO viva', r.nem === 1 && r.riftAperto === false && r.vittoria, r);
  r = await scenario('o2', 'tutti-tranne-nemesi'); check('sopravvivenza: vinta con PALINSESTO viva', r.nem === 1 && r.vittoria, r);
  r = await scenario('m5', 'solo-matria-resta-con-nemesi'); check('guardiano: con la nemesi e il Varco Madre vivi NON e\' vinta', r.nem === 1 && !r.over, r);
  r = await scenario('m5', 'abbatti-matria'); check('guardiano: caduto il Varco Madre e\' vinta (invariato)', r.vittoria, r);
  // tetto: con la nemesi sveglia gli altri nemici sono al piu' 7 (lei occupa un posto); dormiente fino a 8
  const tetto = await p.evaluate(async () => {
    RITMO = 0; const conta = async (awake) => { let max = 0; for (let i = 0; i < 40; i++) { nemesis.awake = awake; nemesis.dead = false; const cfg = generateMission(nodeOf('o1').spec, 3); max = Math.max(max, cfg.enemies.length); } return max; };
    return { sveglia: await conta(true), dormiente: await conta(false) };
  });
  check('tetto: con la nemesi sveglia al massimo 7 nemici generati, dormiente fino a 8', tetto.sveglia <= 7 && tetto.dormiente <= 8 && tetto.dormiente > tetto.sveglia - 1, tetto);
  check('nessun errore JavaScript', errs.length === 0, errs);
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
