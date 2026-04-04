# Fase 9 — Tancament editorial i paquet d'escrutini

Data: 2026-04-04

## Objectiu

Definir el paquet mínim per tancar una versió auditables del cas, preparada per revisió externa.

## Paquet de lliurament (checklist)

- [ ] `evidence/hipotesis.md` tancat amb historial de modificacions al dia.
- [ ] `evidence/evidencies.tsv` complet i sense EID orfes.
- [ ] `evidence/ach_matrix.csv` validada i coherent amb EID vigents.
- [ ] `evidence/sensibilitat.md` amb 3 escenaris completats.
- [ ] `evidence/afirmacions.tsv` alineat amb l'esborrany final.
- [ ] `drafts/esborrany_crani_tibies_fase5.md` revisat amb acceptació/rebuig per AID.
- [ ] `exports/matriu_validada.md` publicat com a base de decisió.
- [ ] `exports/auditoria_recerca.md` adjuntat com a annex estratègic.

## Control de coherència final

1. Cap afirmació factual al text final sense traça AID→EID.
2. Cap conclusió forta d'atribució sense evidència diagnòstica directa.
3. Separació explícita entre descripció factual i capa inferencial.
4. Coherència entre conclusions i resultats de sensibilitat.

## Recomanació de versió

Quan el checklist estigui complet, crear un paquet immutable de revisió (tag de projecte) i conservar:
- hash de commit,
- data de congelació,
- fitxers d'entrada/sortida utilitzats.

## Estat actual

Fase 9 queda **preparada però no tancada**, pendent de completar Fase 8 (sensibilitat formal amb priors declarats).
