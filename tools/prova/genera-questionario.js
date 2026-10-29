// Genera prova/questionario.html da tools/prova/spec.json: una sola fonte per le domande, cosi' il modulo e l'aggregatore non possono divergere.
//   node genera-questionario.js          # scrive prova/questionario.html
//   node genera-questionario.js --check  # esce con 1 se il file non e' aggiornato
const fs = require('fs'), path = require('path');
const radice = path.join(__dirname, '..', '..');
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'spec.json'), 'utf8'));
const build = JSON.parse(fs.readFileSync(path.join(radice, 'builds', 'v2026-10-26', 'build.json'), 'utf8')).versione;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function domanda(d) {
  const nome = 'q.' + d.id, ids = nome.replace(/\./g, '-');
  const aiuto = d.aiuto ? `<p class="aiuto" id="${ids}-a">${esc(d.aiuto)}</p>` : '';
  const desc = d.aiuto ? ` aria-describedby="${ids}-a"` : '';
  let corpo = '';
  if (d.tipo === 'scelta') {
    corpo = `<div class="opz">` + d.opzioni.map(([v, t], i) => `<div class="o"><input type="radio" name="${nome}" id="${ids}-${i}" value="${esc(v)}"><label for="${ids}-${i}">${esc(t)}</label></div>`).join('') + `</div>`;
  } else if (d.tipo === 'scala') {
    const n = d.max - d.min + 1;
    corpo = `<div class="scala">` + Array.from({ length: n }, (_, i) => { const v = d.min + i; return `<div class="s"><input type="radio" name="${nome}" id="${ids}-${v}" value="${v}"><label for="${ids}-${v}">${v}</label></div>`; }).join('') + `</div>` +
      (d.estremi ? `<div class="estremi"><span>${esc(d.estremi[0])}</span><span>${esc(d.estremi[1])}</span></div>` : '');
  } else if (d.tipo === 'numero') {
    corpo = `<div class="num"><input type="number" inputmode="numeric" name="${nome}" id="${ids}" min="${d.min}" max="${d.max}"${desc}> <span>${esc(d.unita || '')}</span></div>`;
  } else {
    corpo = d.breve ? `<input type="text" name="${nome}" id="${ids}" maxlength="200" autocomplete="off"${desc}>` : `<textarea name="${nome}" id="${ids}" rows="3" maxlength="800"${desc}></textarea>`;
  }
  const rotolo = (d.tipo === 'testo' || d.tipo === 'numero') ? `<label class="et" for="${ids}">${esc(d.etichetta)}</label>` : `<legend class="et">${esc(d.etichetta)}</legend>`;
  return (d.tipo === 'testo' || d.tipo === 'numero')
    ? `<div class="dom" data-q="${d.id}">${rotolo}${aiuto}${corpo}</div>`
    : `<fieldset class="dom" data-q="${d.id}"${desc}>${rotolo}${aiuto}${corpo}</fieldset>`;
}

