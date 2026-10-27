# Rapporto grafica — identità di settore, effetti, tavole, esito (build `v2026-10-26`, 0.11.0)

Scelte dell'utente: lavorare su **tavole a fumetti, effetti in battaglia, interfaccia e mappa**; **solo scene e
didascalie** (niente volti); **un'identità per ogni settore**, restando nello stesso linguaggio a china.

## Cosa c'è di nuovo
**Identità di settore (campo)** — `TEMA` in `index.html`. Fuori dalla lastra e solo lì:
- *Orvat*: ciminiere con fumo e fascia calda in cima, forni con bocca accesa (illuminano il bordo come i palazzi),
  cordolo e piastra color brace, brace che sale al posto della cenere, vignetta bruna; sul pavimento un velo caldo
  (alfa ≤ .055), grigliati di scolo e macchie di fuliggine.
- *Tarsis*: piloni con fanale teal (mai il rosso del `mast`), dighe con colature, cordolo teal, spruzzi che cadono,
  vignetta verde-blu; sul pavimento un velo freddo, pozze con riflesso e colature di bagnato.
- *Cassandra*: **identica a prima** (stessa tabella di scenografia: stesse posizioni, stesso seme).
- La tavolozza di gioco non si tocca: ambra = tuo, rosso = minaccia, viola = corruzione. Il fuoco di Orvat è un arancio
  in cima alle ciminiere, non l'incendio del suolo; il teal di Tarsis è quello dell'acqua di gioco.
  `effetti.js` misura la luminanza media del pavimento su 16 caselle: **152 / 144 / 150** (Cassandra / Orvat / Tarsis). Orvat è ~8 punti più scuro (–5%): il velo caldo e la fuliggine. ⚠ La prima misura (166 / 162 / 163, una sola casella, effetti di morte non ancora spenti) era meno affidabile: una casella può portare una decalcomania e gli scuotimenti spostavano il campione; il test ora media su 16 caselle dopo aver svuotato gli effetti.

**Mappa** — `creaCartaSettore()`: fondale SVG deterministico a bassissimo contrasto dietro nodi e archi (Cassandra:
isolati e crepa del varco; Orvat: condotte, ciminiere, forno a cerchi; Tarsis: curve di livello attorno ai bacini e la
diga), alone di colore, archi percorsi e scheda del settore nel colore del settore.

**Effetti in battaglia** — le conseguenze si vedono, senza toccare la logica:
- *taglio* (tre segni paralleli nella direzione del colpo; rosato se colpisce un Kaucha) su ogni colpo;
- *scia e polvere* su chi viene spinto (`push()` avvolta per segnare lo spostamento come spinta);
- *tuffo* (tre anelli piatti e gocce) per chi annega, *vortice nero* per chi cade in voragine o oltre il bordo;
  gli altri morti esplodono come prima.
- `killTerreno()` ora registra `_causa` anche per i **tuoi** mech (senza contarli come «smaltiti col terreno»): era
  l'unico modo per sapere come è morto un mech. **Effetto collaterale voluto:** per un mech che affonda o cade ora
  suonano `annega` e `caduta` invece di `morteMech`.

**Tavole** — camera lenta (spinta del 4% all'ingresso e poi fino a +4,5%, ferma col movimento ridotto), targa del
settore sul primo fotogramma, **strisce doppie** (`strisce`: due momenti separati da un canale nero; usate nelle tavole
3 di Orvat e Tarsis), dissolvenza della didascalia, pulsanti a 44 px, SALTA non va a capo.

**Esito** — una vignetta in testa: squadra in piedi nella scena del settore (vittoria), scena vuota arrossata
(sconfitta), squadra spenta (ritirata). Trovato e corretto: `#outcome{justify-content:center}` con più contenuto dello
schermo **taglia la cima senza possibilità di scorrere**; ora si centra col margine automatico e si scorre.

## Misure e controlli
- `effetti.js`: 14 controlli (scenografia per settore, pavimento invariato, effetti creati/consumati, annegare,
  cadere, colpo, spinta non letale, movimento ridotto, nessuna rete, nessun errore).
- Costo di pittura, Chromium headless: **3,03 ms/frame a Cassandra, 3,68 a Orvat, 3,74 a Tarsis** (+0,7 ms). Su un
  telefono lento sarà più alto; non l'ho misurato su un dispositivo vero.
- Regressione completa verde (layout, ui, flows, settore3, nemesi, backup, a11y, riprendi, migrazione, prova, rilascio,
  raggiungibilita, blocco3, effetti).

## Limiti
- Giudicato su screenshot, non sul telefono: i colori dei veli (alfa .055–.07) e il fumo possono sembrare più o meno
  presenti su un pannello vero. Ho tenuto tutto sotto la soglia in cui la lettura del campo cambierebbe.
- Gli effetti durano 230–650 ms: sono brevi di proposito e **non** ritardano niente; non li ho cronometrati contro una
  partita reale.
- Il disegno è tutto da codice (un file): niente texture né immagini; una pittura più ricca richiederebbe di
  cambiare questo vincolo.

## Aggiunta (0.12.0) — tavole dell'hangar e di Lazy J
- **Hangar (`hangar`, 3 tavole)**: scatta alla prima apertura dalla voce di menu HANGAR. Scena nuova `baia`: parete a
  nervature, portone con banda di pericolo, travi e cavi del carroponte che oscillano, due coni di luce da lavoro,
  banda gialla e nera sul pavimento. Ambra su acciaio freddo, nessun teal né viola: è casa. Il testo legge lo stato:
  la tavola 2 elenca la squadra schierata con le firme vere, la 3 i cinque piloti veri.
- **Lazy J (`lazyj`, `lazyj_simbiosi`, `lazyj_convergenza`)**: la prima quando fa il primo intervento (q=0, uomo in
  tuta), la seconda alla prima volta in banda SIMBIOSI (un braccio cede, tre dita lunghe), la terza a CONVERGENZA (la
  maschera ossea si chiude, la visiera resta). Usano la **stessa figura del pannello** (`artLazyJ`, tipo `lazyj:<q>` nelle
  tavole). Scattano dopo il resoconto, in **coda** (`playCoda`): più tavole nella stessa missione si vedono una dopo
  l'altra, poi si torna alla mappa. Ho verificato i fatti sul codice: gli interventi e le bande (GUSCIO a INNESTO, STRAPPO a
  SIMBIOSI), 440 THz, 2 adattamenti per evoluzione a SIMBIOSI e 3 a CONVERGENZA, tratto al livello 2 e maestria al 3.
- **Fair play**: nessuna tavola dice ciò che l'ARCHIVIO sa. La voce di K-OS e quella di Varga restano dove stanno, nelle
  trasmissioni; qui compare solo ciò che il giocatore può già osservare.
- Trovato e corretto durante il lavoro: nella tavola la figura di Lazy J veniva disegnata due volte (contorno di luce in
  `lighter`), come un fantasma; ora il contorno è solo per telai e creature.
- Test: `blocco3.js` ora 25 controlli (19 tavole si disegnano, a 320 px e in orizzontale; apertura hangar; coda di
  Lazy J in quattro casi). `ui.js` e `a11y.js` segnano la tavola dell'hangar come già vista, o coprirebbe la schermata
  da misurare.

## Trovato durante il lavoro grafico: lo SFOGO non veniva applicato — corretto in 0.13.0
Vedi `RAPPORTO-SFOGO.md`: la funzione non veniva mai chiamata; ora lo è, misurata su campagne intere.
