# Rapporto fase 4 — esperienza: salvataggio, accessibilità, tutorial, suoni (build `v2026-10-26`)

## Cosa c'era già (e quindi non ho rifatto)

Il piano parlava di tutorial, salvataggio, suoni e accessibilità come se mancassero. Leggendo il gioco:

- **Suoni:** sintetizzati con WebAudio, con un effetto per quasi ogni evento (colpo, spinta, caduta, annegamento,
  detonazione, cambio fase, morte per materiale, ambiente). Volume e interruttore nelle opzioni.
- **Salvataggio:** tre slot, «ricomincia» con conferma, conoscenza (codice, ricerca) che sopravvive alle nuove campagne.
- **Tutorial:** trasmissioni contestuali e un pannello che insegna mentre si gioca («Tile ambra: muovi. Bersaglio
  bordato: attacca», la conseguenza mostrata prima di confermare, «tocca di nuovo per confermare»).
- **Accessibilità:** dimensione del testo, animazioni spegnibili, rispetto di `prefers-reduced-motion`.

Quindi la fase è stata una ricerca delle lacune vere. Ne ho trovate sei.

## Lacune trovate e cosa ho fatto

### 1. La missione in corso non si salvava
Ricaricare la pagina a metà missione (su telefono il browser scarta le schede in background) la perdeva.
**Ora c'è un checkpoint a inizio di ogni turno del giocatore** (`salvaBattaglia`, dopo la telegrafia). Il menu offre
«RIPRENDI LA MISSIONE · dall'inizio del turno» anche dopo un ricaricamento. Chiave separata per slot; si cancella a fine
missione, a ritirata e su «ricomincia». Il solo campo non serializzabile era `pilot` (porta funzioni): si salva come
indice. Si riparte dall'inizio dell'ultimo turno, non dal punto esatto: le azioni già fatte in quel turno non sono nel file.

**Verifica:** `riprendi.js` gioca la stessa partita (A) di seguito e (B) fermata a un turno, salvata, con **pagina
nuova** e ripresa dal solo file. Confronta 13 grandezze di esito. Risultato: **61 su 61 identiche** (11 missioni:
guardiani, evacuazione, relay, recupero, demolizione, Tarsis; ripetuto a 42 su 42 dopo le ultime modifiche).
Controllo negativo: manomettendo il checkpoint (un mech a 1 PV) il test trova **12 differenze su 12**, quindi non è vuoto.

### 2. Il salvataggio vive solo in `localStorage`
Sul telefono può sparire (spazio scarso, «cancella dati dei siti», Safari dopo giorni senza aprire la pagina).
Aggiunto in Opzioni **COPIA DI SICUREZZA**: scarica un file con slot, conoscenza e checkpoint; ripristina da file.
L'importazione valida **prima** di scrivere (formato, versione, solo chiavi del gioco, salvataggio principale presente
e leggibile) e, se lo spazio finisce a metà, rimette com'era. Richiesta di archivio persistente al browser.
**Verifica:** `backup.js` esporta, svuota il browser, ripristina e ritrova progressi e missione; sette file sbagliati
(testo, JSON altrui, dati vuoti, chiave estranea, salvataggio corrotto, versione sconosciuta, senza salvataggio principale)
vengono rifiutati ciascuno con il proprio messaggio e senza toccare il salvataggio.

### 3. Il campo non era giocabile senza dito né leggibile da un lettore di schermo
Il campo è un canvas: per un lettore di schermo non esisteva. Il gioco è a informazione perfetta, quindi basta poterla
leggere e poter agire:
- **Tastiera:** frecce (sugli assi della griglia: sinistra/destra colonna, su/giù riga, le stesse coordinate del log),
  Invio o spazio per agire, M/N per scorrere mech e nemici, E fine turno, U annulla, Esc deseleziona, R legge tutto il campo,
  `?` elenca i comandi. Maiuscolo con le frecce sposta la vista (prima la spostava la freccia sola). Cursore bianco ben
  visibile; col mouse sparisce.
