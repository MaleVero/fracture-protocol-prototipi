// Prima partita di un giocatore NUOVO (profilo vuoto): cosa vede, in che ordine, e cosa non gli viene detto.
// Gioca m1 con la tastiera, chiude ogni trasmissione quando compare, e registra le trasmissioni e gli indizi.
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  await p.goto(C.URL); await p.waitForTimeout(600);
  const log = [];
  const r = await p.evaluate(async () => {
    RITMO = 0; const out = { tx: [], hint: [] };
    const orig = window.showTransmission;
    window.showTransmission = function (t) { out.tx.push({ id: t.id, round: B.round, phase: B.phase, sel: !!B.selected, who: typeof t.who === 'function' ? t.who() : t.who, text: (typeof t.text === 'function' ? t.text() : t.text).slice(0, 150) }); return orig.apply(this, arguments); };
    activeMission = nodeOf('m1'); startBattle(activeMission);
    const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 10)); } return true; };
    await wait(() => B.phase === 'player' && !B.busy);
    out.hint.push({ quando: 'inizio', pannello: document.getElementById('bpanel').innerText.slice(0, 160) });
    // gioca col codice "umano": seleziona, muove, mira, conferma
    let guard = 0;
    while (!B.over && guard++ < 10) {
      for (const m of mechs().slice()) {
        if (B.over || m.attacked) continue;
        const t = document.getElementById('txOk'); if (t) t.click();
        onUnitTap(m); checkTransmissions && checkTransmissions();
        const foes = kauchas(); if (!foes.length) break;
        const d = (a, c) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y);
        const f = foes.slice().sort((a, c) => d(m, a) - d(m, c))[0];
        if (B.selRange && !inAtk(m, f.x, f.y)) { let best = null, bs = 1e9; for (const k of B.selRange.keys()) { const [x, y] = k.split(',').map(Number); const dd = Math.abs(x - f.x) + Math.abs(y - f.y); const s = (dd >= m.rmin && dd <= m.rmax ? -100 : 0) + dd; if (s < bs) { bs = s; best = [x, y]; } } if (best) { onCellTap(best[0], best[1]); onUnitTap(m); } }
        const f2 = kauchas().find(q => inAtk(m, q.x, q.y));
        if (f2) { onUnitTap(f2); out.hint.push({ quando: 'dopo 1° tocco su nemico', pannello: document.getElementById('bpanel').innerText.slice(0, 200) }); onUnitTap(f2); await wait(() => !B.busy || B.over, 3000); }
      }
      if (B.over) break;
      const t = document.getElementById('txOk'); if (t) t.click();
      endPlayer(); await wait(() => B.over || (B.phase === 'player' && !B.busy), 6000);
    }
    out.fine = { over: B.over, round: B.round };
    return out;
  });
  console.log('trasmissioni nell\'ordine in cui compaiono (profilo nuovo, m1):');
  r.tx.forEach(t => console.log(`  [r${t.round}/${t.phase}${t.sel ? '/mech selezionato' : ''}] ${t.id.padEnd(11)} ${t.who}: ${t.text.replace(/\n/g, ' ')}…`));
  console.log('\nindizi sul pannello:'); r.hint.forEach(h => console.log('  ' + h.quando + ' → ' + h.pannello.replace(/\n/g, ' | ')));
  console.log('\nfine:', JSON.stringify(r.fine));
  await b.close();
})();
