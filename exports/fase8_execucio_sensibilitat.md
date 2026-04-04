# Fase 8 — Execució operativa de sensibilitat (preparació i criteris)

Data: 2026-04-04
Prerequisits d'entrada: matriu validada (`exports/matriu_validada.md`), auditoria (`exports/auditoria_recerca.md`).

## Objectiu

Deixar preparat el protocol executable per a la sensibilitat formal, sense assignar priors ni alterar hipòtesis sense validació humana.

## Inputs obligatoris que ha d'aportar l'investigador

1. **Priors declarats** per H1/H2/H3 a `evidence/priors.md` (rang + justificació).
2. **Família de dependència dominant** a retirar a l'escenari 1.
3. **Evidència dominant** a retirar a l'escenari 2.

## Protocol (quan hi hagi inputs)

### Escenari 1 — Sense família dominant
- Retirar totes les EID de la família indicada.
- Recalcular balanç H1/H2/H3 amb el mateix esquema C/I/N.
- Registrar canvi: *es manté / es debilita / cau*.

### Escenari 2 — Sense evidència dominant
- Retirar l'EID seleccionada.
- Recalcular i comparar amb base.
- Registrar llindar d'impacte per hipòtesi.

### Escenari 3 — Variació de priors
- Aplicar extrems del rang declarat per a cada hipòtesi.
- Reportar si la conclusió canvia sota configuració escèptica.
- Deixar explícit el llindar on canvia el rànquing.

## Criteris de sortida (acceptació de fase)

La Fase 8 es considera completada quan `evidence/sensibilitat.md` contingui:
- els 3 escenaris completats,
- taula resum de robustesa,
- decisió explícita sobre estabilitat de la conclusió.

## Condicions de regressió

- Si cau la conclusió principal: regressió a Fase 2 (noves evidències) o Fase 1 (reformulació amb registre).
- Si apareix mutació no prevista d'hipòtesi: registrar a `evidence/hipotesis.md` i aplicar regla de derrota si escau.
