# Fase 9 — Tancament editorial i paquet d'escrutini

Data: 2026-04-04

## Estat de tancament (actualitzat)

### Checklist de lliurament

- [x] `evidence/hipotesis.md` tancat amb historial de modificacions operatiu.
- [x] `evidence/evidencies.tsv` complet i sense EID orfes en la matriu actual.
- [x] `evidence/ach_matrix.csv` validada i coherent amb EID vigents.
- [ ] `evidence/sensibilitat.md` amb 3 escenaris formalment completats (**pendent priors**).
- [x] `evidence/afirmacions.tsv` alineat amb l'esborrany de fase 5 i text final de fase 9.
- [x] `drafts/esborrany_crani_tibies_fase5.md` revisat a `drafts/revisio_fase6.md`.
- [x] `exports/matriu_validada.md` publicat com a base de decisió.
- [x] `exports/auditoria_recerca.md` publicat com a annex estratègic.
- [x] `drafts/article_final_fase9.md` generat com a peça final traçable.

## Control de coherència final

1. Les frases factuals del text final mantenen traça AID→EID.
2. No s'ha introduït atribució forta definitiva sense tancar sensibilitat.
3. Es manté separació entre nucli factual i capa inferencial.
4. El tancament editorial queda condicionat a completar Fase 8.

## Decisió de fase 9

- **Part final completada:** Sí (document final traçable disponible).
- **Fase 9 tancada definitivament:** No, pendent d'executar sensibilitat formal amb priors declarats.

## Paquet immutable recomanat (quan es tanqui Fase 8)

Crear tag de revisió amb:
- hash de commit,
- data de congelació,
- llista de fitxers finals (`evidence/*`, `drafts/article_final_fase9.md`, `exports/*`).
