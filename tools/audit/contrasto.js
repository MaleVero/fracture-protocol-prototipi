// Contrasto del testo: ogni testo visibile sulle schermate principali ha almeno 4,5:1 con lo sfondo (WCAG AA). Il colore «attenuato» del gioco
// era a 3,4–4,3:1 quasi ovunque; ora e' piu' chiaro. Esclusa la scheda segnaposto «VAULT — IN SVILUPPO» (decorazione spenta di proposito).
// Lo sfondo e' stimato con i colori di fondo piu' vicini (i gradienti non si leggono): e' una misura per eccesso di prudenza, non una certificazione.
//   node contrasto.js
const C = require('./common'); const { chromium } = C.pw;
(async () => {
  let fail = 0; const check = (k, ok, x) => { if (!ok) fail++; console.log((ok ? '✓ ' : '✗ ') + k, x === undefined ? '' : (typeof x === 'string' ? x : JSON.stringify(x))); };
  const b = await chromium.launch({ executablePath: C.chromium }); const errs = [];
  for (const [w, h] of [[390, 844], [1000, 700]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, reducedMotion: 'reduce' })).newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(C.URL); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {for(const s of SECTORS)s.locked=false;['hangar','cassandra','orvat','tarsis','palinsesto','guardiano'].forEach(x=>seenComic.add(x));RITMO=0;frammenti=420;sigilli=5;samples.bio=14;risonanza=58;['m1','m2','m3'].forEach(id=>cleared.add(id));['vorn','krull','sahir'].forEach(t=>codexSeen.add(t));nemesis.awake=true;nemesis.level=2;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const a=m[1].split(',').map(x=>parseFloat(x));return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}};
const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const bgOf=el=>{let acc=null;const layers=[];for(let e=el;e;e=e.parentElement){const c=parse(getComputedStyle(e).backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=.98)break;}}
 let base={r:8,g:11,b:15};for(let i=layers.length-1;i>=0;i--){const c=layers[i];base={r:c.r*c.a+base.r*(1-c.a),g:c.g*c.a+base.g*(1-c.a),b:c.b*c.a+base.b*(1-c.a)};}return base;};
const fg=(el,bg)=>{const c=parse(getComputedStyle(el).color);const a=c.a;return {r:c.r*a+bg.r*(1-a),g:c.g*a+bg.g*(1-a),b:c.b*a+bg.b*(1-a)}};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const prep={menu:()=>buildMenu(),missioni:()=>{renderCorruptionUI();buildMap();},hangar:()=>{activeMission=null;renderHangar();},codice:()=>renderCodex(),protocolli:()=>renderProtocols(),ricerca:()=>renderResearch(),comando:()=>renderComando(),opzioni:()=>renderOpzioni()};
const res={};
for(const id of Object.keys(prep)){prep[id]();go(id);await wait(400);const bad={};
 for(const e of document.getElementById(id).querySelectorAll('*')){if(e.children.length)continue;const t=(e.textContent||'').trim();if(!t)continue;const r=e.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')continue;
  let op=1;for(let x=e;x;x=x.parentElement)op*=parseFloat(getComputedStyle(x).opacity);if(op<.99)continue;
  const bg=bgOf(e),f=fg(e,bg),cr=ratio(f,bg);if(cr<4.5&&!e.closest('.stub')){const k=cs.color+' on '+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b);bad[k]=bad[k]||{n:0,r:cr.toFixed(2),ex:t.slice(0,18)};bad[k].n++;}}
 res[id]=bad;}
return res; });
    for (const [id, bad] of Object.entries(r)) { const peggiori = Object.entries(bad).map(([k, v]) => k + ' ' + v.r + ' «' + v.ex + '» ×' + v.n); check(`${w}×${h} ${id}: tutto il testo visibile ha contrasto ≥ 4,5:1`, peggiori.length === 0, peggiori); }
  }
  check('nessun errore JavaScript', errs.length === 0, errs.slice(0, 3));
  console.log(fail ? `\n${fail} CONTROLLI FALLITI` : '\ntutti i controlli passati');
  await b.close(); process.exit(fail ? 1 : 0);
})();
