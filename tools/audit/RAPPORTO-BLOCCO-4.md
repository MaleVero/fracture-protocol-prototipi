# Rapporto blocco 4 — prova con altre persone (build `v2026-10-26`, 0.9.0)

## Obiettivo
Il banco di prova non sostituisce un giocatore: guardiani (~40%), relay (~30%) ed evacuazioni (~30%) non si sono mossi con
le leve provate e vanno visti con persone vere. Questo blocco rende la build **provabile da chiunque** e fa tornare indietro
un'informazione utile, senza server e senza raccolta automatica di dati.

## Cosa c'è di nuovo
- **`provare.html`** (radice, linkata dall'indice sopra l'elenco e nel piè di pagina): come aprire, comandi, cosa provare in
  priorità (relay, evacuazioni, PALINSESTO, Lazy J, punti poco chiari), cosa viene registrato, compatibilità, come segnalare.
  Stessa tavolozza dell'indice, nessuna risorsa esterna, nessuno script.
- **Giudizio a fine missione**: tre pulsanti FACILE / GIUSTA / DURA sulla schermata di esito (>= 44 px, sempre raggiungibili
  anche a 320×568). Si può cambiare idea; il giudizio è annunciato ai lettori di schermo.
- **Diario locale** (`fracture-protocol/v1/diario`, ultime 80 missioni): id, nome, settore, esito, motivo, round, meccanismi,
  livello nemesi, escalation, risonanza, giudizio. Rientra nella copia di sicurezza, che resta valida.
- **Rapporto di prova** in Opzioni → PROVA E SEGNALAZIONI: COPIA RAPPORTO, SCARICA RAPPORTO (`.txt` datato), anteprima di
  ciò che verrebbe condiviso, SEGNALA SU GITHUB (issue precompilata, < 7000 caratteri, `noopener`). A missione aperta il
  rapporto descrive anche il campo e il log. Contiene gli ultimi errori JavaScript.
- **Privacy**: il gioco non fa richieste di rete (verificato); il rapporto non contiene email né dati personali e lo
  condivide chi lo vuole, dopo averlo letto.
- Piè di pagina del gioco con la versione (`BUILD_VER`).

## Verifiche
`prova.js` (22 controlli), `rilascio.js` (22, ora anche su `provare.html`), e di nuovo `layout`, `ui`, `flows`, `settore3`,
`nemesi`, `backup`, `a11y`, `riprendi`, `migrazione`, `raggiungibilita`: tutto passa. Smoke di `sim.js` su m1, m2, o4, t7:
nessun errore (il blocco non tocca la logica di battaglia: solo `finish()` e le opzioni).

## Errore mio trovato e corretto
I tre pulsanti di giudizio andavano a capo a tutta larghezza su 320 px; ora stanno in riga con larghezza flessibile
(CSS `.ovval button`). `prova.js` lo controlla.
Sulla pagina avevo scritto un pulsante «NUOVA CAMPAGNA» che non esiste (il gioco parte dal menu: MISSIONI) e una durata
della missione che non ho misurato: corretti, e `rilascio.js` ora verifica che ogni voce di menu citata esista nel gioco.

## Limiti
- **Safari / iOS non verificato**: WebKit non è disponibile nell'ambiente. Il gioco richiede Safari/iOS 15+ (`aspect-ratio`);
  la pagina lo dice. Segnalazioni da quei dispositivi sono le più preziose.
- Il diario è per dispositivo e per browser; una navigazione privata lo perde. Niente statistiche aggregate: i rapporti
  arrivano uno a uno, a mano.
- La segnalazione GitHub richiede un account GitHub; in alternativa COPIA RAPPORTO.
- **GitHub Pages non è attivo** (`has_pages:false`): finché non si attiva da Settings → Pages (ramo `main`, dopo l'unione
  della PR), la pagina e il gioco si aprono solo da file o da un'altra ospitalità.
- Il blocco 3 (fumetti Tarsis, arte del NERIS, nuovo nemico/terreno) resta da fare.
