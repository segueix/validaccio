# Validació probabilística de teories històriques

Repositori de treball per a l'avaluació rigorosa, transparent i auditable de teories històriques basades en evidències convergents.

## Estructura
├── AGENTS.md                  # Regles per a l'agent d'IA
├── README.md                  # Aquest fitxer
├── docs/
│   ├── marc_validacio.md      # Marc teòric + annex operatiu
│   ├── glossari.md            # Definicions de termes clau
│   ├── regles_derrota.md      # Regles de derrota i admissibilitat
│   └── proporcio_esforc.md    # Proporció d'esforç recomanada
├── sources/
│   ├── metadades/             # Un fitxer YAML per font (<citekey>.yaml)
│   ├── notes_lectura/         # Notes de lectura per font (<citekey>.md)
│   └── extractes/             # Fragments citats amb pàgina i context
├── evidence/
│   ├── hipotesis.md           # Hipòtesis competitives amb prediccions
│   ├── evidencies.tsv         # Registre d'evidències (EID)
│   ├── afirmacions.tsv        # Registre d'afirmacions (AID)
│   ├── ach_matrix.csv         # Matriu de consistència H×E
│   ├── dependencies.md        # Famílies de dependència
│   ├── priors.md              # Registre de priors per hipòtesi
│   └── sensibilitat.md        # Informes d'anàlisi de sensibilitat
├── drafts/
│   ├── esquema.md             # Estructura de l'article
│   └── esborrany_01.md        # Esborranys amb traça AID/EID
└── tools/
    └── validate_trace.py      # Validació de traçabilitat

## Flux de treball

1. **Investigador** formula hipòtesis a `evidence/hipotesis.md`
2. **Investigador** classifica evidències a `evidence/evidencies.tsv`
3. **Agent** construeix la matriu ACH a `evidence/ach_matrix.csv`
4. **Investigador** revisa i corregeix la matriu (doble codificació)
5. **Agent** identifica buits i evidència diagnòstica
6. **Agent** executa anàlisi de sensibilitat a `evidence/sensibilitat.md`
7. **Agent** proposa esborrany amb traça obligatòria a `drafts/`
8. **Investigador** valida cada afirmació

## Marc metodològic

Documentat a [`docs/marc_validacio.md`](docs/marc_validacio.md).


## Ordre d'execució

1. Tancar el mètode (20%): fixar `marc_validacio.md`, `regles_derrota.md` i `glossari.md`. Commit etiquetat `v1.0-metode`.
2. Aplicar el protocol a la teoria concreta (80%): hipòtesis → evidències → matriu → sensibilitat → redacció.
