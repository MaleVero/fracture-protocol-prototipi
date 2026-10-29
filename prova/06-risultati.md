# Raccogliere e leggere i risultati

## Raccogliere

Per ogni persona, due testi che ti manda lei:

1. **Le risposte al questionario** (pulsante «Copia le risposte»: comincia con `=== QUESTIONARIO FRACTURE PROTOCOL v1 ===`).
2. **Il rapporto del gioco** (Opzioni → Prova e segnalazioni → Copia rapporto: comincia con `FRACTURE PROTOCOL — RAPPORTO DI PROVA`).

Mettili in una cartella, un file per testo, **il nome comincia con il codice**:

```
risultati/
  T01-questionario.txt
  T01-rapporto.txt
  T02-questionario.txt
  ...
```

(Un file con i due testi incollati uno dopo l'altro va bene lo stesso; senza codice nel nome, vale quello scritto nel questionario.) Le schede delle sessioni osservate restano a parte.

## Leggere

```
node tools/prova/aggrega.js risultati
```

Stampa un riepilogo in Markdown (`--json` per i dati grezzi). Per provarlo senza dati veri: `node tools/prova/aggrega.js tools/prova/esempi` (persone e numeri inventati).

Il riepilogo ha un **semaforo** (✓ nei limiti, ~ da guardare, ✗ sotto la soglia, ? mancano i dati) e poi, sotto, le tabelle: cosa hanno capito (con le risposte sbagliate più scelte), le medie divise fra chi conosce il genere e chi no, le missioni del diario (partite, vittorie, ritirate, giudizi) e le frasi loro.

### Come non leggerlo male

- Con meno di 8 persone ogni percentuale ha un intervallo largo (lo trovi accanto). Un 50% su 6 persone vuol dire «non lo so».
- Leggi prima le **frasi** e le **risposte sbagliate più scelte**, poi i numeri: dicono *cosa* non funziona, i numeri solo *quanto*.
- Confronta **esperti e novizi**: se gli esperti si divertono e i novizi no, il cuore del gioco regge e l'avvio no; se si annoiano gli esperti, il problema è più profondo.
- Una cosa che **tre persone indipendenti** dicono con parole diverse è quasi sicuramente vera. Una che dice una persona sola, può essere un gusto.
- Le sessioni osservate pesano più dei questionari: la gente risponde bene a un test dopo che ha giocato, ma si è già fermata dove si è fermata.

## Decidere

| Cosa vedi | Cosa significa | Cosa fare, in ordine |
|---|---|---|
| Prima missione persa da più del 30%, o aiuti dati nelle prime due | l'avvio non insegna | 1) guardare dove si sono fermati (scheda, momenti 2–9); 2) tutorial o trasmissioni più mirate; 3) alleggerire la missione 1 |
| «Intento» giusto sotto il 70% | le caselle rosse non dicono «questo colpirà» | rendere più forte il segnale prima del turno; testarlo sulla persona che sbaglia |
| «Risonanza» giusta sotto il 50% | Lazy J è un sistema che il gioco non spiega | primo intervento guidato; testo della barra; collegare l'effetto al risultato |
| «Anello rosso» giusto sotto il 50% | l'élite non si capisce | legenda nel briefing e nel Codice, un nome sul pannello |
| Divertimento basso fra gli **esperti** | il cuore non regge | rileggere «frustrante» e «cambiare»; **non** è un problema di grafica |
| Divertimento basso solo fra i novizi | normale per il genere, ma controlla l'avvio | più accompagnamento nelle prime tre missioni |
| DURA > 35% o difficoltà percepita > 3,5 | troppo duro | abbassare la minaccia delle missioni indicate, non di tutte |
| FACILE > 25% | troppo facile | alzarla dopo la missione 3, non all'inizio |
| Una missione con vittorie < 40% o > 90% (con almeno 6 partite) | missione sbagliata | ritararla: è un dato utile anche con pochi tester |
| Leggibilità bassa e creature che si confondono | una coppia di sagome si scambia | guardare quali nomi citano nelle frasi, confrontarle nella Galleria arte |
| Errori nei rapporti («ERRORI RECENTI») | bug | prima di qualunque altra cosa |
| NPS basso con divertimento alto | manca qualcosa attorno al gioco | musica, varietà di mappe, sensazione di progressione: leggere «cambiare» |
| Wishlist «forse» alto | interessa, ma non basta | il materiale di presentazione (immagine di copertina, trailer, demo) conta più del gioco |

Il principio è sempre: **prima ciò che impedisce di capire, poi ciò che toglie il divertimento, poi il resto.**

## Dopo

1. Scrivi in una pagina i **tre problemi più ricorrenti**, ciascuno con almeno due fonti (una sessione osservata e una risposta).
2. Correggi quei tre, non trenta.
3. Rigenera il pacchetto e riscrivi a chi si è offerto di rivedere: un secondo giro con 5 persone, di cui 2 del primo, dice se hai migliorato qualcosa o solo cambiato.
4. Se vuoi che lavori sui risultati con te: incollami il riepilogo di `aggrega.js` e le tre cose più importanti di ogni scheda. Posso metterli in relazione con il codice e proporre i cambiamenti, ma le decisioni sul gioco restano tue.
