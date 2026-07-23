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
- importació local de fonts (PDF, DOCX, TXT, Markdown, imatges) amb validació;
- visor PDF local amb cerca i referències ancorades (font + pàgina + fragment);
- extractes citables amb cita, paràfrasi i comentari separats, ancorats a la font;
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

## Enduriment auditat

La recuperació de migracions substitueix exactament l'estat dels projectes de
la còpia escollida. La privacitat combina el guard de `fetch` amb una política
CSP que limita connexions, formularis, imatges, mitjans, workers i objectes al
mateix origen. El workflow `.github/workflows/webapp-ci.yml` executa lint,
proves i build a cada PR que modifica la webapp; perquè el merge quedi realment
bloquejat quan falla, cal activar el check com a obligatori a la protecció de
`main`.

## Importació local de fonts

La funció 101 obre la biblioteca documental. La lògica de validació viu a
`lib/source-library.ts`: accepta PDF, DOCX, TXT, Markdown i imatges, classifica
cada fitxer per MIME o extensió, comprova la mida (màxim 25 MB) i retorna errors
comprensibles per tipus no admès, fitxer buit o massa gran. L'esquema local puja
a la versió 4 amb un magatzem `sources` indexat per projecte, i la vista «Fonts»
permet importar per arrossegar-i-deixar o amb el selector de fitxers, veure les
fonts registrades del projecte i eliminar-les. Aquesta funció només desa les
metadades de la font; el contingut (blobs) correspon a la funció 102.

## Emmagatzematge local de fitxers

La funció 102 desa el contingut de cada font. En importar-la, el fitxer es
llegeix com a ArrayBuffer i es guarda a IndexedDB (esquema local v5, magatzem
`blobs` indexat per projecte, `lib/source-blobs.ts`), enllaçat a la fitxa per
`sourceId` i **mai incrustat al codi ni al bundle**, de manera que es conserva
offline. Des de la vista «Fonts» es pot **baixar** una font (es reconstrueix un
Blob des del contingut desat) i veure la mida total emmagatzemada del projecte.
L'eliminació és **controlada**: demana confirmació i esborra en cascada la fitxa
i el contingut. Si desar el contingut falla, no queda cap fitxa òrfena.

## Fitxa bibliogràfica i citekey

La funció 103 afegeix a cada font una fitxa bibliogràfica editable des de la vista
«Fonts»: autor, títol, data, edició, arxiu, URL, data de consulta, tipus i
etiquetes. La lògica viu a `lib/bibliography.ts`, és pura i comprovable, i genera
un **citekey estable i únic** a partir del cognom de l'autor i l'any (sense
accents), desambiguant-lo amb un sufix quan ja existeix dins el projecte. El
citekey no canvia un cop assignat, i la fitxa es desa dins la fitxa de la font
(sense cap magatzem ni esquema nous).

## Extracció de text

La funció 105 extreu el text de les fonts TXT, Markdown i DOCX (`lib/text-extraction.ts`,
lògica pura i comprovable). TXT i Markdown es descodifiquen com a UTF-8 i es
divideixen en paràgrafs per línies en blanc. El DOCX és un ZIP amb XML: es
localitza `word/document.xml` amb un lector de ZIP mínim, s'infla amb l'API
**nativa `DecompressionStream('deflate-raw')`** (sense cap dependència externa) i
se n'extreu el text dels elements `<w:t>` i l'estructura de paràgrafs dels `<w:p>`.
Cada paràgraf conserva un **índex reproduïble** (posició dins el document) per
poder-lo tornar a localitzar, i la vista «Fonts» en mostra una previsualització.

## Visor PDF amb ancoratge

La funció 104 obre un visor de PDF dins la vista «Fonts» (botó **Visor** a cada
font PDF). El render fa servir **pdf.js**, la primera dependència de runtime del
projecte. Es fa servir el **build «legacy»** de `pdfjs-dist` de manera
deliberada: el build modern crida `Map.prototype.getOrInsertComputed`, un mètode
que encara no tenen la majoria de navegadors, mentre que el legacy en porta el
polyfill. El *worker* s'empaqueta **localment** (mai des d'un CDN), de manera que
el visor respecta la CSP local-first i el tallafoc de privacitat: cap byte del
PDF surt del dispositiu.

El visor permet navegar per pàgines, **cercar** a tot el document i saltar a la
coincidència, i mostra el **text seleccionable** de la pàgina. Seleccionant un
fragment es crea una **referència ancorada** (font + pàgina + fragment) que es
desa a IndexedDB (magatzem `references` indexat per `sourceId`) i que **reobre el
context exacte** —la pàgina i el fragment ressaltat— quan s'hi torna.

La part comprovable sense navegador viu a `lib/pdf-references.ts` (model de
referència i cerca amb context) i està coberta per proves unitàries i d'integració
(`fake-indexeddb`). El render, la càrrega del *worker* i l'extracció de text s'han
verificat en Chromium. El *teardown* del visor es fa amb `loadingTask.destroy()`
—`PDFDocumentProxy` no exposa `destroy()`—, cosa que només va aflorar en la
verificació end-to-end i que el compilador no detecta perquè esbuild elimina els
tipus sense comprovar-los.

