# tools/audit — banco di prova e rapporti

Strumenti Playwright (Chromium) usati nelle fasi 0–5. Si lanciano da questa cartella: `node <script>`.
Di default lavorano sull'**ultima** build in `builds/` (`BUILD=v2026-09-16 node ...` per un'altra).
Il playwright viene cercato come modulo, poi in `/opt/node-tools`; il browser in `/opt/pw-browsers/chromium` (variabile `CHROMIUM`).
I file generati (screenshot, JSON) vanno in `out/`, ignorata da git.

## Rapporti
`RAPPORTO-FASE0.md` audit · `FASE1` layout e accessibilità su schermi piccoli · `FASE2` bilanciamento ·
`FASE3` Tarsis e NERIS · `FASE4` checkpoint, copia di sicurezza, tastiera · `FASE5` rilascio e **limite della nemesi** ·
`BLOCCHI-1-2` abilità e Lazy J nell'agente, calibrazione di PALINSESTO · `BLOCCO-4` prova con altre persone · `BLOCCO-3` RISACCA, NERIS ridisegnato, tavole di Tarsis · `GRAFICA` identità di settore, effetti, tavole, esito · `SFOGO` la risonanza che scende, misurata su campagne intere · `GRAFICA-2` codice, briefing, menu, hangar, mappa, targa, icona · `GALLERIA` pagina di confronto di telai e creature. · `GRAFICA-3` Comando e Opzioni rifiniti · `GRAFICA-4` Codice, Officina e Ricerca rifiniti · `GRAFICA-5` fine missione · `GRAFICA-6` menu e Hangar · `GRAFICA-7` mappa e campo · `GRAFICA-8` pannello di Lazy J · `GRAFICA-9` rifinitura finale · `MODELLI` modelli dei Kaucha, élite per bandiera

