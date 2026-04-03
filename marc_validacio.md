# Marc teòric per a la validació probabilística de teories històriques basades en evidències convergents

**Versió 2.1 — Abril 2026**
*Amb annex operatiu mínim incorporat*

---

## 1. Objectiu i principis rectors

Aquest document estableix el marc teòric per avaluar de forma rigorosa, transparent i auditable la validesa de teories històriques construïdes a partir d'evidències parcials, indirectes o convergents. El marc s'estructura en tres pilars procedents de disciplines diferents: epistemologia de la historiografia, probabilitat epistèmica bayesiana i tècniques analítiques estructurades.

Respecte a la primera versió del document, aquesta revisió incorpora tres correccions crítiques identificades durant la validació externa:

a) **La relació entre IME i Bayes.** La inferència a la millor explicació (IME) funciona com a generadora i organitzadora d'hipòtesis, no com a regla d'actualització. L'actualització de la confiança segueix regles de coherència bayesiana. Barrejar ambdues funcions sense explicitar-les pot produir incoherència lògica.

b) **El problema dels priors.** Qualsevol assignació de probabilitat inicial ha de ser explícita, justificada i sotmesa a anàlisi de sensibilitat. S'adopta l'escala ordinal com a estàndard i es reserva la quantificació numèrica per a casos amb likelihoods reals.

c) **Les limitacions empíriques de l'ACH.** L'anàlisi d'hipòtesis competitives no és una vacuna universal contra el biaix de confirmació. S'incorpora com a instrument condicionat, amb condicions d'ús i límits documentats.

Totes les fonts citades en aquest document són d'accés lliure o tenen versions substancials accessibles en línia. Això permet la verificació independent de cada afirmació teòrica.

**Principi central:** separem explícitament el **nucli evidencial** (proposicions factuals sustentades per fonts) de la **capa interpretativa** (lectures narratives, judicis de valor, contextualització cultural). El marc valida només el nucli evidencial. La capa interpretativa es presenta com a condicionada i separable.

---

## 2. Pilar I — Legitimació epistemològica

### 2.1 Fonament: la historiografia com a ciència

El primer pilar estableix per què és legítim tractar la recerca històrica com una forma d'investigació científica avaluable amb criteris epistemològics explícits. La referència central és l'obra d'Aviezer Tucker, que ofereix la primera aplicació sistemàtica de la filosofia de la ciència a la historiografia.

