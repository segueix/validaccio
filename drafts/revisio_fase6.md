# Fase 6 — Revisió de traçabilitat de l'esborrany

Data: 2026-04-04
Document revisat: `drafts/esborrany_crani_tibies_fase5.md`

## Estat general

- Revisió feta a nivell de consistència formal AID/EID.
- Cada frase factual de l'esborrany inclou etiqueta de traça `[AID-XXX ← EID-YYY, p. ZZ]` i tipus `[paràfrasi]` o `[inferència]`.
- **Pendent de validació humana final:** acceptació/rebuig de cada AID en base a consulta directa de les fonts.

## Matriu de control AID

| AID | Present a `evidence/afirmacions.tsv` | Referenciat a l'esborrany | Tipus de traça | Estat de revisió |
|---|---|---|---|---|
| AID-001 | Sí | Sí | parafrasi/inferència | Pendent validació humana |
| AID-002 | Sí | Sí | parafrasi/inferència | Pendent validació humana |
| AID-003 | Sí | Sí | parafrasi/inferència | Pendent validació humana |
| AID-004 | Sí | Sí | parafrasi | Pendent validació humana |
| AID-005 | Sí | Sí | parafrasi | Pendent validació humana |
| AID-006 | Sí | Sí | parafrasi | Pendent validació humana |
| AID-007 | Sí | Sí | inferència | Pendent validació humana |
| AID-008 | Sí | Sí | inferència | Pendent validació humana |
| AID-009 | Sí | Sí | inferència | Pendent validació humana |
| AID-010 | Sí | Sí | inferència | Pendent validació humana |

## Observacions de revisió

1. El bloc més sensible és AID-004/AID-005 (1488-1490), perquè condiciona fortament H3.
2. El bloc més robust per contrast estructural és AID-001/AID-002/AID-003 (pre-1600 continental vs fixació XVII atlàntica).
3. Les inferències (AID-007/008/009/010) s'han de revisar amb criteri estricte de no-síntesi prematura.

## Assistència de validació

S'aconsella executar una validació automàtica de traça amb `tools/validate_trace.py` quan aquest script estigui disponible al repositori.
