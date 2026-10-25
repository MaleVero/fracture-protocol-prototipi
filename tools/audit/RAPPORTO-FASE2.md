# Rapporto fase 2 — bilanciamento (build `v2026-10-25`)

## Come si è misurato

`agent.js` gioca le missioni dentro la pagina usando le funzioni del gioco (`pAttack`, `push`, `moveRange`,
`snapshot`/`restoreSnapshot` dell'annulla). A ogni turno prova ogni coppia (casella raggiungibile, bersaglio) di
ogni mech su una copia dello stato, valuta il campo dopo l'azione e applica la migliore. Il punteggio guarda:
nemici rimasti, vita dei mech, progresso dell'obiettivo e **quanto danno telegrafato cade sui mech**
(i Kaucha annunciano dove colpiranno, quindi l'esposizione è esatta).

`sim.js` lancia N partite per missione con semi diversi (il generatore usa `Math.random`, sostituito da un
generatore con seme: stessa missione e stesso seme → stessa partita). Tre livelli di abilità:

| Livello | Cosa cambia |
|---|---|
| esperto | vede tutte le minacce, sceglie quasi sempre la mossa migliore |
| medio | sottovaluta le minacce (×0,35) e sbaglia spesso |
| novizio | ignora le minacce telegrafate, gioca quasi a caso fra le mosse buone |

**Limiti dell'agente (importanti per leggere i numeri):**
- Non usa le abilità dei telai né gli interventi di Lazy J, quindi sottostima ciò che può fare un giocatore.
- Sfrutta l'informazione perfetta e il determinismo meglio di una persona, quindi la sopravvaluta altrove.
- Ricerca a un solo passo: non pianifica il round dopo.
- I numeri **non sono percentuali di vittoria di un giocatore reale**. Servono a confrontare missioni fra loro,
  a trovare campi in cui l'esito è deciso prima di giocare, e a misurare l'effetto di una modifica.

## Cosa è emerso (build originale, 40 semi per livello)

- **Missioni decise dal campo, non dal gioco.** Evacuazione (m8 33%, o7 15% anche da esperto) e missioni con relay
  (m2 55%, o2 65%, o6 63%) hanno percentuali quasi uguali per esperto, medio e novizio: la riuscita non dipende
  da come si gioca.
- **Evacuazione.** In 29 partite su 30 i civili sono già sotto tiro all'apertura, e muoiono nel primo round per
  colpo diretto di un VORN (26 morti su 30 partite in m8): il Kaucha li sceglie come prede e li raggiunge nel
  passo di telegrafia, prima che il giocatore veda il campo. Con ≤1 civile minacciato in m8 si vince 7 volte su 9;
  con ≥2, 2 volte su 21.
- **Relay.** Con minaccia ≥3 all'apertura (almeno due attaccanti su 2 PV) si perde quasi sempre (m2 0/4, o6 0/8).
- **Boss (m5, o4)** separano bene le abilità: 100/83/0% e 65/63/10%. Sono ben tarati.
- **Chiusura del rift (m3, m4, o3):** timeout dominante, ma sensibile alle priorità dell'agente (m4 35% → 78%
  con più peso sul rift): non è un difetto del gioco.
- **Missioni di terreno (m7, o5) e recupero (m6):** 95–100% a ogni livello, chiuse al round 2,5–4 su 7.
  Non ho cambiato niente: alzare di uno la quota in m7 e o5 ha portato solo un round in più (95/95/100%),
  quindi sarebbe stata una modifica senza effetto misurabile.

## Modifiche

Tutte in `builds/v2026-10-25/index.html`.

1. **Apertura giocabile nel generatore** (`aperturaProtetti`, usata da `valutaCampo`). Come `fasciaBersaglio` per
   il terreno, ma rivolta a ciò che si protegge. Dopo la telegrafia dei Kaucha (stessa `decidiMossa`, stato finto)
   scarta i campi in cui:
   - il danno telegrafato sul relay supera i suoi PV (`APERTURA_RELAY_MAX = RELAY_PV`), oppure
   - i civili sotto tiro superano il margine di perdita meno uno (civili − obiettivo − 1, minimo 1).
   `generateMission` somma l'eccesso allo scarto, quindi se in 80 tentativi non trova un campo buono tiene il migliore.
2. **`RELAY_PV`**: i PV del relay erano scritti a mano in tre punti; ora una costante, valore invariato (2).
   Provato a 3: nessun effetto (m2 63→65%, o2 70→70%, o6 80→73%, nel rumore), quindi ripristinato.
3. **Un civile in più nelle due evacuazioni**: m8 `civilians:[4,5]→[5,6]`, o7 `[5,6]→[6,7]`. L'obiettivo resta 3 e 4
   (testi invariati) ma il margine di perdita passa da 1–2 a 2–3.

## Prima / dopo (40 semi × 16 missioni, stesso agente, stessi semi)

| Missione | Obiettivo | PRIMA esp/med/nov | DOPO esp/med/nov | Δ esperto |
|---|---|---|---|---|
| m2 | survive | 55 / 50 / 43 | 60 / 55 / 48 | +5 |
| o2 | survive | 65 / 55 / 48 | 73 / 68 / 55 | +8 |
| o6 | recover | 63 / 68 / 53 | 80 / 85 / 70 | +17 |
| m8 | evacuate | 33 / 30 / 25 | **78 / 73 / 45** | +45 |
| o7 | evacuate | 15 / 15 / 10 | **53 / 48 / 35** | +38 |
| tutte le altre (11) | — | invariate | invariate (identiche al seme) | 0 |
| media 16 missioni | | 76 / 74 / 56 | 83 / 81 / 60 | |

Le undici missioni non toccate danno esattamente gli stessi esiti, seme per seme: conferma che il resto non è cambiato.
L'evacuazione, prima decisa dal campo, ora ha un gradiente di abilità.

## Regressione

`layout.js` 24/24, `ui.js` 0 problemi, `missions.js idle|aggro` 16 missioni senza errori JS, `flows.js` salvataggio ok.

## Resta aperto

- **Relay (m2, o2):** dopo il controllo d'apertura restano sconfitte nei round 2–5 (60–73%) quasi invariate fra i
  livelli. Non è l'apertura e non sono i PV; non so se è difficoltà vera o un limite dell'agente (un giocatore può
  usare blocchi con il corpo, abilità, Lazy J). **Serve una prova con persone.**
- **Missioni facili (m1, m6, m7, o1, o5):** 95–100% anche da novizio. Per m1 è giusto; per le altre è da decidere
  con giocatori reali, non con questo agente (che favorisce le spinte).
- **Stima «PROIBITIVO» del briefing:** m3 mostra squadra 276 contro minaccia 474, ma l'agente la vince al 98%.
  Il confronto del briefing sottostima la squadra e andrebbe ricontrollato.
- **Abilità e Lazy J non misurati.** Estendere l'agente a quelle azioni è il passo naturale per la fase successiva.

## Come rilanciare

```
cd tools/audit
node sim.js --seeds 40 --jobs 4 --skill esperto --out out/x-esperto.json   # ~1 min per livello
node sim.js --missions m8,o7 --seeds 40 --skill novizio
BUILD=v2026-09-16 node sim.js ...                      # build originale, per il confronto
node inspect.js out/x-esperto.json m8                  # perché si vince o si perde (cause di morte, minacce all'apertura)
node confronto.js out/prima out/dopo                   # tabella prima/dopo da file prima-*.json e dopo-*.json
```
