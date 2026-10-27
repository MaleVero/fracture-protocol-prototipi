# Rapporto grafica 3: Comando e Opzioni (build `v2026-10-26`, 0.16.0)

## Cosa è cambiato
**Comando** era una colonna di numeri; ora si legge a colpo d'occhio.
- **Stato campagna**: tre schede di settore (Cassandra, Orvat, Tarsis) con anello di avanzamento (nodi contenuti su totali),
  stato (CHIUSO / PERDUTO / CONTENUTO / N% MARCIO) e barra di corruzione; sotto, sei celle (missioni, telai, moduli,
  frammenti, sigilli, gangli) e la riga «Risposta della Spaccatura». I numeri sono calcolati dallo stato vero, non copiati.
- **Lazy J — risonanza**: ritratto che cambia con la banda, barra con tre tacche, i tre interventi con lo stato
  (disponibile o bloccato) e il costo/beneficio in risonanza, e la nota sullo sfogo (`SFOGO`, oggi 6) letta dalla costante.
- **Dossier di PALINSESTO**: ritratto, livello a cinque punti, adattamenti e tecnologie assimilate a pillole,
  barre delle tendenze misurate; il testo esplicativo di prima è rimasto. Prima che si manifesti c'è il suo ritratto e
  «Nessuna anomalia».
- **Piloti**: l'XP verso il livello successivo (es. «XP 40 / 100 · prossimo LV3») con barra, o «LIVELLO MASSIMO»;
  su schermo largo il roster va su due colonne e le celle su sei.

**Opzioni**
- Gli interruttori sono veri `role="switch"` con `aria-checked` e testo ATTIVO/SPENTO (prima erano solo colorati).
- I cursori (volume, dimensione del testo) hanno la traccia riempita fino al valore; c'è un'anteprima del testo.
- La scheda dello slot mostra l'avanzamento della campagna; i titoli hanno un glifo; in fondo un piede con la build e il
  collegamento alla pagina di prova.

## Verifiche
`comando.js`: 17 controlli (5 a ciascuno di 320×568, 390×844 e 1000×700, più rete ed errori) (schede di settore = nodi veri; sei
numeri = stato; Lazy J a risonanza 0, 30, 60, 90 con banda, barra, tacche, interventi, ritratto dipinto e nota; dossier
vuoto e pieno; XP dei piloti; interruttori che commutano davvero; cursori `--f`; nessuno scorrimento orizzontale).
Batteria completa (layout, ui, flows, settore3, nemesi, backup, a11y, riprendi, migrazione, prova, rilascio,
raggiungibilita, blocco3, effetti, sfogo-test, grafica, galleria): verde; dopo l'aggiornamento di versione ho rilanciato `rilascio.js` e `prova.js`.

## Nota onesta
Il primo giro di `comando.js` ha segnalato un fallimento: era la mia frase di prova («scende di») contro il testo
del gioco («scendere di»), non un difetto del gioco; corretto il test.

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato.
- Il ritratto di Lazy J e del dossier sono disegnati sul canvas con gli stessi pennelli del resto: non li ha visti una
  persona sul telefono.
- Non ho toccato la logica di gioco: solo presentazione.
