// Riassume i dati grezzi di sim.js (--out) per capire PERCHÉ una missione si perde.
//   node inspect.js out/base-esperto.json m2 o2
const fs = require('fs');
const [file, ...ids] = process.argv.slice(2);
const rs = JSON.parse(fs.readFileSync(file, 'utf8'));
const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-';
for (const id of ids) {
  const r = rs.filter(x => x.id === id && !x.error);
  const W = r.filter(x => x.victory), L = r.filter(x => !x.victory);
  console.log(`\n== ${id} (${r[0] && r[0].goal}) vittorie ${W.length}/${r.length}`);
  const f = (k) => `vinte ${avg(W.map(x => x[k]).filter(v => v != null))}  perse ${avg(L.map(x => x[k]).filter(v => v != null))}`;
  for (const k of ['foes0', 'foeHp0', 'attackers0', 'relayHp0', 'relayThr0', 'relayThr1', 'minDistRelay0', 'civ0', 'civThr0', 'civThr1', 'evacGoal', 'hp0', 'rounds', 'evacuated', 'terrainKills', 'pushes'])
    if (r.some(x => x[k] != null)) console.log(`  ${k.padEnd(14)} ${f(k)}`);
  // quante partite hanno il relay già condannato al primo turno (minaccia >= hp) e restano condannate
  if (r.some(x => x.relayHp0 != null)) {
    const cond0 = r.filter(x => x.relayThr0 >= x.relayHp0), cond1 = r.filter(x => x.relayThr1 >= x.relayHp0);
    console.log(`  relay minacciato a morte all'apertura: ${cond0.length}/${r.length}; dopo il 1° turno del giocatore: ${cond1.length}/${r.length}; di queste perse: ${cond1.filter(x => !x.victory).length}`);
  }
  const cs = {}; for (const x of r) for (const [kk, v] of Object.entries(x.causes || {})) cs[kk] = (cs[kk] || 0) + v;
  const rows = Object.entries(cs).sort((a, b) => b[1] - a[1]).slice(0, 14);
  if (rows.length) console.log('  cause di morte (tutte le partite):\n' + rows.map(([kk, v]) => '    ' + String(v).padStart(3) + '  ' + kk).join('\n'));
  if (r.some(x => x.civ0)) {
    const hit0 = r.filter(x => x.civThr0 > 0), hit1 = r.filter(x => x.civThr1 > 0);
    console.log(`  civili minacciati all'apertura: ${hit0.length}/${r.length}; dopo il 1° turno: ${hit1.length}/${r.length}; obiettivo ${r[0].evacGoal} su ${r[0].civ0}`);
  }
}
