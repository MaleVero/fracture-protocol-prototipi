// Controllo di rilascio: parte dall'indice della radice, come un visitatore, e verifica che
// ogni build elencata si apra, che i dati dell'indice coincidano con build.json e con il file,
// che il gioco non chieda nulla alla rete e che non ci siano errori.
//   node rilascio.js
const C = require('./common'); const { chromium } = C.pw; const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '../..');
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = [], reqs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('request', r => { if (!r.url().startsWith('file://') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
  p.on('requestfailed', r => bad.push(r.url()));
  await p.goto('file://' + path.join(root, 'index.html')); await p.waitForTimeout(500);
  const voci = await p.evaluate(() => [...document.querySelectorAll('a.build')].map(a => ({
    href: a.getAttribute('href'), ultima: a.classList.contains('ultima'), data: a.querySelector('.data').textContent, titolo: a.querySelector('.titolo').textContent,
    meta: a.querySelector('.meta').textContent.replace(/\s+/g, ' '), cambia: [...a.querySelectorAll('.cambia li')].map(l => l.textContent), ord: a.querySelector('.ord').textContent })));
  check('l\'indice elenca 2 build, una sola «ultima»', voci.length === 2 && voci.filter(v => v.ultima).length === 1, voci.map(v => v.href + (v.ultima ? ' (ultima)' : '')));
  check('l\'ultima e\' anche la piu\' recente per data della cartella', voci.find(v => v.ultima).href === 'builds/' + fs.readdirSync(path.join(root, 'builds')).filter(d => d.startsWith('v')).sort().pop() + '/index.html');
  const mesi = { gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12 };
  for (const v of voci) {
    const dir = path.join(root, path.dirname(v.href)); const bj = JSON.parse(fs.readFileSync(path.join(dir, 'build.json'), 'utf8'));
    const m = v.data.match(/(\d+) (\w+) (\d+)/); const iso = `${m[3]}-${String(mesi[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    const kb = Math.round(fs.statSync(path.join(root, v.href)).size / 1024);
    const nome = path.basename(dir);
    const ok = bj.titolo === v.titolo && bj.data === iso && v.meta.startsWith(bj.versione) && JSON.stringify(bj.cambia) === JSON.stringify(v.cambia);
    check(`${nome}: indice = build.json (versione, data, titolo, novita')`, ok, ok ? `${bj.versione} · ${bj.data}` : { bj: [bj.versione, bj.data, bj.titolo], indice: [v.meta, iso, v.titolo] });
    if (v.ultima) check(`${nome}: dimensione dichiarata ${v.meta.match(/(\d+) KB/)[1]} KB = file ${kb} KB`, Math.abs(kb - +v.meta.match(/(\d+) KB/)[1]) <= 1);
    check(`${nome}: la data della cartella coincide`, nome === 'v' + iso || nome === 'v' + bj.data);
  }
  // ogni link si apre e il gioco parte
  for (const v of voci) {
    await p.goto('file://' + path.join(root, 'index.html')); await p.click(`a.build[href="${v.href}"]`); await p.waitForLoadState('load'); await p.waitForTimeout(900);
    const r = await p.evaluate(() => ({ titolo: document.title, schermata: document.querySelector('.screen.active') && document.querySelector('.screen.active').id, voci: document.querySelectorAll('#menulist .mitem').length, footer: (document.querySelector('#menu .footer') || {}).textContent || '', missioni: typeof MISSIONS !== 'undefined' ? MISSIONS.length : 0 }));
    check(`${path.basename(path.dirname(v.href))}: si apre dal link e mostra il menu`, r.schermata === 'menu' && r.voci >= 7, r);
  }
  const ult = voci.find(v => v.ultima);
  await p.goto('file://' + path.join(root, ult.href)); await p.waitForTimeout(800);
  const gioco = await p.evaluate(() => ({ footer: document.querySelector('#menu .footer').textContent.replace(/\s+/g, ' '), settori: SECTORS.map(s => s.id).join(','), missioni: MISSIONS.length, neris: !!KDEF.neris }));
  check('l\'ultima build ha 3 settori, 23 missioni e il NERIS', gioco.settori === 'cassandra,orvat,tarsis' && gioco.missioni === 23 && gioco.neris, gioco);
  check('la versione nel gioco coincide con quella dell\'indice', gioco.footer.includes(ult.meta.split(' ')[0]), gioco.footer);
  check('nessuna richiesta di rete (file autonomo)', reqs.length === 0 && bad.length === 0, reqs.concat(bad));
  check('nessun errore JavaScript o di console', errs.length === 0, errs);
  const html = fs.readFileSync(path.join(root, ult.href), 'utf8');
  check('nessuno script o stile esterno', !/<script[^>]+src=|<link[^>]+href=["']https?:|@import\s+url\(["']?https?:/.test(html));
  check('viewport senza blocco dello zoom', /name="viewport"[^>]*width=device-width/.test(html) && !/user-scalable=no|maximum-scale=1/.test(html));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
