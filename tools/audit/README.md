# tools/audit — banco di prova e rapporti

Strumenti Playwright (Chromium) usati nelle fasi 0–5. Si lanciano da questa cartella: `node <script>`.
Di default lavorano sull'**ultima** build in `builds/` (`BUILD=v2026-09-16 node ...` per un'altra).
Il playwright viene cercato come modulo, poi in `/opt/node-tools`; il browser in `/opt/pw-browsers/chromium` (variabile `CHROMIUM`).
I file generati (screenshot, JSON) vanno in `out/`, ignorata da git.

## Rapporti
`RAPPORTO-FASE0.md` audit · `FASE1` layout e accessibilità su schermi piccoli · `FASE2` bilanciamento ·
`FASE3` Tarsis e NERIS · `FASE4` checkpoint, copia di sicurezza, tastiera · `FASE5` rilascio e **limite della nemesi** ·
`BLOCCHI-1-2` abilità e Lazy J nell'agente, calibrazione di PALINSESTO · `BLOCCO-4` prova con altre persone.

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
| `prova.js [shots]` | diario, giudizio a fine missione, rapporto (nessun dato personale), copia/scarica, link GitHub, backup, pulsanti su 3 formati |

## Bilanciamento
`agent.js` è l'agente (prova ogni mossa su una copia dello stato). `sim.js` lo lancia in parallelo:
`node sim.js --seeds 30 --jobs 4 --skill esperto|medio|novizio --progress inizio|campagna|ultimo --nemesi -1|0..N --out out/x.json`.

⚠ **Per cifre vicine al gioco vero usare `--progress ultimo --nemesi 2 --ris 92`** (`--ris` = risonanza di partenza: margine per Lazy J = 100 – N; senza, la barra riparte da vuoto a ogni missione ed e' ottimistico). L'agente «esperto» usa ora anche abilità e Lazy J (`--weights '{"abilita":0,"lazyj":0}'` per il comportamento di prima). Variante senza toccare la build: `--init "codice js"`.

⚠ Vecchia indicazione, ancora valida come limite: `--progress ultimo --nemesi 2`: il default storico (`--progress campagna`,
nemesi dormiente) è ottimistico (media 68% contro ~50%). `inspect.js` spiega perché si vince o si perde,
`confronto.js` mette a tabella due serie di file, `probe*.js` e `primapartita.js` sono sonde.
L'agente non usa abilità né Lazy J e non spende frammenti: i numeri servono a confrontare, non a prevedere un giocatore.
