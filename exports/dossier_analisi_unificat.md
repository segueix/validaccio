# Dossier unificat d'anàlisi (fitxer únic descarregable)

Aquest fitxer unifica els documents de treball del cas en una sola peça per facilitar revisió i anàlisi.

---

## 1) evidence/hipotesis.md

```markdown
# Hipòtesis competitives

> Instruccions: formula totes les hipòtesis plausibles, inclosa com a mínim una hipòtesi ombra.
> Cada hipòtesi ha d'incloure prediccions observables, supòsits explícits,
> condicions d'abandonament i nucli no negociable.
> Consulta `docs/regles_derrota.md` per a les regles d'admissibilitat.

---

## H1 — Origen al Claustre de Barcelona (Teoria de l'autor)

**Enunciat:** Els jocs de marro (com l'alquerc) van néixer al claustre de la catedral de Barcelona com a reaprofitament lúdic dels taulers de càlcul (el Pam de Destre) dels picapedrers medievals. L'etimologia d'alquerc prové del romanç (lligada a "carricare", pedra de molí) i no de l'àrab clàssic.

**Prediccions observables:**
- Si H1 és certa, esperaríem trobar l'origen etimològic de la paraula alquerc lligat a contextos de pedreres o molins, i no en documents antics andalusins.
- Si H1 és certa, les incisions al claustre de Barcelona han de tenir una funció primària demostrable de càlcul arquitectònic.

**Supòsits:**
- Les incisions es van fer originalment com a eina constructiva de càlcul abans d'usar-se per jugar.
- L'evolució de la paraula "carricare" a "alquerque" és fonèticament plausible en el context romànic.

**Condicions d'abandonament:**
- Abandonaria H1 si aparegués un text andalusí inqüestionable del segle IX o X que descrigui el joc explícitament utilitzant la paraula "alquerque".

**Nucli no negociable:**
- L'origen del joc i del seu nom és autòcton, lligat a l'ofici de la pedra català, i no és una importació islàmica.

**Registre de modificacions:**

| # | Data | Modificació | Motivació | Evidència |
|---|------|-------------|-----------|-----------|
| — | — | [cap modificació fins ara] | — | — |

---

## H2 — Origen Islàmic / Andalusí (Consens establert)

**Enunciat:** El joc té un origen àrab/oriental (conegut com a *qirkat*) i va ser introduït a la Península Ibèrica durant l'època de l'Al-Àndalus, on el nom es va adaptar fonèticament a "alquerque".

**Prediccions observables:**
- Si H2 és certa, esperaríem trobar mencions clares del joc i del tauler en tractats àrabs antics.

**Supòsits:**
- El terme *qirkat* es refereix inequívocament a aquest joc de tauler específic i no a un altre tipus de joc.

**Condicions d'abandonament:**
- Abandonaria H2 si es demostrés arqueològicament o filològicament que *qirkat* és un préstec posterior provinent del romanç cap a l'àrab.

**Nucli no negociable:**
- El joc és una importació cultural musulmana d'Orient cap a Occident.

**Registre de modificacions:**

| # | Data | Modificació | Motivació | Evidència |
|---|------|-------------|-----------|-----------|
| — | — | [cap modificació fins ara] | — | — |

---

## H3 — Convergència Lúdica Universal (Hipòtesi ombra)

**Enunciat:** L'estructura geomètrica del tauler és un disseny bàsic que va aparèixer de forma espontània i convergent en diverses cultures paral·leles sense un únic punt d'origen ni transmissió directa.

**Prediccions observables:**
- Si H3 és certa, esperaríem trobar taulers idèntics en cultures sense cap contacte directe (ex: a l'Amèrica precolombina).

**Supòsits:**
- El disseny d'aquesta graella és prou intuïtiu com per ser generat independentment per humans que volen passar l'estona.

**Condicions d'abandonament:**
- Abandonaria H3 si es demostrés que les regles complexes de captura són idèntiques a tot arreu des del principi (la geometria pot convergir per atzar, però unes regles arbitràries complexes no).

**Nucli no negociable:**
- No hi ha cap lloc d'invenció únic; és un desenvolupament antropològic múltiple.

**Registre de modificacions:**

| # | Data | Modificació | Motivació | Evidència |
|---|------|-------------|-----------|-----------|
| — | — | [cap modificació fins ara] | — | — |
```

---

## 2) evidence/evidencies.tsv

