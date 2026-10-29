# Rapporto grafica 8: il pannello di Lazy J in battaglia (build `v2026-10-26`, 0.21.0)

## Il problema
Su telefono il pannello era lungo: ritratto, barra, riga di banda e tre carte impilate su due righe con la descrizione
tagliata, e la terza carta finiva sotto il log. Gli strati di CSS accumulati (cinque blocchi che si correggevano a vicenda)
rendevano ogni ritocco fragile.

## Il nuovo pannello
- **Plancia**: ritratto (cambia con la banda, come prima), nome, **banda** in una targhetta colorata, valore «62/100» e la barra.
- **Barra con tre soglie** (25, 50, 75: dove cambia la banda). Quando armi un intervento, **un tratto a righe** mostra di
  quanto salirà la barra: il costo si vede prima di confermare.
- **Tre tasti in una riga** (≥44 px): nome e costo («+14 risonanza», «richiede SIMBIOSI», «risonanza al massimo»). I non
  disponibili restano spenti con la banda che serve, come prima.
- **La descrizione sta in una riga sotto la barra**: quella della banda finché non armi niente, quella dell'intervento
  quando lo armi, con «scegli una casella · tocca di nuovo il tasto per annullare». Resta anche nel nome accessibile e nel titolo di ogni tasto.
- **Disarmare**: toccare di nuovo il tasto armato annulla la mira (prima non c'era un modo, a parte armarne un altro).
  Il gesto per usare l'intervento non cambia: arma, poi tocca una casella del campo.
- Il pannello resta vuoto fuori dalla fase del giocatore, come prima.

## Verifiche
`lazyj.js`: 12 controlli (3 per ciascuno di 320×568, 390×844 e 1000×700, più il controllo di FINE TURNO a 390×844 e rete/errori).
A risonanza 0, 30, 60 e 90: banda, valore, larghezza e soglie della barra, i tre tasti sulla stessa riga e alti ≥44 px,
stato e costo di ciascuno dai dati del gioco. Armare, disarmare e riarmare un altro tasto; l'anteprima del costo
(`left`/`width`) calcolata dal valore; il tocco sulla casella chiama `usaIntervento(chiave, x, y)` (con una funzione
spia) e il pannello sparisce fuori dalla fase del giocatore. Batteria completa verde, `riprendi.js` compreso
(62 riprese identiche).

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato.
- Prima di armare un tasto non si legge cosa fa (solo la banda): è nel titolo, nel nome accessibile e, dopo il primo
  tocco, nella riga; armare non costa niente finché non si sceglie una casella. Se in prova le persone cercano la
  descrizione prima di toccare, si può mostrare quella dell'ultimo tasto in evidenza o al passaggio del mouse.
- Il costo mostrato non tiene conto di uno sfogo o di altri effetti: è il costo dichiarato dell'intervento.
- Non ho toccato la logica degli interventi, né il pannello di Lazy J in Comando (rifatto nel giro 0.16.0).
