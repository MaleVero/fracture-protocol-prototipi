# Far arrivare il gioco ai tester

Il gioco è **un solo file HTML** (`builds/v2026-10-26/index.html`, ~900 KB): niente installazione, niente server, niente rete. Il problema è solo l'**indirizzo**: un file mandato in una chat o per email, su un telefono, spesso non si apre bene (anteprima senza script, download senza apertura). Serve un link web.

Il comando che prepara tutto:

```
node tools/prova/pacchetto.js
```

crea `tools/audit/out/pacchetto/` (e `pacchetto.zip`) con tre file: `index.html` (la pagina «Come provarlo»), `gioco.html` e `questionario.html`, già collegati fra loro. Il link che dai ai tester è **quello della cartella** (si apre `index.html`).

## Tre modi di metterlo online

### A. Netlify Drop (il più veloce: due minuti, nessun account per provare)

1. Vai su `https://app.netlify.com/drop`.
2. Trascina la **cartella** `pacchetto` (non lo zip) nella pagina.
3. Ottieni un indirizzo tipo `https://nome-casuale.netlify.app`. Quello è il `[LINK]` dei messaggi.

Limiti: senza account il sito è temporaneo (Netlify te lo dice nella pagina); con un account gratuito diventa permanente e puoi aggiornarlo ritrascinando la cartella. Chiunque abbia il link può aprirlo: va bene per un prototipo, non per qualcosa di segreto.

### B. itch.io (se vuoi un indirizzo con password)

1. Crea un account su itch.io, poi *Create new project*.
2. *Kind of project*: **HTML**. Carica `pacchetto.zip`, spunta **«This file will be played in the browser»**.
3. *Visibility & access*: **Restricted** (con password) oppure **Draft** con link privato.
4. Il link è quello della pagina del progetto. Dai la password ai tester nell'invito.

Limiti: itch.io mostra il gioco in un riquadro; sul telefono c'è il pulsante «schermo intero», ma la pagina «Come provarlo» (`index.html`) non è la prima cosa che vedono. Se usi itch.io, metti nell'invito: *«leggi prima le istruzioni in fondo alla pagina»* e copia lì il testo di `provare.html`.

### C. GitHub Pages (permanente, gratis, ma il repository deve essere pubblico)

1. **Unisci la pull request #1** (altrimenti il ramo `main` non ha la build).
2. Su GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, cartella `/ (root)` → Save*.
3. Dopo un minuto l'indirizzo è `https://malevero.github.io/fracture-protocol-prototipi/` (indice delle build) e **`…/provare.html`** (la pagina per i tester). Quest'ultimo è il `[LINK]` da mandare.
4. Il questionario è a `…/prova/questionario.html`.

Svantaggio: ogni modifica richiede un nuovo commit su `main`; i tester vedono sempre l'ultima versione, e **non devi cambiare versione durante la prova** (regola 1 del piano): se continui a lavorare, usa Netlify o itch per la prova e tieni Pages per dopo.

## Prima di mandare il link: la prova di cinque minuti

Fatta **da te**, su un telefono vero, non da computer:

- [ ] Il link si apre e `Apri il gioco` funziona.
- [ ] La prima missione parte, si gioca, si chiude il turno e si arriva al resoconto.
- [ ] A fine missione compaiono FACILE / GIUSTA / DURA e un tocco funziona.
- [ ] Opzioni → Prova e segnalazioni → **Copia rapporto**: incolla da qualche parte e controlla che ci sia il diario.
- [ ] `Compila il questionario` si apre, si riempie, **Copia le risposte** copia.
- [ ] Chiudi la pagina in mezzo a una missione e riaprila: «Riprendi la missione» c'è?

## Gli iPhone (e Safari)

Il gioco non è mai stato provato su Safari: lo dichiara la pagina dei tester e il piano chiede **almeno una persona con iPhone**. Cosa guardare in quella sessione (di persona, se riesci):

- tocco: i pulsanti rispondono al primo tocco? Il campo si sposta con un dito senza muovere la pagina?
- zoom a due dita sulla mappa e sul campo;
- il **suono** parte solo dopo il primo tocco (regola di iOS): è normale, ma verifica che parta;
- il salvataggio resta dopo aver chiuso Safari e riaperto;
- le **barre** del browser (in alto e in basso) non coprono FINE TURNO;
- orizzontale e verticale.

Se qualcosa va storto, mandami il rapporto del gioco: contiene il dispositivo e gli ultimi errori.

## Aggiornare durante la prova

Non farlo, tranne per un errore che impedisce di giocare. In quel caso: correggi, rigenera il pacchetto, **riscrivi a chi aveva già il link** e annota nei risultati quale build ha giocato chi (il rapporto e il questionario riportano la versione).
