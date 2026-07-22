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

## Persistència versionada

La funció 002 separa la persistència de la interfície. IndexedDB utilitza un
esquema explícit v2 amb magatzems `projects` i `metadata`, transaccions comunes
i repositoris tipats. En obrir una base v1, el projecte de `workspace` es migra
sense esborrar el magatzem antic, de manera que una migració incompleta continua
sent recuperable.

Proves específiques:

```bash
npm run test:unit
```

## Múltiples projectes

La funció 003 afegeix una biblioteca local accessible des del selector superior.
Permet crear, obrir, reanomenar, duplicar i arxivar projectes. Els projectes
arxivats es poden restaurar o eliminar amb confirmació. L'identificador del
projecte actiu es conserva a `metadata` i l'esquema local v3 migra els registres
anteriors sense enviar cap dada fora del navegador.

## Còpies portàtils verificades

La funció 004 exporta un paquet JSON v2 amb manifest, versió de dades i checksum
SHA-256. Abans de restaurar-lo, la webapp valida el format, la versió, la
coherència del manifest i la integritat del contingut. Les còpies v1 continuen
sent importables i s'actualitzen al model actual. Si el projecte ja existeix,
l'usuari decideix si el substitueix o l'importa com una còpia independent.