```tsv
EID	font	pagines	tipus	data_interval	fiabilitat	familia_dep	interpretacio_minima
EID-001	Federico Corriente (filòleg) i Diccionario de la lengua castellana (1770)	Apèndix VI	filologica	s.XVIII - actualitat	alta	etimologia_romanc	L'etimologia d'alquerc no prové de l'àrab sinó del llatí tardà 'carricare', referit a la pedra del molí d'oli on es premsa l'oliva (alquerque).
EID-002	Federico Corriente (estudi lexicogràfic andalusí)	Apèndix VI	documental	Edat Mitjana (Al-Àndalus)	alta	buit_documental	Hi ha una manca total de presència del terme 'alquerque' en textos i diccionaris andalusins antics, desestimant un origen àrab directe per a la paraula.
EID-003	José Manuel Hidalgo (arqueòleg, identificació any 2001)	Apèndix VI	arqueologica	s.XIV-XV	alta	pedreres_claustre	S'han identificat arqueològicament a l'ampit del claustre de la catedral de Barcelona tres taulers de marro de punta i un de marro de nou gravats a la pedra.
EID-004	Dr. Joaquim Lloveras (Tesi 1985 / Article 1998)	Apèndix VI	arqueologica_matematica	Edat Mitjana	alta	pedreres_claustre	S'ha demostrat que els gravats de marro del claustre eren, en origen, eines de càlcul (Pam i Pam de Destre) utilitzades pels picapedrers (lapiscides) medievals.
EID-005	Teoria tradicional orientalista	Apèndix VI	documental	Edat Mitjana	moderada	islamica_oriental	Les teories tradicionals relacionen el joc amb la paraula àrab 'qirkat', assumint una transmissió oriental (islam) cap a la península, sense especificar la gènesi del tauler.
```

---

## 3) evidence/ach_matrix.csv

```csv
EID,H1,H2,H3,diagnostic,justificacio
EID-001,C,I,N,si,"H1: reforça etimologia romànica autòctona; H2: contradiu origen lèxic àrab directe; H3: no discrimina sobre convergència del joc"
EID-002,C,I,N,si,"H1: absència andalusina és compatible amb origen no àrab; H2: absència en corpus andalusí contradiu predicció de mencions antigues; H3: evidència lingüística no prova ni refuta convergència"
EID-003,C,C,C,no,"Presència de taulers al claustre és compatible amb H1, H2 i H3; no discrimina origen perquè només acredita existència local en s.XIV-XV"
EID-004,C,I,C,si,"H1: compatible amb origen constructiu (Pam/Pam de Destre); H2: tensiona la gènesi com a joc importat; H3: compatible amb emergència local independent"
EID-005,I,C,I,si,"H1: hipòtesi orientalista contradiu origen autòcton; H2: dona suport directe a transmissió islàmica; H3: model de difusió única contradiu nucli de convergència múltiple"
```

---

## 4) evidence/sensibilitat.md

```markdown
# Anàlisi de sensibilitat

> Recalcular conclusions sota tres escenaris per verificar robustesa.

---

## Base (referència)

- Matriu validada amb doble codificació humana.
- Patró diagnòstic de partida:
  - H1: suport diagnòstic principal (EID-001, EID-002, EID-004)
  - H2: suport diagnòstic alternatiu (EID-005)
  - H3: suport limitat i parcialment inconsistent
- **Conclusió base:** H1 queda com a hipòtesi líder; H2 com a rival debilitada; H3 com a alternativa de suport parcial.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `pedreres_claustre`

**Evidències retirades:** EID-003, EID-004

**Resultat:**
- H1 passa de **alta** a **moderada** (manté avantatge però perd el bloc arqueològic principal).
- H2 passa de **baixa** a **baixa-moderada** (millora relativa per reducció de contradiccions fortes, però no supera H1).
- H3 passa de **baixa-moderada** a **baixa**.
- **La conclusió principal es debilita, però es manté.**

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** EID-004

**Per què és dominant:** és l'evidència diagnòstica d'alta fiabilitat que connecta directament els gravats del claustre amb funció original de càlcul (nucli explicatiu central d'H1).

**Resultat:**
- H1 passa de **alta** a **moderada-alta**.
- H2 passa de **baixa** a **baixa-moderada**.
- H3 passa de **baixa-moderada** a **baixa-moderada** (canvi menor).
- **La conclusió principal es manté, amb pèrdua moderada de robustesa.**

---

## Escenari 3: priors variant dins de rangs

**Variació aplicada:** no executada (no hi ha rangs de prior declarats a `evidence/priors.md`).

**Resultat:**
- No és possible recalcular formalment l'escenari de priors sense vulnerar la regla de no assignar priors ad hoc.
- Estat reportat com a **buit evidencial/metodològic** pendent de declaració humana de priors.
- **La conclusió principal queda provisionalment sense test de robustesa per priors.**

---

## Resum de robustesa

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base | H1 alta | — |
| Sense família dominant | H1 moderada | no (es debilita) |
| Sense evidència dominant | H1 moderada-alta | no |
| Priors variant | no avaluable | sí (pendent) |

**Valoració global:** la conclusió és **moderadament robusta** enfront de dependència/evidència dominant, però **incompleta** fins executar l'escenari de priors amb rangs explícitament declarats.
```
