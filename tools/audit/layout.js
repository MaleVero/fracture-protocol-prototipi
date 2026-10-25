// Misura il layout della battaglia in molti formati: dove sono campo e comandi,
// e se FINE TURNO si raggiunge senza scorrere. Uso: node layout.js [shots]
const C = require('./common'); const { chromium } = C.pw;
const URL = C.URL, OUT = C.OUT;
const SHOT = process.argv[2] === 'shots';
const SIZES = [[320,568],[360,640],[375,667],[390,844],[412,915],[568,320],[667,375],[844,390],[932,430],[768,1024],[1024,768],[1280,800]];
(async () => {
  const browser = await chromium.launch({ executablePath: C.chromium });
  let bad = 0;
  for (const [w, h] of SIZES) {
    const touch = w < 1000 && !(w === 1024 && h === 768);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(URL); await page.waitForTimeout(400);
    for (const withTx of [true, false]) {
      await page.evaluate(() => { RITMO = 0; activeMission = MISSIONS[0]; startBattle(MISSIONS[0]); });
      await page.waitForTimeout(450);
      if (!withTx) await page.evaluate(() => { const b = document.querySelector('#transmission .txok'); if (b) b.click(); });
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const R = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
        const vw = innerWidth, vh = innerHeight;
        const btns = [...document.querySelectorAll('#bcontrols button')].map(b => b.getBoundingClientRect());
        const ctl = btns.length ? { right: Math.round(Math.max(...btns.map(r => r.right))), bottom: Math.round(Math.max(...btns.map(r => r.bottom))), minW: Math.round(Math.min(...btns.map(r => r.width))), minH: Math.round(Math.min(...btns.map(r => r.height))) } : null;
        const end = R('endTurnBtn'), board = R('board');
        const tx = document.getElementById('transmission'); const txShown = tx && tx.style.display !== 'none';
        return { vw, vh, board, ctl, endTurn: end, txShown,
          boardVisible: board && board.h > 0 && board.y < vh, boardFrac: board ? +(Math.min(board.b, vh) - Math.max(board.y, 0)).toFixed(0) / vh : 0,
          endReachable: end && end.b <= vh + 1 && end.y >= 0 && end.r <= vw + 1,
          ctlInside: ctl && ctl.right <= vw + 1 && ctl.bottom <= vh + 1 };
      });
      const flag = (!m.boardVisible || m.board.h < 120) || !m.endReachable || !m.ctlInside;
      if (flag) bad++;
      console.log(`${w}x${h} tx=${withTx ? 'on ' : 'off'} board=${m.board.w}x${m.board.h}@${m.board.y} (${Math.round(m.boardFrac * 100)}% vh)  end=${m.endTurn ? m.endTurn.y + '-' + m.endTurn.b : '-'}  ctl.right=${m.ctl && m.ctl.right} minBtn=${m.ctl && m.ctl.minW}x${m.ctl && m.ctl.minH}  ${flag ? '❌' : '✓'}`);
      if (SHOT) await page.screenshot({ path: `${OUT}/layout-${w}x${h}-tx${withTx ? 1 : 0}.png` });
    }
    if (errs.length) console.log('ERRORS', errs);
    await ctx.close();
  }
  console.log(bad ? `\n${bad} configurazioni da correggere` : '\ntutte le configurazioni ok');
  await browser.close();
})();
