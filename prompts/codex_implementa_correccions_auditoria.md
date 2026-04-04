# Prompt per a Codex — Implementació de correccions D1–D5 de l'auditoria metodològica

## Context del projecte

Ets dins d'un repositori (`validaccio/`) que conté una investigació acadèmica sobre l'origen arquitectònic del Joc de l'Oca. La investigació aplica el mètode ACH (Analysis of Competing Hypotheses, Heuer 1999) per comparar tres hipòtesis:

- **H1 (Ortodòxia):** El tauler s'explica per enginyeria lúdica i probabilística (atzar).
- **H2 (Ombra):** El tauler respon a numerologia renaixentista genèrica (climactèric 7×9, enneada).
- **H3 (Nova Teoria):** L'arquitectura matemàtica del tauler és una translació de la combinatòria de base-9 de l'*Ars Magna* de Ramon Llull.

Una auditoria metodològica independent (`exports/dictamen_auditoria_metodologica.md`) ha identificat **5 debilitats (D1–D5)** que cal corregir per portar el treball a un nivell de tribunal acadèmic. Les dues de gravetat alta són D2 i D3.

## Estructura del repositori

```
docs/
  marc_validacio.md        # Marc teòric (3 pilars: epistemologia, Bayes, ACH)
  regles_derrota.md        # Regles d'admissibilitat i derrota d'hipòtesis
  glossari.md              # Glossari de termes
  proporcio_esforc.md      # Guia interna de proporcions
evidence/
  hipotesis.md             # Declaració de les 3 hipòtesis (H1, H2, H3)
  evidencies.tsv           # Registre d'evidències (EID-019 a EID-028)
  ach_matrix.csv           # Matriu ACH (C/I/N per EID × H)
  priors.md                # Registre de priors (BUIT — plantilla sense omplir)
  dependencies.md          # Famílies de dependència (BUIT — plantilla sense omplir)
  sensibilitat.md          # Anàlisi de sensibilitat (3 escenaris)
  afirmacions.tsv          # Taula d'afirmacions AID (esquelet)
  corollari_intencionalitat.md  # Corol·lari H3a vs H3b
exports/
  matriu_oca_9.md          # Matriu ACH renderitzada
  analisi_final.md         # Informe final de sensibilitat
  dictamen_auditoria_metodologica.md  # L'auditoria que genera aquestes tasques
drafts/
  article_final_oca_9.md   # Esborrany de l'article
  esquema.md               # Esquema de l'article
```

## Les 5 correccions a implementar

### D1 — Clàusula de demarcació de l'absorció (Gravetat: MODERADA)

**Problema:** A la Fase 3c, les evidències de jugabilitat (EID-019/020/021) es van reclassificar d'`I` a `C` per a H3 amb l'argument que un disseny lul·lià genera jugabilitat com a subproducte. Però no hi ha cap regla formalitzada que delimiti quan l'absorció és lícita i quan no ho és, cosa que podria convertir H3 en irrefutable.

**Acció concreta:**

