# Prova con persone: il materiale

Tutto quello che serve per far giocare FRACTURE PROTOCOL a persone vere e capire cosa funziona. Si può fare in una settimana, da soli.

## Da dove cominciare (dieci minuti)

1. Leggi **[01-piano.md](01-piano.md)**: cosa vuoi imparare, chi invitare, quante persone, e quali numeri contano.
2. Metti il gioco online con **[05-distribuzione.md](05-distribuzione.md)** (tre modi, il più veloce è trascinare una cartella su Netlify Drop).
3. Invia gli inviti con i testi di **[02-inviti.md](02-inviti.md)**.
4. Con le prime persone fai una **sessione osservata**: **[03-sessione-osservata.md](03-sessione-osservata.md)** e la **[scheda](04-scheda-osservazione.md)** da compilare mentre guardi.
5. Alle altre dai solo il link: giocano da sole e compilano il questionario.
6. Raccogli i testi e leggi i risultati con **[06-risultati.md](06-risultati.md)**.

## Che cosa c'è

| File | A cosa serve |
|---|---|
| `01-piano.md` | obiettivi, ipotesi, soglie, chi reclutare, calendario, regole |
| `02-inviti.md` | messaggi pronti da copiare (amici, community, promemoria, grazie) e testo di consenso |
| `03-sessione-osservata.md` | copione minuto per minuto, cosa dire e cosa non dire |
| `04-scheda-osservazione.md` | tabella da stampare o copiare, con i momenti del gioco da guardare |
| `05-distribuzione.md` | come far arrivare il gioco ai tester (e cosa fare con gli iPhone) |
| `06-risultati.md` | come raccogliere e leggere i dati, e cosa decidere |
| `questionario.html` | il questionario di fine prova (10 minuti): non invia nulla, si copia da sé |
| `../provare.html` | la pagina «Come provarlo» che vede il tester |
| `../tools/prova/aggrega.js` | mette insieme questionari e rapporti del gioco in un riepilogo |
| `../tools/prova/pacchetto.js` | crea la cartella (e lo .zip) da mettere online |

## Come funziona la raccolta dati

Il gioco non invia niente: nessuna rete, nessun account. Ci sono due testi che il tester **copia e ti manda lui**:

- il **rapporto del gioco** (Opzioni → Prova e segnalazioni → Copia rapporto): dispositivo, schermo, diario delle ultime missioni con esito, round, mech persi e il giudizio FACILE/GIUSTA/DURA;
- le **risposte al questionario** (pulsante «Copia le risposte»).

`node tools/prova/aggrega.js cartella-con-i-testi` li mette insieme. Per provarlo subito: `node tools/prova/aggrega.js tools/prova/esempi` (dati inventati).

## Onestà sui numeri

Con 6–12 persone non si fa statistica: si scoprono **problemi** (uno basta, se è grave) e si vedono **tendenze**. Ogni percentuale nel riepilogo ha il suo intervallo di confidenza, e per questo ho scritto le soglie come «da guardare» e non come verdetti. La parte più preziosa di tutta la prova sono le **sessioni osservate**: vedere dove una persona si ferma vale più di qualsiasi scala da 1 a 5.
