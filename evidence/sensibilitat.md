# Anàlisi de sensibilitat

> Estat: recalculat després d'afegir EID-005 i transició a H3.1.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `funcionalitat_desempat`

**Evidències retirades:** EID-004

**Resultat:**
- H1 recupera pes relatiu en etimologia.
- H2 es manté alternativa funcional de revers.
- H3.1 perd la seva peça causal central de desempat i es debilita.
- **La conclusió sobre superioritat d'H3.1 es debilita en absència de la família funcional.**

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** EID-001

**Per què és dominant:** És l'única evidència directament etimològica al nucli de disputa del valor de *back*.

**Resultat:**
- H1 perd avantatge discriminatori principal.
- H3.1 guanya tracció relativa per convergència EID-003 + EID-004 + EID-005.
- **La disputa passa a avantatge clar d'H3.1.**

---

## Escenari 3: priors variant dins de rangs (executat)

**Mapeig ACH→pes de versemblança:** C=1.0, N=0.5, I=0.1

**Pes de versemblança per hipòtesi (matriu actual amb EID-005):**
- L(H1)=0.0125
- L(H2)=0.0125
- L(H3.1)=0.1000

### Perfil 1 — Biaix ortodox (0.75 / 0.15 / 0.10)
- Posterior H1: **44.12%**
- Posterior H2: **8.82%**
- Posterior H3.1: **47.06%**
- Resultat: H3.1 supera lleugerament H1 fins i tot sota biaix ortodox.

### Perfil 2 — Agnòstic (0.333 / 0.333 / 0.333)
- Posterior H1: **10.00%**
- Posterior H2: **10.00%**
- Posterior H3.1: **80.00%**
- Resultat: H3.1 lidera de forma robusta.

### Perfil 3 — Contextualitzat (0.10 / 0.30 / 0.60)
- Posterior H1: **1.92%**
- Posterior H2: **5.77%**
- Posterior H3.1: **92.31%**
- Resultat: H3.1 es consolida de forma dominant.

**Diagnòstic de la directiva de resolució:**
- H3.1 lidera en els tres perfils.
- La victòria d'H3.1 s'explica per la distinció entre origen de components i invenció de funció-reglament integrat.
- Qualificació actual: **robustesa alta** amb la matriu vigent.

---

## Buits detectats

- H2 continua sense evidència diagnòstica pròpia que li permeti liderar en cap perfil.
- EID-005 s'ha d'enriquir amb cites primàries paginades del corpus Pahlavi per auditoria externa.
- Cal mantenir control de dependències entre EID-003/EID-004 per evitar sobrecomptatge narratiu.

---

## Resum de robustesa

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base (amb EID-005) | H3.1 guanya en 3/3 perfils de prior | — |
| Sense família dominant | H3.1 es debilita però no col·lapsa | sí |
| Sense evidència dominant (EID-001) | H3.1 lidera amb claredat | sí |
| Priors (3 perfils) | H3.1 venç també el Perfil 1 | sí |

**Valoració global:** robustesa alta per H3.1 en l'estat actual de la matriu, amb millora substancial respecte l'etapa H3.
