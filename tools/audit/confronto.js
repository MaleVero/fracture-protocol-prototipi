// Tabella prima/dopo: vittorie per missione e livello di abilità, da due serie di file.
//   node confronto.js out/prima out/dopo     (legge out/prima-{esperto,medio,novizio}.json ecc.)
const fs = require('fs');
const [A, B] = process.argv.slice(2);
const lv = ['esperto', 'medio', 'novizio'];
const load = p => lv.map(l => { const rs = JSON.parse(fs.readFileSync(`${p}-${l}.json`, 'utf8')); const by = {}; rs.filter(r => !r.error).forEach(r => (by[r.id] = by[r.id] || []).push(r)); return by; });
const a = load(A), b = load(B);
const ids = Object.keys(a[0]);
const pct = (rs) => rs && rs.length ? Math.round(100 * rs.filter(r => r.victory).length / rs.length) : NaN;
const f = n => isNaN(n) ? '  - ' : String(n).padStart(3) + '%';
console.log('missione goal         |   PRIMA esp/med/nov    |   DOPO  esp/med/nov    | delta esp');
let tot = [[], []];
for (const id of ids) {
  const g = (a[0][id][0] || {}).goal || '';
  const pa = lv.map((_, i) => pct(a[i][id])), pb = lv.map((_, i) => pct(b[i][id]));
  const d = pb[0] - pa[0];
  console.log(id.padEnd(4), g.padEnd(12), '|', pa.map(f).join(' '), '  |', pb.map(f).join(' '), '  |', (d > 0 ? '+' : '') + d);
}
const media = (x, i) => Math.round(ids.reduce((s, id) => s + pct(x[i][id]), 0) / ids.length);
console.log('media'.padEnd(17), '|', lv.map((_, i) => f(media(a, i))).join(' '), '  |', lv.map((_, i) => f(media(b, i))).join(' '));
