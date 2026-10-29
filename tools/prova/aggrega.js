// Aggrega i risultati della prova: questionari (prova/questionario.html) e rapporti del gioco (Opzioni → Prova e segnalazioni → Copia rapporto).
//   node tools/prova/aggrega.js <cartella|file> [altro...]   # stampa il riepilogo in Markdown
//   node tools/prova/aggrega.js <cartella> --json            # stesso contenuto, strutturato
// Convenzione: un file per persona, il nome comincia col codice (T01-questionario.txt, T01-rapporto.txt). Se il questionario contiene il
// codice, vale quello. Un file puo' contenere anche entrambi i testi incollati uno dopo l'altro.
// Niente di cio' che leggo lascia questa macchina; le soglie vengono da tools/prova/spec.json.
const fs = require('fs'), path = require('path');
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec.json'), 'utf8'));
const SOGLIE = spec.soglie;
const DOMANDE = {}; spec.sezioni.forEach(s => s.domande.forEach(d => { DOMANDE[d.id] = Object.assign({ sezione: s.id }, d); }));

// ───────────────────────────── lettura
function raccogliFile(args) {
  const out = [];
  const visita = p => {
    if (!fs.existsSync(p)) { console.error('non trovato: ' + p); process.exit(2); }
    const st = fs.statSync(p);
    if (st.isDirectory()) fs.readdirSync(p).sort().forEach(f => visita(path.join(p, f)));
    else if (/\.(txt|md)$/i.test(p) && !/^README/i.test(path.basename(p))) out.push(p);
  };
  args.forEach(visita);
  return out;
}
function codiceDaFile(f) { const m = path.basename(f).match(/^([A-Za-z]+\d+)/); return m ? m[1].toUpperCase() : null; }

function leggiQuestionari(testo) {
  const res = []; const re = /=== QUESTIONARIO FRACTURE PROTOCOL v(\d+) ===([\s\S]*?)=== FINE ===/g; let m;
  while ((m = re.exec(testo))) {
    const q = { versione: +m[1], risposte: {}, build: null, data: null };
    m[2].split(/\r?\n/).forEach(l => {
      const r = l.match(/^([a-z.]+):\s?(.*)$/i); if (!r) return;
      if (r[1] === 'build') q.build = r[2].trim(); else if (r[1] === 'data') q.data = r[2].trim();
      else if (r[1].startsWith('q.')) q.risposte[r[1].slice(2)] = r[2].trim();
    });
    res.push(q);
  }
  return res;
}
const RIGA_DIARIO = /^(\d{4}-\d\d-\d\d \d\d:\d\d) · (\S+) (.+?) · (vittoria|ritirata|sconfitta)(?: \(([^)]*)\))? · round (\d+)\/(\d+) · mech (\S+) · nemesi (.+?) · escalation ([\d.]+)(?: · giudizio: (FACILE|GIUSTA|DURA))?\s*$/;
function leggiRapporti(testo) {
  const res = []; const parti = testo.split(/(?=FRACTURE PROTOCOL — RAPPORTO DI PROVA)/).filter(p => /^FRACTURE PROTOCOL — RAPPORTO DI PROVA/.test(p));
  for (const p of parti) {
    const r = { build: null, dispositivo: null, schermo: null, righe: [], errori: false };
    const b = p.match(/^build: (\S+)/m); if (b) r.build = b[1];
    const d = p.match(/^dispositivo: (.*)$/m); if (d) r.dispositivo = d[1].trim();
    const s = p.match(/^schermo: (\d+)×(\d+)/m); if (s) r.schermo = [+s[1], +s[2]];
    r.errori = /^ERRORI RECENTI:/m.test(p);
    for (const l of p.split(/\r?\n/)) {
      const m = l.match(RIGA_DIARIO); if (!m) continue;
      r.righe.push({ t: m[1], id: m[2], nome: m[3], esito: m[4], motivo: m[5] || null, round: +m[6], max: +m[7], mech: m[8], nemesi: m[9], esc: +m[10], giudizio: m[11] || null });
    }
    res.push(r);
  }
  return res;
}