## Verifiche (devono finire con «tutti i controlli passati» / «ok»)
| Script | Cosa controlla |
|---|---|
| `layout.js [shots]` | campo e comandi in battaglia in 12 formati × trasmissione aperta/chiusa |
| `ui.js [shots]` | 9 schermate × 4 formati: overflow, elementi fuori schermo, bersagli di tocco, testo piccolo |
| `missions.js idle\|aggro` | tutte le missioni partono e finiscono, senza errori JS (UI reale) |
| `flows.js` | salvataggio, scelta «tieni il campo / sganciati», ripresa dal menu |
| `settore3.js` | sblocco a catena, mappa, codice, salvataggio di Tarsis |
| `raggiungibilita.js` | i guardiani a configurazione fissa sono raggiungibili a contatto |
| `riprendi.js [--sabota]` | ripresa da checkpoint == partita continua (con controllo negativo) |
| `backup.js` | copia di sicurezza: esporta, svuota, ripristina, rifiuta file sbagliati |
| `a11y.js [shots]` | nomi dei controlli, tastiera, annunci, m1 vinta con la sola tastiera |
| `migrazione.js` | salvataggi fra build diverse, avanti e indietro |
| `rilascio.js` | l'indice e `build.json` coincidono, ogni link si apre, nessuna rete; `provare.html` raggiungibile, leggibile a 320 px, coerente col gioco |
| `campagna.js` | campagna intera col flusso vero (diagnostica: l'esito dipende dall'agente) |
| `nemesi.js` | PALINSESTO fuori dalle condizioni di vittoria, tetto dei nemici, guardiano invariato |
| `galleria.js` | galleria arte: una scheda per ogni telaio/creatura/struttura, pose, pavimenti, confronto a due, altezze, sagome, somiglianze, stato della battaglia intatto |
| `comando.js` | Comando e Opzioni: schede di settore con i nodi veri, sei numeri della campagna, profilo di Lazy J a quattro livelli di risonanza, dossier della nemesi, XP dei piloti, interruttori (`role=switch`), cursori, piede con la build, a 320, 390 e 1000 px |
| `schede.js` | Codice, Officina e Ricerca: avanzamento del bestiario e rango, accenti per tipo di modulo, «mancano N» esatto, catena dei rami, sagome degli innesti, a 320, 390 e 1000 px |
| `esito.js` | schermata di fine missione: settore in testa, barre della corruzione col colore del cambiamento, una riga per ogni costo, somma delle ricompense = totale, saldo e campioni veri, valutazione in una riga, a 320, 390 e 1000 px |
| `menuhangar.js` | menu e Hangar: riga di sistema, badge e note delle voci dallo stato, ricostruzione al ritorno, quadro della squadra, statistiche a barre in scala, intestazione di baia, a 320, 390 e 1000 px |
| `mappa.js` | mappa e campo: legenda del fronte a barre (valori veri, perduto, fuori controllo), regole a un tocco, barra dei round in battaglia, a 320, 390 e 1000 px |
| `lazyj.js` | pannello di Lazy J in battaglia: banda, valore, soglie, tre tasti in una riga, tasto armato con anteprima del costo, disarmo, chiamata dell'intervento, FINE TURNO visibile, a 320, 390 e 1000 px |
| `bersagli.js` | rifinitura finale: nessun controllo sotto 44 px e nessun testo sotto 8,5 px su tutte le schermate, con testo al 160% niente esce dallo schermo, a 320, 390 e 1000 px |
| `contrasto.js` | rifinitura finale: tutto il testo visibile ha contrasto almeno 4,5:1 su tutte le schermate principali (390 e 1000 px) |
| `modelli.js` | modelli dei Kaucha: ingombro, moto di riposo per specie (fermo con «riduci movimento»), élite per bandiera (segni di rango, statistiche, generatore, budget, pannello, salvataggio), contrasto creatura/pavimento |
| `grafica.js` | testata dell'hangar, culla, codice con sagome, sfondo del menu, mappa, presenze nel briefing, targa di missione, icone: 3 formati |
| `shot-schermate.js [WxH] [id...]`, `icona.js` | anteprime di tutte le schermate; rigenera l'icona (PNG inline) |
| `sfogo-test.js` | sfogo della risonanza: -6 se Lazy J non interviene (vinta/persa/sganciata), non sotto zero, dopo la nemesi, sopravvive al ricaricamento |
| `sfogo.js` | campagne intere con la barra che persiste (misura, non un controllo): sfogo spento/acceso, profili di Lazy J |
| `effetti.js [shots]` | scenografia dei tre settori (pavimento di gioco invariato), effetti di colpo, spinta, tuffo, voragine |
| `shot-settori.js`, `shot-mappa.js` | anteprime del campo e della mappa nei tre settori (diagnostica visiva, `DSF=2 CLIP=1` per ingrandire) |
| `blocco3.js [shots]` | RISACCA (registro, spinta in acqua, giroscopi), tavole di Tarsis e del finale, 320 px |
| `prova.js [shots]` | diario, giudizio a fine missione, rapporto (nessun dato personale), copia/scarica, link GitHub, backup, pulsanti su 3 formati |

## Bilanciamento
`agent.js` è l'agente (prova ogni mossa su una copia dello stato). `sim.js` lo lancia in parallelo:
`node sim.js --seeds 30 --jobs 4 --skill esperto|medio|novizio --progress inizio|campagna|ultimo --nemesi -1|0..N --out out/x.json`.

⚠ **Per cifre vicine al gioco vero usare `--progress ultimo --nemesi 2 --ris 92`** (`--ris` = risonanza di partenza: margine per Lazy J = 100 – N; senza, la barra riparte da vuoto a ogni missione ed e' ottimistico). L'agente «esperto» usa ora anche abilità e Lazy J (`--weights '{"abilita":0,"lazyj":0}'` per il comportamento di prima). Variante senza toccare la build: `--init "codice js"`.

⚠ Vecchia indicazione, ancora valida come limite: `--progress ultimo --nemesi 2`: il default storico (`--progress campagna`,
nemesi dormiente) è ottimistico (media 68% contro ~50%). `inspect.js` spiega perché si vince o si perde,
`confronto.js` mette a tabella due serie di file, `probe*.js` e `primapartita.js` sono sonde.
L'agente non usa abilità né Lazy J e non spende frammenti: i numeri servono a confrontare, non a prevedere un giocatore.