const sezioni = spec.sezioni.map(s => `<section><h2>${esc(s.titolo)}</h2>${s.intro ? `<p class="sotto">${esc(s.intro)}</p>` : ''}${s.domande.map(domanda).join('')}</section>`).join('\n');
const elenco = spec.sezioni.flatMap(s => s.domande.map(d => ({ id: d.id, tipo: d.tipo })));

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>Questionario di prova</title>
<style>
:root{--void:#07090b;--pan:#11161b;--pan2:#161c22;--linea:#2a323a;--bone:#c8ccc9;--dim:#8a9396;--amber:#ffb000;--teal:#2fa8a0;--ok:#5fb87a}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--void);color:var(--bone);font:15px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:0 16px env(safe-area-inset-bottom)}
.foglio{max-width:640px;margin:0 auto;padding:22px 0 80px}
h1{font-size:22px;letter-spacing:.08em;color:var(--amber);margin:0 0 6px}
h1 b{color:var(--bone);font-weight:700}
h2{font-size:13px;letter-spacing:.18em;color:var(--amber);border-bottom:1px solid var(--linea);padding-bottom:6px;margin:34px 0 12px;text-transform:uppercase}
.sotto{color:var(--dim);margin:0 0 14px}
.dom{border:0;margin:0 0 22px;padding:0;min-width:0}
.et{display:block;padding:0;margin:0 0 6px;color:var(--bone);font-weight:700}
.aiuto{margin:0 0 6px;color:var(--dim);font-size:13px}
.opz{display:flex;flex-direction:column;gap:6px}
.o label,.s label{display:flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid var(--linea);background:var(--pan);cursor:pointer;color:var(--bone)}
.o input,.s input{position:absolute;opacity:0;width:44px;height:44px;margin:0;pointer-events:none}
.o,.s{position:relative}
.o input:checked+label,.s input:checked+label{border-color:var(--amber);color:var(--amber);background:#1b1608}
.o input:focus-visible+label,.s input:focus-visible+label{outline:2px solid var(--amber);outline-offset:2px}
.scala{display:flex;flex-wrap:wrap;gap:6px}
.s label{justify-content:center;min-width:44px;padding:8px 0}
.estremi{display:flex;justify-content:space-between;gap:10px;color:var(--dim);font-size:12px;margin-top:4px}
input[type=text],input[type=number],textarea{width:100%;min-height:44px;padding:10px 12px;background:var(--pan);border:1px solid var(--linea);color:var(--bone);font:inherit;border-radius:0}
input[type=number]{width:120px}
.num{display:flex;align-items:center;gap:10px;color:var(--dim)}
textarea{resize:vertical}
input:focus-visible,textarea:focus-visible{outline:2px solid var(--amber);outline-offset:1px}
.fine{margin-top:30px;border:1px solid var(--linea);background:var(--pan);padding:14px}
.fine h2{margin-top:0}
.barra{height:6px;background:#000;border:1px solid var(--linea);margin:6px 0 14px}
.barra i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--teal),var(--amber))}
.az{display:flex;flex-wrap:wrap;gap:8px}
button{min-height:44px;padding:10px 16px;background:transparent;border:1px solid var(--amber);color:var(--amber);font:inherit;letter-spacing:.08em;cursor:pointer}
button.pieno{background:var(--amber);color:#07090b;font-weight:700}
button:focus-visible{outline:2px solid var(--bone);outline-offset:2px}
#anteprima{width:100%;min-height:160px;margin-top:12px;font-size:12px;color:var(--dim);background:#05070a}
#esito{min-height:1.4em;color:var(--ok);margin:8px 0 0}
.nota{color:var(--dim);font-size:13px}
a{color:var(--teal)}
@media (max-width:420px){body{font-size:14px}h1{font-size:19px}}
</style>
</head>
<body>
<div class="foglio">
<h1>Questionario <b>di prova</b></h1>
<p class="sotto">${esc(spec.intro)}</p>
<form id="modulo" autocomplete="off" novalidate>
${sezioni}
<div class="fine">
  <h2>Mandalo</h2>
  <p class="sotto">Sotto vedi esattamente cosa verrebbe condiviso. Non lascia questo dispositivo finché non lo incolli tu da qualche parte.</p>
  <div class="barra" role="img" aria-label="Domande risposte" id="barra"><i></i></div>
  <p class="nota" id="conta"></p>
  <div class="az"><button type="button" class="pieno" id="copia">COPIA LE RISPOSTE</button><button type="button" id="scarica">SCARICA UN FILE</button></div>
  <p id="esito" role="status"></p>
  <textarea id="anteprima" readonly aria-label="Anteprima delle risposte da condividere"></textarea>
</div>
</form>
<p class="nota">Versione del gioco provata: ${esc(build)} · <a href="../provare.html">torna alla pagina di prova</a></p>
</div>
<script>
(function(){
  var BUILD=${JSON.stringify(build)}, VER=${JSON.stringify(spec.versione)}, DOMANDE=${JSON.stringify(elenco)};
  var f=document.getElementById('modulo');
  function valore(id,tipo){
    var els=f.querySelectorAll('[name="q.'+id+'"]');
    if(tipo==='scelta'||tipo==='scala'){ for(var i=0;i<els.length;i++) if(els[i].checked) return els[i].value; return ''; }
    return els.length?String(els[0].value).replace(/\\s+/g,' ').trim():'';
  }
  function testo(){
    var L=['=== QUESTIONARIO FRACTURE PROTOCOL v'+VER+' ===','build: '+BUILD,'data: '+new Date().toISOString().slice(0,16)];
    DOMANDE.forEach(function(d){ var v=valore(d.id,d.tipo); if(v!=='') L.push('q.'+d.id+': '+v); });
    L.push('=== FINE ===');
    return L.join('\\n');
  }
  function aggiorna(){
    var fatte=0; DOMANDE.forEach(function(d){ if(valore(d.id,d.tipo)!=='') fatte++; });
    document.querySelector('#barra i').style.width=Math.round(fatte/DOMANDE.length*100)+'%';
    document.getElementById('conta').textContent=fatte+' risposte su '+DOMANDE.length+' (nessuna è obbligatoria)';
    document.getElementById('anteprima').value=testo();
  }
  f.addEventListener('input',aggiorna); f.addEventListener('change',aggiorna);
  function esito(m){ document.getElementById('esito').textContent=m; }
  document.getElementById('copia').addEventListener('click',function(){
    var t=testo();
    function fallback(){ try{ var ta=document.getElementById('anteprima'); ta.removeAttribute('readonly'); ta.select(); var ok=document.execCommand&&document.execCommand('copy'); ta.setAttribute('readonly',''); return !!ok; }catch(e){ return false; } }
    function fine(ok){ esito(ok?'Copiato. Incollalo nel messaggio a chi ti ha invitato.':'Non sono riuscito a copiare: seleziona il testo qui sotto e copialo a mano.'); }
    try{ if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){fine(true)},function(){fine(fallback())}); else fine(fallback()); }catch(e){ fine(fallback()); }
  });
  document.getElementById('scarica').addEventListener('click',function(){
    try{ var u=URL.createObjectURL(new Blob([testo()],{type:'text/plain;charset=utf-8'})), a=document.createElement('a'); a.href=u; a.download='fracture-protocol-questionario-'+new Date().toISOString().slice(0,10)+'.txt'; document.body.appendChild(a); a.click(); setTimeout(function(){a.remove();URL.revokeObjectURL(u);},1500); esito('File scaricato: mandalo a chi ti ha invitato.'); }catch(e){ esito('Il browser non permette di scaricare: usa COPIA LE RISPOSTE.'); }
  });
  aggiorna();
})();
</script>
</body>
</html>
`;

const dest = path.join(radice, 'prova', 'questionario.html');
if (process.argv.includes('--check')) {
  const att = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
  if (att !== html) { console.error('prova/questionario.html non e\' aggiornato: lancia node tools/prova/genera-questionario.js'); process.exit(1); }
  console.log('questionario.html aggiornato'); process.exit(0);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, html);
console.log('scritto', path.relative(radice, dest), (html.length / 1024).toFixed(1) + ' KB', elenco.length + ' domande');
