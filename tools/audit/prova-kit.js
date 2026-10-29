// Il materiale per la prova con persone: il questionario si compila e si copia, l'aggregatore legge cio' che produce (e il rapporto del gioco),
// i numeri tornano con un calcolo indipendente, il pacchetto si apre da file e i documenti non hanno collegamenti rotti.
//   node prova-kit.js
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const C = require('./common'); const { chromium } = C.pw;
const radice = path.join(__dirname, '..', '..');
const spec = JSON.parse(fs.readFileSync(path.join(radice, 'tools', 'prova', 'spec.json'), 'utf8'));
const E = require(path.join(radice, 'tools', 'prova', 'esempi.js'));
const { aggrega, markdown, wilson } = require(path.join(radice, 'tools', 'prova', 'aggrega.js'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-kit-'));
let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
const scrivi = (dir, nome, t) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, nome), t); };
const eq = (a, b) => Math.abs(a - b) < 1e-9;

(async () => {
  // ── 1. la specifica e' coerente
  const tutte = spec.sezioni.flatMap(s => s.domande); const ids = tutte.map(d => d.id);
  const comp = spec.sezioni.find(s => s.id === 'comp').domande;
  check('le domande hanno id unici, le scale hanno min < max, ogni domanda di comprensione ha una risposta corretta fra le opzioni e «non lo so»',
    new Set(ids).size === ids.length && tutte.filter(d => d.tipo === 'scala').every(d => d.min < d.max) && comp.every(d => d.opzioni.some(o => o[0] === d.corretta) && d.opzioni.some(o => o[0] === 'nonso')), { n: ids.length });
  const gen = cp.spawnSync('node', [path.join(radice, 'tools', 'prova', 'genera-questionario.js'), '--check'], { encoding: 'utf8' });
  check('prova/questionario.html e\' aggiornato rispetto a spec.json', gen.status === 0, gen.stderr.trim());

  // ── 2. l'aggregatore contro un calcolo indipendente
  const dir = path.join(tmp, 'esempi'); for (const c of Object.keys(E.RISP)) scrivi(dir, c + '-questionario.txt', E.questionario(c)); for (const c of E.RAPPORTI) scrivi(dir, c + '-rapporto.txt', E.rapporto(c));
  const files = fs.readdirSync(dir).map(f => path.join(dir, f));
  const R = aggrega(files); const cod = Object.keys(E.RISP), rs = cod.map(c => E.RISP[c]);
  check('conta persone, questionari, rapporti e partite', R.n.persone === 6 && R.n.questionari === 6 && R.n.rapporti === 4 && R.diario.partite === E.DIARIO.length, R.n);
  const compOk = comp.every(d => { const x = R.comprensione.domande[d.id], giuste = rs.filter(r => r[d.id] === d.corretta).length; return x.n === 6 && x.giuste === giuste && x.nonso === rs.filter(r => r[d.id] === 'nonso').length && eq(x.quota, giuste / 6); });
  const totGiuste = comp.reduce((s, d) => s + rs.filter(r => r[d.id] === d.corretta).length, 0);
  check('la comprensione per domanda e complessiva coincide col calcolo diretto', compOk && eq(R.comprensione.quotaComplessiva, totGiuste / 30), { complessiva: R.comprensione.quotaComplessiva, atteso: totGiuste / 30 });
  const mediaDiretta = k => rs.reduce((s, r) => s + +r[k], 0) / rs.length;
  check('medie delle scale (divertimento, voglia, difficolta, campo, creature) coincidono', ['divertimento', 'voglia', 'difficolta', 'campo', 'creature', 'interfaccia', 'obiettivi'].every(k => eq(R.esperienza[k].media, mediaDiretta(k))), Object.fromEntries(Object.entries(R.esperienza).map(([k, v]) => [k, +v.media.toFixed(2)])));
  const esp = rs.filter(r => +r.tattici >= 2), nov = rs.filter(r => +r.tattici <= 1);
  check('le medie degli esperti di tattici e dei novizi sono separate correttamente', eq(R.esperienza.divertimento.esperti, esp.reduce((s, r) => s + +r.divertimento, 0) / esp.length) && eq(R.esperienza.divertimento.novizi, nov.reduce((s, r) => s + +r.divertimento, 0) / nov.length), { esperti: esp.length, novizi: nov.length });
  const n = rs.map(r => +r.nps), nps = Math.round((n.filter(x => x >= 9).length - n.filter(x => x <= 6).length) / n.length * 100);
  check('NPS e wishlist coincidono col calcolo diretto', R.mercato.nps === nps && eq(R.mercato.wishlistSi, rs.filter(r => r.wishlist === 'si').length / 6) && R.mercato.prezzo['10-15'] === rs.filter(r => r.prezzo === '10-15').length, { nps, atteso: nps });
  const m1 = R.diario.missioni.find(m => m.id === 'm1');
  check('il diario: partite, vittorie e giudizi per missione; la prima missione di ciascuno', m1.n === E.DIARIO.filter(d => d[2] === 'm1').length && m1.vittorie === E.DIARIO.filter(d => d[2] === 'm1' && d[4] === 'vittoria').length && R.diario.primaMissione.vinte === 3 && R.diario.primaMissione.n === 4 && R.diario.giudizi.DURA === E.DIARIO.filter(d => d[11] === 'DURA').length, { m1, primaMissione: R.diario.primaMissione });
  const w = wilson(5, 6), w0 = wilson(0, 0), wTutti = wilson(6, 6);
  check('l\'intervallo di Wilson e\' quello noto (5 su 6: 44%–97%) e non esce da 0–1', Math.abs(w[0] - 0.4365) < 0.001 && Math.abs(w[1] - 0.9699) < 0.001 && w0[0] === 0 && w0[1] === 0 && wTutti[1] <= 1, [w, w0, wTutti]);
  // robustezza: duplicati, file misti, anonimi, rumore
  const dir2 = path.join(tmp, 'robusto'); for (const f of files) scrivi(dir2, path.basename(f), fs.readFileSync(f, 'utf8'));
  scrivi(dir2, 'T01-rapporto-bis.txt', E.rapporto('T01'));
  scrivi(dir2, 'T07-tutto.txt', E.questionario('T06').replace('q.codice: T06\n', '') + '\n' + E.rapporto('T04'));
  scrivi(dir2, 'mio.txt', E.questionario('T05').replace('q.codice: T05\n', ''));
  scrivi(dir2, 'rumore.txt', 'ciao a tutti\n=== QUESTIONARIO FRACTURE PROTOCOL v1 ===\nq.intento: b\nq.sconosciuta: x\nriga senza chiave\n=== FINE ===\n');
  scrivi(dir2, 'README.txt', 'non deve essere letto');
  const R2 = aggrega(fs.readdirSync(dir2).filter(f => f !== 'README.txt').map(f => path.join(dir2, f)));
  const T01 = R2.diario.perPersona.find(p => p.codice === 'T01');
  check('stesso rapporto in due file = una volta; un file con questionario e rapporto vale per una persona; senza codice nasce un anonimo; il rumore non fa crashare',
    T01.partite === 3 && R2.n.persone === 6 + 1 + 2 && R2.n.questionari === 6 + 1 + 1 + 1 && R2.diario.perPersona.some(p => p.codice === 'T07'), { persone: R2.n, t01: T01 });
  const md = markdown(R), md8 = markdown(Object.assign({}, R, { n: Object.assign({}, R.n, { persone: 9 }) }));
  check('il riepilogo ha il semaforo e dice «indicativi» sotto le 8 persone ma non sopra', /## Semaforo/.test(md) && /indicativi/.test(md) && !/indicativi/.test(md8) && /\| ✓ \||\| ~ \||\| ✗ \|/.test(md), md.split('\n').slice(0, 3).join(' '));
  const cli = cp.spawnSync('node', [path.join(radice, 'tools', 'prova', 'aggrega.js'), dir, '--json'], { encoding: 'utf8' }); let J = null; try { J = JSON.parse(cli.stdout); } catch (e) { }
  const vuota = cp.spawnSync('node', [path.join(radice, 'tools', 'prova', 'aggrega.js'), path.join(tmp, 'non-esiste-niente')], { encoding: 'utf8' });
  check('dalla riga di comando: --json restituisce i dati; un percorso che non esiste da\' un messaggio chiaro e uscita 2, non uno stack', J && J.n.persone === 6 && vuota.status === 2 && /non trovato/.test(vuota.stderr) && !/\n\s+at /.test(vuota.stderr), { json: !!J, uscita: vuota.status, errore: vuota.stderr.trim().slice(0, 80) });

  // ── 3. il questionario in un browser vero
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [], reqs = [];
  const ctxP = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  const pq = await ctxP.newPage(); pq.on('pageerror', e => errs.push(e.message)); pq.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) reqs.push(r.url()); });
  const URLQ = 'file://' + path.join(radice, 'prova', 'questionario.html');
  const compila = async (r, codice) => {
    await pq.goto(URLQ); await pq.waitForTimeout(150);
    await pq.fill('#q-codice', codice);
    for (const d of tutte) {
      if (d.id === 'codice' || r[d.id] === undefined || r[d.id] === '') continue;
      if (d.tipo === 'scelta' || d.tipo === 'scala') { const id = await pq.evaluate(([n, v]) => { const e = [...document.querySelectorAll(`input[name="q.${n}"]`)].find(x => x.value === v); return e ? e.id : null; }, [d.id, String(r[d.id])]); if (!id) throw new Error('opzione assente: ' + d.id + '=' + r[d.id]); await pq.click(`label[for="${id}"]`); }
      else await pq.fill('#q-' + d.id, String(r[d.id]));
    }
    return await pq.inputValue('#anteprima');
  };
  const dir3 = path.join(tmp, 'dalpagina');
  for (const c of cod) scrivi(dir3, c + '-questionario.txt', await compila(E.RISP[c], c));
  for (const c of E.RAPPORTI) scrivi(dir3, c + '-rapporto.txt', E.rapporto(c));
  const R3 = aggrega(fs.readdirSync(dir3).map(f => path.join(dir3, f)));
  const confronto = (a, bb) => eq(a.comprensione.quotaComplessiva, bb.comprensione.quotaComplessiva) && Object.keys(a.esperienza).every(k => eq(a.esperienza[k].media, bb.esperienza[k].media)) && a.mercato.nps === bb.mercato.nps && JSON.stringify(a.mercato.prezzo) === JSON.stringify(bb.mercato.prezzo) && JSON.stringify(a.profilo.eta) === JSON.stringify(bb.profilo.eta) && JSON.stringify(a.aperte) === JSON.stringify(bb.aperte);
  check('compilando il questionario nel browser per le 6 persone di prova e dando il testo all\'aggregatore si ottengono gli stessi numeri e le stesse frasi dei dati di partenza', confronto(R3, R), { complessiva: R3.comprensione.quotaComplessiva, nps: R3.mercato.nps });
  // anteprima: chiavi assenti, ritorni a capo, due punti
  await pq.goto(URLQ); await pq.waitForTimeout(100);
  const vuoto = await pq.inputValue('#anteprima');
  await pq.fill('#q-bello', 'riga uno\n\nriga: due'); const pe = await pq.inputValue('#anteprima');
  check('un questionario vuoto contiene solo l\'intestazione; il testo con ritorni a capo e due punti resta su una riga leggibile dall\'aggregatore', vuoto.split('\n').filter(l => l.startsWith('q.')).length === 0 && /q\.bello: riga uno riga: due/.test(pe) && /^=== QUESTIONARIO FRACTURE PROTOCOL v1 ===/.test(pe) && /=== FINE ===$/.test(pe), pe.split('\n').slice(-3));
  const rl = await pq.evaluate(() => { const bad = []; document.querySelectorAll('input[type=radio]').forEach(i => { if (!document.querySelector(`label[for="${i.id}"]`)) bad.push(i.id); }); document.querySelectorAll('input[type=text],input[type=number],textarea').forEach(i => { if (i.id !== 'anteprima' && !document.querySelector(`label[for="${i.id}"]`)) bad.push(i.id); }); return { senzaEtichetta: bad, fieldset: document.querySelectorAll('fieldset > legend').length }; });
  check('ogni risposta ha un\'etichetta collegata e ogni gruppo di scelta ha la sua legenda (lettori di schermo)', rl.senzaEtichetta.length === 0 && rl.fieldset >= tutte.filter(d => d.tipo === 'scelta' || d.tipo === 'scala').length, rl);
  await pq.click('#copia'); await pq.waitForTimeout(250);
  const clip = await pq.evaluate(() => navigator.clipboard.readText()); const prima = await pq.inputValue('#anteprima');
  const [dl] = await Promise.all([pq.waitForEvent('download'), pq.click('#scarica')]);
  check('«copia» mette nelle appunti esattamente l\'anteprima, «scarica» da\' un .txt datato', clip === prima && /^fracture-protocol-questionario-\d{4}-\d\d-\d\d\.txt$/.test(dl.suggestedFilename()), dl.suggestedFilename());
  for (const [w, h] of [[320, 568], [390, 844], [1000, 700]]) {
    const pg = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500 })).newPage(); await pg.goto(URLQ); await pg.waitForTimeout(200);
    const m = await pg.evaluate(() => { const piccoli = []; document.querySelectorAll('.o label, .s label, button, input[type=text], input[type=number], textarea').forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 0 && (r.height < 43.5 || (e.tagName === 'LABEL' && r.width < 43.5))) piccoli.push((e.id || e.textContent || e.tagName).toString().slice(0, 20) + ':' + Math.round(r.width) + 'x' + Math.round(r.height)); });
      return { ov: document.documentElement.scrollWidth > innerWidth, piccoli }; });
    check(`${w}×${h}: il questionario non ha scorrimento orizzontale e ogni controllo e' alto almeno 44 px`, !m.ov && m.piccoli.length === 0, m);
  }
  check('nessuna richiesta di rete e nessun errore JavaScript nel questionario', reqs.length === 0 && errs.length === 0, { reqs, errs: errs.slice(0, 3) });

  // ── 4. il pacchetto
  const out = path.join(tmp, 'pacchetto'); const pk = cp.spawnSync('node', [path.join(radice, 'tools', 'prova', 'pacchetto.js'), '--out', out], { encoding: 'utf8' });
  const att = ['index.html', 'gioco.html', 'questionario.html', 'LEGGIMI.txt'];
  const zipElenco = cp.spawnSync('python3', ['-c', 'import zipfile,sys;print("\\n".join(sorted(zipfile.ZipFile(sys.argv[1]).namelist())))', out + '.zip'], { encoding: 'utf8' }).stdout.trim().split('\n');
  check('il pacchetto ha i quattro file e lo zip li contiene tutti, sotto 1 MB', pk.status === 0 && att.every(f => fs.existsSync(path.join(out, f))) && att.every(f => zipElenco.includes(f)) && fs.statSync(out + '.zip').size < 1024 * 1024, { uscita: pk.status, zip: zipElenco });
  const testi = Object.fromEntries(att.map(f => [f, fs.readFileSync(path.join(out, f), 'utf8')]));
  check('nel pacchetto non restano collegamenti verso cartelle del repository (../, builds/, prova/)', !/href="\.\.\//.test(testi['index.html'] + testi['gioco.html'] + testi['questionario.html']) && !/href="builds\//.test(testi['index.html']) && !/href="prova\//.test(testi['index.html']), null);
  const pp = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage(); const e2 = [], r2 = []; pp.on('pageerror', e => e2.push(e.message)); pp.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) r2.push(r.url()); });
  await pp.goto('file://' + path.join(out, 'index.html')); await pp.waitForTimeout(200);
  await pp.click('a.vai[href="gioco.html"]'); await pp.waitForLoadState('load'); await pp.waitForTimeout(500);
  const gioco = await pp.evaluate(() => ({ titolo: document.title, schermata: document.querySelector('.screen.active') && document.querySelector('.screen.active').id, ver: typeof BUILD_VER !== 'undefined' ? BUILD_VER : null }));
  await pp.evaluate(() => { renderOpzioni(); go('opzioni'); }); await pp.waitForTimeout(250);
  const link = await pp.evaluate(() => [...document.querySelectorAll('.opt-info a')].map(a => a.getAttribute('href')));
  await pp.click('.opt-info a[href="questionario.html"]'); await pp.waitForLoadState('load'); await pp.waitForTimeout(200);
  const q2 = await pp.evaluate(() => ({ titolo: document.title, ritorno: document.querySelector('.nota a') && document.querySelector('.nota a').getAttribute('href') }));
  await pp.click('.nota a'); await pp.waitForLoadState('load');
  const finale = await pp.evaluate(() => document.title);
  check('dal pacchetto aperto da file: la pagina porta al gioco, il gioco ha i collegamenti a istruzioni e questionario, il questionario torna alle istruzioni, nessuna rete',
    /FRACTURE/i.test(gioco.titolo) && gioco.schermata === 'menu' && gioco.ver && link.join() === 'index.html,questionario.html' && /Questionario/.test(q2.titolo) && q2.ritorno === 'index.html' && /provarlo/i.test(finale) && r2.length === 0 && e2.length === 0, { gioco, link, q2, finale, e2, r2 });

  // ── 5. i documenti
  const docs = ['README.md', '01-piano.md', '02-inviti.md', '03-sessione-osservata.md', '04-scheda-osservazione.md', '05-distribuzione.md', '06-risultati.md'];
  const mancano = docs.filter(f => !fs.existsSync(path.join(radice, 'prova', f)));
  const rotti = []; docs.forEach(f => { const t = fs.existsSync(path.join(radice, 'prova', f)) ? fs.readFileSync(path.join(radice, 'prova', f), 'utf8') : ''; for (const m of t.matchAll(/\]\(([^)#]+?)(?:#[^)]*)?\)/g)) { const u = m[1]; if (/^(https?:|mailto:)/.test(u)) continue; if (!fs.existsSync(path.join(radice, 'prova', u))) rotti.push(f + ' → ' + u); } });
  const readme = fs.readFileSync(path.join(radice, 'prova', 'README.md'), 'utf8');
  check('i sette documenti ci sono, nessun collegamento interno e\' rotto e il README li elenca tutti', mancano.length === 0 && rotti.length === 0 && docs.slice(1).every(f => readme.includes(f)), { mancano, rotti });
  const tutti = docs.map(f => fs.readFileSync(path.join(radice, 'prova', f), 'utf8')).join('\n');
  check('nessun segnaposto dimenticato (TODO, XXX, lorem) e i comandi citati esistono', !/TODO|XXX|lorem/i.test(tutti) && ['tools/prova/aggrega.js', 'tools/prova/pacchetto.js', 'tools/prova/esempi'].every(p => fs.existsSync(path.join(radice, p))), null);
  const spesse = cp.spawnSync('node', [path.join(radice, 'tools', 'prova', 'aggrega.js'), path.join(radice, 'tools', 'prova', 'esempi')], { encoding: 'utf8' });
  check('l\'esempio promesso dal README (aggrega.js su tools/prova/esempi) funziona', spesse.status === 0 && /6 persone/.test(spesse.stdout), spesse.status);

  await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
