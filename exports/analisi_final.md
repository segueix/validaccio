# Informe final de sensibilitat — Triple Anomalia del 9

## Base ACH (entrada)
- Matriu usada: `evidence/ach_matrix.csv`
- Marcador base: **H1 = 4 · H2 = 4 · H3 = 0**
- Criteri: minimització d'inconsistències (ACH)

## Escenari A — Retirada família dominant (`anomalia_ludica`)
- Evidències excloses: `EID-025`, `EID-026`, `EID-028`
- Marcador: **H1 = 1 · H2 = 1 · H3 = 0**
- Lectura: H3 es manté com a millor hipòtesi; baixa la força discriminant global.

## Escenari B — Retirada evidència dominant (`EID-027`)
- Evidència exclosa: `EID-027`
- Marcador: **H1 = 3 · H2 = 3 · H3 = 0**
- Lectura: H3 es manté; l'avantatge es redueix però no cau.

## Escenari C — Priors adversos
- Condició: sense rangs formalitzats a `evidence/priors.md`; s'aplica estrès qualitatiu advers a H3.
- Resultat: la jerarquia ACH no canvia (H3 continua amb 0 inconsistències).

## Dictamen de sensibilitat
La conclusió principal (**H3 superior per inconsistències mínimes**) **es manté** en els tres escenaris. El sistema és robust en estructura, però la capacitat de discriminació empírica es redueix quan s'elimina la família material `anomalia_ludica`.