// ───────────────────────────── statistiche
const somma = a => a.reduce((s, x) => s + x, 0);
const media = a => a.length ? somma(a) / a.length : null;
const mediana = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function wilson(k, n, z) {
  if (!n) return [0, 0]; z = z || 1.96; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - s) / d), Math.min(1, (c + s) / d)];
}
const pct = x => x === null || x === undefined ? '–' : Math.round(x * 100) + '%';
const num = (x, c) => x === null || x === undefined ? '–' : (+x).toFixed(c === undefined ? 1 : c);
const conta = a => { const o = {}; a.forEach(x => { o[x] = (o[x] || 0) + 1; }); return o; };

function aggrega(files) {
  const persone = new Map();      // codice -> { q, righe:[], rapporti:[] }
  const prendi = c => { if (!persone.has(c)) persone.set(c, { codice: c, q: null, righe: new Map(), rapporti: [] }); return persone.get(c); };
  let anon = 0;
  for (const f of files) {
    const testo = fs.readFileSync(f, 'utf8'); const dalFile = codiceDaFile(f);
    for (const q of leggiQuestionari(testo)) {
      const c = ((q.risposte.codice || '').toUpperCase().match(/^[A-Z]+\d+/) || [dalFile])[0] || 'ANON' + (++anon);
      const p = prendi(c); p.q = q;
    }
    for (const r of leggiRapporti(testo)) {
      const c = dalFile || 'ANON' + (++anon); const p = prendi(c); p.rapporti.push(r);
      r.righe.forEach(l => p.righe.set(l.t + '|' + l.id, l));   // il diario e' cumulativo: stessa riga in due rapporti = una volta
    }
  }
  const P = [...persone.values()];
  const Q = P.filter(p => p.q);
  const R = {};
  R.n = { persone: P.length, questionari: Q.length, rapporti: P.filter(p => p.rapporti.length).length };

  // profilo
  const prof = {}; ['eta', 'tattici', 'giochi', 'dispositivo'].forEach(k => { prof[k] = conta(Q.map(p => p.q.risposte[k]).filter(Boolean)); });
  prof.minuti = { n: Q.filter(p => p.q.risposte.minuti !== undefined && p.q.risposte.minuti !== '').length };
  prof.minuti.mediana = mediana(Q.map(p => p.q.risposte.minuti).filter(x => x !== undefined && x !== '').map(Number).filter(x => !isNaN(x)));
  R.profilo = prof;

  // comprensione
  R.comprensione = { domande: {}, punteggioMedio: null };
  const cd = spec.sezioni.find(s => s.id === 'comp').domande;
  const punteggi = [];
  cd.forEach(d => {
    const risp = Q.map(p => p.q.risposte[d.id]).filter(x => x !== undefined && x !== '');
    const giuste = risp.filter(x => x === d.corretta).length;
    R.comprensione.domande[d.id] = { n: risp.length, giuste, quota: risp.length ? giuste / risp.length : null, ic: wilson(giuste, risp.length), nonso: risp.filter(x => x === 'nonso').length, scelte: conta(risp), etichetta: d.etichetta };
  });
  Q.forEach(p => { const r = cd.filter(d => p.q.risposte[d.id] !== undefined && p.q.risposte[d.id] !== ''); if (r.length === cd.length) punteggi.push(r.filter(d => p.q.risposte[d.id] === d.corretta).length); });
  R.comprensione.punteggi = punteggi;
  R.comprensione.punteggioMedio = media(punteggi);
  R.comprensione.quotaComplessiva = (() => { const tot = Object.values(R.comprensione.domande); const n = somma(tot.map(x => x.n)); return n ? somma(tot.map(x => x.giuste)) / n : null; })();

  // esperienza (scale)
  R.esperienza = {};
  spec.sezioni.find(s => s.id === 'es').domande.filter(d => d.tipo === 'scala').forEach(d => {
    const v = Q.map(p => p.q.risposte[d.id]).filter(x => x !== undefined && x !== '').map(Number).filter(x => !isNaN(x));
    const esp = Q.filter(p => ['2', '3'].includes(p.q.risposte.tattici)), nov = Q.filter(p => ['0', '1'].includes(p.q.risposte.tattici));
    const m = ps => media(ps.map(p => p.q.risposte[d.id]).filter(x => x !== undefined && x !== '').map(Number).filter(x => !isNaN(x)));
    R.esperienza[d.id] = { n: v.length, media: media(v), mediana: mediana(v), distribuzione: conta(v), esperti: m(esp), novizi: m(nov), etichetta: d.etichetta };
  });
  const sc = id => { const v = Q.map(p => p.q.risposte[id]).filter(x => x !== undefined && x !== ''); return conta(v); };
  R.fumetti = sc('fumetti'); R.suono = sc('suono');

  // mercato
  const npsV = Q.map(p => p.q.risposte.nps).filter(x => x !== undefined && x !== '').map(Number);
  const prom = npsV.filter(x => x >= 9).length, detr = npsV.filter(x => x <= 6).length;
  R.mercato = { nps: npsV.length ? Math.round((prom - detr) / npsV.length * 100) : null, npsN: npsV.length, promotori: prom, detrattori: detr,
    wishlist: sc('wishlist'), prezzo: sc('prezzo') };
  const wl = Q.map(p => p.q.risposte.wishlist).filter(Boolean); R.mercato.wishlistSi = wl.length ? wl.filter(x => x === 'si').length / wl.length : null; R.mercato.wishlistN = wl.length;

  // diario del gioco
  const tutte = []; P.forEach(p => [...p.righe.values()].forEach(l => tutte.push(Object.assign({ chi: p.codice }, l))));
  const perMissione = {};
  tutte.forEach(l => { const m = perMissione[l.id] || (perMissione[l.id] = { id: l.id, nome: l.nome, n: 0, vittorie: 0, ritirate: 0, sconfitte: 0, round: [], giudizi: { FACILE: 0, GIUSTA: 0, DURA: 0 } });
    m.n++; if (l.esito === 'vittoria') m.vittorie++; else if (l.esito === 'ritirata') m.ritirate++; else m.sconfitte++; m.round.push(l.round); if (l.giudizio) m.giudizi[l.giudizio]++; });
  R.diario = { partite: tutte.length, missioni: Object.values(perMissione).sort((a, b) => b.n - a.n).map(m => Object.assign(m, { quota: m.vittorie / m.n, roundMedio: media(m.round) })) };
  const giud = conta(tutte.map(l => l.giudizio).filter(Boolean)); R.diario.giudizi = giud; R.diario.giudiziN = somma(Object.values(giud));
  // la prima missione di ciascuno: e' l'onboarding
  const primi = P.map(p => [...p.righe.values()].sort((a, b) => a.t < b.t ? -1 : 1)[0]).filter(Boolean);
  R.diario.primaMissione = { n: primi.length, vinte: primi.filter(l => l.esito === 'vittoria').length, quota: primi.length ? primi.filter(l => l.esito === 'vittoria').length / primi.length : null };
  R.diario.perPersona = P.filter(p => p.righe.size).map(p => ({ codice: p.codice, partite: p.righe.size }));
  R.diario.dispositivi = conta(P.flatMap(p => p.rapporti.map(r => r.schermo ? (r.schermo[0] < 600 ? 'telefono (<600 px)' : r.schermo[0] < 1000 ? 'tablet (600–999 px)' : 'schermo largo (≥1000 px)') : null)).filter(Boolean));
  R.diario.conErrori = P.filter(p => p.rapporti.some(r => r.errori)).map(p => p.codice);
  R.diario.build = conta(P.flatMap(p => p.rapporti.map(r => r.build)).concat(Q.map(p => p.q.build)).filter(Boolean));

  // aperte
  R.aperte = {}; ['bello', 'frustrante', 'confuso', 'ricorda', 'cambiare'].forEach(k => { R.aperte[k] = P.filter(p => p.q && p.q.risposte[k]).map(p => ({ chi: p.codice, testo: p.q.risposte[k] })); });

  // verdetti
  const v = [];
  const semaforo = (valore, buono, debole, alto) => valore === null || valore === undefined ? '?' : (alto === false ? (valore <= buono ? '✓' : valore <= debole ? '~' : '✗') : (valore >= buono ? '✓' : valore >= debole ? '~' : '✗'));
  v.push({ voce: 'Capiscono le regole (risposte giuste alle 5 domande)', valore: pct(R.comprensione.quotaComplessiva), segno: semaforo(R.comprensione.quotaComplessiva, SOGLIE.comprensione.buono, SOGLIE.comprensione.debole), soglia: '≥ ' + pct(SOGLIE.comprensione.buono) });
  v.push({ voce: 'Prima missione vinta da chi gioca (onboarding)', valore: pct(R.diario.primaMissione.quota) + ' (' + R.diario.primaMissione.vinte + '/' + R.diario.primaMissione.n + ')', segno: semaforo(R.diario.primaMissione.quota, 0.7, 0.5), soglia: '≥ 70%' });
  v.push({ voce: 'Divertimento (1–5)', valore: num(R.esperienza.divertimento && R.esperienza.divertimento.media), segno: semaforo(R.esperienza.divertimento && R.esperienza.divertimento.media, SOGLIE.divertimento.buono, SOGLIE.divertimento.debole), soglia: '≥ ' + SOGLIE.divertimento.buono });
  v.push({ voce: 'Voglia di un\'altra missione (1–5)', valore: num(R.esperienza.voglia && R.esperienza.voglia.media), segno: semaforo(R.esperienza.voglia && R.esperienza.voglia.media, SOGLIE.voglia.buono, SOGLIE.voglia.debole), soglia: '≥ ' + SOGLIE.voglia.buono });
  const dif = R.esperienza.difficolta && R.esperienza.difficolta.media;
  v.push({ voce: 'Difficoltà percepita (1 facile … 5 difficile)', valore: num(dif), segno: dif === null || dif === undefined ? '?' : (dif >= SOGLIE.difficolta.da && dif <= SOGLIE.difficolta.a ? '✓' : (dif >= 2 && dif <= 4 ? '~' : '✗')), soglia: SOGLIE.difficolta.da + '–' + SOGLIE.difficolta.a });
  const leggi = media([R.esperienza.campo && R.esperienza.campo.media, R.esperienza.creature && R.esperienza.creature.media].filter(x => x !== null && x !== undefined));
  v.push({ voce: 'Leggibilità del campo e delle creature (1–5)', valore: num(leggi), segno: semaforo(leggi, SOGLIE.leggibilita.buono, SOGLIE.leggibilita.debole), soglia: '≥ ' + SOGLIE.leggibilita.buono });
  if (R.diario.giudiziN) {
    const g = R.diario.giudizi, n = R.diario.giudiziN; const gi = (g.GIUSTA || 0) / n, du = (g.DURA || 0) / n, fa = (g.FACILE || 0) / n;
    v.push({ voce: 'Giudizi di fine missione: GIUSTA', valore: pct(gi), segno: gi >= SOGLIE.giudizi.giustaMin ? '✓' : gi >= 0.35 ? '~' : '✗', soglia: '≥ ' + pct(SOGLIE.giudizi.giustaMin) });
    v.push({ voce: 'Giudizi di fine missione: DURA', valore: pct(du), segno: du <= SOGLIE.giudizi.durMax ? '✓' : du <= 0.5 ? '~' : '✗', soglia: '≤ ' + pct(SOGLIE.giudizi.durMax) });
    v.push({ voce: 'Giudizi di fine missione: FACILE', valore: pct(fa), segno: fa <= SOGLIE.giudizi.facileMax ? '✓' : fa <= 0.4 ? '~' : '✗', soglia: '≤ ' + pct(SOGLIE.giudizi.facileMax) });
  }
  v.push({ voce: 'NPS (promotori − detrattori)', valore: R.mercato.nps === null ? '–' : String(R.mercato.nps), segno: semaforo(R.mercato.nps, SOGLIE.nps.buono, SOGLIE.nps.debole), soglia: '≥ ' + SOGLIE.nps.buono });
  v.push({ voce: 'Lo metterebbero in wishlist (sì)', valore: pct(R.mercato.wishlistSi), segno: semaforo(R.mercato.wishlistSi, SOGLIE.wishlist.buono, SOGLIE.wishlist.debole), soglia: '≥ ' + pct(SOGLIE.wishlist.buono) });
  R.verdetti = v;
  return R;
}

