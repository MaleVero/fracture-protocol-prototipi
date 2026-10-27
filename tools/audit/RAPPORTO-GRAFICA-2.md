# Rapporto grafica, secondo giro (build `v2026-10-26`, 0.14.0)

Sguardo d'insieme sulle schermate non ancora toccate (menu, hangar, codice, ricerca, comando, officina, mappa) con
`shot-schermate.js`, poi interventi dove la resa era più debole o rotta.

## Difetti trovati e corretti
- **Hangar: il pulsante «OFFICINA» copriva la riga di testo della testata** (`float:right` dentro un riquadro che non lo
  conteneva). Ora il riquadro è flex con a-capo e il pulsante scende sotto il testo. Stesso trattamento per «VAI
  ALL'HANGAR» dell'officina, su una riga sua.
- **Codice: il totale era scritto a mano («/9»)** mentre il bestiario ne ha 13 (14 con il segnaposto). Ora è calcolato e
  coincide con quello del menu (le schede `_` sono segnaposto e non si contano).
- **Indice e pagina dei tester: il sottotitolo era a `#4a4b63` su nero**, quasi illeggibile; ora usa il grigio del testo.

## Novità
- **Codice con le sagome**: le schede non ancora viste mostrano la forma nera con un filo di luce (come un bestiario),
  non un blocco sfocato. Il guardiano, la nemesi e la scheda segnaposto restano «▓»: la loro forma è una scoperta della
  storia, non del catalogo.
- **Briefing con le presenze**: nel riquadro di ogni missione, una riga con le creature che può schierare (pool o
  schieramento fisso). Sagome a colori e con la sigla per quelle già registrate, nere le altre, e «N non registrate».
  Etichetta accessibile: dice «sconosciuta», non il nome.
- **Sfondo del titolo nel menu**: la scena del settore corrente (Cassandra, Orvat, Tarsis) a bassa opacità, dipinta una
  volta per ingresso, sfumata ai bordi. Il testo sta sopra.
- **Culla dell'hangar**: il ritratto del telaio sta sotto una luce da lavoro, su una banda gialla e nera (CSS, nessun costo
  di pittura).
- **Corruzione sulla mappa**: due macchie violette che crescono col valore del settore (`--corr`), sopra la carta e sotto i
  nodi. Nessuna informazione nuova: lo stesso numero dell'anello dei nodi, in forma di ambiente.
- **Targa di missione**: 2,2 s a inizio missione, nome e nodo nel colore del settore (rosso per il guardiano). Non prende il
  tocco, non ritarda il primo turno, con movimento ridotto compare ferma; **non** compare alla ripresa di un checkpoint.
- **Icona**: favicon SVG e `apple-touch-icon` PNG, inline, nelle tre pagine (indice, pagina dei tester, gioco). Un rombo
  ambra, la crepa teal e viola. `icona.js` la rigenera.
- **Indice e pagina dei tester**: skyline con la crepa dietro il titolo (SVG inline, ~3 KB).

## Verifiche
`grafica.js`: 29 controlli a 320×568, 390×844 e 1000×700 (testata dell'hangar, culla, codice, menu, mappa, briefing,
targa, icone, nessuna rete, nessun errore). Regressione completa verde.

## Limiti
- Giudicato su screenshot, non sul telefono. La targa e lo sfondo del menu sono decorazione: se danno fastidio si
  spengono con una riga ciascuno (`bannerMissione`, `drawHeroArt`).
- Le sagome rivelano che esistono creature che il giocatore non conosce (e la forma). Il guardiano e la nemesi no.
- `apple-touch-icon` PNG pesa ~16 KB per pagina; non ho potuto provarlo su un iPhone.
- Non ho rivisto la resa delle singole creature: l'allineamento di tutti i tipi sul campo si sovrappone e non è leggibile
  come foglio di confronto; servirebbe una pagina di prova dedicata.
