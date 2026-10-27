# Rapporto grafica 4: Codice, Officina, Ricerca (build `v2026-10-26`, 0.17.0)

## Cosa è cambiato
Le tre schermate erano elenchi piatti; ora parlano la lingua di Comando (celle, barre, accenti).
- **Codice Kaucha**: barra di avanzamento con «N REGISTRATE · M DA INCONTRARE»; ogni scheda vista ha un filo di colore
  in cima secondo il rango (rango 1 verde-acqua, rango 2 ambra, élite/adattivo viola). Le schede chiuse restano sagome, senza accento.
- **Officina**: in testa tre celle (frammenti, sigilli, gangli); ogni modulo ha un accento sul bordo per tipo (arma ambra,
  difesa verde-acqua, utilità grigio); dove i frammenti non bastano il pulsante dice **quanto manca** («mancano 15 fr»).
  Stessa cosa per i telai. Il nome accessibile dei pulsanti d'acquisto non cambia.
- **Ricerca**: in testa campioni BIO, campioni TEC e ricerche acquisite (es. 1/6); i due rami sono **catene** con un
  punto per nodo (verde se acquisito, verde-acqua se aperto, spento se bloccato); sotto un nodo aperto ma non pagabile
  c'è «mancano N BIO/TEC»; ogni **innesto Kaucha** mostra la creatura da cui deriva: **sagoma nera** finché non l'hai
  abbattuta, a colori dopo. Riusa gli stessi disegni del Codice.

## Verifiche
`schede.js`: 11 controlli (3 per ciascuno di 320×568, 390×844, 1000×700, più rete ed errori). Verificano testo e larghezza
della barra, classi di rango contro il livello vero di ogni creatura, i numeri delle celle contro lo stato, la
differenza esatta di «mancano N» su tutte le carte (e la sua assenza dove si può comprare), le catene (3 + 3 nodi),
le sagome non vuote di tutti e dieci gli innesti e il passaggio a colori sbloccandone uno. Batteria completa
(layout, ui, flows, settore3, nemesi, backup, a11y, riprendi, migrazione, prova, rilascio, raggiungibilita, blocco3,
effetti, sfogo-test, grafica, galleria, comando) verde dopo l'aggiornamento di versione.

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato.
- Solo presentazione: prezzi, regole di sblocco e acquisti non sono cambiati.
- Nessuna persona ha ancora visto queste schermate sul telefono.
