// Per le missioni a configurazione fissa (guardiani): un mech a contatto raggiunge ogni nemico?
// BFS dalle caselle di schieramento sulle caselle libere (niente acqua, rift, terreno bloccante,
// unità). Restituisce, per ogni nemico, se esiste una casella ADIACENTE raggiungibile.
//   node raggiungibilita.js [idMissione ...]
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  const b = await chromium.launch({ executablePath: C.chromium });
  const p = await (await b.newContext()).newPage();
  await p.goto(C.URL); await p.waitForTimeout(400);
  const ids = process.argv.slice(2);
  const out = await p.evaluate((ids) => {
    const res = [];
    for (const m of MISSIONS.filter(x => x.cfg && (!ids.length || ids.includes(x.id)))) {
      const c = m.cfg, W = 8, H = 8, key = (x, y) => x + ',' + y;
      const water = new Set((c.water || []).map(([x, y]) => key(x, y)));
      const blk = new Set((c.terrain || []).filter(([x, y, t]) => TERR[t].blocks).map(([x, y]) => key(x, y)));
      const units = new Set([...(c.bunkers || []), ...(c.enemies || []).map(e => [e.x, e.y])].map(([x, y]) => key(x, y)));
      if (c.rift) blk.add(key(c.rift.x, c.rift.y));
      const free = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !water.has(key(x, y)) && !blk.has(key(x, y)) && !units.has(key(x, y));
      const seen = new Set(), q = [];
      POS_SCHIERAMENTO.forEach(([x, y]) => { seen.add(key(x, y)); q.push([x, y]); });
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (free(nx, ny) && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); q.push([nx, ny]); } } }
      const r = (c.enemies || []).map(e => ({ t: e.t, at: e.x + ',' + e.y, raggiungibile: DIRS.some(([dx, dy]) => seen.has(key(e.x + dx, e.y + dy))) }));
      const rift = c.rift ? DIRS.some(([dx, dy]) => seen.has(key(c.rift.x + dx, c.rift.y + dy))) : null;
      res.push({ id: m.id, nemici: r, rift });
    }
    return res;
  }, ids);
  for (const m of out) {
    console.log(m.id, 'rift:', m.rift === null ? '-' : (m.rift ? 'raggiungibile' : 'NON RAGGIUNGIBILE'));
    for (const e of m.nemici) console.log('   ', e.t.padEnd(11), e.at.padEnd(5), e.raggiungibile ? 'raggiungibile a contatto' : 'NON raggiungibile a contatto (solo a distanza)');
  }
  await b.close();
})();
