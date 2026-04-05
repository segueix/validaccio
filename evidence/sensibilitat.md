# Anàlisi de sensibilitat

> Estat: actualitzat amb Escenari C calculat a partir dels priors declarats per l'investigador.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `corpus_catala_mediterrani`

**Evidències retirades:** EID-003

**Resultat:**
- H1 es manté estable (EID-001 continua discriminant a favor d'H1).
- H2 es manté competitiva en lectura funcional per EID-002.
- H3 es debilita de manera crítica en perdre el seu suport específic.
- **La conclusió principal sobre H3 es debilita.**

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** EID-001

**Per què és dominant:** És l'única evidència directament etimològica al nucli de disputa del valor de *back*.

**Resultat:**
- H1 perd avantatge discriminatori.
- H2 i H3 guanyen pes relatiu en la lectura funcional/material.
- **La conclusió etimològica queda indeterminada.**

---

## Escenari 3: priors variant dins de rangs (executat)

**Mapeig ACH→pes de versemblança:** C=1.0, N=0.5, I=0.1

**Pes de versemblança per hipòtesi (matriu actual):**
- L(H1)=0.25
- L(H2)=0.05
- L(H3)=0.10

### Perfil 1 — Biaix ortodox (0.75 / 0.15 / 0.10)
- Posterior H1: **91.46%**
- Posterior H2: **3.66%**
- Posterior H3: **4.88%**
- Resultat: H3 **no** doblega el biaix ortodox.

### Perfil 2 — Agnòstic (0.333 / 0.333 / 0.333)
- Posterior H1: **62.50%**
- Posterior H2: **12.50%**
- Posterior H3: **25.00%**
- Resultat: H1 continua primera; H3 no imposa canvi de paradigma.

### Perfil 3 — Contextualitzat (0.10 / 0.30 / 0.60)
- Posterior H1: **25.00%**
- Posterior H2: **15.00%**
- Posterior H3: **60.00%**
- Resultat: H3 guanya només sota prior inicial favorable.

**Diagnòstic de la directiva de resolució:**
- H3 depèn del Perfil 3 per imposar-se.
- Per tant, la qualificació és **robustesa baixa-moderada** (no "Robustesa Alta").

---

## Buits detectats

- H2 segueix sense evidència diagnòstica pròpia capaç de derrotar H1 en etimologia estricta.
- H3 depèn d'una família documental agregada (EID-003) i requereix desagregació en EID independents.
- Cal doble codificació humana formal de `evidence/ach_matrix.csv` si es vol auditoria externa forta.

---

## Resum de robustesa

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base | H1 domina en lectura etimològica | — |
| Sense família dominant | H3 es debilita críticament | sí |
| Sense evidència dominant | Etimologia queda indeterminada | sí |
| Priors (3 perfils) | H3 només guanya al Perfil 3 | sí |

**Valoració global:** conclusió sensible als priors i a l'evidència dominant; robustesa alta per H3 no demostrada amb la matriu actual.
