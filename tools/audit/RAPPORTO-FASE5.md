# Rapporto fase 5 — rilascio 0.9.0 (`builds/v2026-10-26`)

## Cosa è stato pubblicato (nel branch)

| | |
|---|---|
| Build | `builds/v2026-10-26/index.html`, 762 KB, un file solo, nessuna richiesta di rete |
| Metadati | `builds/v2026-10-26/build.json` (0.9.0, 2026-10-26) |
| Indice | `index.html` della radice: la nuova build in cima come «ultima», la 0.8.0 resta apribile sotto |
| Versione nel gioco | il footer del menu diceva «BUILD 0.4 · GREYBOX» mentre l'indice dichiarava 0.8.0: ora «BUILD 0.9.0 · PROTOTIPO» |
| Cartella | rinominata dalla data di lavoro (`v2026-10-25`) alla data di rilascio, riferimenti nei rapporti aggiornati |

La 0.8.0 (`builds/v2026-09-16`) non è stata toccata. **Non ho creato una pull request**: per pubblicare il sito
bisogna portare il branch `claude/epic-hamilton-kggpv2` nel ramo da cui il sito si serve.

## Controlli di rilascio

`rilascio.js` parte dall'indice come un visitatore: ogni link si apre; indice e `build.json` coincidono (versione,
data, titolo, novità); la dimensione dichiarata coincide col file (762 KB); la versione mostrata nel gioco coincide;
nessuna richiesta di rete, nessun errore di console, nessuno script o stile esterno, zoom non bloccato.
`migrazione.js`: le due build condividono la chiave di salvataggio, quindi si è provato in entrambe le direzioni.

- **Avanti:** una campagna scritta dalla 0.8.0 si apre nella 0.9.0 senza perdere niente (nodi, frammenti, sigilli,
  trasmissioni viste); Tarsis resta chiuso e si apre da solo quando si contengono i due guardiani.
- **Indietro** (campagna della 0.9.0 riaperta nella 0.8.0): nessuna perdita, ma **la mappa risulta vuota** finché non
  si sceglie una scheda di settore, perché la build vecchia non conosce «tarsis». Limite noto, non corretto (non ho
  modificato una build già pubblicata).

Batteria completa sul rilascio, tutta verde: `layout.js` 24/24 · `ui.js` 0 problemi · `missions.js idle|aggro` 23
missioni senza errori · `flows.js` · `settore3.js` · `backup.js` · `a11y.js` · `riprendi.js` · `migrazione.js` · `rilascio.js`.

## Una modifica di gioco dell'ultimo momento

**o7 (evacuazione di Orvat): tetto di 4 nemici** (`maxNemici`, manopola nuova del generatore). Il generatore riempie sempre
fino a 8 nemici, quindi abbassare il budget non toglieva nessuno (provato: 19, 15 e 12 danno lo stesso). Con tetto 4,
stato «campagna», nemesi dormiente: esperto 13% → 45%, medio 48%, novizio 33%. Tetti 5 e 3 provati e scartati.
È l'unica modifica di contenuto della fase.

## La scoperta più importante della fase: la nemesi non era nel banco

Giocando la campagna intera col flusso vero (`campagna.js`) l'agente restava bloccato su nodi che il banco dava per
vincibili. Causa: dopo la prima missione **PALINSESTO si sveglia e compare in ogni missione di campo**, con un adattamento
in più a ogni vittoria, e il banco sostituisce `finish()` quindi non la svegliava mai. Misurato aggiungendola
(`sim.js --nemesi N`, nodo giocato per ultimo nel settore, esperto, 30 semi):

| | dormiente | nemesi 2 | nemesi 4 |
|---|---|---|---|
| media sulle 23 missioni | **68%** | **52%** | **49%** |
| m5 (guardiano Cassandra) | 100% | 40% | 40% |
| o1 · t1 (eliminazione) | 80% · 80% | 33% · 43% | 23% · 27% |
| m2 · t2 (relay) | 37% · 20% | 20% · 20% | 17% · 17% |
| t7 (guardiano finale) | 80% | 73% | 70% |
| m7 · o5 · t4 (terreno) | 97 · 93 · 100% | 100 · 93 · 100% | 100 · 90 · 100% |

Conseguenze, in ordine di importanza:
1. **I valori assoluti delle fasi 2 e 3 sono ottimistici** (avviso aggiunto in testa a quei rapporti). I confronti
   prima/dopo restano validi.
2. Le missioni di **eliminazione** sono le più colpite: PALINSESTO conta fra i Kaucha da abbattere, e ridurla a zero
   «la respinge», non la elimina. Da guardare con giocatori veri: è una scelta di design, non la tocco.
3. Il **guardiano m5** a 40% con nemesi sveglia contro 100% dormiente: il primo guardiano è molto più duro di come
   appariva. Il guardiano finale (t7) regge meglio (70–80%).
4. Resta vero che l'agente **non spende i frammenti, non usa abilità né Lazy J**: un giocatore vero ha più strumenti.
   Quindi 50% non significa «la campagna è ingiocabile». Significa che **va provata da persone, a partire da m5 e dalle
   eliminazioni**.

`campagna.js`: in due esecuzioni dello stesso comando la campagna intera si è conclusa una volta (23/23, i tre settori in
catena, «CATENA RECISA», stato identico dopo il ricaricamento) e si è fermata a o2 un'altra: coerente con ~50% per
missione e con la corsa contro la corruzione. Il test controlla l'integrità del flusso, non pretende la vittoria.

## Non fatto / limiti

- Nessuna prova con giocatori veri, né con lettori di schermo veri, né su Safari/iOS (vedi rapporti 1 e 4).
- Alto contrasto e daltonismo, nuovo terreno, fumetti per Tarsis, arte originale del NERIS, musica.
- Tornando alla 0.8.0 dopo aver giocato Tarsis la mappa è vuota finché non si sceglie una scheda settore.
- La cartella `tools/` e i rapporti sono nel repository e quindi serviti dallo stesso sito: sono pagine inerti,
  ma volendo si possono spostare fuori dal ramo di pubblicazione.
- `CATENA RECISA` compare alla caduta del Varco Madre anche se l'unità PALINSESTO non è stata abbattuta in quella
  battaglia (`nemesis.dead` resta falso): incoerenza del gioco originale, senza conseguenze a campagna chiusa.
