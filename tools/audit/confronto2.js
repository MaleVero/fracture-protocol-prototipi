// Confronto per tipo di missione fra serie di file: node confronto2.js etichetta=file ...   (file in out/, senza .json)
const fs = require('fs'); const args = process.argv.slice(2).map(a => a.split('='));
const d = args.map(([, f]) => { const by = {}; JSON.parse(fs.readFileSync('out/' + f + '.json', 'utf8')).filter(r => !r.error).forEach(r => (by[r.id] = by[r.id] || []).push(r)); return by; });
const pct = a => a && a.length ? Math.round(100 * a.filter(r => r.victory).length / a.length) : NaN;
const ids = Object.keys(d[0]).filter(id => d.every(x => x[id]));
const grp = { 'guardiani (m5 o4 t7)': ['m5', 'o4', 't7'], 'eliminazione (m1 o1 t1)': ['m1', 'o1', 't1'], 'relay (m2 o2 t2)': ['m2', 'o2', 't2'], 'evacuazione (m8 o7)': ['m8', 'o7'], 'rift (m3 m4 o3 t3)': ['m3', 'm4', 'o3', 't3'], 'terreno (m7 o5 t4)': ['m7', 'o5', 't4'], 'recupero (m6 o6 t5)': ['m6', 'o6', 't5'], 'demolizione (o8 t6)': ['o8', 't6'] };
console.log('gruppo'.padEnd(26) + args.map(a => a[0].padStart(11)).join(''));
for (const [g, l0] of Object.entries(grp)) { const l = l0.filter(id => d.every(x => x[id])); if (l.length) console.log(g.padEnd(26) + d.map(x => (Math.round(l.reduce((s, id) => s + pct(x[id]), 0) / l.length) + '%').padStart(11)).join('')); }
console.log('media 23 missioni'.padEnd(26) + d.map(x => (Math.round(ids.reduce((s, id) => s + pct(x[id]), 0) / ids.length) + '%').padStart(11)).join(''));
if (process.argv.includes('--dettaglio') || true) { console.log('\nper missione:'); for (const id of ids) console.log(id.padEnd(4) + d.map(x => (pct(x[id]) + '%').padStart(11)).join('')); }
