# Rapporto fase 0 — audit della build `v2026-09-16` (0.8.0)

Metodo: Chromium headless (Playwright). Gli script sono in questa cartella e si rilanciano
su qualunque build (`BUILD=v2026-xx-xx node missions.js aggro`).

| Script | Cosa fa |
|---|---|
| `load.js` | Caricamento su desktop e telefono, errori in console, elenco missioni |
| `missions.js idle\|aggro` | Avvia le 16 missioni e le gioca fino alla fine: `idle` non fa nulla, `aggro` muove e spara |
| `ui.js` | 9 schermate × 4 formati (390×844, 320×568, 844×390, 1280×800): overflow, elementi fuori schermo, pulsanti piccoli, testo piccolo, screenshot |
| `flows.js` | Salvataggio dopo vittoria e reload, scelta «tieni il campo / sganciati», ripresa missione dal menu |

## Cosa funziona

- **Nessun errore JavaScript** in nessuna prova: 16 missioni × 2 agenti, 9 schermate × 4 formati.
- Tutte le 16 missioni partono, si giocano e si chiudono. Ogni obiettivo (8 tipi) arriva a una schermata di esito.
- Caricamento ~1,6–1,8 s per 733 KB.
- Salvataggio: dopo una vittoria e un reload, frammenti e missioni completate restano.
- Fine tempo: appare la scelta «TIENI IL CAMPO / SGANCIATI» e i due pulsanti funzionano
  (round supplementare, ritirata con schermata di esito).
- Menu → ⌂ in battaglia → «RIPRENDI LA MISSIONE» presente.
- Nessuno scorrimento orizzontale della pagina in nessun formato.

## Problemi trovati

### Alta priorità

**A1 — Battaglia su telefono piccolo (320×568): il campo non si vede.**
Obiettivo, Lazy J, tre abilità e il riquadro della trasmissione occupano tutta la prima schermata.
Il campo di gioco è sotto la piega, FINE TURNO è fuori schermo e `⚙` esce a destra (x=353 su 320).
Screenshot: `out/small-battle.png` dopo `node ui.js`.

**A2 — Battaglia in orizzontale (844×390): i controlli sbordano.**
La riga dei pulsanti esce dallo schermo a destra (`↩` x=848, `⚙` x=902 su 844) e la colonna destra è tagliata in basso.
Il campo occupa meno di metà schermo e il riquadro della trasmissione copre il pannello del mech.
Screenshot: `out/land-battle.png`.

### Media priorità

**M1 — Su telefono normale (390×844) il campo è piccolo.**
Sono circa 280×170 px su 844 di altezza: il resto è HUD, Lazy J e abilità. In più la riga di pulsanti
in basso tocca la cornice.

**M2 — Testo troppo piccolo e zoom disabilitato.**
80 elementi con carattere di 7–8 px in battaglia, 54 sulla mappa, 13 nel menu. Il meta viewport ha
`maximum-scale=1, user-scalable=no`, quindi non si può ingrandire.

**M3 — Bersagli di tocco sotto i 32 px.**
`backbtn` 34×29, zoom mappa 30×30, `npGo` 31 px di altezza, `txOk` («RICEVUTO») 90×27.

**M4 — Mappa su telefono: etichette sovrapposte o tagliate.**
«AVAMPOSTO KILO» si sovrappone a «DIGA SVANIR»; «NIDO — VARCO MADRE» è coperto dal bordo e dai pulsanti di zoom.

### Da valutare in fase 2 (bilanciamento)

**B1 — Stime di forza.** Il briefing di FENDITURA NOX (m3) mostra `SQUADRA 276 · MINACCIA 474 — PROIBITIVO`
con la squadra iniziale. Va verificato se è voluto o se il nodo è troppo duro per il punto in cui si apre.

**B2 — Agente di prova semplice.** L'agente `aggro` (muove verso il nemico più vicino e spara) vince solo m1.
Non è un segnale di bilanciamento, perché non usa terreno, abilità né Lazy J.
La fase 2 richiede un agente che sfrutti la meccanica centrale (spingere i nemici nelle voragini).

## Non è un bug (verificato)

Nel Nido (m5) il gioco si ferma al round 12/12 in fase `env` con `busy=true`. È il prompt di fine tempo
(`awaitRetreat`), che aspetta una scelta del giocatore; il comportamento è voluto e la UI è presente.

## Proposta per la fase 1

1. A1 + A2 + M1: ridisegnare il layout della battaglia per altezze basse e orizzontale
   (HUD compatto, abilità e trasmissione richiudibili, controlli sempre visibili).
2. M3 + M4: bersagli ≥ 40 px, etichette della mappa senza sovrapposizioni.
3. M2: rimuovere `user-scalable=no`, alzare il corpo minimo del testo (≥ 10–11 px).
4. Rilanciare `ui.js` come test di regressione: deve dare `out: []` in tutti i formati.
