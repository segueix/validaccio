# Proporció d'esforç recomanada

## Principi rector

El repositori ha de contenir un mètode prou dur per impedir trampes interpretatives, però l'energia principal ha d'anar a demostrar la teoria amb evidències.

## Proporció

| Fase | Esforç | Objectiu | Quan es considera tancada |
|------|-------:|----------|---------------------------|
| Mètode | 20% | Tancar les regles del joc | Quan `docs/marc_validacio.md` i `docs/regles_derrota.md` estan fixats i versionats |
| Teoria + evidències | 80% | Validar la teoria concreta | Quan la matriu, la sensibilitat i l'esborrany estan complets |

## Senyals de perill

- Si portes més de dues setmanes "polint" el mètode sense haver tocat `evidence/`, estàs procrastinant.
- Si estàs afegint regles metodològiques per respondre a un resultat concret de l'anàlisi, estàs fent rescats ad hoc — exactament el que el mètode prohibeix als rivals.
- Si l'agent dedica més temps a discutir el marc que a construir la matriu, redirigeix-lo.

## Ordre d'execució

1. **Tancar el mètode** — fixar `marc_validacio.md`, `regles_derrota.md` i `glossari.md`. Commit etiquetat: `v1.0-metode`.
2. **Formular hipòtesis** — omplir `evidence/hipotesis.md` amb totes les rivals i les seves declaracions prèvies (prediccions, condicions d'abandonament, nucli no negociable).
3. **Classificar evidències** — omplir `evidence/evidencies.tsv` amb totes les evidències del cas.
4. **Construir la matriu** — demanar a l'agent que creui hipòtesis amb evidències.
5. **Analitzar sensibilitat** — executar els tres escenaris.
6. **Redactar** — amb traça obligatòria.
7. **Revisar i publicar.**
