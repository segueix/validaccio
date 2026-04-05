# Anàlisi de sensibilitat

> Estat: recalculat després d'afegir EID-004 al nucli evidencial.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `funcionalitat_desempat`

**Evidències retirades:** EID-004

**Resultat:**
- H1 recupera avantatge en lectura etimològica per pes d'EID-001.
- H2 es manté com a alternativa funcional de revers, però sense tracció diagnòstica forta.
- H3 perd la seva peça causal central (desempat + retirada sense rei) i es debilita.
- **La conclusió principal sobre robustesa d'H3 es debilita.**

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** EID-001

**Per què és dominant:** És l'única evidència directament etimològica al nucli de disputa del valor de *back*.

**Resultat:**
- H1 perd avantatge discriminatori principal.
- H3 guanya tracció relativa gràcies a EID-003 + EID-004.
- **La disputa passa de domini d'H1 a competència oberta amb avantatge d'H3.**

---

## Escenari 3: priors variant dins de rangs (executat)

**Mapeig ACH→pes de versemblança:** C=1.0, N=0.5, I=0.1

**Pes de versemblança per hipòtesi (matriu actual amb EID-004):**
- L(H1)=0.025
- L(H2)=0.025
- L(H3)=0.100

### Perfil 1 — Biaix ortodox (0.75 / 0.15 / 0.10)
- Posterior H1: **57.69%**
- Posterior H2: **11.54%**
- Posterior H3: **30.77%**
- Resultat: H3 encara no supera H1, però redueix fortament la distància.

### Perfil 2 — Agnòstic (0.333 / 0.333 / 0.333)
- Posterior H1: **16.67%**
- Posterior H2: **16.67%**
- Posterior H3: **66.67%**
- Resultat: H3 esdevé hipòtesi líder amb marge ampli.

### Perfil 3 — Contextualitzat (0.10 / 0.30 / 0.60)
- Posterior H1: **3.57%**
- Posterior H2: **10.71%**
- Posterior H3: **85.71%**
- Resultat: H3 es consolida de manera dominant.

**Diagnòstic de la directiva de resolució:**
- H3 ja no depèn exclusivament del Perfil 3: també lidera al Perfil 2.
- H3 no doblega encara el Perfil 1, però el biaix ortodox queda erosionat de forma substancial.
- Qualificació actual: **robustesa moderada-alta (encara no màxima)**.

---

## Buits detectats

- Persisteix dependència d'un eix etimològic únic (EID-001) per sostenir H1.
- H2 continua sense una evidència diagnòstica pròpia que li permeti liderar en cap perfil.
- Cal desagregar EID-003 en EID primàries independents per audibilitat externa.

---

## Resum de robustesa

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base (amb EID-004) | H3 guanya en 2/3 perfils de prior | — |
| Sense família dominant | H3 es debilita | sí |
| Sense evidència dominant (EID-001) | H3 lidera amb més claredat | sí |
| Priors (3 perfils) | H3 no venç Perfil 1, però domina Perfil 2 i 3 | sí |

**Valoració global:** H3 augmenta robustesa respecte la versió anterior i mostra capacitat de lideratge fora del perfil favorable, però encara no aconsegueix robustesa màxima contra biaix ortodox extrem.
