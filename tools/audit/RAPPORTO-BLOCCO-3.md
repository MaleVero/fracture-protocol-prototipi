# Rapporto blocco 3 — contenuto di Tarsis: RISACCA, NERIS ridisegnato, tavole (build `v2026-10-26`, 0.10.0)

## Cosa c'è di nuovo
- **RISACCA**, nuovo nemico di Tarsis (`KDEF.risacca`: 3 PV, mov 3, danno 1, contatto, `kb:2`). Non ferisce: **spinge di due
  caselle**. A Tarsis dietro di te c'è quasi sempre acqua, e l'acqua uccide anche i tuoi mech (`push()` vale per tutti).
  È il rovescio del NERIS: il NERIS nega la tua meccanica, la RISACCA te la rivolge contro. Usa solo il tratto `kb`
  che il motore già conosceva (VORN APEX, adattamento PISTONI): niente codice di battaglia nuovo, quindi la spinta è
  telegrafata come tutte (la proiezione della casella d'arrivo c'era già) e i GIROSCOPI D'ASSETTO la parano.
  Registrata in: `KDEF`, `ENEMY_COST` (3), `UNLOCK_AFTER` (0), `SAMPLE_BIO`, `CODEX`, `SIZE`/`SC`, `K_ART`, una trasmissione
  alla prima comparsa, pool di t3, t5, t6. Mai fuori da Tarsis (controllato).
- **NERIS ridisegnato**: non più «il Vorn con una pinna». Corpo allungato e liscio, coda a rondine, vela dorsale a tre
  raggi, due arti palmati, branchie, pelle teal (nel Vorn il teal è solo un accento). Letto sul campo a 3×: non si
  confonde con Vorn e Krull.
- **Tavole a fumetti**: `orvat` (apertura della cintura industriale, 3 tavole, scena nuova `cintura`: ciminiere, fumo, bagliore dei forni), `tarsis` (apertura, scatta alla prima volta che si apre la scheda del settore; 3 tavole) e `catena`
  (finale, fra il resoconto dell'ultimo guardiano e l'azzeramento della campagna; 3 tavole). Come le altre: una volta
  sola, sempre saltabili, vivono in `meta`. Testi con parti **lette dalla partita** (adattamenti di PALINSESTO, corpi
  riportati, innesti): il finale risponde con numeri veri alla domanda lasciata dalla tavola del guardiano di Cassandra.
  Due scene nuove nel motore delle tavole: `bacino` e `sorgente` (specchio d'acqua con riflesso e increspature,
  velatura alle caviglie), che rispettano `reduceMotion`.
- **Tap target** dei pulsanti delle tavole portati a 44 px (erano 37: difetto che c'era già, trovato da `blocco3.js`) e SALTA non va più a capo quando il titolo è lungo.
- Versione 0.10.0; indice, `build.json`, `provare.html` aggiornati.

## Misure (agente «esperto», caso peggiore: `--progress ultimo --nemesi 2 --ris 92`, 60 semi freschi, stessi semi)
| Nodo | prima | dopo |
|---|---|---|
| t1 eliminate | 70% | 70% |
| t2 survive | 40% | 40% |
| t3 closeRift | 52% | 53% |
| t4 terrainKill | 98% | 98% |
| t5 recover | 53% | 57% |
| t6 demolish | 58% | 52% |
| t7 boss | 17% | 17% |

Neutro: il blocco aggiunge varietà, non difficoltà misurabile. t1, t2, t4, t7 non toccano i pool.
Il primo tentativo (RISACCA al posto del GRUMO in t3 e t5) spostava t5 da 67% a 47%: il GRUMO era ciò che teneva lenti i
nemici sul relay. Ho provato tre sistemazioni dei pool con gli stessi 30 semi e tenuto quella più vicina alla base
(RISACCA al posto di VRAST in t3, di TRAHN in t5, di SAHIR in t6). Con 30 semi l'errore è ±9 punti: le tre differivano
meno di così, quindi la scelta è *la meno peggio*, confermata poi su 60 semi nuovi.

## Cosa questa misura NON dice
- **La RISACCA quasi non incide sull'agente**: 60 partite su t3/t5/t6/t7 (20 semi per nodo), **5 spinte reali sui mech, 4 mech
  morti** (3 in t6, 1 in t3). L'agente la vede arrivare (è telegrafata) e la evita o la uccide. Per un umano, che guarda
  la casella dietro di sé meno bene di un greedy con la copia dello stato, potrebbe pesare di più o essere frustrante.
  **Serve una prova con persone.** Due leve pronte, se serve: `kb:1` o `dmg:0`.
- Non ho provato RISACCA e NERIS insieme nel guardiano (t7 ha una coda fissa: NERIS, VORN, NERIS, KRULL, NERIS).
- Il banco non vede le tavole: verifica che si disegnino, non che emozionino.
- **Test `missions.js aggro` intermittente, anche sulla build precedente**: 1 esecuzione su 3 su `HEAD` segnala una
  missione «bloccata in fase env all'ultimo round» (m4, t3, o1, o5 a rotazione) mentre il gioco mostra già
  l'esito corretto. Sembra una corsa fra il banco e la fine missione, non un blocco del gioco, ma non l'ho indagata.

## Non fatto, e perché
- **Nuovo tipo di terreno**: ho scelto un nemico che usa una meccanica esistente invece di un terreno, perché un terreno
  nuovo tocca motore, telegrafia, generatore, disegno e accessibilità e *poi* va tarato: il costo è di un blocco intero, e
  il guadagno non è misurabile senza persone che giochino.
- Musica o suoni per le tavole.

## Come verificare
```
cd tools/audit
node blocco3.js [shots]     # 15 controlli: registro, spinta in acqua, giroscopi, 9 tavole, 320 px, finale (3 casi)
node blocco3-tavole.js      # un PNG per tavola in out/ (diagnostica visiva)
BUILD=<cartella-base> node sim.js --missions t1,t2,t3,t4,t5,t6,t7 --seeds 60 --seed0 100 --jobs 3 --progress ultimo --nemesi 2 --ris 92
```
