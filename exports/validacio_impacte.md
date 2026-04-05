# Validació de l'estudi i avaluació d'impacte

Data: 2026-04-05
Validador: Agent IA (Claude Code)

---

## 1. Resum de l'estudi

L'estudi investiga l'etimologia de *backgammon* mitjançant tres hipòtesis competitives:

- **H1 (Ortodòxia):** *back* = retrocés mecànic de fitxes (consens lexicogràfic).
- **H2 (Ombra):** joc complementari del revers del tauler (funcional, sense causalitat de desempat).
- **H3.1 (Resemantització):** els components del joc tenen origen oriental, però es resemantitzen a la Mediterrània medieval en integrar-se amb els escacs en taulers reversibles, adquirint funció de desempat («fer taules»).

Amb 5 evidències (EID-001 a EID-005), una matriu ACH i anàlisi bayesiana amb 3 perfils de priors, l'estudi conclou que **H3.1 lidera en els 3 perfils** amb robustesa alta.

---

## 2. Verificació aritmètica

### 2.1 Likelihoods (verificats correctament)

| Hipòtesi | Producte (C=1.0, N=0.5, I=0.1) | Likelihood |
|---|---|---|
| H1 | C×N×N×I×N = 1.0×0.5×0.5×0.1×0.5 | **0.0125** |
| H2 | I×C×N×N×N = 0.1×1.0×0.5×0.5×0.5 | **0.0125** |
| H3.1 | I×C×C×C×C = 0.1×1.0×1.0×1.0×1.0 | **0.1000** |

Els likelihoods declarats a l'estudi són **correctes**.

### 2.2 Posteriors (verificats correctament)

| Perfil | Posterior H1 | Posterior H2 | Posterior H3.1 | Líder |
|---|---:|---:|---:|---|
| 1 — Biaix ortodox | 44.12% | 8.82% | 47.06% | H3.1 |
| 2 — Agnòstic | 10.00% | 10.00% | 80.00% | H3.1 |
| 3 — Contextualitzat | 1.92% | 5.77% | 92.31% | H3.1 |

Posteriors **aritmèticament correctes**.

---

## 3. Errors i problemes detectats

### 3.1 ERROR CRÍTIC: Sensibilitat sense EID-004 mal reportada

L'estudi afirma a `evidence/sensibilitat.md` (Escenari 1):

> *"H3.1 perd la seva peça causal central de desempat i es debilita."*
> Taula resum: *"H3.1 es debilita però no col·lapsa"*

**Recàlcul real sense EID-004:**

| Perfil | Posterior H1 | Posterior H2 | Posterior H3.1 | Líder |
|---|---:|---:|---:|---|
| 1 — Biaix ortodox | **87.21%** | 3.49% | 9.30% | **H1** |
| 2 — Agnòstic | **50.00%** | 10.00% | 40.00% | **H1** |
| 3 — Contextualitzat | 15.62% | 9.38% | **75.00%** | H3.1 |

**Diagnòstic: H3.1 no "es debilita" — col·lapsa en 2 de 3 perfils.** Sense EID-004, H1 recupera el lideratge amb biaix ortodox (87%) i agnòstic (50%). Només el perfil ja favorable a H3.1 la manté líder. L'afirmació de "robustesa alta" és **insostenible** si EID-004 cau.

### 3.2 Dependencies no analitzades

El fitxer `evidence/dependencies.md` és **una plantilla buida** — no s'ha completat per a cap evidència. Això viola directament:

- `docs/marc_validacio.md` §8.4: *"Cada EID ha d'indicar la seva família de dependència"*
- `docs/marc_validacio.md` §8.1: la dependència és un artefacte mínim obligatori

**EID-003 i EID-004 provenen de la mateixa font** ("Apèndix II aportat per l'investigador"), però es tracten com a independents en el producte de likelihoods. Si pertanyen a la mateixa família de dependència, el doble comptatge infla artificialment H3.1.

### 3.3 Autoabastiment d'evidències (biaix potencial)

| EID | Font | Qui l'aporta |
|---|---|---|
| EID-001 | Etymonline | Font externa independent |
| EID-002 | Met Museum | Font externa independent |
| EID-003 | Apèndix II investigador | **Investigador** |
| EID-004 | Apèndix II investigador | **Investigador** |
| EID-005 | Corpus Sassànida (síntesi) | **Investigador** |

3 de 5 evidències (60%) provenen directament de l'investigador que defensa H3.1. La Regla 10 d'`AGENTS.md` exigeix Red Teaming per a hipòtesis rivals, però el problema invers també existeix: les evidències favorables a la teoria nova haurien de ser verificables per fonts externes paginades.

### 3.4 Registre d'afirmacions buit

