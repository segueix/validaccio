# Matriu ACH — Triple Anomalia del 9 (revisió 3c)

## Cobertura de dades
- EID codificats: **EID-019 a EID-028**.
- Ajust 3c aplicat: correcció de falses inconsistències d'H3 segons criteri de diagnosticitat (Heuer), reclasificant `EID-019..024` d'`I` a `N/C` quan no refuten directament el nucli d'H3.

## Recompte d'inconsistències (I)

| Hipòtesi | Inconsistències |
|---|---:|
| H1 | 4 |
| H2 | 4 |
| H3 | 0 |

## Taula resum

| EID | H1 | H2 | H3 | Diagnòstica |
|---|---|---|---|---|
| EID-019 | C | N | C | si |
| EID-020 | C | N | C | si |
| EID-021 | C | N | C | si |
| EID-022 | N | C | N | no |
| EID-023 | N | C | N | no |
| EID-024 | N | C | N | no |
| EID-025 | I | I | C | si |
| EID-026 | I | I | C | si |
| EID-027 | I | I | C | si |
| EID-028 | I | I | C | si |

## Lectura ACH mínima
- `EID-025` i `EID-026` mantenen conflicte diagnòstic fort contra H1/H2 (`I/I`) i suporten H3 (`C`).
- Les evidències de jugabilitat/equilibri (`EID-019..021`) passen a ser compatibles amb H3 en tant que efectes emergents d'un sistema tancat.
- Les evidències simbòliques generals (`EID-022..024`) es tracten com no diagnòstiques per H3 en aquesta revisió.

> [!IMPORTANT]
> **Marcador Final ACH**
>
> **H1 = 4 · H2 = 4 · H3 = 0**
