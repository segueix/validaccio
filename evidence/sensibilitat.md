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
