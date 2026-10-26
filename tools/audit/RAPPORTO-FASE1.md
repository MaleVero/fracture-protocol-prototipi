# Rapporto fase 1 — layout e accessibilità (build `v2026-10-26`)

Lavoro fatto su una copia della build: `builds/v2026-09-16/` (la 0.8.0 pubblicata) è intatta.
`index.html` della radice non è ancora aggiornato: la pubblicazione è la fase 5.
Tutte le modifiche sono CSS, più due ritocchi minimi al JS (posizione delle etichette della mappa e
scorrimento verso le trasmissioni). La logica di gioco non è toccata.

## Prima / dopo

Misure con `node layout.js` (12 formati × trasmissione aperta/chiusa = 24 configurazioni) e `node ui.js`.

| Problema | Prima | Dopo |
|---|---|---|
| A1 Campo in battaglia su telefono piccolo/medio | 2 px d'altezza su 320×568, 360×640, 375×667 con la trasmissione aperta | 194–230 px, sempre visibile |
| A2 Orizzontale | comandi fino a 150 px fuori schermo (844×390: x=902 su 844); 568×320: campo 2 px | tutti i comandi dentro lo schermo, FINE TURNO sempre raggiungibile |
| M1 Campo piccolo su 390×844 | 169 px con trasmissione aperta | 240 px |
| M2 Testo | 80 elementi a 7–8 px, zoom disabilitato | minimo 9 px (corpo base 10–11 px), zoom con le dita riabilitato |
| M3 Bersagli di tocco | 5–8 sotto i 32 px a schermata | 0 sotto i 32 px su touch e su mouse |
| M4 Mappa | etichette sovrapposte, «NIDO — VARCO MADRE» fuori dal bordo | etichette a capo e dentro i bordi, a 390 e a 320 px |
| Extra: mappa desktop | riquadro alto 910 px su 800: nodi in basso fuori schermo | limitato all'altezza della finestra, tutti i nodi visibili |

Configurazioni di layout che falliscono: **13 su 24 → 0 su 24**.

## Cosa è cambiato

- **Causa radice di A1/A2:** `#board` si restringeva fino a zero perché le colonne flex lo schiacciavano
  per far stare il resto. Ora in verticale non si restringe: scorre lo schermo e la riga dei comandi
  è ancorata in basso (`position:sticky`).
- Schermi bassi in verticale (≤ 720 px): HUD più compatto e descrizioni degli interventi di Lazy J chiuse
  (restano nomi e banda richiesta, come già in orizzontale).
- Orizzontale: la regola a due colonne partiva da 640 px e escludeva i telefoni piccoli; ora da 480.
  I comandi vanno su due righe (FINE TURNO sopra, i cinque secondari sotto).
- Le trasmissioni si portano in vista (`scrollIntoView`) e, a lettura finita, si torna al campo.
- Scala tipografica: `--t-micro` 8,5 → 10 px, `--t-mini` 10 → 11 px; 78 corpi fissi da 7–9 px portati a 10 px.
  Seguono tutti l'opzione «testo» come prima.
- Mappa su telefono: riquadro 1:1,12, etichette massimo 64 px (50 px sotto 340 px di larghezza),
  controlli di zoom in alto a destra con area di tocco da 44 px.

## Regressione

- 16 missioni × agenti `idle` e `aggro`: 0 errori JavaScript, esiti identici alla fase 0
  (idle: 16 sconfitte; aggro: vince solo m1).
- Salvataggio e reload, scelta «tieni il campo / sganciati», ripresa missione: invariati.

## Limiti noti

- Su 320×568 con trasmissione aperta, il campo esce in parte dall'alto mentre si legge il messaggio
  (e torna in vista alla chiusura): è il prezzo di tenere FINE TURNO sempre visibile.
- Il campo di gioco in verticale resta limitato dalla larghezza dello schermo (il rombo isometrico è largo
  quanto lo schermo): su 390 px sono 240 px d'altezza. Per ingrandirlo servirebbe cambiare la proiezione.
- Verificato solo con Chromium headless: Safari iOS non è stato provato (barra indirizzi dinamica,
  area sicura); `100vh` e `env(safe-area-inset-bottom)` sono i punti da controllare su un iPhone vero.

## Come rilanciare

```
cd tools/audit
node layout.js shots   # 24 configurazioni, deve finire con «tutte le configurazioni ok»
node ui.js shots       # nessun `out`/`small`/`docOverflowX` su touch
node missions.js aggro # 16 missioni senza errori
BUILD=v2026-09-16 node layout.js   # per confrontare con la build vecchia
```
