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
- panell de salut de l'emmagatzematge amb ús, quota, persistència i avisos;
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

## Salut de l'emmagatzematge

La funció 006 afegeix la vista «Salut», que llegeix `navigator.storage` per
mostrar l'ús i la quota locals, si el navegador ha concedit la persistència i
quan es va fer l'última còpia portàtil (registrada en exportar). La lògica
d'avaluació viu a `lib/storage-health.ts`, és pura i comprovable, i converteix
aquestes dades en avisos de risc graduats —informació, atenció o risc alt— amb
accions de recuperació directes: protegir l'espai, exportar una còpia o
gestionar projectes. Cap dada surt del navegador; si l'API d'estimació no
existeix, l'estat ho indica sense inventar xifres.

## Migracions i recuperació

La funció 007 formalitza els canvis d'esquema de dades. La lògica de migració
viu a `lib/local-db/migrations.ts` com un registre de passos purs i provats que
porten un registre de projecte fins a la versió de dades actual. En obrir
l'espai, `ensureProjectsMigrated` desa primer una **còpia prèvia** dels registres
crus a `metadata` i només després escriu els migrats; si algun registre falla,
es conserva sense tocar i la còpia prèvia queda disponible. Quan la migració
detecta problemes, la interfície mostra un bàner amb l'acció **Recupera la còpia
prèvia**, que restaura l'estat anterior sense enviar cap dada fora del navegador.

## Proves automàtiques del nucli

La funció 009 estableix la xarxa de seguretat de proves executables localment:

```bash
npm run test:unit
```

A més de les proves unitàries de lògica pura (esquema, normalització, paquet
portàtil, salut de l'emmagatzematge i migracions), s'hi afegeixen proves
**d'integració** sobre IndexedDB amb `fake-indexeddb`. Cobreixen la persistència
real (desar, llegir, ordenar, comptar, esborrar), la migració d'esquema en obrir
una base v1, el flux crític d'exportació→importació→persistència, el rollback
d'una transacció que falla i el runner de migració amb còpia prèvia i
recuperació. No requereixen navegador ni xarxa.

## Tallafoc de privacitat

La funció 010 fa complir el principi que cap fitxer surt del dispositiu. La
política viu a `lib/privacy-firewall.ts`: classifica cada petició i només deixa
passar el mateix origen i els recursos locals (`data:`/`blob:`); qualsevol
destinació externa queda **bloquejada** tret que l'usuari hi hagi donat
consentiment explícit i no s'estigui en **mode sense xarxa**. En arrencar, la
vista «Privadesa» embolcalla `fetch` amb aquest tallafoc, mostra l'inventari de
peticions declarades (totes locals, sense dades de recerca), permet activar el
mode sense xarxa (que es recorda a `metadata`) i registra qualsevol intent de
sortida. Una prova comprova que un enviament extern d'un fitxer queda bloquejat i
que el `fetch` base no s'arriba a invocar.
