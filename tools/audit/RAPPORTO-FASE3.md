# Rapporto fase 3 — contenuto: Settore TARSIS e il NERIS (build `v2026-10-25`)

## Cosa c'è di nuovo

**SETTORE TARSIS — «bacino sommerso»**, il terzo e ultimo settore. Si apre quando cade il guardiano di Orvat,
come gli altri. Il tema è l'acqua, che nel gioco è già un'arma: qui ce n'è ovunque, e arriva chi la attraversa.

| Nodo | Obiettivo | Cosa lo distingue |
|---|---|---|
| t1 CANALE DI SCOLO | elimina tutti | 4–6 caselle d'acqua; un NERIS garantito (presentazione) |
| t2 CHIUSA DI CALMA | relay per 6 round | il relay sta sulla riva; i NERIS arrivano dall'acqua |
| t3 POZZO DI RISALITA | chiudi il rift | il rift scarica nell'acqua; NERIS garantito |
| t4 DISSALATORE SEPOLTO | 5 uccisioni da terreno | pool a maggioranza NERIS: l'acqua non basta, servono voragini e cisterne |
| t5 STAZIONE DI POMPAGGIO | estrai 3 campioni (cavo + relay) | recupero con acqua |
| t6 CHIUSE ROTTE | abbatti 3 piloni | demolizione con acqua |
| t7 SORGENTE — TERZO VARCO | guardiano | due bacini ai lati, corridoio centrale; 3 NERIS e ondate dal rift |

Niente evacuazione: i civili scendono in colonna e l'acqua sbarra la colonna.

**NERIS** — il Vorn che ha imparato l'acqua. Stessi PV, movimento e danno del Vorn; in più `noDrown`: buttarlo in
acqua non lo uccide, lo sposta. Non è `noPush`: voragine, bordo e collisione restano aperte. Nega **una** meccanica,
non il gioco. Costa 3 nel generatore (il Vorn 2): `combatPower` pesa `noDrown` 20.
Registrato in: `KDEF`, `ENEMY_COST`, `UNLOCK_AFTER` (0: entra solo dai pool di Tarsis), `SAMPLE_BIO`, `CODEX`,
`SIZE`/`SC`, `K_ART` (`kNeris`: il Vorn più pinna dorsale e branchie). Due trasmissioni: apertura di Tarsis e prima
comparsa del NERIS.

**Catena dei settori derivata.** `applyUnlocks` ora apre il settore seguente quando il guardiano precedente è
contenuto, anche su un salvataggio scritto prima che Tarsis esistesse. `lastSector()` sposta il finale su t7
(«CATENA RECISA», PALINSESTO muore lì).

## Misure (40 semi, stato «campagna»: settori precedenti contenuti, antenati del nodo contenuti)

| Nodo | esperto | medio | novizio | round (esp) | mech persi (esp) | timeout (esp) |
|---|---|---|---|---|---|---|
| t1 eliminate | 90% | 90% | 80% | 4,6/6 | 0,03 | 10% |
| t2 survive | 50% | 45% | 33% | 4,4/6 | 0,00 | 0% |
| t3 closeRift | 60% | 58% | 20% | 6,2/7 | 0,30 | 40% |
| t4 terrainKill | 98% | 100% | 100% | 3,8/7 | 0,05 | 3% |
| t5 recover | 65% | 63% | 38% | 2,7/8 | 0,00 | 0% |
| t6 demolish | 53% | 40% | 40% | 5,9/7 | 0,28 | 48% |
| t7 boss | 83% | 48% | 5% | 10,6/12 | 0,50 | 15% |
| **media Tarsis** | **71%** | **63%** | **45%** | | | |

Confronto, stesso stato e stessi semi: Cassandra 86 / 81 / 61 · Orvat 62 / 61 / 41 · **Tarsis 71 / 63 / 45**. La curva
scende da Cassandra a Orvat e Tarsis è un passo equivalente a Orvat (non più duro); il guardiano è il più duro dei tre
solo nel gradiente di abilità (83 / 48 / 5), simile a o4 (73 / 53 / 10).

## Errori miei trovati misurando (e corretti)

1. **Guardiano t7, prima stesura:** lago chiuso a (4,3): il Varco Madre non era raggiungibile a piedi. L'esperto
   «vinceva» il 27% restando fuori portata, 73% di timeout. Rilevato dai timeout, confermato con `raggiungibilita.js`.
2. **Seconda stesura:** guado di una colonna: il tiro in linea del Varco ne copre tre e quella colonna era la
   traiettoria. Esperto 0%, 11 squadre annientate su 40.
3. **Terza stesura:** due bacini e corridoio di tre colonne: esperto 100% in 5 round, troppo facile. Con due NERIS
   in più nei bacini 0%; con **uno** in più 83 / 48 / 5. È la versione consegnata.

## Cosa questa misura NON dice

- **Lo stato «campagna» è un limite superiore di difficoltà.** L'escalation sale di 1,5 per nodo contenuto
  (budget fino a +10, élite nei pool) e nella realtà quei nodi vanno di pari passo con moduli, telai e piloti che il mio
  agente non ha. Lo stato «inizio» (solo m1 contenuta, usato in fase 2) è un limite inferiore. La verità sta in mezzo.
  Per questo nella fase 2 le missioni di Orvat risultavano più facili di come le incontra chi arriva in fondo.
- **o7 (evacuazione di Orvat)** passa dal 53% (stato inizio) al 13% (stato campagna). Provato di nuovo: budget 15 e 12,
  obiettivo a 3 sfollati, pool più leggero — nessun effetto (13–25%), quindi lasciato com'era. Va visto con giocatori.
- **t4 (terreno)** è vinto al 98–100% anche dal novizio: i NERIS ora sono la maggioranza e solo 0,3 uccisioni su 5
  avvengono per acqua, quindi il nodo cambia metodo, ma l'agente è molto bravo a spingere. Non so se un umano lo
  trova facile.
- **t2 (relay)** ripete lo schema di m2 e o2: 50 / 45 / 33, poco sensibile all'abilità. Le sconfitte arrivano nei round
  centrali, non all'apertura (il controllo d'apertura di fase 2 è attivo anche qui).
- **t3 e t6** perdono soprattutto a tempo (40–48% di timeout): sono missioni lente, non letali.

## Non fatto

Nuovo tipo di terreno; fumetto o tavole narrative per Tarsis (le trasmissioni sono due battute); musica; arte originale
del NERIS (è il Vorn con pinna e branchie); evacuazione in Tarsis. Il banco non vede abilità dei telai né Lazy J.

## Come verificare

```
cd tools/audit
node settore3.js shots      # sblocco a catena, mappa, codice, salvataggio: 15 controlli
node raggiungibilita.js     # i guardiani sono raggiungibili a contatto
node sim.js --missions t1,t2,t3,t4,t5,t6,t7 --seeds 40 --skill esperto
node sim.js --seeds 30 --progress inizio   # stato iniziale invece di campagna
```
