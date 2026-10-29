// Costruisce il pacchetto da dare ai tester: una cartella (e un .zip) che si carica ovunque ci sia hosting statico
// (GitHub Pages, Netlify Drop, itch.io come HTML5) e funziona anche aperta da file. Niente rete, niente account.
//   node tools/prova/pacchetto.js [--out cartella]
// Contenuto:  index.html (la pagina «Come provarlo»)  gioco.html (il gioco)  questionario.html  LEGGIMI.txt
const fs = require('fs'), path = require('path'), cp = require('child_process');
const radice = path.join(__dirname, '..', '..');
const i = process.argv.indexOf('--out');
const out = i > 0 ? path.resolve(process.argv[i + 1]) : path.join(radice, 'tools', 'audit', 'out', 'pacchetto');
const build = JSON.parse(fs.readFileSync(path.join(radice, 'builds', 'v2026-10-26', 'build.json'), 'utf8'));
const leggi = (...p) => fs.readFileSync(path.join(radice, ...p), 'utf8');
function sostituisci(testo, da, a, quante) {
  const n = testo.split(da).length - 1;
  if (quante !== undefined && n !== quante) throw new Error(`atteso ${quante} × ${da}, trovato ${n}`);
  return testo.split(da).join(a);
}
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });

let pagina = leggi('provare.html');
pagina = sostituisci(pagina, 'href="builds/v2026-10-26/index.html"', 'href="gioco.html"', 1);
pagina = sostituisci(pagina, 'href="prova/questionario.html"', 'href="questionario.html"', 1);
pagina = pagina.replace(/\s*<p><a href="index\.html">&larr; tutte le build<\/a><\/p>/, '');
fs.writeFileSync(path.join(out, 'index.html'), pagina);

let gioco = leggi('builds', 'v2026-10-26', 'index.html');
gioco = sostituisci(gioco, 'href="../../provare.html"', 'href="index.html"', 1);
gioco = sostituisci(gioco, 'href="../../prova/questionario.html"', 'href="questionario.html"', 1);
fs.writeFileSync(path.join(out, 'gioco.html'), gioco);

let q = leggi('prova', 'questionario.html');
q = sostituisci(q, 'href="../provare.html"', 'href="index.html"', 1);
fs.writeFileSync(path.join(out, 'questionario.html'), q);

fs.writeFileSync(path.join(out, 'LEGGIMI.txt'), `FRACTURE PROTOCOL — pacchetto per la prova (build ${build.versione})

Tre file, nessuna dipendenza, nessuna connessione:
  index.html          la pagina «Come provarlo» (da qui si apre tutto)
  gioco.html          il gioco
  questionario.html   il questionario di fine prova

Per metterlo online (a scelta, tutti gratuiti):
  - Netlify Drop: trascina QUESTA cartella su https://app.netlify.com/drop e ottieni un indirizzo da mandare.
  - itch.io: crea un progetto «HTML», carica il .zip, spunta «This file will be played in the browser», metti la visibilità su
    «Restricted» (con password) e manda il link.
  - GitHub Pages: vedi prova/05-distribuzione.md nel repository.
Il link da mandare e' quello della cartella (si apre index.html).

Non aprire i file direttamente da una chat o da un'app di posta sul telefono: serve un indirizzo web (o un browser vero).
`);

// zip (con il comando di sistema se c'e', altrimenti con python)
const zip = out + '.zip'; fs.rmSync(zip, { force: true });
try { cp.execFileSync('zip', ['-qr', zip, '.'], { cwd: out }); }
catch (e) { cp.execFileSync('python3', ['-c', 'import shutil,sys;shutil.make_archive(sys.argv[1][:-4],"zip",sys.argv[2])', zip, out]); }
const kb = f => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
console.log('pacchetto in ' + path.relative(radice, out) + ': ' + fs.readdirSync(out).map(f => f + ' ' + kb(path.join(out, f))).join(', '));
console.log('zip: ' + path.relative(radice, zip) + ' ' + kb(zip));
