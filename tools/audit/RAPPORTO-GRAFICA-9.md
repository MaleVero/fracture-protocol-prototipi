# Rapporto grafica 9: rifinitura finale (build `v2026-10-26`, 0.22.0)

Un giro di controlli **automatici** su tutte le schermate (menu, mappa, hangar, codice, officina, ricerca, comando, opzioni,
galleria, battaglia, fine missione) a 320, 390 e 1000 px, poi guardati a occhio dove i numeri segnalavano qualcosa.
Tre famiglie di difetti, tutte reali e tutte sistemate.

## 1. Bersagli di tocco (prima: decine sotto i 44 px)
Sul telefono un pulsante sotto i 44 px non si centra. Trovati: frecce dell'hangar a 24–26 px, pulsanti d'acquisto
dell'Officina a 33, STUDIA a 25, interruttori e pulsanti delle Opzioni a 29–30, il titolo «COSA CONTIENE IL RAPPORTO» a 13,
il collegamento «Come provarlo» a 11, i pulsanti della galleria a 36, le linguette dei settori e il tasto indietro a 40, i
pulsanti dell'esito a 42. Ora tutti a 44 o più, senza cambiare lo stile.

## 2. Contrasto del testo
Il colore «attenuato» (`--bone-dim`), usato per quasi tutto il testo secondario, era a **3,4–4,3:1** sul fondo: sotto il
minimo 4,5:1 (WCAG AA). Schiarito (`#6E7679` → `#8A9396`, ora ≈5,6:1 sui pannelli); il viola del testo del dimensionale
(`#9B4FB0` → `#B26CC7`) era a 3,4:1; i testi in grigio-blu fisso dei gruppi di squadra e dei costi di Lazy J a 2,2:1.
La gerarchia fra testo normale e attenuato resta leggibile (guardato su menu e Comando).

## 3. Testo al 160% (il massimo delle Opzioni)
A 160% uscivano dallo schermo: il titolo del menu («PROTOCOL» a 83 px), le schede del Codice, i prezzi dell'Officina a 320 px
e le carte di settore e gli interventi di Lazy J in Comando. Ora il titolo si limita alla larghezza dello schermo, le colonne
si possono restringere e le parole lunghe vanno a capo. In Opzioni la riga di un cursore (volume, dimensione del testo)
mette il testo sopra e il cursore a tutta larghezza sui telefoni, invece di strizzare la descrizione in una colonna da una parola.
Con il testo al 160% FINE TURNO resta dentro lo schermo a 320×568 e 390×844.

## Verifiche
- `bersagli.js`: 55 controlli (10 schermate × 3 formati per bersagli e testo minimo; 20 per il 160%: niente fuori schermo
  né scorrimento orizzontale, FINE TURNO visibile; rete ed errori).
- `contrasto.js`: 17 controlli (tutte le schermate principali a 390 e 1000 px).
- Batteria completa verde. Non ho rilanciato `riprendi.js`: nessuna modifica alla logica, solo CSS.

## Eccezioni dichiarate (non corrette)
- **Pin dei nodi della mappa: 42 px**; sono vincolati dalla geometria della mappa (si sovrapporrebbero) e a due dita si ingrandisce.
- **Pulsanti di zoom della mappa: 34 px** (anche questi hanno il pizzico a due dita) e i comandi della camera su schermo largo
  con il mouse (34 px).
- **A 320 px, i cinque tasti secondari della battaglia** (annulla, deseleziona, menu, ritirata, opzioni) sono larghi 38 px e
  alti 54: con FINE TURNO non ci stanno a 44 in 296 px, e metterli su due righe toglierebbe altezza a un campo già
  stretto. Su 360 px e oltre sono a norma.
- La scheda segnaposto **«VAULT — IN SVILUPPO»** in fondo a Comando (wallet e persistenza on-chain) ha contrasto bassissimo
  di proposito; l'ho lasciata perché è un contenuto di progetto, non mio. Promette una funzione che il gioco non ha: da decidere se tenerla.

## Limiti
- Il contrasto è stimato dal colore di fondo più vicino: i gradienti e le immagini non si leggono, è una misura prudente non una certificazione.
- Giudicato su Chromium; Safari/iPhone e lettori di schermo reali non verificati.