**Font principal:** Tucker, A. (2004). *Our Knowledge of the Past: A Philosophy of Historiography*. Cambridge University Press. Capítol introductori accessible a: [assets.cambridge.org](https://assets.cambridge.org/97805218/34155/sample/9780521834155ws.pdf)

**Font complementària:** Tucker, A. (2024). *Historiographic Reasoning*. Cambridge Elements. Accessible a: [academia.edu](https://www.academia.edu/123478521/Historiographic_Reasoning)

**Ressenya crítica:** Zammito, J. H. (2004). Ressenya a *Notre Dame Philosophical Reviews*. Accessible a: [ndpr.nd.edu](https://ndpr.nd.edu/reviews/our-knowledge-of-the-past-a-philosophy-of-historiography/)

### 2.2 Conceptes que incorporem al marc

**Historiografia científica vs. interpretació historiogràfica.** Tucker distingeix entre la historiografia com a producció de coneixement probable del passat (científica) i la historiografia com a producte que afegeix judicis ètics, estètics i polítics (interpretativa). Aquesta distinció és el fonament del principi de separació entre nucli evidencial i capa interpretativa que regeix tot el marc.

**Inferència a la millor explicació (IME).** El mecanisme central de justificació historiogràfica: davant d'un conjunt d'evidències, la hipòtesi que millor explica la totalitat de les dades disponibles és la que mereix acceptació provisional. Les hipòtesis es seleccionen entre alternatives competitives en funció de poder explicatiu, simplicitat, consistència interna i capacitat de predir noves troballes.

**Correcció crítica sobre la IME.** Dins d'aquest marc, la IME funciona exclusivament com a ***generadora i organitzadora d'hipòtesis*** i com a criteri d'assignació de plausibilitat inicial (priors), però ***no com a regla d'actualització***. Climenhaga (2017) demostra formalment que usar la IME com a regla d'inferència autònoma —fora del marc bayesià— pot conduir a creences deductivament inconsistents o a credences probabilísticament incoherents, especialment quan hi ha múltiples nivells d'explicació.

**Font de la correcció:** Climenhaga, N. (2017). "Inference to the Best Explanation Made Incoherent." *Journal of Philosophy* 114(5): 251–273. Preprint a: [philsci-archive.pitt.edu/12756/](https://philsci-archive.pitt.edu/12756/)

**Evidència com a traça i convergència de fonts independents.** Les fonts històriques són traces d'esdeveniments passats. La seva fiabilitat es pot avaluar amb criteris objectius: proximitat temporal, independència, intencionalitat. Tucker (2016) explicita el principi bayesià clau: quan la probabilitat prèvia d'una hipòtesi és baixa però dues o més fonts independents la sustenten, la probabilitat posterior augmenta dràsticament. Això formalitza el valor de l'evidència convergent.

**Font:** Tucker, A. (2016). "The Reverend Bayes vs. Jesus Christ." *History and Theory* 55(1): 129–140. Accessible a: [academia.edu/21612004/](https://www.academia.edu/21612004/)

### 2.3 Funció dins el marc

Tucker proporciona la legitimació teòrica per tractar la recerca històrica com a ciència. Respon a la pregunta: *"Per què és legítim avaluar hipòtesis històriques amb criteris de probabilitat?"* Sense aquest fonament, qualsevol intent de quantificar la força de les evidències seria epistemològicament buit.

---

## 3. Pilar II — Fonamentació probabilística bayesiana

### 3.1 Fonament: la probabilitat epistèmica

El segon pilar formalitza com s'assignen i actualitzen graus de confiança en hipòtesis històriques a partir d'evidència incompleta. La probabilitat epistèmica és diferent de la probabilitat estadística (freqüència observada) i de la probabilitat subjectiva (creença personal). És la probabilitat que resulta d'aplicar correctament el raonament bayesià a un cos d'evidències, i és l'única aplicable a esdeveniments històrics irrepetibles.

**Fonts principals:**

Lin, H. (2022). "Bayesian Epistemology." *Stanford Encyclopedia of Philosophy*. Accessible a: [plato.stanford.edu/entries/epistemology-bayesian/](https://plato.stanford.edu/entries/epistemology-bayesian/)

Joyce, J. (2003). "Bayes' Theorem." *Stanford Encyclopedia of Philosophy*. Accessible a: [plato.stanford.edu/entries/bayes-theorem/](https://plato.stanford.edu/entries/bayes-theorem/)

### 3.2 Conceptes que incorporem al marc

**Probabilisme i condicionalització.** Les dues normes centrals de l'epistemologia bayesiana: (1) les credences d'un agent racional han de satisfer els axiomes de la probabilitat (probabilisme), i (2) quan s'obté nova evidència, les credences s'han d'actualitzar per condicionalització. El teorema de Bayes formalitza exactament aquest procés: la probabilitat posterior d'una hipòtesi és proporcional al producte de la probabilitat prèvia (prior) pel likelihood de l'evidència donada la hipòtesi.

**El problema dels priors i la solució objectivista.** El punt més vulnerable de qualsevol aplicació bayesiana és la tria de priors. Si els priors són arbitraris, el resultat també ho és. Jon Williamson proposa una solució rigorosa: el bayesianisme objectiu, que afegeix al probabilisme i la condicionalització un tercer principi —l'equivocació (entropia màxima)— segons el qual les credences han de ser tan poc informatives com sigui possible donades les restriccions. Això proporciona una política de priors defensable: no són "objectius" en sentit absolut, però són els menys arbitraris possible.

**Font:** Landes, J. i Williamson, J. (2013). "Objective Bayesianism and the Maximum Entropy Principle." *Entropy* 15(9): 3528–3591. Accés obert a: [mdpi.com/1099-4300/15/9/3528](https://www.mdpi.com/1099-4300/15/9/3528)

**Font complementària:** Williamson, J. (2023). "Bayesianism from a Philosophical Perspective and Its Application to Medicine." *International Journal of Biostatistics* 19(2): 295–307. Accessible a: [kar.kent.ac.uk](https://kar.kent.ac.uk/99017/1/10.1515_ijb-2022-0043.pdf)

**Política de quantificació per a aquest marc.** Per evitar la falsa precisió numèrica, el marc adopta una escala ordinal de cinc nivells com a estàndard (molt baixa / baixa / moderada / alta / molt alta). La quantificació numèrica (intervals, factors de Bayes) es reserva per a casos on els likelihoods siguin defensables empíricament. En tots els casos es requereix anàlisi de sensibilitat: variar els priors dins de rangs raonables i verificar si la conclusió es manté.

### 3.3 El pont entre IME i Bayes

Un dels punts de fricció teòrics més importants del marc és la relació entre la inferència a la millor explicació (Pilar I) i l'actualització bayesiana (Pilar II). El debat filosòfic és viu i no resolt, però hi ha propostes d'integració defensables.

Iranzo (2008) distingeix entre dues interpretacions: l'"IBE-Bayesianism" (on el mèrit explicatiu determina els priors) i el "frequentist-Bayesianism" (on l'historial empíric els determina), i argumenta que la segona opció és més robust perquè evita lectures purament subjectivistes dels priors i manté un rol per al valor explicatiu.

**Font:** Iranzo, V. (2008). "Bayesianism and Inference to the Best Explanation." *THEORIA* 23(1): 89–106. Accessible a: [dialnet.unirioja.es](https://dialnet.unirioja.es/descarga/articulo/2712732.pdf) i [philsci-archive.pitt.edu](https://philsci-archive.pitt.edu/10410/1/Iranzo.pdf)

Lange (2020) aporta una proposta addicional: la qualitat explicativa afecta no només els priors sinó també els likelihoods (la probabilitat de l'evidència donada la hipòtesi). Això amplia el canal pel qual la IME entra al càlcul bayesià.

**Font:** Lange, M. (2020). "Putting Explanation Back into 'Inference to the Best Explanation.'" *Noûs*. Manuscrit accessible a: [philosophy.unc.edu](https://philosophy.unc.edu/wp-content/uploads/sites/122/2013/10/Nous-2020-Lange-Putting-explanation-back-into-inference-to-the-best-explanation.pdf)

**Posició adoptada en aquest marc:** la IME genera i ordena hipòtesis i contribueix a l'assignació de priors (via plausibilitat i simplicitat) i de likelihoods (via qualitat explicativa). L'actualització formal de credences segueix la lògica bayesiana. Aquesta integració evita la incoherència demostrada per Climenhaga sense renunciar al poder heurístic de la IME.

### 3.4 Funció dins el marc

El segon pilar respon a la pregunta: *"Es pot assignar rigorosament un nivell de confiança a una afirmació sobre el passat?"* La resposta és sí, sempre que: (1) el procés d'actualització sigui transparent, (2) els priors estiguin justificats o siguin mínimament informatius, (3) les dependències entre evidències estiguin controlades, i (4) es realitzi anàlisi de sensibilitat.

---

## 4. Pilar III — Eines operatives i control de biaixos

### 4.1 Fonament: per què el raonament intuïtiu no és suficient

El tercer pilar parteix d'una constatació empírica: el raonament humà, fins i tot el d'experts, està sistemàticament distorsionat per biaixos cognitius. Tversky i Kahneman (1974) van demostrar que els judicis sota incertesa depenen de tres heurístiques —representativitat, disponibilitat i ancoratge— que produeixen errors predictibles i sistemàtics.

**Font:** Tversky, A. i Kahneman, D. (1974). "Judgment under Uncertainty: Heuristics and Biases." *Science* 185(4157): 1124–1131. Accessible a: [sites.socsci.uci.edu](https://sites.socsci.uci.edu/~bskyrms/bio/readings/tversky_k_heuristics_biases.pdf)

Això implica que qualsevol investigador històric que avalua evidències és susceptible de: sobreponderar l'evidència que confirma la seva hipòtesi preferida (biaix de confirmació), ancorar-se a la primera estimació i ajustar insuficientment (ancoratge), i jutjar la probabilitat d'un escenari per la facilitat amb què ve a la ment (disponibilitat). Les tècniques estructurades són el corrector necessari.

### 4.2 L'anàlisi d'hipòtesis competitives (ACH): ús i límits

Heuer (1999) va desenvolupar l'ACH com a procediment sistemàtic per avaluar hipòtesis múltiples contra evidència. El mètode consisteix a: llistar totes les hipòtesis plausibles, identificar les evidències rellevants, construir una matriu de consistència (hipòtesis × evidències), buscar evidència diagnòstica (que discrimina entre hipòtesis), i seleccionar la hipòtesi més difícil de refutar.

**Font principal:** Heuer, R. J. Jr. (1999). *Psychology of Intelligence Analysis*. CIA/CSI. Text complet (214 pàg.) a: [cia.gov](https://www.cia.gov/resources/csi/static/Pyschology-of-Intelligence-Analysis.pdf)

**Font metodològica:** Heuer, R. J. Jr. (2005). *How Does Analysis of Competing Hypotheses (ACH) Improve Intelligence Analysis?* Pherson Associates. Accessible a: [pherson.org](https://www.pherson.org/wp-content/uploads/2013/06/06.-How-Does-ACH-Improve-Analysis_FINAL.pdf)

**Correcció crítica: limitacions empíriques de l'ACH.** Dhami, Belton i Mandel (2019) van sotmetre l'ACH a una prova empírica amb 50 analistes professionals d'intel·ligència. Els resultats van ser sobradors: els analistes no seguien tots els passos prescrits, l'evidència de reducció del biaix de confirmació era mixta, i en alguns casos l'ACH augmentava la inconsistència i l'error de judici.

**Font:** Dhami, M. K., Belton, I. K. i Mandel, D. R. (2019). "The 'Analysis of Competing Hypotheses' in Intelligence Analysis." *Applied Cognitive Psychology* 33(6): 1080–1090. Accés obert a: [strathprints.strath.ac.uk/69049/](https://strathprints.strath.ac.uk/69049/)

### 4.3 Protocol mínim viable per a aquest marc

Donades les limitacions documentades, l'ACH s'incorpora a aquest marc com a instrument condicionat, no com a garantia. El protocol mínim viable inclou tres components:

1. **Matriu de consistència.** Creuar hipòtesis amb evidències i marcar consistència (C), inconsistència (I) o neutralitat (N). Identificar evidència diagnòstica (que discrimina) vs. no diagnòstica (consistent amb totes les hipòtesis).

2. **Control de dependències.** Cada evidència ha de portar un camp de dependència que indiqui si deriva d'una altra font. Les evidències dependents s'agrupen per famílies i s'actualitza per grup, no per ítem, per evitar el doble comptatge.

3. **Anàlisi de sensibilitat.** Recalcular conclusions eliminant l'evidència o la família dominant, i variant els priors dins de rangs raonables. Si la conclusió no sobreviu, cal declarar-ho explícitament.

### 4.4 Funció dins el marc

El tercer pilar respon a la pregunta: *"Quin procediment segueixo per avaluar hipòtesis de forma estructurada i lliure de biaixos?"* Les eines operatives converteixen els principis dels Pilars I i II en un procés executable, auditable i replicable —amb la cautela que cap tècnica elimina automàticament el biaix.

---

## 5. Precedent metodològic: Bayes en arqueologia

Per demostrar que l'aplicació bayesiana a la recerca històrica no és un exercici teòric aïllat, cal citar el treball d'Otárola-Castillo et al. (2022), que aplica explícitament la inferència bayesiana a l'avaluació d'hipòtesis en arqueologia, més enllà de la datació per radiocarboni.

Aquest estudi demostra com el coneixement previ expert es pot incorporar formalment com a prior, com les dades arqueològiques actualitzen la confiança en hipòtesis competitives, i com el procés es pot reproduir i auditar amb codi R disponible en accés obert.

**Font:** Otárola-Castillo, E. R. et al. (2022). "Beyond Chronology, Using Bayesian Inference to Evaluate Hypotheses in Archaeology." *Advances in Archaeological Practice* 10(4): 397–413. Accés obert a: [eprints.whiterose.ac.uk](https://eprints.whiterose.ac.uk/id/eprint/187322/7/beyond-chronology-using-bayesian-inference-to-evaluate-hypotheses-in-archaeology.pdf)

Codi R replicable a: [osf.io/54f62/](https://osf.io/54f62/)

---

## 6. Síntesi: com funcionen els tres pilars conjuntament

La integració dels tres pilars segueix una lògica precisa:

1. **Tucker** estableix que la recerca històrica pot i ha de ser tractada com a ciència, i que la IME és el mecanisme per generar i ordenar hipòtesis. Respon al ***per què***.

2. **L'epistemologia bayesiana** formalitza el procés d'actualització de credences a partir d'evidència, amb normes per gestionar priors, dependències i sensibilitat. Climenhaga, Iranzo i Lange expliquen com IME i Bayes s'integren sense incoherència. Williamson aporta la política de priors. Respon al ***amb quina base***.

3. **Les eines operatives** (Heuer, Dhami et al., Tversky i Kahneman) proporcionen les tècniques per executar l'avaluació de forma estructurada, amb consciència dels límits de cada tècnica. Responen al ***com es fa***.

Cap pilar és suficient per si sol. Tucker sense Bayes manca de formalització. Bayes sense Tucker manca de legitimació historiogràfica. Tots dos sense les eines operatives manquen de procediment executable. I les eines operatives soles, sense fonamentació teòrica, són receptes cegues.

---

## 7. Avantatges respecte la historiografia convencional

**Transparència.** Cada pas del raonament és explícit: hipòtesis declarades, evidències classificades, pesos justificats, conclusions traçables. Un altre investigador pot revisar i arribar a un judici independent.

**Replicabilitat.** El mètode no depèn de l'autoritat o la reputació de l'investigador, sinó de la qualitat de les evidències i del rigor del procés.

**Resistència a biaixos.** Les tècniques estructurades obliguen a considerar hipòtesis alternatives i a distingir entre evidència que confirma i evidència que discrimina, amb consciència explícita de les limitacions documentades.

**Graduació de la certesa.** Permet presentar conclusions amb graus de confiança en lloc de l'opció binària "demostrat/no demostrat", que és epistemològicament inadequada per a la majoria de qüestions històriques.

**Separació nucli/interpretació.** Blinda el marc contra la crítica que un esquema formal només "disfressa" una narració. El nucli evidencial és avaluable independentment de la capa interpretativa.

---

## 8. Annex operatiu mínim

Les regles següents converteixen el marc teòric en un protocol executable i auditable. Són condicions necessàries per validar qualsevol conclusió produïda sota aquest marc.

### 8.1 Artefactes mínims obligatoris

Cap conclusió factual és vàlida sense que existeixin prèviament els artefactes següents:

- **Llista d'hipòtesis (H):** totes les hipòtesis competitives, inclosa com a mínim una "hipòtesi ombra" (alternativa plausible mínima). Cada hipòtesi ha d'incloure prediccions observables i supòsits explícits.
- **Llista d'evidències (EID):** cada evidència identificada amb un codi únic, font/citekey, pàgines, tipus (documental, iconogràfica, arqueològica, numismàtica, filològica, contextual), data/interval, i família de dependència.
- **Taula d'afirmacions (AID):** cada proposició factual de l'article vinculada a les evidències que la sustenten (EID) amb pàgina i distinció explícita entre cita literal, paràfrasi i inferència.
- **Matriu H×E (C/I/N):** consistència, inconsistència o neutralitat de cada evidència respecte cada hipòtesi. Identificació d'evidència diagnòstica.
- **Registre de priors:** per a cada hipòtesi, la probabilitat prèvia assignada com a rang (interval), amb justificació explícita.
- **Informe de sensibilitat:** recalcular conclusions variant priors dins de rangs, eliminant l'evidència dominant i eliminant la família de dependència dominant.

### 8.2 Política de quantificació

Escala ordinal de cinc nivells (molt baixa / baixa / moderada / alta / molt alta) com a **estàndard per defecte**. El mode numèric (intervals, factors de Bayes) només es permet si es compleixen simultàniament:

- Hi ha un model de likelihood explícit i defensable.
- La independència o dependència entre evidències està justificada.
- Es presenta una prova de sensibilitat estructurada.

Si no es compleixen les tres condicions, la conclusió es reporta en escala ordinal.

### 8.3 Registre de priors

Cada hipòtesi ha de tenir un prior declarat com a **rang** (no com a valor puntual), amb una de tres categories justificatives:

- **Prior neutre:** basat en equiprobabilitat o entropia màxima (quan no hi ha informació prèvia).
- **Prior informatiu per consens:** basat en el consens historiogràfic existent (citant fonts).
- **Prior escèptic:** deliberadament baix per a la hipòtesi preferida, per testar la robustesa.

Es prohibeixen priors puntuals sense rang i priors sense justificació textual.

### 8.4 Dependències entre evidències

Cada EID ha d'indicar la seva **família de dependència** (derivació editorial, citació directa, tradició comuna, o independent). L'actualització de confiança es fa per família, no per ítem individual. L'anàlisi de sensibilitat ha d'incloure un escenari "sense la família dominant".

Criteri de definició de família: dues evidències pertanyen a la mateixa família si una deriva de l'altra, si ambdues deriven d'una font comuna, o si la seva coincidència s'explica per transmissió i no per observació independent.

### 8.5 Revisió i codificació

La codificació de la matriu (C/I/N), la fiabilitat de fonts i la diagnosticitat es fa amb **doble codificació** (dues passades independents). Les discrepàncies s'anoten explícitament i es resolen amb justificació escrita. Si cal, es recorre a un tercer revisor.

Per a projectes d'investigador individual, la doble codificació es pot substituir per una revisió temporal: primera codificació, pausa mínima de 48 hores, i segona codificació independent.

### 8.6 Traçabilitat

**Cap frase factual a les conclusions de l'article sense AID vinculat a EID amb pàgina.** Cada afirmació ha de distingir explícitament entre:

- **Cita:** reproducció literal amb pàgina.
- **Paràfrasi:** reformulació amb pàgina.
- **Inferència:** conclusió derivada de múltiples evidències, amb llista d'EID i descripció del raonament.

### 8.7 Ús d'intel·ligència artificial

Si s'utilitza un agent d'IA (com Claude Code o similar) per assistir en l'anàlisi, síntesi o redacció, s'apliquen les regles següents:

- L'agent pot proposar, però **la validació és sempre humana**.
- Qualsevol resum o inferència generada per l'agent ha de citar evidència amb pàgina abans de ser acceptada.
- L'ús d'IA es declara a la secció metodològica de l'article quan és rellevant per a la producció del contingut.

### 8.8 Política d'OCR i fonts al repositori

Per defecte, **no s'inclouen PDFs ni OCR complets al repositori**. Només metadades, checksums (SHA-256) i extractes breus justificats. L'excepció requereix simultàniament: base de drets clara (domini públic, llicència oberta o permís), repositori privat amb control d'accés, i etiqueta de qualitat d'OCR verificada per mostreig.

---

## 9. Bibliografia completa amb accés

### Pilar I — Legitimació epistemològica

- Climenhaga, N. (2017). "Inference to the Best Explanation Made Incoherent." *Journal of Philosophy* 114(5): 251–273. [philsci-archive.pitt.edu/12756/](https://philsci-archive.pitt.edu/12756/)
- Tucker, A. (2004). *Our Knowledge of the Past: A Philosophy of Historiography*. Cambridge UP. Cap. intro: [assets.cambridge.org](https://assets.cambridge.org/97805218/34155/sample/9780521834155ws.pdf)
- Tucker, A. (2016). "The Reverend Bayes vs. Jesus Christ." *History and Theory* 55(1): 129–140. [academia.edu/21612004/](https://www.academia.edu/21612004/)
- Tucker, A. (2024). *Historiographic Reasoning*. Cambridge Elements. [academia.edu](https://www.academia.edu/123478521/Historiographic_Reasoning)
- Zammito, J. H. (2004). Ressenya de Tucker 2004. *Notre Dame Philosophical Reviews*. [ndpr.nd.edu](https://ndpr.nd.edu/reviews/our-knowledge-of-the-past-a-philosophy-of-historiography/)

### Pilar II — Fonamentació bayesiana

- Cabrera, F. (2017). "Can There Be a Bayesian Explanationism?" *Synthese* 194(4): 1245–1272. [philsci-archive.pitt.edu/13438/](https://philsci-archive.pitt.edu/13438/)
- Iranzo, V. (2008). "Bayesianism and Inference to the Best Explanation." *THEORIA* 23(1): 89–106. [dialnet.unirioja.es](https://dialnet.unirioja.es/descarga/articulo/2712732.pdf)
- Joyce, J. (2003). "Bayes' Theorem." *Stanford Encyclopedia of Philosophy*. [plato.stanford.edu/entries/bayes-theorem/](https://plato.stanford.edu/entries/bayes-theorem/)
- Landes, J. i Williamson, J. (2013). "Objective Bayesianism and the Maximum Entropy Principle." *Entropy* 15(9): 3528–3591. [mdpi.com/1099-4300/15/9/3528](https://www.mdpi.com/1099-4300/15/9/3528)
- Lange, M. (2020). "Putting Explanation Back into 'Inference to the Best Explanation.'" *Noûs*. [philosophy.unc.edu](https://philosophy.unc.edu/wp-content/uploads/sites/122/2013/10/Nous-2020-Lange-Putting-explanation-back-into-inference-to-the-best-explanation.pdf)
- Lin, H. (2022). "Bayesian Epistemology." *Stanford Encyclopedia of Philosophy*. [plato.stanford.edu/entries/epistemology-bayesian/](https://plato.stanford.edu/entries/epistemology-bayesian/)
- Williamson, J. (2023). "Bayesianism from a Philosophical Perspective." *International Journal of Biostatistics* 19(2): 295–307. [kar.kent.ac.uk](https://kar.kent.ac.uk/99017/1/10.1515_ijb-2022-0043.pdf)

### Pilar III — Eines operatives

- Dhami, M. K., Belton, I. K. i Mandel, D. R. (2019). "The 'Analysis of Competing Hypotheses' in Intelligence Analysis." *Applied Cognitive Psychology* 33(6): 1080–1090. [strathprints.strath.ac.uk/69049/](https://strathprints.strath.ac.uk/69049/)
- Heuer, R. J. Jr. (1999). *Psychology of Intelligence Analysis*. CIA/CSI. [cia.gov](https://www.cia.gov/resources/csi/static/Pyschology-of-Intelligence-Analysis.pdf)
- Heuer, R. J. Jr. (2005). *How Does ACH Improve Intelligence Analysis?* Pherson Associates. [pherson.org](https://www.pherson.org/wp-content/uploads/2013/06/06.-How-Does-ACH-Improve-Analysis_FINAL.pdf)
- Tversky, A. i Kahneman, D. (1974). "Judgment under Uncertainty: Heuristics and Biases." *Science* 185(4157): 1124–1131. [sites.socsci.uci.edu](https://sites.socsci.uci.edu/~bskyrms/bio/readings/tversky_k_heuristics_biases.pdf)

### Precedent aplicat

- Otárola-Castillo, E. R. et al. (2022). "Beyond Chronology, Using Bayesian Inference to Evaluate Hypotheses in Archaeology." *Advances in Archaeological Practice* 10(4): 397–413. [eprints.whiterose.ac.uk](https://eprints.whiterose.ac.uk/id/eprint/187322/7/beyond-chronology-using-bayesian-inference-to-evaluate-hypotheses-in-archaeology.pdf)
