// Dati SINTETICI per provare gli strumenti: persone inventate, numeri inventati. Non sono risultati di una prova.
//   node tools/prova/esempi.js     # scrive tools/prova/esempi/*.txt
const fs = require('fs'), path = require('path');
const RISP = {   // codice -> risposte al questionario
  T01: { eta: '25-34', tattici: '3', giochi: '3', dispositivo: 'computer', minuti: '45', intento: 'b', acqua: 'c', risonanza: 'b', anello: 'd', corruzione: 'a', obiettivi: '5', difficolta: '3', divertimento: '5', voglia: '5', campo: '4', creature: '4', interfaccia: '3', fumetti: 'leggo', suono: 'manca', bello: 'Spingere un Vorn in acqua e vederlo sparire.', frustrante: 'Il relay distrutto al terzo round senza poter fare niente.', confuso: 'La barra di Lazy J: ho capito solo alla quinta missione.', ricorda: 'Into the Breach', cambiare: 'Più info sul turno dei nemici.', nps: '9', wishlist: 'si', prezzo: '10-15' },
  T02: { eta: '18-24', tattici: '2', giochi: '3', dispositivo: 'telefono', minuti: '30', intento: 'b', acqua: 'c', risonanza: 'a', anello: 'nonso', corruzione: 'a', obiettivi: '4', difficolta: '4', divertimento: '4', voglia: '4', campo: '3', creature: '3', interfaccia: '3', fumetti: 'dipende', suono: 'manca', bello: 'Il Grumo che non si sposta: ho dovuto ripensare tutto.', frustrante: 'Su telefono i pulsanti in basso sono piccoli.', confuso: 'Non ho notato l\'anello rosso.', ricorda: 'XCOM', cambiare: 'La musica.', nps: '8', wishlist: 'forse', prezzo: '5-10' },
  T03: { eta: '35-44', tattici: '0', giochi: '1', dispositivo: 'telefono', minuti: '20', intento: 'a', acqua: 'c', risonanza: 'nonso', anello: 'nonso', corruzione: 'nonso', obiettivi: '2', difficolta: '5', divertimento: '2', voglia: '2', campo: '2', creature: '3', interfaccia: '2', fumetti: 'salto', suono: 'nonsentito', bello: 'Le tavole a fumetti, belle.', frustrante: 'Non capivo cosa fare nella prima missione.', confuso: 'Tutto: cosa significano le caselle rosse?', ricorda: 'niente', cambiare: 'Spiegare meglio all\'inizio.', nps: '4', wishlist: 'no', prezzo: 'nonacquisto' },
  T04: { eta: '25-34', tattici: '2', giochi: '2', dispositivo: 'computer', minuti: '40', intento: 'b', acqua: 'c', risonanza: 'b', anello: 'd', corruzione: 'b', obiettivi: '4', difficolta: '3', divertimento: '4', voglia: '5', campo: '4', creature: '5', interfaccia: '4', fumetti: 'leggo', suono: 'ok', bello: 'Chiudere il rift all\'ultimo round.', frustrante: 'Perdere un mech per una spinta che non avevo previsto.', confuso: 'Niente di grave.', ricorda: 'Into the Breach', cambiare: 'Più varietà di mappe.', nps: '9', wishlist: 'si', prezzo: '15-20' },
  T05: { eta: '45+', tattici: '1', giochi: '1', dispositivo: 'tablet', minuti: '25', intento: 'b', acqua: 'b', risonanza: 'nonso', anello: 'nonso', corruzione: 'a', obiettivi: '3', difficolta: '4', divertimento: '3', voglia: '3', campo: '3', creature: '2', interfaccia: '3', fumetti: 'dipende', suono: 'ok', bello: 'Quando ho capito le spinte.', frustrante: 'Le creature viola si confondono.', confuso: 'Vorn e Neris sembrano uguali.', ricorda: 'Advance Wars', cambiare: 'Colori più diversi per le creature.', nps: '6', wishlist: 'forse', prezzo: '5-10' },
  T06: { eta: '18-24', tattici: '3', giochi: '3', dispositivo: 'computer', minuti: '60', intento: 'b', acqua: 'c', risonanza: 'b', anello: 'd', corruzione: 'a', obiettivi: '5', difficolta: '2', divertimento: '4', voglia: '4', campo: '5', creature: '4', interfaccia: '4', fumetti: 'salto', suono: 'manca', bello: 'La corruzione che cresce se ignori un nodo: tensione vera.', frustrante: 'Troppo facile dopo le prime missioni.', confuso: '', ricorda: 'Into the Breach', cambiare: 'Più difficoltà.', nps: '10', wishlist: 'si', prezzo: '10-15' }
};
// partite del diario: [codice, data, id, nome, esito, motivo, round, max, mech, nemesi, escalation, giudizio]
const DIARIO = [
  ['T01', '2026-11-02 18:10', 'm1', 'AVAMPOSTO KILO', 'vittoria', null, 3, 6, '3/3', 'dormiente', 0, 'GIUSTA'],
  ['T01', '2026-11-02 18:22', 'm2', 'DIGA SVANIR', 'sconfitta', 'relay', 4, 5, '2/3', 'liv 0', 1.5, 'DURA'],
  ['T01', '2026-11-02 18:35', 'm2', 'DIGA SVANIR', 'vittoria', null, 5, 5, '3/3', 'liv 0', 1.5, 'GIUSTA'],
  ['T02', '2026-11-02 19:00', 'm1', 'AVAMPOSTO KILO', 'vittoria', null, 4, 6, '3/3', 'dormiente', 0, 'GIUSTA'],
  ['T02', '2026-11-02 19:12', 'm3', 'FENDITURA NOX', 'ritirata', null, 5, 7, '1/3', 'liv 0', 1.5, 'DURA'],
  ['T03', '2026-11-03 10:00', 'm1', 'AVAMPOSTO KILO', 'sconfitta', 'wipe', 5, 6, '0/3', 'dormiente', 0, 'DURA'],
  ['T04', '2026-11-03 17:00', 'm1', 'AVAMPOSTO KILO', 'vittoria', null, 3, 6, '3/3', 'dormiente', 0, 'FACILE'],
  ['T04', '2026-11-03 17:11', 'm2', 'DIGA SVANIR', 'vittoria', null, 4, 5, '3/3', 'liv 0', 1.5, 'GIUSTA'],
  ['T04', '2026-11-03 17:25', 'm3', 'FENDITURA NOX', 'vittoria', null, 6, 7, '2/3', 'liv 0', 3, 'GIUSTA']
];
const RAPPORTI = ['T01', 'T02', 'T03', 'T04'];
function questionario(c, build) {
  const r = RISP[c]; const L = ['=== QUESTIONARIO FRACTURE PROTOCOL v1 ===', 'build: ' + (build || '0.23.0'), 'data: 2026-11-03T20:00', 'q.codice: ' + c];
  ['eta', 'tattici', 'giochi', 'dispositivo', 'minuti', 'intento', 'acqua', 'risonanza', 'anello', 'corruzione', 'obiettivi', 'difficolta', 'divertimento', 'voglia', 'campo', 'creature', 'interfaccia', 'fumetti', 'suono', 'bello', 'frustrante', 'confuso', 'ricorda', 'cambiare', 'nps', 'wishlist', 'prezzo']
    .forEach(k => { if (r[k] !== undefined && r[k] !== '') L.push('q.' + k + ': ' + r[k]); });
  L.push('=== FINE ==='); return L.join('\n') + '\n';
}
function rapporto(c, build) {
  const righe = DIARIO.filter(d => d[0] === c).map(d => `${d[1]} · ${d[2]} ${d[3]} · ${d[4]}${d[5] ? ' (' + d[5] + ')' : ''} · round ${d[6]}/${d[7]} · mech ${d[8]} · nemesi ${d[9]} · escalation ${d[10]}${d[11] ? ' · giudizio: ' + d[11] : ''}`);
  const sch = RISP[c].dispositivo === 'telefono' ? '390×844' : RISP[c].dispositivo === 'tablet' ? '820×1180' : '1440×900';
  return ['FRACTURE PROTOCOL — RAPPORTO DI PROVA', 'build: ' + (build || '0.23.0') + ' · 2026-11-03T20:00:00.000Z', 'dispositivo: sintetico', 'schermo: ' + sch + ' @2 · ' + (RISP[c].dispositivo === 'computer' ? 'mouse/tastiera' : 'touch') + ' · lingua it-IT',
    'impostazioni: testo 100% · suono sì volume 85 · animazioni sì', 'campagna: slot 1 · SETTORE CASSANDRA · nodi contenuti 2/23 · frammenti 300 · risonanza 20 · nemesi dormiente · escalation 1.5', '', 'DIARIO (ultime 30 missioni):', righe.join('\n'), '', 'COSA È SUCCESSO / COSA TI ASPETTAVI:', ''].join('\n') + '\n';
}
module.exports = { RISP, DIARIO, RAPPORTI, questionario, rapporto };
if (require.main === module) {
  const dir = path.join(__dirname, 'esempi'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'LEGGIMI.txt'), 'DATI SINTETICI: persone, risposte e partite inventate per provare gli strumenti.\nNon sono risultati di una prova.\n\nProva:  node tools/prova/aggrega.js tools/prova/esempi\n');
  for (const c of Object.keys(RISP)) fs.writeFileSync(path.join(dir, c + '-questionario.txt'), questionario(c));
  for (const c of RAPPORTI) fs.writeFileSync(path.join(dir, c + '-rapporto.txt'), rapporto(c));
  console.log('scritti', Object.keys(RISP).length + RAPPORTI.length, 'file in', path.relative(process.cwd(), dir));
}
