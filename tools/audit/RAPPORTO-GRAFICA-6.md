# Rapporto grafica 6: menu e Hangar (build `v2026-10-26`, 0.19.0)

## Un difetto trovato
Il menu aveva il badge **«3 ATTIVE»** scritto a mano sulla voce Missioni: restava uguale anche a campagna finita. Ora il
badge conta le missioni davvero disponibili (sbloccate e non ancora contenute) e sparisce quando non ce ne sono.

## Menu
- La riga di sistema non va più a capo e non si accavalla alla cornice: sotto i 430 px perde «LINK COMANDO STABILE».
- Ogni voce porta una nota viva a destra: Hangar «N TELAI», Officina «frammenti · ◈ sigilli», Ricerca «BIO · TEC»,
  Comando «LAZY J · banda». Il Codice mantiene il suo conteggio.
- Il menu si **ricostruisce a ogni ritorno** (`go('menu')`): prima restava com'era quando era stato costruito, quindi le note
  sarebbero state vecchie.

## Hangar
- **Quadro della squadra** in testa: potenza, slot pieni su totali, scudi agganciati su tre, sigilli. Si aggiorna
  installando un modulo o agganciando uno scudo.
- **Statistiche a barre** (HP, MOV, DMG, RNG) con i valori effettivi (moduli compresi) e la scala dei telai che
  esistono, così si confrontano a vista; sotto, scudo, spinta e potenza.
- L'etichetta «N SLOT» non invade più la sagoma (prima si sovrapponeva al bordo dell'immagine e, con «2 SLOT»,
  andava a capo su due righe).
- Il pulsante Officina sta a tutta larghezza sotto il testo (≥44 px) invece di essere schiacciato nel riquadro.

## Verifiche
`menuhangar.js`: 12 controlli (4 per ciascuno di 320×568, 390×844, 1000×700, più rete ed errori) e batteria completa verde,
`riprendi.js` compresa (62 riprese identiche). Nel primo giro il test ha fallito due volte per errori miei di aspettativa
(il campo sigilli non era azzerato; la potenza va letta prima di installare i moduli), non per difetti del gioco.

## Limiti
- Giudicato su screenshot Chromium; Safari/iPhone non verificato.
- Solo presentazione, tranne il badge (ora calcolato) e la ricostruzione del menu al ritorno.
- Il fumetto, le tavole e la vignetta del menu non sono stati toccati.
