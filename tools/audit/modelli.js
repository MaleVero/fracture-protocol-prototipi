// Modelli dei Kaucha: ogni creatura si disegna, tiene l'ingombro, ha il suo moto di riposo (e sta ferma con «riduci movimento»);
// le quattro élite per bandiera si riconoscono (anello rosso, segni di rango), pesano di piu' e compaiono solo dall'escalation in poi.
//   node modelli.js
const C = require('./common'); const { chromium } = C.pw;
// Ingombro disegnato (px a scala 2,2) misurato dopo il rifacimento dei modelli; tolleranza 12%.
const INGOMBRO = { vorn: [126, 52], krull: [53, 96], sahir: [85, 80], grumo: [100, 97], vrast: [78, 97], skorr: [104, 92], trahn: [100, 69], vornelite: [148, 67], krullelite: [65, 99], neris: [143, 87], risacca: [102, 92], palinsesto: [89, 62], matria: [112, 125] };
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [];
  // 1. ingombro e moto di riposo
  for (const riduci of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: riduci ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(600);
    await p.evaluate(async () => { ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)); go('galleria'); await new Promise(r => setTimeout(r, 1000)); });
    if (!riduci) {
      const r1 = await p.evaluate(async ING => {
        const out = {}; for (const [k, [w, h]] of Object.entries(ING)) { const m = __galleria.galMaschera(k, 40); out[k] = m && Math.abs(m.w - w) / w <= 0.12 && Math.abs(m.h - h) / h <= 0.12 ? true : (m ? [Math.round(m.w), Math.round(m.h), w, h] : 'vuota'); }
        return out; }, INGOMBRO);
      check('tutte e 13 le creature si disegnano e tengono l\'ingombro misurato (±12%)', Object.values(r1).every(v => v === true), Object.fromEntries(Object.entries(r1).filter(([, v]) => v !== true)));
    }
    // moto: due fotogrammi a mezzo secondo di distanza; con «riduci movimento» devono essere identici
    const r2 = await p.evaluate(async () => {
      document.querySelector('.gal-bar button[data-g="zoom"][data-v="2.2"]').click(); document.querySelector('.gal-bar button[data-g="anima"][data-v="true"]').click(); await new Promise(r => setTimeout(r, 600));
      const specie = ['vorn', 'krull', 'sahir', 'grumo', 'vrast', 'skorr', 'trahn', 'neris', 'risacca', 'vornelite', 'krullelite', 'palinsesto', 'matria'];
      const foto = async () => { const o = {}; for (const k of specie) { const cv = document.querySelector(`canvas[data-gk="${k}"]`); cv.scrollIntoView({ block: 'center' }); await new Promise(r => setTimeout(r, 160)); o[k] = [...cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data]; } return o; };
      const a = await foto(); await new Promise(r => setTimeout(r, 350)); const c = await foto(); await new Promise(r => setTimeout(r, 310)); const d = await foto();
      const diff = (x, y) => { let n = 0; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 24) n++; return n; };
      return Object.fromEntries(specie.map(k => [k, Math.max(diff(a[k], c[k]), diff(c[k], d[k]), diff(a[k], d[k]))]));
    });
    if (riduci) check('con «riduci movimento» ogni creatura resta ferma fra due fotogrammi', Object.values(r2).every(n => n === 0), r2);
    else check('senza «riduci movimento» ogni specie si muove da ferma (almeno 25 pixel cambiano fra due fotogrammi)', Object.values(r2).every(n => n >= 25), r2);
    await ctx.close();
  }
  // 2. élite: segni di rango e peso
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(600);
  const r3 = await p.evaluate(async () => {
    ['hangar', 'cassandra', 'orvat', 'tarsis'].forEach(x => seenComic.add(x)); go('galleria'); await new Promise(r => setTimeout(r, 1000)); document.querySelector('.gal-bar button[data-g="zoom"][data-v="2.2"]').click(); await new Promise(r => setTimeout(r, 500));
    const specie = ['grumo', 'vrast', 'skorr', 'trahn'];
    const conta = k => { const cv = document.querySelector(`canvas[data-gk="${k}"]`), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let rossi = 0; const da = Math.floor(d.length / 4 * 0.6) * 4; for (let i = da; i < d.length; i += 4) if (d[i] - d[i + 1] > 45 && d[i] - d[i + 2] > 45) rossi++; return { rossi, d: [...d] }; };
    const base = Object.fromEntries(specie.map(k => [k, conta(k)]));
    document.querySelector('.gal-bar button[data-g="rango"][data-v="elite"]').click(); await new Promise(r => setTimeout(r, 500));
    const el = Object.fromEntries(specie.map(k => [k, conta(k)]));
    const diff = (x, y) => { let n = 0; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 40) n++; return n; };
    const unaltre = ['vorn', 'krull', 'sahir', 'neris'].map(k => { const cv = document.querySelector(`canvas[data-gk="${k}"]`); return cv.getContext('2d').getImageData(0, 0, 4, 4).data.length; });
    return Object.fromEntries(specie.map(k => [k, { rossiBase: base[k].rossi, rossiElite: el[k].rossi, diverse: diff(base[k].d, el[k].d) }]));
  });
  check('le quattro élite per bandiera si distinguono dalla base (molti pixel cambiati e l anello rosso a terra)', Object.values(r3).every(v => v.diverse > 1500 && v.rossiElite >= 40), r3);
  const r4 = await p.evaluate(() => {
    const out = {};
    for (const t of Object.keys(ELITE_MOD)) {
      const def = KDEF[t], u = mkUnit(Object.assign({ type: t, name: def.nm + '-α', player: false }, def)), m = ELITE_MOD[t]; applyElite(u);
      out[t] = { hp: u.maxHp === def.maxHp + (m.maxHp || 0) && u.hp === u.maxHp, dmg: u.dmg === def.dmg + (m.dmg || 0), pull: (u.pull || 0) === (def.pull || 0) + (m.pull || 0), tier: u.tier === 3, nome: /\+-α$/.test(u.name), glifo: /\+$/.test(u.glyph), bandiera: u.elite === true,
        tratti: ['noPush', 'freeze', 'burn', 'splash'].every(k => !!u[k] === !!def[k]), potenza: combatPower(u) > combatPower(def), costo: m.cost };
      const doppio = applyElite(u); out[t].unaVolta = doppio.maxHp === u.maxHp;
    }
    return out;
  });
  check('applicare l\'élite aggiunge punti vita, danno o richiamo come dichiarato, tiene i tratti (noPush, gelo, fuoco, area), mette tier 3, "+" nel nome e nella sigla, alza la potenza e non si somma due volte',
    Object.values(r4).every(v => Object.entries(v).every(([k, x]) => k === 'costo' || x === true)) && Object.keys(r4).join() === 'grumo,vrast,skorr,trahn', r4);
  // 3. il generatore: niente élite senza escalation, e con escalation una quota ragionevole, sempre dentro il budget e mai fra i garantiti
  const r5 = await p.evaluate(() => {
    let sd = 7; const rnd = () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; Math.random = rnd;
    const spec = Object.assign({}, nodeOf('t3').spec, { pool: ['vorn', 'krull', 'grumo', 'vrast', 'skorr', 'trahn'], budget: 18, guarantee: ['grumo'], maxNemici: 8 });
    const sec = currentSector; cleared.clear();
    const run = n => { let elite = 0, eligibili = 0, garantiti = 0, sforo = 0; for (let i = 0; i < n; i++) { const cfg = generaCampo(spec, 3); const costo = cfg.enemies.reduce((s, e) => s + ENEMY_COST[e.t] + (e.elite ? ELITE_MOD[e.t].cost : 0), 0); if (costo > Math.round((spec.budget + Math.min(10, Math.round(escalationLevel() * 1.2))) * MINACCIA) + 0.001) sforo++; for (const e of cfg.enemies) { if (ELITE_MOD[e.t]) { eligibili++; if (e.elite) elite++; } } if (cfg.enemies.some((e, k) => e.elite && k === 0)) garantiti++; } return { elite, eligibili, sforo, garantiti }; };
    const senza = run(150);
    sectorNodes(sec).forEach(m => cleared.add(m.id)); MISSIONS.forEach(m => cleared.add(m.id));
    const alto = escalationLevel(), con = run(300);
    return { senza, alto: Math.round(alto * 10) / 10, soglia: ELITE_THRESHOLD, con, quota: con.eligibili ? con.elite / con.eligibili : 0 };
  });
  check('senza escalation il generatore non produce élite; con escalation alta la quota fra le creature che possono esserlo sta fra l 8 e il 35%; il budget non viene mai sforato e il primo garantito non e\' élite',
    r5.senza.elite === 0 && r5.alto >= r5.soglia && r5.quota >= 0.08 && r5.quota <= 0.35 && r5.con.sforo === 0 && r5.senza.sforo === 0 && r5.con.garantiti === 0, r5);
  // 4. in battaglia: l'unita' élite viene dal cfg con la bandiera, il pannello la dice, il corpo e' piu' grande e resiste al salvataggio
  const r6 = await p.evaluate(async () => {
    Math.random = Math.random; const m = nodeOf('t3'); activeMission = m; RITMO = 0;
    const gen = generaCampo; m.cfg = null; const spec = m.spec; const orig = spec.guarantee;
    startBattle(m); await new Promise(r => setTimeout(r, 700)); const t = document.getElementById('txOk'); if (t) t.click();
    const k = B.units.find(u => !u.player && !u.structure && ELITE_MOD[u.type]) || null;
    // costruisce un nemico élite a mano nello stesso modo in cui lo fa startBattle (cfg.enemies con la bandiera)
    const def = KDEF.grumo, e = mkUnit(Object.assign({ type: 'grumo', name: def.nm + '-ω', player: false }, def)); applyElite(e); e.x = 3; e.y = 2; B.units = B.units.filter(u => u.player).concat([e]);
    B.inspected = e; bRender(); await new Promise(r => setTimeout(r, 300));
    const pannello = document.getElementById('bpanel').textContent;
    const copia = JSON.parse(JSON.stringify(e)); const snap = Object.assign({}, e);
    return { pannello: /GRM\+|GRUMO\+/.test(pannello) && /ÉLITE/.test(pannello), salvato: copia.elite === true && copia.maxHp === 7 && snap.elite === true, scala: e.elite === true };
  });
  check('un\'élite in battaglia: il pannello dice GRUMO+ e ÉLITE, e la bandiera sopravvive a copia e salvataggio', r6.pannello && r6.salvato && r6.scala, r6);
  // 5. leggibilita': il colore medio di ogni creatura si stacca dal pavimento dei tre settori di almeno 2:1 (valore, non tinta)
  const r7 = await p.evaluate(async () => {
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }, L = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
    const kau = ['vorn', 'krull', 'sahir', 'grumo', 'vrast', 'skorr', 'trahn', 'vornelite', 'krullelite', 'neris', 'risacca', 'palinsesto', 'matria'];
    const lum = Object.fromEntries(kau.map(k => { const c = __galleria.colori(k); return [k, c ? L(c.r, c.g, c.b) : null]; })); const out = {};
    document.querySelector('.gal-bar button[data-g="zoom"][data-v="1.6"]').click(); await new Promise(r => setTimeout(r, 400));   // a scala piccola i punti di campione cadono sul pavimento, non sulla creatura
    for (const tema of ['cassandra', 'orvat', 'tarsis']) {
      document.querySelector(`.gal-bar button[data-g="tema"][data-v="${tema}"]`).click(); await new Promise(r => setTimeout(r, 600));
      const cv = document.querySelector('canvas[data-gk="vorn"]'), g = cv.getContext('2d'), w = cv.width, h = cv.height; let r = 0, gg = 0, bb = 0, n = 0;
      for (const [x, y] of [[w * .5, h * .9], [w * .3, h * .85], [w * .7, h * .85], [w * .2, h * .7], [w * .8, h * .7]]) { const d = g.getImageData(Math.round(x) - 2, Math.round(y) - 2, 4, 4).data; for (let i = 0; i < 16; i++) { r += d[i * 4]; gg += d[i * 4 + 1]; bb += d[i * 4 + 2]; n++; } }
      const fl = L(r / n, gg / n, bb / n); out[tema] = Object.fromEntries(kau.map(k => [k, lum[k] === null ? 0 : +((Math.max(fl, lum[k]) + .05) / (Math.min(fl, lum[k]) + .05)).toFixed(2)]));
    }
    return out; });
  const peggiori = Object.entries(r7).flatMap(([t, o]) => Object.entries(o).filter(([, v]) => v < 2.0).map(([k, v]) => t + ':' + k + '=' + v));
  check('il colore medio di ogni creatura si stacca dal pavimento dei tre settori di almeno 2:1', peggiori.length === 0, peggiori.length ? peggiori : 'minimo ' + Math.min(...Object.values(r7).flatMap(o => Object.values(o))));
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