- **Annunci:** regione `aria-live` che riceve ogni riga del log, il cambio di fase, le trasmissioni, la selezione, la mira
  con il danno previsto e l'esito della missione. Ogni casella si descrive a parole (unità, PV, intento nemico, terreno,
  minaccia, raggiungibilità).
- **Nomi:** i pulsanti con solo un simbolo ora hanno un nome («⌂» → «Torna al menu, la missione resta aperta»;
  «140 fr» → «Compra PIASTRE CORAZZA, 140 frammenti»; «‹» → «Telaio precedente, baia 1»). I nodi della mappa sono
  pulsanti raggiungibili con Tab e Invio, con nome e stato. Cursori con etichetta. Anello di focus visibile ovunque.
**Verifica:** `a11y.js`, con eventi reali di tastiera: **missione m1 vinta usando solo la tastiera** (3 turni); 64 caselle
descritte senza errori in 6 missioni; ogni controllo visibile di 8 schermate + battaglia ha un nome; annunci distinti per
M, Invio, N, R, `?`.

### 4. Un errore nel tutorial: l'ordine delle trasmissioni
A profilo nuovo il **primo** messaggio era «Le caselle bordate sono ciò che faranno il prossimo turno…», davanti al
benvenuto del Comando, perché gli intenti nascono durante la telegrafia. Ora `intento` aspetta il turno del giocatore:
il benvenuto è il primo. Su dispositivi con puntatore fine il pannello aggiunge una riga con i tasti.
Non ho costruito un tutorial nuovo: quello che c'è insegna già bene (`primapartita.js` lo mostra).

### 5. Audio con la scheda in background
L'ambiente continuava a suonare (e a consumare batteria) a pagina nascosta. Ora il contesto audio si sospende e riprende
al ritorno (salvo suono spento dall'utente).

### 6. Due testi fissi sbagliati
Il codice mostrava «2/6 svelate» fisso (ora conta davvero), e COMANDO scriveva «Settore Cassandra» anche in Orvat e Tarsis.

## Regressione

`layout.js` 24/24 · `ui.js` 0 problemi, 4 formati senza errori JS · `missions.js idle|aggro` 23 missioni senza errori ·
`flows.js` ok · `settore3.js` 15/15 · `backup.js` ok · `a11y.js` ok · `riprendi.js` 42/42.
**Il gioco non è cambiato:** 230 partite dell'agente con gli stessi semi della fase 3: 210 identiche; le 20 diverse sono
tutte e sole t4 e t7 (10+10), ritoccate in fase 3 dopo quel riferimento. Il banco resta veloce (230 partite in 33 s).

## Limiti

- **Mai provato con un vero lettore di schermo** (VoiceOver, TalkBack, NVDA): ho verificato il DOM, le regioni live e la
  tastiera in Chromium. L'ordine e la verbosità degli annunci vanno ascoltati da chi li usa.
- **Il checkpoint riparte dall'inizio del turno**, non dal punto esatto; Lazy J e le abilità usate in quel turno vanno rifatte.
- **Safari/iOS non provato.** Su Safari `navigator.storage.persist()` di solito non concede; resta la copia di sicurezza.
- Alto contrasto e daltonismo non affrontati: i segnali del campo usano colore più forma/glifo, ma non l'ho misurato.
- **Abilità e interventi di Lazy J a bersaglio:** si attivano col pulsante (Tab, Invio); il focus torna al campo e si sceglie
  la casella con le frecce e Invio. Verificato end to end per BOMBARDAMENTO (`a11y.js`: ho trovato e corretto che il focus
  restava sul pulsante e Invio la riattivava). Le altre abilità e i tre interventi passano dallo stesso punto, ma non li
  ho provati uno per uno.

## Come rilanciare

```
cd tools/audit
node riprendi.js --seeds 3 --turni 2,3        # ripresa == partita continua
node riprendi.js --sabota --missions m3,o2    # controllo negativo: deve trovare differenze
node backup.js        # copia di sicurezza
node a11y.js shots    # tastiera, nomi, annunci
node primapartita.js  # prima partita di un profilo nuovo: ordine delle trasmissioni
```
