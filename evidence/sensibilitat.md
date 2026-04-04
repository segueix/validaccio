# Anàlisi de sensibilitat

> Recalcular conclusions sota tres escenaris per verificar robustesa.

---

## Escenari 1: sense la família de dependència dominant

**Família eliminada:** `anomalia_ludica`

**Evidències retirades:** `EID-025`, `EID-026`, `EID-028`

**Resultat (recompte d'inconsistències I):**
- H1 passa de **4** a **1**
- H2 passa de **4** a **1**
- H3 passa de **0** a **0**
- **La conclusió principal es manté**, però es debilita la separació diagnòstica perquè es retiren tres proves materials clau.

---

## Escenari 2: sense l'evidència dominant

**Evidència eliminada:** `EID-027`

**Per què és dominant:** és l'única evidència de família `coherencia_semantica` que connecta directament el 9 operatiu amb la formulació lul·liana (independent de la família material `anomalia_ludica`).

**Resultat (recompte d'inconsistències I):**
- H1 passa de **4** a **3**
- H2 passa de **4** a **3**
- H3 passa de **0** a **0**
- **La conclusió principal es manté**.

---

## Escenari 3: priors variant dins de rangs

**Variació aplicada:** prova d'estrès amb priors adversos (H1/H2 favorits, H3 penalitzat) en absència de rangs formalment declarats a `evidence/priors.md`.

**Resultat:**
- Amb priors escèptics per a H3, la conclusió **es manté** sota el criteri ACH basat en inconsistències (H3 continua amb 0 `I`).
- **Llindar de canvi:** la conclusió només canviaria si s'introdueix una regla externa que sobreponderi priors per damunt de la diagnosticitat de la matriu.

---

## Resum de robustesa

| Escenari | Conclusió principal | Canvia? |
|----------|--------------------:|:-------:|
| Base | H3 (0 inconsistències) | — |
| Sense família dominant | H3 (0 inconsistències) | no |
| Sense evidència dominant | H3 (0 inconsistències) | no |
| Priors adversos | H3 (0 inconsistències ACH) | no |

**Valoració global:** la conclusió és **robusta** dins els tres escenaris testats, amb sensibilitat moderada a la pèrdua de poder discriminant quan s'elimina la família material dominant.
