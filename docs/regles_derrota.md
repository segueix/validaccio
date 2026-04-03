# Regles de derrota i admissibilitat de hipòtesis rivals

> Aquest document fixa les regles del joc abans d'avaluar cap teoria concreta.
> Un cop acceptades, no es modifiquen durant l'anàlisi del cas.
> Qualsevol modificació posterior ha de ser explícita, motivada i versionada.

---

## 1. Objecte de validació

L'objecte que es valida és sempre un artefacte concret i delimitat, no un "nucli possible" indeterminat. Abans de començar l'anàlisi, cal fixar per escrit:

- **Què és exactament l'objecte:** el còdex, document o artefacte tal com existeix ara, amb les seves característiques materials i textuals observables.
- **Què NO és l'objecte:** una reconstrucció hipotètica d'un "original perdut", ni un "nucli antic" que podria haver existit en alguna forma no especificada.

**Regla:** si una hipòtesi requereix postular un objecte diferent del que existeix per sobreviure, ha de declarar-ho explícitament i justificar l'existència d'aquest objecte amb evidència independent. No n'hi ha prou amb dir "podria haver existit un original".

---

## 2. Admissibilitat de hipòtesis rivals

Una hipòtesi rival és admissible si i només si compleix totes les condicions següents:

### 2.1 Falsificabilitat
La hipòtesi ha de fer prediccions observables que, si no es compleixen, la debilitarien. Una hipòtesi que no pot ser debilitada per cap evidència concebible no és una hipòtesi científica — és un article de fe.

**Test:** si la hipòtesi rival no pot respondre a la pregunta "quina evidència et faria canviar d'opinió?", no és admissible dins d'aquest marc.

### 2.2 Estabilitat
La hipòtesi ha de mantenir el seu enunciat central durant l'anàlisi. No pot mutar cada cop que es presenta una dificultat. Específicament:

- **Mutació prohibida:** reformular l'enunciat central per esquivar una evidència adversa sense declarar la reformulació com a hipòtesi nova.
- **Replegament prohibit:** retrocedir cap a versions cada cop més febles ("bé, potser no tot és de l'època X, però hi ha un nucli antic") sense evidència independent per al "nucli".
- **Afegit ad hoc prohibit:** incorporar supòsits nous que no estaven a l'enunciat original per neutralitzar evidència adversa.

**Regla:** si una hipòtesi rival necessita tres o més modificacions no previstes per sobreviure a l'evidència, es considera derrotada operativament. Les modificacions es comptabilitzen a la matriu.

### 2.3 Parsimònia
A igualtat d'evidència, la hipòtesi que requereix menys supòsits no verificats és preferible. Cada supòsit no verificat que una hipòtesi necessita és un cost epistemològic que es registra explícitament.

---

## 3. Evidència diagnòstica vs. ornamental

### 3.1 Evidència diagnòstica
Una evidència és diagnòstica si discrimina entre hipòtesis — és a dir, si és consistent amb almenys una hipòtesi i inconsistent amb almenys una altra. Només l'evidència diagnòstica pot modificar la confiança relativa entre hipòtesis.

### 3.2 Evidència ornamental
Una evidència és ornamental si és consistent amb totes les hipòtesis en joc. Pot il·lustrar el context, però no té pes en la decisió entre hipòtesis. Es registra a la matriu com a N (neutral) en totes les columnes.

**Regla:** cap conclusió pot basar-se majoritàriament en evidència ornamental. Si més del 60% de les evidències citades en una conclusió són ornamentals, la conclusió es marca com a "insuficientment sustentada".

---

## 4. Condicions de derrota d'una hipòtesi

Una hipòtesi es considera derrotada quan es compleix qualsevol d'aquestes condicions:

### 4.1 Inconsistència acumulada
La hipòtesi és inconsistent amb tres o més evidències diagnòstiques independents (de famílies de dependència diferents).

### 4.2 Absència de suport diagnòstic
La hipòtesi no té cap evidència diagnòstica que la sustenti — és a dir, tota l'evidència que la suporta és igualment consistent amb les rivals.

### 4.3 Dependència de supòsits no verificats
La hipòtesi requereix dos o més supòsits que no tenen suport evidencial independent i que són necessaris per a la seva viabilitat.

### 4.4 Mutació excessiva
La hipòtesi ha hagut de ser reformulada tres o més vegades per esquivar evidència adversa (sense que les reformulacions estiguin sustentades per evidència nova).

### 4.5 Fragilitat a sensibilitat
La hipòtesi perd el suport quan s'elimina una sola família de dependència o quan els priors es mouen dins de rangs raonables.

**Regla de registre:** quan una hipòtesi compleix qualsevol condició de derrota, es marca com a "derrotada" a `evidence/hipotesis.md` amb referència a la condició i les evidències/modificacions que la desencadenen. La derrota és auditable.

---

## 5. Protecció contra el camaleonisme

El camaleonisme és la tendència d'una hipòtesi rival a transformar-se indefinidament per esquivar la derrota. Per prevenir-lo:

### 5.1 Registre de versions
Cada modificació d'una hipòtesi rival es registra amb data, motivació i evidència que la desencadena. El registre és acumulatiu i no es pot esborrar.

### 5.2 Límit de modificacions
Si una hipòtesi acumula tres modificacions no previstes, es considera operativament derrotada (regla 4.4). L'investigador pot optar per declarar una hipòtesi nova que incorpori les modificacions, però ha de ser avaluada de zero contra tota l'evidència.

### 5.3 Declaració prèvia
Abans de començar l'anàlisi, cada hipòtesi ha de declarar:
- **Prediccions fortes:** què ha de ser cert perquè la hipòtesi sigui viable.
- **Condicions d'abandonament:** quina evidència faria que l'investigador la descartés.
- **Nucli no negociable:** quina part de l'enunciat no pot canviar sense que la hipòtesi sigui una altra.

---

## 6. Què cal per salvar una atribució forta

Quan una hipòtesi atribueix un artefacte a un autor, període o context específic (atribució forta), la càrrega de la prova és proporcional a la força de l'atribució. Específicament:

- **Atribució forta:** "aquest artefacte és obra de X en el període Y". Requereix evidència diagnòstica directa (documental, codicològica, lingüística o material) que vinculi l'artefacte amb X i Y, no només compatibilitat contextual.
- **Atribució feble:** "aquest artefacte podria ser d'un context proper a X". Requereix menys evidència, però també ofereix menys poder explicatiu.

**Regla:** una atribució forta no pot ser defensada només amb evidència ornamental ni amb absència d'evidència contrària. El silenci documental no és evidència a favor.

---

## 7. Aplicació temporal

Aquestes regles s'apliquen en el moment de fixar les hipòtesis i abans de començar l'avaluació d'evidències. Un cop fixades:

- No es modifiquen durant l'anàlisi del cas concret.
- Si cal modificar-les, es fa en un commit separat amb justificació explícita i es reavalua tota l'evidència sota les noves regles.
- La versió de les regles vigent durant l'anàlisi queda registrada al repositori.