## Extractes citables

La funció 107 afegeix la vista «Extractes», el taller on cada afirmació del llibre
neix amb la seva traça. Un extracte manté **tres registres separats** que la
recerca rigorosa no ha de barrejar mai: la **cita** textual de la font, la
**paràfrasi** amb paraules pròpies i el **comentari** o judici propi. Cada extracte
queda ancorat a una font i, si ve del visor PDF, a una **pàgina** i una
**referència** concretes; el botó «Obre la font» reobre el PDF exactament en
aquesta pàgina.

Des del visor, el botó **«→ Extracte»** de cada referència la **promou** a extracte
amb la cita i la pàgina ja emplenades, tancant el cercle lectura → ancoratge →
nota citable. La citació breu es deriva del citekey de la font i la pàgina
(`@citekey, p. N`).

La lògica pura i comprovable viu a `lib/citable-notes.ts` (model, validació que
obliga a omplir com a mínim un registre, format de citació, filtre i pont des
d'una referència), coberta per proves unitàries i d'integració (magatzem `notes`).
En esborrar una font, els seus extractes s'eliminen en cascada. El flux complet
—importar un PDF, obrir el visor, ancorar una referència, promoure-la a extracte i
retrobar-lo després de recarregar— s'ha verificat end-to-end en Chromium.

## Editor d'hipòtesis (H1/H2/H3)

La funció 201 obre el nucli de validació ACH. La lògica pura viu a
`lib/hypotheses.ts`, amb l'ordre nomenclàtric **immutable H1 = Consens,
H2 = Ombra, H3 = Nova teoria**. Cada hipòtesi es defineix amb enunciat falsable,
prediccions observables, supòsits, condicions d'abandonament, nucli no
negociable i estat de revisió, i recorda la **Regla 10 (Red Teaming)**: el
consens i l'ombra s'han de formular amb una font independent, no debilitar-los.
Les hipòtesis es desen per projecte al magatzem `hypotheses` i s'editen des de la
vista «Hipòtesis».

## Registre d'evidències (EID)

La funció 204 obre el registre d'evidències, el pas de l'ACH on la font es
converteix en dada avaluable. Cada evidència es registra amb una **descripció
neutral** —el fet, no la interpretació— i queda ancorada a la **font**, la
**pàgina** i l'**extracte citable** (funció 107). S'hi afegeix la **família de
dependència** (per agrupar evidències que no són independents, funció 207) i la
**qualitat** (primària / secundària / terciària / incerta). Cada evidència rep un
codi **EID** seqüencial i estable (E1, E2…) que després encapçalarà les files de
la matriu ACH (funció 209).

Des de la vista «Extractes», el botó **«→ Evidència»** promou un extracte a
evidència prenent la **paràfrasi** com a descripció neutral de partida i
enllaçant la font, la pàgina i l'extracte. Així la cadena queda sencera:
font → extracte (cita / paràfrasi / comentari) → evidència (EID). La lògica pura
viu a `lib/evidence.ts` (model, validació, generació de codi, qualitat i pont),
coberta per proves unitàries i d'integració.

## Registre d'afirmacions (AID)

La funció 205 registra cada afirmació factual de l'obra amb un codi **AID**
seqüencial i estable (A1, A2…), el **text exacte**, el **capítol**, l'**estat** de
revisió i el **grau d'assertivitat**. L'assertivitat fa servir l'escala ordinal de
cinc nivells (molt baixa → molt alta) que el marc de validació adopta com a
estàndard per evitar la falsa precisió numèrica, i s'ha de marcar de manera
**homogènia** i coherent amb l'evidència.

Cada afirmació es classifica per la **bifurcació de la certesa** del marc:
**incondicional** (fet mecànic verificable, que cap atribució no pot rebaixar) o
**condicional** (atribució a autor, tradició o context, que queda oberta si falta
evidència documental diagnòstica). Quan una afirmació és condicional, l'editor
recorda que no se n'ha de pujar l'assertivitat sense aquell suport. La lògica pura
viu a `lib/affirmations.ts` i està coberta per proves unitàries i d'integració.

## Enllaç AID ↔ EID

La funció 206 connecta cada afirmació (AID) amb les evidències (EID) que la
**sostenen**, la **contradiuen** o la **contextualitzen**, i registra com se'n
deriva l'afirmació (cita literal, paràfrasi o inferència). L'enllaç és navegable
en **tots dos sentits**: des de la vista «Afirmacions» cada afirmació mostra les
seves evidències amb la postura i un resum ràpid (a favor / en contra / context),
i des de «Evidències» cada evidència mostra les afirmacions que hi depenen.

Cada enllaç té un identificador determinista per parella (AID, EID), de manera que
no se'n poden crear duplicats, i s'esborra en cascada quan s'elimina l'afirmació o
l'evidència. La lògica pura viu a `lib/aid-eid-links.ts` (model, consultes
bidireccionals, resum de postures) i està coberta per proves unitàries i
d'integració.

Els magatzems de les funcions 104, 107, 201, 204, 205 i 206 conviuen a l'esquema
local **v10** (`references`, `notes`, `hypotheses`, `evidence`, `affirmations` i
`links`), creats de manera additiva i protegida.
