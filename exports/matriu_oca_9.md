# Matriu ACH — Triple Anomalia del 9 (validada)

## Cobertura de dades
- EID codificats: **EID-019 a EID-028**.
- Criteri aplicat: codificació C/I/N respecte H1, H2 i H3 amb justificació textual a `evidence/ach_matrix.csv`.

## Recompte d'inconsistències (I)

| Hipòtesi | Inconsistències |
|---|---:|
| H1 | 4 |
| H2 | 4 |
| H3 | 4 |

## Taula resum

| EID | H1 | H2 | H3 | Diagnòstica |
|---|---|---|---|---|
| EID-019 | C | N | I | si |
| EID-020 | C | N | I | si |
| EID-021 | C | N | I | si |
| EID-022 | N | C | N | no |
| EID-023 | N | C | N | no |
| EID-024 | N | C | I | si |
| EID-025 | I | I | C | si |
| EID-026 | I | I | C | si |
| EID-027 | I | I | C | si |
| EID-028 | I | I | C | si |

## Lectura ACH mínima
- Les evidències lul·lianes `EID-025` i `EID-026` introdueixen **conflicte obert** amb H1 i H2 (codificades com `I/I`) i reforcen H3 (`C`).
- Amb el conjunt complet 019–028, la matriu queda equilibrada en inconsistències totals (4/4/4), de manera que **H3 no esdevé encara l'única hipòtesi sense contradiccions materials** en aquesta passada.

> [!IMPORTANT]
> **Marcador Final ACH**
>
> **H1 = 4 · H2 = 4 · H3 = 4**
