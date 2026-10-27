# Rapporto sfogo — la risonanza che scende (build `v2026-10-26`, 0.13.0)

## Il difetto
`sfogaRisonanza()` era definita e **mai chiamata**: la risonanza di Lazy J saliva a ogni intervento e non scendeva mai,
esattamente la «barra a senso unico» che lo sfogo doveva evitare (commento di progetto: «la rinuncia diventa una mossa»).
Le tavole e le prove di prova avevano già descritto la regola come funzionante.

## Cosa fa ora
- In `finish()`, **una volta per missione chiusa** (vinta, persa o sganciata), se Lazy J non è intervenuto la risonanza
  scende di 6 (`SFOGO`), mai sotto zero. Il resoconto dice «Lazy J non è intervenuto: la risonanza scende di X (ora Y)».
- **Dopo** l'evoluzione della nemesi: questa legge la banda com'era *durante* la missione. Chi ha giocato a CONVERGENZA paga
  tre adattamenti anche se poi la barra si scarica (provato: 76 → 3 adattamenti, poi 70).
- «È intervenuto» sta in `B.mission.lj`, che il checkpoint salva: **un ricaricamento a metà missione non fa scattare lo
  sfogo** a chi ha già fatto un intervento. Il flag globale `risonanzaUsata` non sopravvive al ricaricamento ed è rimasto
  solo come compatibilità.
- La terza tavola di Lazy J torna a dire che chiudere una missione senza usarlo la fa scendere.

## Misura (campagne intere, flusso vero con `finish` reale, la barra persiste fra le missioni)
Nuovo `sfogo.js` e opzione `keepRis` in `agent.js`: finora il banco azzerava la risonanza a ogni missione e non poteva vedere
niente di tutto questo. Agente «esperto» (abilità + Lazy J), 12 campagne per variante, stessi semi, 23 nodi, riprova le perse
(max 6 tentativi per missione). «Spento» = comportamento della 0.12.0.

| profilo di Lazy J | sfogo | campagne concluse | vittorie per giocata | giocate con intervento | interventi/giocata | risonanza a fine | banda CONVERGENZA |
|---|---|---|---|---|---|---|---|
| normale | spento | 12/12 | 79% | **19%** | 0,40 | 97 | 81% |
| normale | **6** | 12/12 | 82% | **49%** | 0,79 | 94 | 86% |
| parsimonioso (costo ×2,5, max 1) | spento | 11/12 | 79% | 26% | 0,43 | 96 | 72% |
| parsimonioso | **6** | 11/12 | 74% | 48% | 0,70 | 84 | 63% |
| vorace (costo ÷4, max 3) | spento | 11/12 | 78% | 11% | 0,45 | 97 | 93% |
| vorace | **6** | 12/12 | 81% | 48% | 0,79 | 93 | 93% |
| normale | 12 | 12/12 | 81% | 56% | 1,02 | 89 | 75% |
| normale | 20 | 11/12 | 79% | 61% | 1,25 | 82 | 65% |

Cosa dice:
- **Il bug aveva un effetto reale e grosso: senza sfogo la barra arriva al tetto verso la giocata 11 e Lazy J resta
  bloccato** (`risonanza + costo ≤ 100`): solo 11–26% delle giocate vedevano un intervento. Con lo sfogo quasi il 50%.
  È la meccanica che il gioco dichiarava, adesso presente.
- **La difficoltà per l'agente non cambia**: le vittorie stanno fra 74% e 82% in tutte le righe, dentro il rumore
  (errore ≈ ±2,5 punti sul totale, ±9 sulla singola riga). Anche con 12 o 20 al posto di 6 niente si muove.
- **6 non basta a far pesare la rinuncia**: un esperto che usa Lazy J circa una missione su due tiene la barra fra 85 e 95
  e finisce a CONVERGENZA quasi sempre (86%). Solo un giocatore parsimonioso arriva più in basso (63%). Per questo
  tengo il valore documentato (6) e **non lo cambio**: non c'è un'evidenza che serva, e il valore giusto dipende da come lo
  usano le persone — non da un agente che spende per punteggio.

## Cosa questa misura NON dice
- L'agente non sceglie *quando* usare Lazy J (guardiani, eliminazioni): decide missione per missione con un prezzo fisso.
  Una persona che lo conserva per i momenti chiave potrebbe tenere la barra molto più bassa; il banco non lo modella.
- Le misure per missione di `RAPPORTO-BLOCCHI-1-2.md` (`--ris N`) restano valide: simulano una barra a livello fisso.
- 12 campagne per riga: ±9 punti sulla singola riga, ±2,5 sul totale di ~320 giocate.

## Come rilanciare
```
cd tools/audit
node sfogo-test.js                               # il comportamento: 9 controlli
node sfogo.js --seeds 12 --jobs 2                # campagne intere, sfogo spento e acceso
node sfogo.js --seeds 12 --sfogo on --sfogoval 12
node sfogo.js --seeds 12 --weights '{"risPrezzo":3,"maxLJ":1}'     # giocatore parsimonioso
```
