# Dictamen d'Auditoria Metodologica Independent

**Objecte:** Avaluacio de la puresa i robustesa del metode ACH aplicat a la investigacio sobre l'origen arquitectonic del Joc de l'Oca.

**Marc de referencia:** Heuer (1999), *Psychology of Intelligence Analysis*; Dhami, Belton & Mandel (2019); Tucker (2004); Climenhaga (2017); Williamson (2013).

**Auditor:** Agent d'IA actuant com a Auditor Metodologic Independent.

**Data:** 4 d'abril de 2026.

---

## Punt 1. La Regla de Subsumpcio (Absorcio) — Fase 3c

### Que es va fer

A la Fase 3c, les evidencies de jugabilitat ludica (EID-019, EID-020, EID-021) van ser reclassificades respecte H3: d'`I` (inconsistent) a `C` (consistent). La justificacio: un disseny lul·lia genera bona jugabilitat com a subproducte inherent ("efecte emergent d'un sistema tancat"), de manera que proves de bona jugabilitat no refuten H3.

### Veredicte: moviment epistemologicament licit, pero amb una reserva important

**A favor de la licitud:**

1. **Coherencia logica del raonament d'absorcio.** El moviment segueix un patro reconegut en filosofia de la ciencia: quan una teoria T2 inclou T1 com a cas particular (subsumpcio), les prediccions de T1 son automaticament compatibles amb T2. Si H3 postula un sistema formal tancat de base 9, i aquest sistema —per construccio— produeix equilibri ludic, aleshores les evidencies d'equilibri ludic son logicament consistents amb H3. Negar-ho seria exigir que una teoria mes general fos refutada per les prediccions de la teoria menys general que engloba. Aixo no es un biaix: es una consequencia directa de la relacio de subsumpcio entre models.

2. **Precedent en ACH ortodoxa.** Heuer (1999, cap. 8) estableix que la codificacio C/I/N ha d'avaluar si l'evidencia contradiu el nucli de la hipotesi, no si es compatible amb una altra hipotesi. EID-019/020/021 no refuten el nucli d'H3 ("el 9 es un limit operatiu lul·lia"); per tant, codificar-les com a `I` seria una atribucio d'inconsistencia espuria, que es precisament el que l'ACH ortodoxa prohibeix.

3. **Simetria del tractament.** El moviment no s'aplica nomes a H3: les evidencies simboliques (EID-022/023/024) tambe es codifiquen com a `N` per H3 en lloc de `C`, cosa que priva H3 de suports fals. Aixo indica que la reclassificacio no es unidireccional a favor d'H3.

**Reserva critica:**

4. **Risc d'immunitzacio.** El principi d'absorcio, aplicat sense limits, pot convertir qualsevol hipotesi en irrefutable: tota evidencia adversa es pot redefinir com a "efecte emergent compatible". Per evitar aquest risc, calia —i no s'ha fet de forma explicitament formalitzada— establir un **criteri de demarcacio de l'absorcio**: quines categories d'evidencia son absorbibles i quines, si fossin inconsistents, realment refutarien H3?

   En concret: si algu demostrés que la malla +4/+5 **no** produeix equilibri ludic eficient (contradient EID-019/020), H3 hauria de rebre una `I`? La resposta logica es si (perque aleshores la propietat "subproducte inherent" quedaria falsificada), pero aixo no queda explicitat al protocol.

**Recomanacio:** Afegir a `docs/regles_derrota.md` o a la matriu mateixa una clausula explicita del tipus: *"L'absorcio nomes es licita quan existeix una derivacio mecanica explicita (no nomes narrativa) del subproducte. Si la derivacio es nomes plausible pero no demostrada, l'evidencia es codifica N, no C."* Sense aquesta clausula, el moviment es licit pero no blindat.

**Qualificacio:** **APROVAT AMB OBSERVACIO**.

---

## Punt 2. L'Analisi de Sensibilitat — Fase 4

### Que es va fer

Es van modelar tres escenaris: (A) retirada de la familia dominant `anomalia_ludica` (EID-025/026/028), (B) retirada de l'evidencia dominant EID-027, i (C) priors adversos. En tots tres, H3 va mantenir 0 inconsistencies.

### Veredicte: logicament solida en el criteri ACH; estadisticament no quantificable; amb una feblesa estructural detectada

**Punts forts:**

1. **Disseny correcte dels escenaris.** La tria dels tres escenaris respecta el protocol minim de l'annex operatiu (8.1): eliminar familia dominant, eliminar evidencia dominant, variar priors. Aixo es estandard en ACH i esta ben executat.

2. **Resultat logic clar.** En l'Escenari B (sense EID-027, que es l'unica evidencia de la familia `coherencia_semantica`), la geometria nua del tauler (EID-025, EID-026, EID-028) continua generant 3 inconsistencies contra H1 i H2, i 0 contra H3. Aixo demostra que la conclusio no depenja d'un sol testimoni textual extern. La logica de la deduccio es valida: si tres propietats estructurals del tauler (malla +4/+5, regla 26/53, tancament 63) son individualment inconsistents amb H1 i H2, la retirada d'una quarta evidencia (textual) no altera la jerarquia.

