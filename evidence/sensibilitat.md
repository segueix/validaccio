# Anàlisi de sensibilitat

> Estat: informe preliminar pendent de doble codificació humana de la matriu.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `corpus_catala_mediterrani`

**Evidències retirades:** EID-003

**Resultat preliminar:**
- H1 es manté estable (segueix sostinguda per EID-001).
- H2 es manté parcialment viable (EID-002).
- H3 es debilita de manera crítica per pèrdua del seu suport específic.
- **La conclusió principal es debilita per a H3.**

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** EID-001

**Per què és dominant:** És l'única evidència directament etimològica al nucli de disputa sobre el valor de *back*.

**Resultat preliminar:**
- H1 perd avantatge discriminatori clar.
- H2 i H3 augmenten competitivitat relativa en lectura funcional/material.
- **La conclusió principal sobre etimologia cau a indeterminació.**

---

## Escenari 3: priors variant dins de rangs

**Variació aplicada:** No executada (pendent de priors declarats per l'investigador a `evidence/priors.md`).

**Resultat preliminar:**
- Sense priors declarats, no es pot completar el càlcul de robustesa bayesiana.
- **Conclusió de sensibilitat no tancable en aquest escenari.**

---

## Buits detectats

- H2 no disposa encara d'evidència diagnòstica pròpia que la faci guanyar contra H1 en el terreny etimològic estricte.
- H3 depèn fortament d'una família documental agregada (EID-003) i necessita segmentació en EID primàries independents.
- Cal doble codificació humana de `evidence/ach_matrix.csv` abans de consolidar resultats.

---

## Resum de robustesa (provisional)

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base (provisional) | H1 forta en etimologia; H3 forta en tesi històrica pròpia | — |
| Sense família dominant | H3 es debilita fortament | sí |
| Sense evidència dominant | Etimologia queda indeterminada | sí |
| Priors escèptics | No avaluable (manca de priors) | n/a |

**Valoració global:** robustesa parcial; estructura sensible a pèrdua d'evidència diagnòstica clau.
