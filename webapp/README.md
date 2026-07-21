# Webapp local-first de Validacció

Primera interfície navegable per convertir el marc metodològic de `validaccio`
en una eina de treball per a obres històriques traçables.

## Estat d'aquesta iteració

- mapa complet del producte visible;
- tauler adaptat al projecte «L'origen del Tarot»;
- navegació per fonts, hipòtesis, evidències, ACH, sensibilitat, capítols,
  validació i exportació;
- projecte desat localment al navegador amb IndexedDB;
- canvi de nom, protecció de l'emmagatzematge i còpia/restauració JSON;
- disseny responsiu per a Chromebook, tauleta i mòbil;
- manifest i shell bàsic per a ús com a PWA.

Les pantalles metodològiques encara són prototips visibles. Les dades reals del
manuscrit i de les fonts no formen part del codi ni s'envien al servidor.

## Desenvolupament

Requereix Node.js 22.13 o posterior.

```bash
npm ci
npm run dev
```

Validació de producció:

```bash
npm run lint
npm run build
```