3. **Honeste declaratiu.** L'informe de sensibilitat (`sensibilitat.md`) reconeix explicitament que "la capacitat de discriminacio empirica es redueix" a l'Escenari A. Aixo es un senyal de bona praxi: no s'amaga la perdua de poder.

**Febleses detectades:**

4. **"Estadisticament solida" es una expressio improcedent.** El marc propi declara una escala ordinal de cinc nivells i prohibeix quantificacio numerica sense likelihoods defensables (marc_validacio.md, 8.2). Per tant, la conclusio no pot qualificar-se com a "estadisticament" robusta en sentit tecnic. La paraula correcta es **logicament** robusta dins del criteri de minimitzacio d'inconsistencies ACH. Utilitzar "estadisticament" implicaria un model probabilistic formal que no existeix en aquest repositori.

5. **L'Escenari A revela una fragilitat que mereix mes atencio.** Quan es retira la familia `anomalia_ludica`, el marcador baixa a H1=1, H2=1, H3=0. Aixo significa que nomes queda **una sola inconsistencia** separant H3 de les rivals (provinent d'EID-027). En un tribunal academic, un oponent podria argumentar que una sola evidencia de diferencia es insuficient per a un veredicte fort, especialment quan EID-027 pertany a una familia d'un sol membre (`coherencia_semantica`) i, per tant, te tot el pes d'un unic testimoni.

6. **Priors no formalitzats.** L'escenari C (priors adversos) es honest en declarar que `evidence/priors.md` no te rangs formalitzats i que s'aplica un "estres qualitatiu". Pero aixo significa que l'escenari C es, de facto, un exercici retoric i no una prova de sensibilitat genuina. Sense priors numerics o almenys ordinals assignats, no es pot calcular cap canvi real. El marc propi exigeix priors declarats com a rang (8.3); aquest requisit esta incomplet.

**Sobre la pregunta especifica ("l'arquitectura derrota H1 i H2 sense suport documental?"):**

Si, dins la logica ACH pura: tres evidencies estructurals independents (EID-025/026/028) generen cadascuna una `I` contra H1 i H2. Aixo supera el llindar de 3 inconsistencies independents que `regles_derrota.md` (4.1) fixa per considerar una hipotesi derrotada. Pero cal notar que les tres pertanyen a la mateixa familia de dependencia (`anomalia_ludica`), cosa que redueix la seva independencia. Si es compta per families (com exigeix el protocol 8.4), nomes hi ha **una** familia inconsistent, no tres de independents. Aixo es un punt critic: la derrota d'H1/H2 per la regla 4.1 requereix "tres o mes evidencies diagnostiques independents (de families de dependencia diferents)". Amb una sola familia, **la condicio formal de derrota no es compleix en sentit estricte**.

**Recomanacio:** (a) Formalitzar els priors. (b) Avaluar si EID-025, EID-026 i EID-028 son realment una sola familia o si es poden defensar com a subfamilies independents (la malla geometrica, la regla d'admissio i el tancament numeric son fenomens observables distints del tauler, encara que comparteixin l'objecte fisic). (c) Ser molt precis en la conclusio final: la superioritat d'H3 es per absencia d'inconsistencies propies, no necessariament per derrota formal de les rivals.

**Qualificacio:** **APROVAT AMB RESERVES**.

---

## Punt 3. El Corol·lari d'Intencionalitat (H3a vs H3b)

### Que es va fer

