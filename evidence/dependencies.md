# Famílies de dependència (cas Backgammon)

> Objectiu: separar explícitament vies de verificació independents per evitar doble comptatge i habilitar KO tècnic.
> Si un bloc aparentment únic conté subproves per vies diferents, s'ha de bifurcar abans de construir o recalcular la matriu ACH.

---

## Família 1 — Lexicografia anglesa

**Definició de via:** tradició etimològica anglesa sobre el terme *backgammon*.

**Evidències membres:**
- EID-001 (Etymonline)

**Criteri d'independència:**
- Font externa en línia, tradició lexicogràfica anglosaxona independent de qualsevol corpus català o mediterrani.

**Dependència detectada:**
- Cap. Via única i autònoma.

---

## Família 2 — Materialitat de taulers

**Definició de via:** evidència iconogràfica i objectual de taulers reversibles/multi-joc.

**Evidències membres:**
- EID-002 (Metropolitan Museum of Art)

**Criteri d'independència:**
- Objecte físic del s.XV catalogat per institució museística independent. No depèn de cap interpretació textual catalana ni filològica.

**Dependència detectada:**
- Cap. Via única i autònoma.

---

## Família 3 — Arqueologia documental catalana

**Definició de via:** registres notarials, inventaris i fonts primàries catalanes que documenten l'existència i ús de taules.

**Evidències membres:**
- EID-003

**Fonts primàries subjacents:**
- Testament de l'ardiaca Ramon al monestir de Sant Cugat (1045)
- Inventari d'Arnau Mir de Tost (1068)
- Ramon Llull, *Llibre de l'orde de cavalleria* (1274-1276)
- Inventari de béns del rei Martí l'Humà (1410)

**Criteri d'independència:**
- Documents notarials i inventaris històrics d'arxiu. La via de verificació és arqueologia documental: existència material i social del joc en context català medieval. No requereix cap anàlisi filològica ni lexicogràfica per sostenir-se.

**Dependència detectada:**
- Cap respecte a Família 4 (lexicografia catalana). Les fonts són de naturalesa completament diferent (registres d'arxiu vs. diccionaris filològics).

---

## Família 4 — Lexicografia catalana

**Definició de via:** obres lexicogràfiques i etimològiques d'autors externs que documenten i analitzen l'expressió «fer taules».

**Evidències membres:**
- EID-004

**Fonts primàries subjacents:**
- Diccionari Aguiló (1915-1932): defineix «fer taules» en relació al mat ofegat
- Diccionari català-valencià-balear (DCVB), Alcover i Moll
- Diccionari etimològic i complementari de la llengua catalana, Joan Coromines (1980)

**Criteri d'independència:**
- Obres de referència filològica produïdes per acadèmics externs (Aguiló, Alcover-Moll, Coromines). La via de verificació és filològica i lexicogràfica: significat documentat de l'expressió «fer taules» i la seva connexió amb el desempat als escacs. No requereix cap document notarial ni inventari per sostenir-se.

**Dependència detectada:**
- Cap respecte a Família 3 (arqueologia documental). Les fonts són de naturalesa completament diferent (diccionaris filològics vs. registres d'arxiu).

---

## Família 5 — Tradició oriental

**Definició de via:** corpus sassànida i pahlavi sobre l'origen cosmològic del Nard/Taules.

**Evidències membres:**
- EID-005

**Fonts primàries subjacents:**
- Wizarishn i tradició pahlavi (s. V–VII)

**Criteri d'independència:**
- Tradició textual oriental, completament independent de qualsevol font europea.

**Dependència detectada:**
- Cap respecte a cap altra família. Nota: les cites primàries paginades del corpus Pahlavi encara no s'han incorporat al repositori per a auditoria externa.

---

## Taula de control de bifurcació

| Bloc inicial | Subprova | Família assignada | Justificació de separació |
|---|---|---|---|
| Compilació investigador (antic «Apèndix II») | Registres notarials catalans (s.XI–XV) | Família 3 — Arqueologia documental | Fonts primàries: testaments, inventaris d'arxiu. Via: existència material/social del joc. |
| Compilació investigador (antic «Apèndix II») | Lexicografia de «fer taules» (s.XX) | Família 4 — Lexicografia catalana | Fonts primàries: Aguiló, Alcover-Moll, Coromines. Via: anàlisi filològica de la locució. |

**Justificació d'ortogonalitat EID-003 / EID-004:** L'EID-003 prové de l'arqueologia documental i demostra l'existència i materialitat primerenca del joc compartint suport amb els escacs. L'EID-004 prové de l'estudi filològic, demostrant l'origen de la locució d'empat als escacs. No tenen dependència causal entre elles: la primera respon a «el joc existia i cohabitava amb els escacs?» i la segona a «què significa l'expressió fer taules?». La seva convergència cap a H3.1 reforça la hipòtesi de manera genuïna, sense inflar artificialment la probabilitat bayesiana.

---

## Evidències independents confirmades

| EID | Família | Justificació d'independència |
|---|---|---|
| EID-001 | Família 1 — Lexicografia anglesa | Font externa (Etymonline), tradició anglosaxona autònoma |
| EID-002 | Família 2 — Materialitat de taulers | Objecte catalogat per Met Museum, via iconogràfica independent |
| EID-003 | Família 3 — Arqueologia documental catalana | Registres notarials i inventaris d'arxiu (s.XI–XV), via documental |
| EID-004 | Família 4 — Lexicografia catalana | Diccionaris d'Aguiló, Alcover-Moll i Coromines, via filològica |
| EID-005 | Família 5 — Tradició oriental | Corpus sassànida/pahlavi, via completament independent |

**Conclusió:** Les 5 evidències pertanyen a 5 famílies de dependència diferents. No hi ha doble comptatge. El producte de likelihoods és legítim.
