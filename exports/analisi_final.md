# Informe unificat d'anàlisi final (sensibilitat)

Data: 2026-04-05

## Mètode de l'Escenari C

- Priors declarats: Perfil 1 (0.75/0.15/0.10), Perfil 2 (0.333/0.333/0.333), Perfil 3 (0.10/0.30/0.60).
- Conversió ACH→versemblança: C=1.0, N=0.5, I=0.1.
- Likelihoods amb EID-004:
  - H1: 0.025
  - H2: 0.025
  - H3: 0.100

## Posteriors

| Perfil | Posterior H1 | Posterior H2 | Posterior H3 | Hipòtesi líder |
|---|---:|---:|---:|---|
| 1 — Biaix ortodox | 57.69% | 11.54% | 30.77% | H1 |
| 2 — Agnòstic | 16.67% | 16.67% | 66.67% | H3 |
| 3 — Contextualitzat | 3.57% | 10.71% | 85.71% | H3 |

## Lectura de robustesa

- H3 lidera en 2 de 3 perfils.
- H3 no supera encara H1 sota biaix ortodox extrem (Perfil 1).
- Robustesa actual d'H3: **moderada-alta** (millora clara respecte l'estat anterior).
