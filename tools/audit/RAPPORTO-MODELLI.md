# Rapporto modelli dei Kaucha (build `v2026-10-26`, 0.23.0)

Richiesta: migliorare i modelli dei Kaucha (leggibilità sul campo, animazioni di riposo, varianti élite mancanti, sagome da rifare).
Ho guardato tutte e 13 le creature in galleria a grande scala e sul campo (a scala di gioco), poi ho lavorato in quattro direzioni.

## 1. Leggibilità sul campo
Ho misurato il valore medio di ogni creatura contro il pavimento dei tre settori (`__galleria.colori`). Le scure (Vorn, Krull, Grumo,
Skorr) stanno a 3,3–3,8:1; le **chiare** no: Vrast 2,0, Risacca 2,0, Sahir 2,2, Neris 2,4. Interventi:
- **Vrast**: i cristalli della corona passano da `#d2f0fa`/`#a9dcee` (quasi bianchi, sul pavimento chiaro sparivano) a mezzi toni
  (`#79bbd6`/`#5aa6c4`) con un filo di luce sul bordo; il bianco resta solo nel lampo che li attraversa.
- **Risacca**: la cresta dell'onda è più scura (`#276878`), la schiuma resta bianca.
- **Sahir**: le parti pallide del nuovo modello sono state scurite.
Risultato: minimo 2,07:1 su tutte le creature e i tre pavimenti (prima 1,93). `modelli.js` ora lo presidia (soglia 2,0).

## 2. Moto di riposo per specie
Ogni specie ha un suo gesto, in genere un impulso breve dentro un ciclo lungo (una creatura che si agita di continuo è rumore):
- **Vorn**: ogni ~3,5 s si accuccia, flette le zampe e abbassa la mandibola («sta per scattare»).
- **Krull**: oscilla sui trampoli (i piedi fermi, la testa cerca il bersaglio); due articolazioni sulle gambe; la canna carica e scarica.
  Aggiunta una sacca d'artiglieria sul dorso.
- **Sahir**: fluttua sopra lo stelo mancante; filamenti in ritardo; schegge in orbita che accelerano quando pulsa.
- **Grumo**: le piastre si alzano a scalini (ognuna un po' più della precedente); la giuntura pulsa piano.
- **Vrast**: lampi bianchi che scorrono sulla corona.
- **Skorr**: fumo dai camini, gocce di brace.
- **Trahn**: i bracci si serrano insieme agli anelli che collassano (il richiamo); uncini alle punte.
`modelli.js` verifica che ogni specie cambi almeno 25 pixel fra due fotogrammi e che **con «riduci movimento» tutte stiano ferme**.
Il test ha trovato due difetti reali: (a) il fumo dello Skorr lanciava un'eccezione all'avvio (`arc()` con raggio negativo: il modulo
di un numero negativo resta negativo, `(t*0.5+cx*0.05)%1` con cx=-10 è negativo per t<1) — corretto prima di arrivare al gioco;
(b) quattro creature (Sahir, Krull élite, Palinsesto, Varco Madre) e le gocce dello Skorr si muovevano anche con «riduci movimento»,
cosa che vale da prima di questo lavoro — corrette.

## 3. Sahir ridisegnato
Era uno stelo con un disco e quattro tentacoli, cioè un lampione. Ora è ciò che fa: un organo che amplifica, sospeso senza niente che
lo regga: cupola molle con le pieghe di un cervello, due costole d'osso a coppa, cinque filamenti che pendono e non toccano terra,
una corona di schegge che gli gira attorno. Niente pupilla verticale (non è un predatore): una perla che pulsa. Ingombro uguale
a quello dichiarato (38×37). La confusione con le altre sagome resta sotto la soglia (nessuna coppia fra famiglie diverse sopra 0,54).
Krull ha una sacca e una canna illuminata ma la sagoma è quella di prima.

## 4. Varianti élite per Grumo, Vrast, Skorr e Trahn
- **Come**: non sono tipi nuovi (la logica che legge il tipo — spinta, gelo, fuoco, richiamo — non cambia): sono la stessa creatura
  con la bandiera `elite`. `ELITE_MOD`: **Grumo +2 PV, Vrast +1 PV +1 danno, Skorr +1 PV +1 danno, Trahn +1 PV +1 richiamo**.
  Costano 2 punti di budget in più. Mostrano «GRUMO+-α», sigla «GRM+», rango 3 / ÉLITE nel pannello.
- **Segni di rango**, gli stessi per tutte (anche per le due élite di sempre): un **anello rosso a terra**, la sagoma ingrandita del 10%,
  venature o dettagli rossi e **una struttura in più** — Grumo: speroni e punta; Vrast: corona a sette punte con il cristallo centrale
  rosso e schegge che girano; Skorr: un terzo camino, fauci arroventate a bianco e lingue di fiamma; Trahn: un secondo paio di bracci.
- **Quando**: solo dal livello di escalation delle élite di sempre (`ELITE_THRESHOLD`), con probabilità 0,2 per ogni creatura di quelle quattro
  che il generatore piazza, mai fra i garantiti, mai negli scenari scritti a mano, mai se il budget non basta. Nella galleria un nuovo
  comando RANGO (BASE / ÉLITE) le mostra. Il Codice lo dice nelle quattro schede.
- **Bilanciamento, misurato** (agente «esperto», missioni procedurali): a progresso di campagna (30 giocate per missione) le vittorie vanno da **83,3%
  a 82,5%**; nel caso peggiore (tutti gli altri nodi del settore già contenuti, 15 giocate) da **80,9% a 76,1%**, dentro la banda 74–82% che mi ero dato
  per l'agente. Il caso peggiore è rumoroso (ogni missione ±10 punti): la differenza va letta come «un poco più duro a fine campagna».
  Con probabilità 0,3 era 75,3%: l'ho abbassata a 0,2.

## Verifiche
`modelli.js`: 8 controlli (ingombro ±12% di tutte e 13; moto con e senza «riduci movimento»; le quattro élite differiscono dalla base e hanno l'anello rosso;
le statistiche dell'élite come dichiarate con tratti intatti, tier, nome, sigla, potenza e non si somma due volte; il generatore: nessuna élite senza escalation,
quota fra l'8 e il 35% con escalation alta, budget mai sforato, nessuna fra i garantiti; il pannello e la copia/salvataggio; il contrasto creatura/pavimento).
Batteria completa verde, `riprendi.js` (62 riprese identiche) e `missions.js idle` senza errori.

## Limiti
- Giudicato su screenshot Chromium e a scala di gioco su un campo di prova; le animazioni le ho viste come fotogrammi, non in movimento continuo.
- Il Sahir nuovo, l'anello rosso e la corona a sette punte non li ha visti una persona.
- Le élite sono state provate solo con l'agente, che non è un giocatore: se danno fastidio, `ELITE_CHANCE` (0,2) è la manopola.
- Non ho ridisegnato Neris, Risacca, Palinsesto e Varco Madre (hanno già una sagoma propria); il Vorn è la creatura di riferimento e non l'ho toccato oltre allo scatto.
