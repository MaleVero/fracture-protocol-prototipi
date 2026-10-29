# Rapporto grafica 5: fine missione (build `v2026-10-26`, 0.18.0)

## Prima
Un muro di righe centrate senza gerarchia: «NODO … 30% → 42%», «INDICE DI SETTORE…», i nodi fuori controllo come una frase
lunga, i campioni nel mezzo, tre grandi bottoni di valutazione impilati e due pulsanti finali uguali.

## Dopo
- **In testa** il settore e la missione («SETTORE TARSIS · POZZO DI RISALITA») sopra il titolo dell'esito.
- **Ricompensa** (vittoria o ritirata) in un pannello a righe allineate: base e bonus a sinistra, valore a destra; il
  totale in grande con il saldo sotto; XP dei piloti e promozioni in nota.
- **Corruzione** con due **barre** (nodo e indice di settore): la parte che resta è viola, quella cambiata è rossa se
  il settore è peggiorato e verde se è migliorato, e il testo dice «da A% a B%». Ogni costo (collaterale civile,
  perdite ai Kaucha, round supplementari, innesti) è una riga con il suo valore; i **nodi fuori controllo** sono chip.
- **Campioni recuperati** in due celle (+BIO, +TEC, con il totale).
- Le righe di PALINSESTO, dello sfogo di Lazy J e i banner di fine campagna sono invariati nel testo, ora a tutta larghezza.
- La valutazione FACILE/GIUSTA/DURA sta in **una riga sola** (prima la regola `min-width:220px` dei pulsanti la
  faceva andare a capo su tre righe); «RITORNA ALLA MAPPA» è pieno e il più evidente.
- I pannelli entrano con una breve dissolvenza, spenta con «riduci movimento».

## Verifiche
`esito.js`: 11 controlli (3 per ciascuno di 320×568, 390×844, 1000×700, più rete ed errori). Sconfitta forzata con
collaterale, perdite e innesti: le barre hanno la parte fissa e quella cambiata della larghezza e del colore giusti, le
righe riportano i valori calcolati dal gioco (`civicCorruption`, `perditeCorruption`), i chip sono tanti quanti i nodi
fuori controllo. Vittoria: la somma delle righe è il totale, il totale è ciò che i frammenti hanno guadagnato davvero, il
saldo è quello del gioco e i campioni coincidono con quelli incassati. Valutazione su una riga, bottoni ≥44 px,
niente scorrimento orizzontale. Batteria completa verde; `riprendi.js` ha superato il mio tetto di 280 s per la
lentezza della macchina e rilanciato da solo è passato (62 riprese identiche).

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato.
- Solo presentazione: ricompense, corruzione e regole sono quelle di prima.
- Non ho cambiato la vignetta in cima (`drawOutcomeArt`).