Edita `docs/regles_derrota.md`. Afegeix una nova secció **"5.4 Límits de l'absorció (subsumpció)"** (abans de la secció 6), amb aquest contingut conceptual (pots polir la redacció perquè sigui coherent amb l'estil del document):

> Quan una hipòtesi H_general engloba una hipòtesi H_particular com a cas especial (subsumpció), les evidències consistents amb H_particular es poden codificar com a `C` per a H_general, però **només si** es compleix simultàniament:
>
> (a) Existeix una **derivació mecànica explícita** (no només narrativa) que mostra com el model de H_general produeix necessàriament el fenomen descrit per l'evidència. No n'hi ha prou amb plausibilitat genèrica.
>
> (b) Es declara explícitament a la matriu **quina evidència podria rebre `I` si el subproducte predit no es materialitzés**. Si no existeix cap evidència concebible que refutés l'absorció, el moviment és un senyal d'immunització i es rebutja.
>
> (c) L'absorció es registra amb un **marcador `[ABS]`** a la columna de justificació de la matriu, perquè sigui auditable.

Després d'afegir la secció, actualitza `evidence/ach_matrix.csv`: a les files EID-019, EID-020 i EID-021, afegeix el marcador `[ABS]` al final del camp `justificacio`.

### D2 — Formalització dels priors (Gravetat: ALTA)

**Problema:** `evidence/priors.md` és una plantilla buida. El marc propi (`marc_validacio.md`, secció 8.3) exigeix priors declarats com a rang amb justificació. Sense priors, l'escenari C de sensibilitat (priors adversos) no té base real.

**Acció concreta:**

Edita `evidence/priors.md`. Substitueix les plantilles buides pel contingut següent:

**H1:**
- **Rang:** alta
- **Categoria:** prior informatiu per consens
- **Justificació:** H1 és la posició per defecte en la historiografia dels jocs de taula. La majoria d'obres de referència (Parlett 1999, Murray 1952) tracten el tauler com a producte d'evolució lúdica sense atribuir-li programa esotèric. El consens acadèmic implícit atorga alta plausibilitat prèvia a una explicació funcional.

**H2:**
- **Rang:** moderada
- **Categoria:** prior informatiu per consens
- **Justificació:** La lectura numerològica renaixentista del 63 (climactèric 7×9) i del simbolisme moral dels paranys és documentada en fonts secundàries (Seville 2019, Goose Game scholarship). No és la posició dominant, però és una alternativa reconeguda.

**H3:**
- **Rang:** baixa
- **Categoria:** prior escèptic
- **Justificació:** La hipòtesi lul·liana no té precedent directe en la literatura publicada sobre el Joc de l'Oca. La càrrega de la prova recau sobre la teoria nova. S'assigna un prior deliberadament baix per testar la robustesa: si la matriu ACH manté H3 com a superior malgrat un prior escèptic, la conclusió és més resistent.

Després, actualitza `evidence/sensibilitat.md`, **Escenari 3**: substitueix la frase "en absència de rangs formalment declarats a `evidence/priors.md`" per una referència als priors ara formalitzats, i reformula el resultat especificant que amb priors H1=alta, H2=moderada, H3=baixa, la jerarquia ACH (basada en inconsistències) no canvia perquè el criteri ACH és independent dels priors (minimitza `I`, no maximitza `P(H)`), però que en un marc bayesià complet caldria un likelihood formal per determinar si el prior escèptic d'H3 és superat per la força de l'evidència.

Finalment, actualitza `exports/analisi_final.md`, **Escenari C**: adapta'l perquè reflecteixi els priors ara formalitzats, en la mateixa línia que la modificació de sensibilitat.md.

### D3 — Redefinició de famílies de dependència o reformulació de la conclusió (Gravetat: ALTA)

**Problema:** `regles_derrota.md` (secció 4.1) exigeix "tres o més evidències diagnòstiques independents (de famílies de dependència **diferents**)" per considerar una hipòtesi derrotada. Però EID-025, EID-026 i EID-028 pertanyen totes a la família `anomalia_ludica`. Per tant, compten com a **una sola família**, i la condició formal de derrota d'H1/H2 no es compleix en sentit estricte.

**Acció concreta (opció dual — implementa AMBDUES parts):**

**Part A — Redefinir famílies a `evidence/dependencies.md`:**

Substitueix la plantilla buida per un registre real de famílies. Argumenta (seguint l'estil del document) que les tres evidències `anomalia_ludica` representen observacions de **tres fenòmens físicament distints del tauler**:

- **Família `malla_geometrica`:** EID-025. Observació: la distribució espacial de les oques forma dues sèries +4/+5 amb recurrència 9. Es pot verificar comptant posicions al tauler. No requereix coneixement de regles de joc.
- **Família `regla_admissio`:** EID-026. Observació: el reglament escrit prescriu una excepció per a la tirada inicial de 9 (6+3→26, 5+4→53). Es verifica llegint el reglament. No depèn de la geometria del tauler.
- **Família `tancament_numeric`:** EID-028. Observació: la meta és a 63 (múltiple de 9, suma de dígits = 9). Es verifica aritmèticament. No depèn ni de la malla ni de la regla d'admissió.
- **Família `coherencia_semantica`:** EID-027. Observació: la funció del 9 com a límit operatiu en l'Ars lul·liana. Deriva de fonts textuals lul·lianes, independent de l'observació del tauler.
- **Evidències independents:** EID-019 a EID-024 — cadascuna prové d'una anàlisi funcional o contextual independent.

Inclou un paràgraf de justificació: "La família original `anomalia_ludica` es desglossa en tres subfamílies perquè cadascuna és verificable de manera independent: la malla es pot observar sense conèixer el reglament, el reglament es pot llegir sense observar la malla, i el tancament a 63 és un fet aritmètic autònom. Dues evidències pertanyen a la mateixa família si una **deriva** de l'altra o si ambdues deriven d'una font comuna. Aquí no és el cas: cadascuna és una observació primària d'un aspecte diferent del tauler."

Actualitza també `evidence/evidencies.tsv`: canvia el camp `familia_dep` d'EID-025 a `malla_geometrica`, d'EID-026 a `regla_admissio`, i d'EID-028 a `tancament_numeric`.

**Part B — Reformular la conclusió:**

Edita `exports/matriu_oca_9.md`. A la secció "Lectura ACH mínima", afegeix un paràgraf que digui:

> Amb la redefinició de famílies de dependència (veure `evidence/dependencies.md`), les 4 inconsistències d'H1 i H2 provenen de **3 famílies independents** (`malla_geometrica`, `regla_admissio`, `tancament_numeric`) més 1 família addicional (`coherencia_semantica`). Això compleix la condició 4.1 de `docs/regles_derrota.md` per a derrota formal. No obstant, atès que la redefinició de famílies s'ha fet *a posteriori* de la construcció de la matriu, la conclusió es presenta en doble format: (a) "derrota formal" sota la redefinició justificada, i (b) "superioritat relativa" si es manté la família original `anomalia_ludica` com a bloc únic.

Edita `drafts/article_final_oca_9.md`. A la secció "La prova d'estrès (metodologia ACH)", afegeix una nota al final que reflecteixi la mateixa doble formulació.

### D4 — Substitució de "estadísticament" per terminologia correcta (Gravetat: MODERADA)

**Problema:** El corol·lari i l'article utilitzen la paraula "estadísticament" sense que existeixi cap model probabilístic formal al repositori. El marc propi (secció 8.2) prohibeix quantificació numèrica sense likelihoods defensables.

**Acció concreta:**

Cerca a tots els fitxers del repositori les paraules "estadísticament" i "estadística" (en context d'afirmacions sobre plausibilitat o robustesa). Substitueix-les per la terminologia adequada:

- "estadísticament" → "lògicament" o "per criteris de parsimònia" (segons el context)
- "plausibilitat estadística" → "plausibilitat lògica" o "plausibilitat comparativa"

Fitxers afectats amb certesa:
- `evidence/corollari_intencionalitat.md` — seccions 4 i 5 (títols i cos)
- `drafts/article_final_oca_9.md` — si conté la mateixa terminologia

No substitueixis "estadísticament" si apareix en contextos legítims (p. ex., citant un mètode estadístic real o en el marc teòric quan parla de probabilitat freqüentista).

### D5 — Bifurcació del corol·lari en incondicional i condicional (Gravetat: MODERADA)

**Problema:** El corol·lari conclou conjuntament que hi ha "disseny conscient" (intencionalitat) i que aquest disseny és "lul·lià". Però la segona afirmació depèn essencialment d'EID-027 (la tecnificació lul·liana del 9). Si EID-027 caigués, la primera conclusió se sostindria però la segona no.

**Acció concreta:**

Edita `evidence/corollari_intencionalitat.md`. Substitueix l'actual secció "Dictamen del Corol·lari" (final del document) per dues seccions:

**"Dictamen Incondicional (H3b-gen: enginyeria lúdica conscient)":**

> Independentment de l'atribució a una tradició intel·lectual concreta, la confluència de tres capes funcionals (clausura 63, malla +4/+5, admissió-9), totes governades pel mateix paràmetre i amb funcions complementàries, és lògicament més parsimoniosa sota un model de disseny deliberat que sota un model d'accident. Aquest dictamen es manté fins i tot si es retira EID-027. [AID-COR-015a ← EID-025, EID-026, EID-028]

**"Dictamen Condicional (H3b-lul: enginyeria lul·liana)":**

> La identificació de l'enginyeria específicament com a lul·liana (el 9 com a límit operatiu de plenitud de l'Ars Magna, no com a valor esotèric genèric) depèn de la validesa d'EID-027. Si EID-027 es manté, H3b-lul és l'explicació més parsimoniosa del conjunt complet d'evidències. Si EID-027 es retirés, el dictamen recula a H3b-gen (enginyeria deliberada sense atribució lul·liana específica). [AID-COR-015b ← EID-025, EID-026, EID-027, EID-028]

Mantén la reserva metodològica existent (AID-COR-016) tal com està.

Actualitza també `drafts/article_final_oca_9.md` perquè la conclusió final reflecteixi la mateixa estructura dual: dictamen incondicional d'enginyeria + dictamen condicional d'atribució lul·liana.

## Instruccions generals

1. **No modifiquis** `docs/marc_validacio.md` ni `docs/glossari.md` — el marc teòric està tancat.
2. **Respecta l'estil** de cada fitxer: les regles de derrota tenen estil normatiu, les evidències tenen estil descriptiu, el corol·lari té estil argumentatiu.
3. **Mantén la traçabilitat:** qualsevol AID nou ha de seguir la numeració existent (AID-COR-015a, AID-COR-015b, etc.) i vincular-se als EID corresponents.
4. **Fes un commit per cada correcció** (D1, D2, D3, D4, D5) amb un missatge descriptiu que indiqui quina debilitat es corregeix.
5. Després de les 5 correccions, fes un **commit final** que actualitzi `exports/dictamen_auditoria_metodologica.md` afegint una secció al final titulada "Registre de correccions implementades" amb la llista D1–D5 i la data.
6. **Push** tots els commits a la branca `claude/audit-research-methodology-8MdR4`.