Es va deduir que la confluencia de tres capes (meta 63, malla +4/+5, regla d'admissio 9) totes governades per la mateixa variable (9) i amb funcions complementaries, fa estadisticament menys parsimoniosa la hipotesi d'"accident felis" (H3a) que la de "disseny conscient" (H3b).

### Veredicte: la logica qualitativa es valida; la retorica probabilistica excedeix les dades

**Punts forts:**

1. **Argument de parsimonia ben construït.** L'estructura del corol·lari segueix un patro d'eliminacio d'alternatives clasic: si tres subsistemes independents convergeixen en un unic parametre de control, la hipotesi d'accident requereix tres coincidencies no coordinades, mentre que la hipotesi de disseny en requereix una sola (la decisio de projecte). Per Occam, H3b es preferible. Aixo es logicament correcte.

2. **Separacio entre intencionalitat de sistema i atribucio biografica.** El corol·lari es curos en distingir que "disseny conscient" no equival a "disseny de Ramon Llull" ni a "disseny d'un lul·lista concret". La reserva metodologica final (AID-COR-016) es epistemologicament necessaria i esta ben col·locada.

3. **Tracabilitat d'afirmacions.** Cada pas del corol·lari porta un AID amb EID vinculats. Aixo es exemplar i compleix l'exigencia de tracabilitat del marc (8.6).

**Febleses detectades:**

4. **Absencia de quantificacio de la "confluencia estadistica".** El corol·lari parla de "plausibilitat estadistica" (seccions 4 i 5) pero no calcula cap probabilitat, ni siquiera ordinal. Quina es la probabilitat que tres capes convergeixin per atzar? Sense un model (ni que sigui combinatori elemental) que estimi quantes configuracions alternatives eren possibles per a un tauler de 63 caselles, la paraula "estadisticament" es retorica, no tecnica. Aixo es coherent amb la limitacio ja detectada al Punt 2: el marc ordinal propi no dona base per a afirmacions "estadistiques".

5. **Suposit d'independencia de les tres capes no demostrat.** L'argument de parsimonia es fort **si** les tres capes son realment independents. Pero: (a) la malla +4/+5 i el tancament a 63 estan mecanicament vinculats (la malla porta al final); (b) la regla 26/53 existeix precisament perque la malla d'oques existeix. Per tant, les tres capes no son completament independents: comparteixen restriccions de disseny mutues. Aixo no invalida l'argument, pero en redueix la forca: no son tres coincidencies lliures, sino tres manifestacions d'un sistema on ja hi ha interdependencies internes. La pregunta genuina no es "quina es la probabilitat que tres coses independents convergeixin", sino "quina es la probabilitat que un sistema coherent amb una base X emergeixi sense intencionalitat?". Aquesta segona pregunta es mes dificil de respondre i no s'aborda.

6. **El salt de "disseny" a "disseny lul·lia".** El corol·lari demostra raonadament que hi ha disseny conscient, pero el pas de "disseny conscient" a "disseny **lul·lia**" depenja essencialment d'EID-027 (la tecnificacio lul·liana del 9). Si EID-027 cau, el corol·lari segueix demostrant intencionalitat generica pero no especificament lul·liana. El corol·lari hauria de fer explicitament aquesta distincio: un corol·lari **incondicional** (hi ha enginyeria) i un corol·lari **condicional** (l'enginyeria es d'estil lul·lia, si EID-027 es manté).

**Recomanacio:** (a) Substituir "estadisticament" per "logicament" o "per criteris de parsimonia" en tot el corol·lari. (b) Fer explicita la interdependencia parcial de les tres capes i reformular l'argument en termes de graus de llibertat del sistema, no de coincidencies independents. (c) Separar formalment el dictamen d'intencionalitat del dictamen d'atribucio lul·liana.

**Qualificacio:** **APROVAT AMB OBSERVACIONS**.

---

## Dictamen Global

### Qualificacio general del metode: APROVAT AMB RESERVES

L'investigador ha aplicat l'ACH amb un grau de rigor significativament superior al que es habitual en recerques historiques convencionals. Especificament:

**Aspectes exemplars:**
- El marc teorico-metodologic (`marc_validacio.md`) es sofisticat, ben fonamentat i autoconsciement limitat.
- Les regles de derrota (`regles_derrota.md`) son severes i s'apliquen de forma simetrica a totes les hipotesis.
- La tracabilitat AID-EID es rigorosa i transversal.
- La separacio entre nucli evidencial i capa interpretativa es respectada.
- L'analisi de sensibilitat es un gest epistemologic que la majoria d'investigacions historiques no fan.

**Debilitats que cal corregir per resistir un tribunal academic:**

| # | Debilitat | Gravetat | Solucio |
|---|-----------|----------|---------|
| D1 | La regla d'absorcio no te clausula de demarcacio formalitzada | Moderada | Afegir criteri explicit a `regles_derrota.md` |
| D2 | Els priors (`priors.md`) estan buits: no s'ha completat un artefacte obligatori del propi marc | Alta | Omplir amb rangs ordinals i justificacio |
| D3 | La derrota formal d'H1/H2 no compleix estrictament la regla 4.1 (tres families independents) si `anomalia_ludica` es compta com una sola familia | Alta | Redefinir families o reformular la conclusio en termes de "superioritat relativa" en lloc de "derrota" |
| D4 | Us de "estadisticament" sense model probabilistic | Moderada | Substituir per "logicament" / "per parsimonia" |
| D5 | El corol·lari no separa formalment intencionalitat generica d'atribucio lul·liana | Moderada | Bifurcar en corol·lari incondicional i condicional |

### Veredicte final

El metode es **substancialment solid** i demostra competencia analitica. Les febleses detectades son **corregibles** sense invalidar l'estructura. Si es corregeixen D2 i D3 (que son les de gravetat alta), el treball resistiria l'escrutini d'un tribunal academic amb un nivell de confianca raonable. En l'estat actual, un oponent informat podria explotar D3 (la qüestio de les families de dependencia) per impugnar la conclusio de derrota d'H1/H2, i podria explotar D2 (els priors buits) per qüestionar la completesa del protocol.

Cap de les febleses detectades suggereix mala fe o manipulacio deliberada. El biaix de confirmacio, si n'hi ha, opera a un nivell subtil (l'absorcio generosa i la retorica estadistica), no a un nivell estructural.

---

*Fi del Dictamen. Document generat per auditoria metodologica independent.*