// ───────────────────────────── uscita
function markdown(R) {
  const L = [];
  L.push('# Risultati della prova'); L.push('');
  L.push(`**${R.n.persone} persone** · ${R.n.questionari} questionari · ${R.n.rapporti} rapporti del gioco · ${R.diario.partite} partite nel diario.`);
  if (R.n.persone < 8) L.push(`\n> Con meno di 8 persone i numeri sono indicativi, non statistica: per ogni percentuale trovi l'intervallo di confidenza al 95% (Wilson). Un 60% su 6 persone può essere un 25% o un 88% veri.`);
  if (Object.keys(R.diario.build).length) L.push(`\nBuild provate: ${Object.entries(R.diario.build).map(([k, v]) => k + ' (' + v + ')').join(', ')}.`);
  L.push('');
  L.push('## Semaforo'); L.push('');
  L.push('| | Misura | Valore | Soglia |'); L.push('|---|---|---|---|');
  R.verdetti.forEach(x => L.push(`| ${x.segno} | ${x.voce} | ${x.valore} | ${x.soglia} |`));
  L.push(''); L.push('✓ nei limiti · ~ da guardare · ✗ sotto la soglia · ? mancano i dati');
  L.push('');
  L.push('## Chi ha provato'); L.push('');
  const riga = (t, o) => Object.keys(o).length ? `- ${t}: ${Object.entries(o).map(([k, v]) => k + ' ' + v).join(' · ')}` : null;
  [riga('Età', R.profilo.eta), riga('Giochi tattici (0 mai … 3 genere preferito)', R.profilo.tattici), riga('Videogiochi in generale (0 … 3)', R.profilo.giochi), riga('Dispositivo dichiarato', R.profilo.dispositivo), riga('Schermo dai rapporti', R.diario.dispositivi)].filter(Boolean).forEach(x => L.push(x));
  if (R.profilo.minuti.mediana !== null) L.push(`- Minuti giocati: mediana ${R.profilo.minuti.mediana} (su ${R.profilo.minuti.n})`);
  L.push('');
  L.push('## Cosa hanno capito'); L.push('');
  L.push('| Domanda | Giuste | Intervallo 95% | «Non lo so» |'); L.push('|---|---|---|---|');
  Object.entries(R.comprensione.domande).forEach(([k, d]) => L.push(`| ${d.etichetta} | ${d.giuste}/${d.n} (${pct(d.quota)}) | ${pct(d.ic[0])}–${pct(d.ic[1])} | ${d.nonso} |`));
  if (R.comprensione.punteggioMedio !== null) L.push(`\nPunteggio medio: ${num(R.comprensione.punteggioMedio)} su 5. Distribuzione: ${Object.entries(conta(R.comprensione.punteggi)).map(([k, v]) => k + '/5 ×' + v).join(' · ')}.`);
  L.push(''); L.push('Le risposte sbagliate più scelte dicono *cosa* il gioco fa capire male:'); L.push('');
  Object.entries(R.comprensione.domande).forEach(([k, d]) => { const sb = Object.entries(d.scelte).filter(([o]) => o !== DOMANDE[k].corretta && o !== 'nonso').sort((a, b) => b[1] - a[1])[0]; if (sb) { const op = DOMANDE[k].opzioni.find(o => o[0] === sb[0]); L.push(`- ${k}: ${sb[1]} hanno scelto «${op ? op[1] : sb[0]}»`); } });
  L.push('');
  L.push('## Com\'è andata'); L.push('');
  L.push('| Misura | n | Media | Esperti di tattici | Novizi |'); L.push('|---|---|---|---|---|');
  Object.entries(R.esperienza).forEach(([k, e]) => L.push(`| ${e.etichetta} | ${e.n} | ${num(e.media)} | ${num(e.esperti)} | ${num(e.novizi)} |`));
  if (Object.keys(R.fumetti).length) L.push(`\nTavole a fumetti: ${Object.entries(R.fumetti).map(([k, v]) => k + ' ' + v).join(' · ')}.`);
  if (Object.keys(R.suono).length) L.push(`Suono: ${Object.entries(R.suono).map(([k, v]) => k + ' ' + v).join(' · ')}.`);
  L.push('');
  if (R.diario.partite) {
    L.push('## Le missioni giocate (dal diario del gioco)'); L.push('');
    L.push('| Missione | Partite | Vittorie | Ritirate | Sconfitte | Round medi | FACILE / GIUSTA / DURA |'); L.push('|---|---|---|---|---|---|---|');
    R.diario.missioni.forEach(m => L.push(`| ${m.id} ${m.nome} | ${m.n} | ${m.vittorie} (${pct(m.quota)}) | ${m.ritirate} | ${m.sconfitte} | ${num(m.roundMedio)} | ${m.giudizi.FACILE} / ${m.giudizi.GIUSTA} / ${m.giudizi.DURA} |`));
    L.push(`\nPrima missione di ciascuno: vinta da ${R.diario.primaMissione.vinte} su ${R.diario.primaMissione.n}. Partite per persona: ${R.diario.perPersona.map(p => p.codice + ' ' + p.partite).join(', ')}.`);
    if (R.diario.conErrori.length) L.push(`\n⚠ Rapporti con errori del gioco registrati: ${R.diario.conErrori.join(', ')}.`);
    L.push('');
  }
  L.push('## Se fosse in vendita'); L.push('');
  L.push(`- NPS: ${R.mercato.nps === null ? '–' : R.mercato.nps} (${R.mercato.promotori} promotori, ${R.mercato.detrattori} detrattori su ${R.mercato.npsN})`);
  if (R.mercato.wishlistN) { const k = Math.round((R.mercato.wishlistSi || 0) * R.mercato.wishlistN), ic = wilson(k, R.mercato.wishlistN); L.push(`- Wishlist «sì»: ${k}/${R.mercato.wishlistN} (${pct(R.mercato.wishlistSi)}, intervallo ${pct(ic[0])}–${pct(ic[1])}); ${Object.entries(R.mercato.wishlist).map(([k2, v]) => k2 + ' ' + v).join(' · ')}`); }
  if (Object.keys(R.mercato.prezzo).length) L.push(`- Prezzo: ${Object.entries(R.mercato.prezzo).map(([k, v]) => k + ' ' + v).join(' · ')}`);
  L.push('');
  L.push('## Con parole loro'); L.push('');
  const tit = { bello: 'Il momento più bello', frustrante: 'Il più frustrante', confuso: 'Dove non hanno capito', ricorda: 'A che gioco li ha fatti pensare', cambiare: 'Cosa cambierebbero' };
  Object.entries(R.aperte).forEach(([k, a]) => { if (!a.length) return; L.push(`### ${tit[k]}`); a.forEach(x => L.push(`- **${x.chi}**: ${x.testo.slice(0, 300)}`)); L.push(''); });
  return L.join('\n');
}

module.exports = { aggrega, markdown, leggiQuestionari, leggiRapporti, wilson, raccogliFile };
if (require.main === module) {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!args.length) { console.error('uso: node tools/prova/aggrega.js <cartella|file> [altro...] [--json]'); process.exit(2); }
  const files = raccogliFile(args);
  if (!files.length) { console.error('nessun file .txt/.md trovato'); process.exit(2); }
  const R = aggrega(files);
  console.log(process.argv.includes('--json') ? JSON.stringify(R, null, 2) : markdown(R));
}