`evidence/afirmacions.tsv` conté una sola fila de plantilla. L'estudi no ha completat el registre de traçabilitat AID→EID exigit pel marc (§8.6). Sense aquest registre, cap conclusió factual és formalment traçable.

### 3.5 Base evidencial prima

5 evidències per a 3 hipòtesis és el mínim funcional. La matriu té una estructura asimètrica: H3.1 rep C en 4/5 evidències i I en 1. Això crea una dependència extrema del mapeig C/I/N: qualsevol reclassificació d'un sol C a N canviaria dràsticament els resultats.

### 3.6 EID-005 sense cites primàries paginades

L'estudi reconeix aquest buit a `evidence/sensibilitat.md`:

> *"EID-005 s'ha d'enriquir amb cites primàries paginades del corpus Pahlavi per auditoria externa."*

Sense paginació verificable, EID-005 no compleix el requisit de traçabilitat del marc.

---

## 4. Punts forts de l'estudi

1. **Marc metodològic sòlid.** El `marc_validacio.md` és excel·lent: tres pilars ben documentats (Tucker, Bayes, ACH/Heuer), amb correccions crítiques (Climenhaga, Dhami) i fonts verificables. És un marc publicable per si sol.

2. **Transparència procedimental.** Tots els passos són explícits i auditables: hipòtesis amb prediccions, matriu C/I/N, priors declarats, likelihood explícit.

3. **Originalitat de la tesi.** La distinció entre "origen de components" i "invenció de funció-reglament integrat" (H3.1) és genuïnament nova i intel·lectualment potent.

4. **Resistència parcial als priors hostils.** H3.1 guanya fins i tot amb el Perfil 1 ortodox (47% vs 44%), cosa que mostra força discriminatòria de la matriu.

5. **Autoconeixement dels límits.** L'estudi identifica buits (EID-005, dependències EID-003/EID-004) encara que no els resol.

---

## 5. Veredicte: és impactable?

### 5.1 Dictamen incondicional (mecànic)

| Criteri | Estat | Nota |
|---|---|---|
| Aritmètica correcta | **PASSA** | Likelihoods i posteriors verificats |
| Sensibilitat reportada fidelment | **FALLA** | Escenari 1 subestima col·lapse d'H3.1 |
| Dependencies documentades | **FALLA** | Plantilla buida |
| Traçabilitat AID→EID | **FALLA** | Registre buit |
| Base evidencial suficient | **PARCIAL** | 5 EID és el mínim; massa concentrades en 1 font |
| Doble codificació | **NO VERIFICABLE** | No hi ha registre explícit de confirmació |

### 5.2 Dictamen condicional (atributiu)

La tesi central d'H3.1 (resemantització mediterrània del Nard/Taules com a desempat d'escacs ofegats) és **una contribució original i valuosa** al camp de la història dels jocs de taula. Però:

- **No és publicable en l'estat actual.** Els defectes de sensibilitat (§3.1), dependències (§3.2) i traçabilitat (§3.4) invaliden formalment la conclusió de "robustesa alta".
- **És impactable si es corregeix.** La tesi té potencial d'impacte en revistes d'història cultural, ludologia o filologia romànica, sempre que:

### 5.3 Accions necessàries per fer l'estudi impactable

| # | Acció | Prioritat |
|---|---|---|
| 1 | **Corregir l'Escenari 1 de sensibilitat** amb els càlculs reals (H1 guanya en 2/3 perfils sense EID-004) | URGENT |
| 2 | **Completar `dependencies.md`** — especialment clarificar si EID-003 i EID-004 són independents o mateixa família | URGENT |
| 3 | **Completar `afirmacions.tsv`** amb traçabilitat AID→EID paginada | ALTA |
| 4 | **Afegir cites primàries paginades a EID-005** (corpus Pahlavi: Wizarishn, etc.) | ALTA |
| 5 | **Ampliar base evidencial** — buscar fonts externes independents que sustentin o refutin H3.1 (mínim 2-3 EID noves) | ALTA |
| 6 | **Documentar doble codificació** amb registre temporal | MODERADA |
| 7 | **Verificar Red Teaming** (Regla 10): confirmar que H1 va ser formulada per font independent | MODERADA |

---

## 6. Conclusió

> **L'estudi té una tesi original i un marc metodològic de qualitat, però no és impactable en l'estat actual.** L'error en la sensibilitat (Escenari 1) i les dependències no analitzades debiliten la conclusió de robustesa. Amb les correccions indicades — especialment la número 1 (sensibilitat) i 2 (dependències) — l'estudi pot assolir el nivell de rigor necessari per ser publicable i impactant.
>
> La fortalesa principal és que H3.1 guanya fins i tot sota priors hostils **amb la matriu completa**. La feblesa principal és que depèn críticament d'EID-004, i aquesta dependència no està reconeguda amb prou claredat.
