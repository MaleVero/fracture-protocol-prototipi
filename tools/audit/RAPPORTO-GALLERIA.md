# Rapporto galleria arte (build `v2026-10-26`, 0.15.0)

## Cosa è
Una schermata dentro il gioco, **Opzioni → GALLERIA ARTE** (o l'indirizzo con `#galleria`), per guardare telai, creature e
strutture una accanto all'altra. Sta dentro il gioco perché usa il **motore vero del campo**: ogni scheda passa da
`drawUnit` (ombra, alone di distacco, rifinitura, pose, pavimento), quindi mostra ciò che il giocatore vede, non
un'interpretazione. Per la durata di una scheda `ctx`, `TW`, l'origine, `B`, le luci e la missione attiva vengono
sostituiti e poi rimessi in un `finally`; una battaglia in memoria non perde niente (verificato).

## Cosa contiene
- **25 schede**: 9 sagome di mech (il LNC-05 ha due assetti), 13 creature (base, élite e speciali), 3 strutture. Ogni
  scheda ha sigla, nome, ruolo e statistiche.
- **Comandi**: pavimento (Cassandra / Orvat / Tarsis), posa (fermo / colpo / ferito / crollo), scala (campo / ×1,6 /
  ×2,2), movimento (fermo / anima). Se a una scala la sagoma non sta nella cella viene ridotta e la scheda lo dice
  («ridotto a ×0,37 per starci» per il Varco Madre).
- **Confronto a due**: tocca due schede (o Invio/spazio da tastiera) e le vedi affiancate **alla stessa scala**, con
  tabella di PV, movimento, danno, gittata, ingombro in pixel, rapporto delle altezze e confondibilità. La terza scelta
  sostituisce la prima.
- **Altezze a confronto**: tutte le sagome sulla stessa linea alla scala del campo, con l'ingombro misurato.
- **Sagome a grandezza di pedina**: solo la forma, piena, alla dimensione di una pedina — è così che si riconoscono davvero.
- **Somiglianze**: per ogni coppia, la sovrapposizione delle sagome a pari altezza (IoU, 0–1) pesata per la differenza di
  grandezza reale. Un civile e uno spettro hanno la stessa forma in scala diversa e a schermo non si scambiano: la
  forma da sola li segnerebbe come gemelli (0,72), il rischio pesato no.

## Cosa ho trovato guardandole
- **Nessuna coppia di famiglie diverse supera 0,54 di rischio.** La più alta è VORN ~ VORN APEX (0,60), una stessa
  famiglia, voluta. Poi LNC-05 ~ VRAST e GRUMO ~ VRAST (0,54): da controllare con persone, ma lontane da una confusione.
  `galleria.js` fissa la soglia a 0,65 fra famiglie diverse.
- **Il NERIS ridisegnato si stacca dal Vorn da cui deriva**: rischio 0,39 contro lo 0,60 di Vorn Apex, che è della
  stessa famiglia per scelta. La RISACCA è distinta da tutto ciò che ho letto (0,15 dal Vorn, 0,24 dal NERIS).
- **Il LNC-05 in assetto caccia ha l'ingombro quasi uguale al Vorn** (55×26 contro 57×24, altezza 0,90×) e la
  forma abbastanza diversa: rischio 0,50 (forma 0,53). Non è alto, ma è la coppia mech–creatura più vicina che ho
  misurato, quindi vale guardarla in battaglia; per il resto un mech e una creatura non si avvicinano.
- **Il Varco Madre non sta in una cella ×1,6**: serve ridurlo a ×0,37 (ingombro 50×57 contro 36×36 del BHM-02, 1,58×).
  È coerente con la gerarchia «guardiano > mech», non un difetto.
- **Bug mio trovato dal test**: dopo il disegno delle altezze la missione attiva (`activeMission`) restava azzerata,
  quindi con una battaglia in corso la galleria la cancellava. Corretto; `galleria.js` lo verifica.

## Verifiche
`galleria.js`: 14 controlli a 320×568, 390×844 e 1000×700 (una scheda per ogni chiave di `MECH_ART`/`K_ART`, tutte
disegnate; pose, pavimenti e scale cambiano il disegno e tornando indietro si ritrova lo stesso; il confronto a due;
altezze, sagome e somiglianze; stato della battaglia intatto; apertura dalle Opzioni e ritorno; animazione che si
spegne uscendo; `#galleria`; nessuna rete, nessun errore).

## Limiti
- Giudicato su screenshot. La somiglianza è una misura di forma a 40×40 pixel: dice quali coppie guardare, non se i
  giocatori le confondono davvero.
- Non ho ritoccato nessuna creatura: la galleria mostra dove guardare, e il confronto non ha trovato un caso che
  giustifichi di cambiare un disegno senza averlo visto in mano a una persona.
- Strumento di lavoro, non di gioco: sta in Opzioni e non è linkato da nessun'altra parte.
