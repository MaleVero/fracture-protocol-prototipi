# Rapporto grafica 7: mappa e campo (build `v2026-10-26`, 0.20.0)

## Mappa
Sotto la mappa c'era un muro di dieci righe di testo («su un nodo: contenerlo −14…−60 · rigiocarlo −2 · …»).
- **Il fronte come barre**: una per ogni settore sbloccato (larghezza e colore dal valore vero: verde, ambra, arancione,
  rosso a 28 / 55 / 80), il **globale** in fondo con «a 100 la campagna finisce» e la **previsione** («di questo passo il
  settore cade fra N missioni»). Un settore perduto mostra la barra piena e PERDUTO. I nodi fuori controllo sono **chip**.
- **Le regole** (quanto si guadagna contenendo un nodo, cosa costa una ritirata, come avanza la corruzione fra una
  missione e l'altra) stanno in un riquadro «COME CRESCE E COME SI CONTIENE», chiuso all'inizio e toccabile
  (≥44 px). Il testo è quello di prima e i numeri vengono sempre dalle costanti del gioco.

## Campo di battaglia
Ho toccato solo l'intestazione, non il motore isometrico (già lavorato nei giri precedenti):
- **Barra dei round** sotto il contatore: a che punto della missione sei (round / massimo); diventa arancione quando
  restano pochi round e l'obiettivo non è sopravvivere, come il numero.
- **Fase** (telegrafia, turno, esecuzione, ambiente) con una guida colorata a sinistra, dello stesso colore del testo.

## Verifiche
`mappa.js`: 12 controlli (4 per ciascuno di 320×568, 390×844 e 1000×700, più rete ed errori). Il fronte contro
`sectorCorrOf`/`sectorLost`/`globalCorruption`, i chip contro i nodi sopra la soglia, la previsione, le regole chiuse
e poi aperte con le costanti, la barra dei round a round 1, a metà e all'ultimo. Batteria completa verde,
`riprendi.js` compreso (62 riprese identiche). Un passaggio del test ha richiesto un ritocco: in Chromium un `<details>`
chiuso restituisce comunque un riquadro non vuoto, quindi la visibilità si legge dal testo, non dalla geometria.

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato (in particolare `<details>`/`summary` su iOS 15).
- Non ho ritoccato i nodi della mappa né la grafica del campo: l'etichetta «NIDO — VARCO MADRE» va a capo su tre righe
  e il riquadro isometrico su desktop resta centrato con vuoto sopra a 700 px di altezza; sono scelte dei giri precedenti
  e non ho trovato un difetto da correggere senza rifare il layout.
- Il pannello di Lazy J in battaglia su telefono resta lungo (la terza carta è coperta dal log): non l'ho toccato
  perché ogni carta è un comando e comprimerle avrebbe cambiato come si usano.
