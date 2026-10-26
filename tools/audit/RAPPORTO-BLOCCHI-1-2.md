# Rapporto blocchi 1 e 2 — misure più realistiche e calibrazione di PALINSESTO

Dopo la PR (fase 5) con 72$ di credito rimasti. Tutto nel branch della PR, build `v2026-10-26` (ancora 0.9.0: non pubblicata).

## Blocco 1 — l'agente usa abilità e Lazy J

`agent.js` ora gioca anche le **abilità dei telai** (una per battaglia, con o senza bersaglio, dopo il movimento) e gli
**interventi di Lazy J** (SCOSSA NERA, GUSCIO, STRAPPO), valutandoli sulla copia dello stato come ogni altra azione. Ogni
abilità ha un costo nel punteggio (deve rendere più di un attacco) e la risonanza spesa pure (alza la nemesi). Livelli:
esperto = abilità + Lazy J, medio = solo abilità, novizio = niente. Si spengono con `--weights '{"abilita":0,"lazyj":0}'`.

**Il punto delicato è la risonanza.** La barra è UNA per tutta la campagna (tetto 100, –6 a missione se non la tocchi),
mentre il banco la riportava a zero a ogni missione: 2–9 interventi a partita non sono sostenibili su 23 missioni.
Nuova opzione `--ris N`: margine per Lazy J = 100 – N.

Esperto, 30 semi, PALINSESTO sveglia (2 evoluzioni), nodo giocato per ultimo nel settore (caso peggiore). Build prima dei blocchi:

| gruppo | niente | + abilità | + Lazy J, margine 8 | margine 22 | margine 50 |
|---|---|---|---|---|---|
| guardiani (m5 o4 t7) | 51% | 57% | 40% | 67% | 69% |
| eliminazione (m1 o1 t1) | 59% | 60% | 46% | 85% | 89% |
| relay (m2 o2 t2) | 28% | 29% | 33% | 41% | 47% |
| evacuazione (m8 o7) | 28% | 30% | 30% | 44% | 50% |
| rift (m3 m4 o3 t3) | 45% | 49% | 53% | 61% | 63% |
| terreno (m7 o5 t4) | 98% | 97% | 98% | 99% | 99% |
| recupero (m6 o6 t5) | 59% | 67% | 65% | 73% | 76% |
| demolizione (o8 t6) | 42% | 47% | 57% | 63% | 60% |
| **media 23 missioni** | **52%** | **55%** | **53%** | **67%** | **70%** |

Lettura onesta:
- Le **abilità** valgono poco (+3 punti). Lazy J vale molto (+15) **solo** con 22 o più punti di risonanza per missione, cioè
  circa 5 volte quello che la barra sostiene mediamente. Con un consumo sostenibile (8) il vantaggio sparisce.
- Quindi **il ~50% non era in gran parte un limite dell'agente**: per un esperto che non spende più risonanza di quanta ne
  produca la campagna, la nemesi sveglia resta il problema principale. Per giocare meglio, il giocatore deve concentrare Lazy J
  sui momenti chiave (guardiani, eliminazioni), cosa che il banco non modella.
- Anomalia da non leggere come dato di gioco: **t7** peggiora con le abilità (73% → 43%): l'agente a un passo le usa male
  contro i NERIS (immuni all'acqua). È un limite dell'agente.
- Non modellato: spendere i frammenti in moduli e telai, e ogni scelta fra squadre diverse.

## Blocco 2 — calibrazione di PALINSESTO

Due modifiche, entrambe coerenti col testo del gioco e verificate da `nemesi.js`:

1. **PALINSESTO non conta fra i Kaucha da abbattere** per eliminazione, sopravvivenza e chiusura del rift (`checkEnd`).
   Il gioco dice «ucciderla, non qui»: ridurla a zero la *respinge*, e nelle missioni «elimina tutti i Kaucha» di fatto
   obbligava a respingerla. Respingerla resta possibile e conviene: se la respingi non cresce (`finish`). Il guardiano si vince
   ancora abbattendo il Varco Madre, invariato.
2. **La nemesi sveglia occupa un posto nel tetto dei nemici** (tetto 8 → altri 7), invece di sommarsi a 8.

Esperto, stessa configurazione, prima → dopo entrambe:

| gruppo | niente | con abilità + Lazy J (margine 8) |
|---|---|---|
| eliminazione (m1 o1 t1) | 59% → **79%** | 46% → **84%** |
| rift | 45% → 48% | 53% → 60% |
| recupero | 59% → 62% | 65% → 71% |
| demolizione | 42% → 48% | 57% → 52% |
| guardiani, relay, evacuazione, terreno | invariati (±1) | invariati (±3) |
| **media 23 missioni** | **52% → 57%** | **53% → 60%** |

Provato e **scartato**: ammorbidire SOVRACCARICO (+3 PV/+1 danno ripetuto: al livello 5 la nemesi ha 19 PV e fa 7 danni).
Varianti +2 PV/+1 danno e +4 PV/+0 danno, a livello 4, 40 semi: guardiani 34% / 38% / 40% — differenze dentro il rumore
(±10 punti per missione). Senza evidenza non l'ho toccato. Resta però un numero da guardare con giocatori veri: con tendenze
neutre la crescita è lineare e il danno supera i PV di qualunque mech già al livello 2.

## Cosa resta aperto

- **Guardiani (40–50%), relay (28–35%), evacuazione (30%)** non si muovono con queste leve. I relay e l'evacuazione erano
  bassi anche con la nemesi dormiente (fasi 2 e 3). Non so se è difficoltà vera o limite dell'agente: serve la prova con persone.
- Il banco continua a non spendere frammenti né a scegliere squadre.
- `--nemesi 2 --progress ultimo --ris 92` è la configurazione che consiglio per cifre vicine alla campagna vera.

## Come rilanciare
```
node sim.js --seeds 30 --jobs 4 --skill esperto --progress ultimo --nemesi 2 --ris 92 --out out/x.json
node sim.js ... --weights '{"abilita":0,"lazyj":0}'     # come prima dei blocchi
node sim.js ... --init "ADAPT.overload.apply=u=>{u.maxHp+=2;u.dmg+=1;}"   # variante senza toccare la build
node confronto2.js "prima=a" "dopo=b"                    # per tipo di missione, da out/a.json e out/b.json
node nemesi.js                                           # PALINSESTO nelle condizioni di vittoria e nel tetto
```
