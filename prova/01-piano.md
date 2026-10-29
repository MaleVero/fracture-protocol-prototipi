# Piano della prova

## A cosa serve

Finora il gioco è stato misurato solo da un agente automatico: sa dirti se le regole reggono, non se una persona le capisce o si diverte. Questa prova risponde a cinque domande, **in quest'ordine**: se la prima è no, le altre non contano.

| # | Domanda | Come lo vedo | Soglia di partenza |
|---|---|---|---|
| 1 | **Si capisce?** Una persona nuova arriva a giocare senza aiuto? | prima missione vinta; 5 domande di comprensione; sessione osservata | prima missione vinta da ≥ 70%; risposte giuste ≥ 70% |
| 2 | **Diverte?** Vuole giocare ancora? | «voglia di un'altra missione» e «divertimento» (1–5); quante missioni gioca da sola | media ≥ 4 su entrambe |
| 3 | **La difficoltà è giusta?** | giudizi di fine missione; difficoltà percepita; vittorie per missione | GIUSTA ≥ 50%, DURA ≤ 35%, FACILE ≤ 25% |
| 4 | **Si legge?** Creature, intenti, élite, interfaccia | domande su campo/creature (1–5); confusioni osservate | media ≥ 4 |
| 5 | **Lo comprerebbe?** | consiglierebbe (0–10), wishlist, prezzo | NPS ≥ 30; wishlist «sì» ≥ 40% |

Le soglie stanno in `tools/prova/spec.json` e sono un **punto di partenza**, non una legge: cambiale prima di cominciare, non dopo aver visto i numeri.

## Chi invitare e quanti

Obiettivo: **9–12 persone**, in tre gruppi. Ognuno con una funzione:

- **A. Giocatori di tattici a turni** (Into the Breach, XCOM, Fire Emblem, Advance Wars, Wargroove…), 3–4 persone. Dicono se il design ha qualcosa di nuovo e dove annoia chi conosce il genere.
- **B. Giocatori generici**, 3–4 persone. Sono il grosso del pubblico Steam: se capiscono loro, il gioco si capisce.
- **C. Chi gioca poco o niente**, 2–3 persone. Non sono il pubblico, ma mostrano senza pietà dove l'avvio spiega male.

Evita di far provare solo amici stretti: tendono a dire «bello». Dai a tutti lo stesso permesso: *«Mi serve sapere dove non funziona. Se ti annoi, dimmelo.»*

Almeno **una persona con iPhone** (Safari): il gioco non è mai stato provato lì.

## Due modi di provare

- **Sessione osservata** (30–40 minuti, 5–6 persone, in persona o in videochiamata con schermo condiviso): tu guardi e non aiuti. È la parte che insegna di più. Guida in `03-sessione-osservata.md`.
- **Prova da soli** (10–12 persone): ricevono il link, giocano quando vogliono, copiano il rapporto del gioco e le risposte al questionario. Più volume, meno profondità.

Mescola: le prime persone osservate, poi le altre da sole. Dopo le prime 3 sessioni osservate fermati un giorno e rileggi cosa è emerso: se tre persone su tre inciampano sullo stesso punto, non serve la quarta.

## Una settimana

| Giorno | Cosa |
|---|---|
| 1 | Metti il gioco online (`05-distribuzione.md`), prova tu il link da telefono e da computer, invia gli inviti |
| 2–4 | Sessioni osservate (2 al giorno al massimo: dopo non osservi più bene) |
| 5 | Pausa: rileggi le schede, scrivi i 3 problemi più ricorrenti |
| 5–6 | Mandano il link alle persone da sole; promemoria dopo 2 giorni |
| 7 | Raccogli i testi, `aggrega.js`, decidi (`06-risultati.md`) |

## Le regole del gioco della prova

1. **Una sola versione per tutti.** Non cambiare il gioco tra un tester e l'altro, o non sai più cosa hai misurato. Annota i problemi, correggili alla fine. (Fa eccezione un errore che impedisce di giocare.)
2. **Non spiegare, non difendere.** Se non capiscono qualcosa, quello è il dato. Se ti viene voglia di dire «ma lì c'è scritto…», segna il punto sulla scheda e stai zitto.
3. **Non misurare te stesso.** Il questionario fa domande sul gioco, non sulla persona.
4. **Niente dati personali.** Codici (T01, T02…), niente nomi nei file.
5. **Dì il tempo.** «Ti ruberò 30 minuti» e rispettalo.

## Cosa NON puoi concludere

- **«Venderà»:** con 10 persone, a cui hai chiesto un favore, nessuno può dirti questo. Il dato più vicino è se *giocano ancora* quando hai smesso di osservarli.
- **Che il bilanciamento sia a posto:** 10 partite per missione non bastano. Servono per scoprire missioni sbagliate (tutti perdono, nessuno perde), non per tarare i numeri.
- **Che la grafica piaccia al pubblico Steam:** i tester vedono un prototipo in una finestra, non una pagina con trailer e immagine di copertina.

## Dopo la prova

Una tabella corta, in `06-risultati.md`, collega ogni risultato a una decisione. Il principio: **si sistema prima ciò che impedisce di capire, poi ciò che toglie divertimento, poi il resto**. Se il divertimento è basso fra chi conosce il genere, non è un problema di grafica e non lo si cura con la grafica.
