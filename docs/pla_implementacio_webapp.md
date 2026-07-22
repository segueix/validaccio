# Pla d'implementació numerat de Validacció

> Document canònic de desenvolupament de la webapp local-first.  
> Versió: 1.0 · Data inicial: 2026-07-21 · Branca canònica: `main`

## 1. Com s'utilitza aquest pla

Cada funció té un identificador numèric permanent. Per demanar-ne la implementació n'hi ha prou amb escriure el número, per exemple:

- `102`
- `Implementa 209`
- `Fes la funció 307`

També s'accepten zeros inicials, però el número canònic és el que figura en aquest document. Els identificadors **no es reordenen, no es reutilitzen i no canvien**. Si una funció es descarta, queda marcada com a `RETIRADA`.

### Protocol obligatori de l'agent

Quan rep un número, l'agent ha de:

1. Localitzar exactament la funció en aquest document.
2. Revisar-ne les dependències i l'estat actual del codi.
3. Si manca una dependència, explicar el bloqueig i proposar el número previ; no ampliar l'abast silenciosament.
4. Crear una branca curta `feat/NNN-nom-breu` des de la `main` actualitzada.
5. Implementar només l'abast i els criteris d'acceptació d'aquell número.
6. Executar les comprovacions proporcionals al canvi; com a mínim lint, build i proves afectades.
7. Actualitzar en aquest document l'estat, la data i una nota breu del resultat.
8. Obrir una PR cap a `main`. `main` continua sent la versió canònica i estable.
9. No desplegar la webapp publicada si l'usuari no diu explícitament `desplega`.

Format recomanat de commit i PR: `[NNN] Nom de la funció`.

## 2. Principis que cap funció no pot trencar

- **Local-first:** manuscrits, fonts, anotacions i matrius viuen al dispositiu de l'usuari per defecte.
- **GitHub només conté codi i documentació:** mai el llibre ni les fonts privades.
- **Sense API obligatòria:** el flux principal ha de funcionar amb ChatGPT Plus mitjançant exportació/importació manual.
- **API opcional i controlada:** qualsevol automatització ha de mostrar cost estimat i demanar consentiment.
- **Traçabilitat:** cap afirmació històrica factual sense AID/EID i localització verificable.
- **Decisió humana:** l'aplicació ajuda a analitzar; l'investigador valida hipòtesis, atribucions i canvis de mètode.
- **Compatibilitat:** els projectes antics s'han de poder migrar i exportar abans de canvis d'esquema.
- **Privacitat comprovable:** cap telemetria, càrrega de fitxers o petició externa amagada.

## 3. Llegenda d'estats

| Estat | Significat |
|---|---|
| `FET` | Implementat i verificat |
| `PARCIAL` | Hi ha una base funcional, però no compleix tots els criteris |
| `PENDENT` | Encara no implementat |
| `EN CURS` | Branca o PR activa |
| `BLOQUEJAT` | Necessita una decisió o dependència externa |
| `RETIRADA` | Es conserva el número, però ja no es construirà |

Prioritats: **P0** imprescindible per al primer ús real; **P1** nucli metodològic; **P2** millora important; **P3** opcional o futura.

## 4. Catàleg funcional

### A. Fonaments local-first

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **001** | Interfície base i navegació | P0 | — | **FET** | Dashboard responsive amb accés visible a fonts, hipòtesis, evidències, ACH, sensibilitat, capítols, validació i exportació. |
| **002** | Repositori local versionat | P0 | 001 | **FET** | IndexedDB amb esquema explícit, transaccions, repositoris tipats i versió de dades; la base actual només desa metadades bàsiques. |
| **003** | Gestió de múltiples projectes | P0 | 002 | **FET** | Crear, obrir, reanomenar, duplicar, arxivar i eliminar projectes amb confirmació i pantalla de selecció. |
| **004** | Còpia portàtil d'un projecte | P0 | 002 | **FET** | Exportar i importar un paquet validat amb manifest, versió, dades i comprovació d'integritat SHA-256, límit de mida i compatibilitat amb còpies v1. |
| **005** | PWA instal·lable i offline | P1 | 001 | **PARCIAL** | Instal·lació al Chromebook, arrencada sense xarxa, recursos versionats i actualització segura sense perdre dades. |
| **006** | Salut de l'emmagatzematge | P0 | 002, 004 | **FET** | Mostrar ús/quota, persistència concedida, última còpia, avisos de risc i acció de recuperació. |
| **007** | Migracions i recuperació | P0 | 002, 004 | **FET** | Cada canvi d'esquema té migració provada, còpia prèvia i recuperació si falla. |
| **008** | Accessibilitat i teclat | P1 | 001 | **PARCIAL** | WCAG AA pràctica: focus visible, etiquetes, contrast, navegació completa per teclat i lector de pantalla. |
| **009** | Proves automàtiques del nucli | P0 | 002 | **FET** | Proves unitàries i d'integració per persistència, importació, validació i flux crític, executables localment. |
| **010** | Tallafoc de privacitat | P0 | 001 | **EN CURS** | Inventari de peticions de xarxa, mode sense xarxa, consentiment previ i prova que els fitxers no surten del dispositiu. |

### B. Fonts i biblioteca documental

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **101** | Importació local de fonts | P0 | 002, 003 | **PENDENT** | Importar PDF, DOCX, TXT, Markdown i imatges amb validació de tipus, mida i errors comprensibles. |
| **102** | Emmagatzematge local de fitxers | P0 | 002, 101 | **PENDENT** | Desar blobs grans sense incrustar-los al codi, conservar-los offline i eliminar-los de manera controlada. |
| **103** | Fitxa bibliogràfica i citekey | P0 | 101 | **PENDENT** | Autor, títol, data, edició, arxiu, URL, data de consulta, tipus, etiquetes i identificador estable únic. |
| **104** | Visor PDF amb ancoratge | P0 | 102, 103 | **PENDENT** | Llegir PDF, anar a pàgina, cercar, seleccionar fragment i crear una referència que reobre el context exacte. |
| **105** | Extracció de text DOCX/TXT/MD | P0 | 101, 102 | **PENDENT** | Extreure text i estructura conservant origen, paràgrafs i localitzacions reproduïbles. |
| **106** | OCR per documents escanejats | P2 | 102, 104 | **PENDENT** | OCR opcional per pàgina, llengua seleccionable, confiança visible i text sempre vinculat a la imatge original. |
| **107** | Notes i extractes citables | P0 | 103, 104, 105 | **PENDENT** | Crear extractes amb cita, paràfrasi separada, comentari propi, pàgina/context i enllaç a la font. |
| **108** | Qualitat i límits de la font | P1 | 103 | **PENDENT** | Registrar primària/secundària, proximitat, autoria, biaixos, limitacions i justificació sense convertir-ho en veritat automàtica. |
| **109** | Duplicats i procedència | P1 | 102, 103 | **PENDENT** | Hash dels fitxers, detecció de duplicats, versions/edicions i cadena de procedència. |
| **110** | Cerca local de corpus | P1 | 105, 107 | **PENDENT** | Cerca de text complet, filtres per font/etiqueta/data i resultats amb context, sense servidor extern. |
| **111** | Bibliografia i formats de citació | P1 | 103 | **PENDENT** | Generar bibliografia i cites consistents amb un estil configurable i avisos de camps incomplets. |
| **112** | Panell de cobertura de fonts | P2 | 107, 108 | **PENDENT** | Mostrar fonts llegides, pendents, citades, buits documentals i concentració excessiva en una mateixa família. |

### C. Validació històrica i ACH

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **201** | Editor d'hipòtesis H1/H2/H3 | P0 | 002, 003 | **PENDENT** | Crear i editar H1 consens, H2 ombra i H3 teoria nova, amb definició precisa i estat de revisió. |
| **202** | Prediccions i condicions de derrota | P0 | 201 | **PENDENT** | Cada hipòtesi declara prediccions, supòsits, què l'afavoriria i què la faria caure. |
| **203** | Registre de mutacions | P0 | 201 | **PENDENT** | Qualsevol canvi substancial conserva abans/després, motiu, data i aprovació humana. |
| **204** | Registre d'evidències EID | P0 | 103, 107, 201 | **PENDENT** | Crear EID únic amb descripció neutral, font, pàgina, extracte, família i qualitat. |
| **205** | Registre d'afirmacions AID | P0 | 201 | **PENDENT** | Crear AID únic amb text exacte, tipus, capítol, estat i grau d'assertivitat. |
| **206** | Enllaç AID–EID | P0 | 204, 205 | **PENDENT** | Cada afirmació mostra evidències favorables, contràries o contextuals i permet navegar en tots dos sentits. |
| **207** | Famílies de dependència | P1 | 204 | **PENDENT** | Agrupar evidències no independents, justificar la relació i evitar recompte múltiple silenciós. |
| **208** | Priors com a rangs justificats | P1 | 201 | **PENDENT** | Definir rangs, font/justificació i sensibilitat; cap prior fix o ocult. |
| **209** | Matriu ACH editable | P0 | 201, 204 | **PENDENT** | Files EID, columnes d'hipòtesi, valors C/I/N, comentari obligatori i filtres; exportació CSV compatible. |
| **210** | Doble codificació | P1 | 209 | **PENDENT** | Dues passades independents o dos revisors, comparació de discrepàncies i resolució registrada. |
| **211** | Evidència diagnòstica vs ornamental | P1 | 207, 209 | **PENDENT** | Detectar evidència compatible amb totes les hipòtesis i impedir que infli la força atributiva. |
| **212** | Anàlisi de sensibilitat | P1 | 207, 208, 209 | **PENDENT** | Recalcular escenaris alterant priors, pesos i dependències, mostrant quines decisions són robustes. |
| **213** | Motor de regles de derrota | P1 | 202, 209 | **PENDENT** | Avaluar condicions declarades, mostrar activacions i exigir confirmació humana abans de canviar l'estat. |
| **214** | Escala assertiva d'atribució | P0 | 205, 206 | **PENDENT** | Classificar cada frase com a font, fet establert, inferència, corol·lari, atribució o hipòtesi; alertar si el llenguatge supera l'evidència. |
| **215** | Validador automàtic de traça | P0 | 204, 205, 206 | **PENDENT** | Traslladar les regles de `scripts/validate_trace.py` a la webapp i detectar AID/EID inexistents, pàgines buides i cites orfes. |
| **216** | Auditoria estratègica i buits | P1 | 209, 211, 212 | **PENDENT** | Identificar gold evidence, colls d'ampolla, evidència absent i següents cerques amb més valor discriminant. |
| **217** | Compatibilitat amb els fitxers del repositori | P0 | 204, 205, 209, 215 | **PENDENT** | Importar/exportar `afirmacions.tsv`, `evidencies.tsv`, `ach_matrix.csv`, hipòtesis i decisions sense pèrdua. |

### D. Escriptura i acabament del llibre

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **301** | Importació del manuscrit | P0 | 002, 003, 102 | **PENDENT** | Importar DOCX, TXT o Markdown localment, conservar l'original intacte i crear una còpia de treball. |
| **302** | Estructura de llibre i capítols | P0 | 301 | **PENDENT** | Detectar/reordenar parts, capítols i seccions amb títols, estat i objectiu argumental. |
| **303** | Editor de capítols amb autodesat | P0 | 302 | **PENDENT** | Editar offline, autodesar transaccionalment i recuperar l'última versió coherent després d'un tancament inesperat. |
| **304** | Versions i comparació textual | P1 | 303 | **PENDENT** | Crear instantànies, comparar canvis, restaurar una versió i conservar-ne l'autoria/origen. |
| **305** | Perfil d'estil de l'autor | P0 | 301 | **PENDENT** | Extreure del primer llibre un perfil revisable: veu, ritme, lèxic, estructura, assertivitat, atribució i usos que s'han d'evitar. |
| **306** | Dossier d'evidència per capítol | P0 | 206, 302 | **PENDENT** | Reunir objectiu, esquema, AID/EID, cites, objeccions, incerteses i límits en un paquet autocontingut. |
| **307** | Paquet per treballar amb ChatGPT Plus | P0 | 214, 305, 306 | **PENDENT** | Exportar instruccions i context dins límits configurables, sense API, amb checklist de retorn i cap dada no seleccionada. |
| **308** | Importació i comparació de resposta IA | P0 | 304, 307 | **PENDENT** | Enganxar/importar el capítol treballat, veure diferències i acceptar o rebutjar canvis per blocs. |
| **309** | Capa de traçabilitat dins el text | P0 | 206, 303 | **PENDENT** | Associar frases a AID/EID, veure cobertura i saltar del text a l'evidència exacta. |
| **310** | Cites, notes i bibliografia del llibre | P1 | 111, 303, 309 | **PENDENT** | Inserir cites/notes, renumerar-les, detectar referències trencades i generar bibliografia final. |
| **311** | Coherència de noms, termes i cronologia | P1 | 303 | **PENDENT** | Índex local de persones, llocs, dates i termes amb avisos de variants, contradiccions i salts cronològics. |
| **312** | Preparació i bloqueig de capítol | P1 | 214, 215, 303, 309 | **PENDENT** | Checklist de traça, estil, cites i objeccions; bloqueig reversible amb registre d'aprovació. |
| **313** | Auditoria adversarial del llibre | P1 | 212, 213, 312 | **PENDENT** | Generar revisió red-team: millors contraarguments, biaixos, dependències i afirmacions que excedeixen l'evidència. |
| **314** | Exportació editorial final | P0 | 310, 312 | **PENDENT** | Exportar DOCX i Markdown coherents, amb estructura, notes, cites i bibliografia; verificació visual del DOCX. |

### E. IA opcional, mai necessària

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **401** | Capa neutral de proveïdors | P3 | 307, 308 | **PENDENT** | Interfície comuna opcional; el projecte continua completament usable sense proveïdor configurat. |
| **402** | Claus API protegides | P3 | 401, 010 | **PENDENT** | Cap clau al repositori, bundle o exportació; emmagatzematge segur i advertiment clar dels límits d'una app web. |
| **403** | Previsió i límit de cost | P2 | 401 | **PENDENT** | Mostrar model, volum, cost màxim estimat i requerir confirmació abans de cada procés facturable. |
| **404** | Memòria cau i repetició controlada | P3 | 401 | **PENDENT** | Evitar crides duplicades, identificar entrada/model/configuració i permetre reproduir o invalidar un resultat. |
| **405** | Adaptador de model local | P3 | 401 | **PENDENT** | Connectar opcionalment un model local sense alterar el format dels dossiers ni enviar dades a internet. |
| **406** | Registre d'operacions IA | P2 | 401 | **PENDENT** | Guardar localment selecció enviada, model, configuració, cost, resultat i decisió humana, amb opció d'exclusió. |
| **407** | Paritat del mode sense API | P1 | 307, 401 | **PENDENT** | Prova automàtica que cap funció P0 o P1 exigeix una clau API, excepte les marcades explícitament opcionals. |

### F. Qualitat, GitHub i publicació

| ID | Funció | Prioritat | Depèn de | Estat | Criteri d'acceptació |
|---:|---|:---:|---|---|---|
| **501** | Flux GitHub amb `main` canònica | P0 | — | **PARCIAL** | Branques curtes, PR revisable, historial clar i cap manuscrit privat al repo; falta automatitzar proteccions. |
| **502** | CI de lint, build i proves | P0 | 009, 501 | **PENDENT** | Cada PR executa instal·lació reproduïble, lint, build i proves; el merge queda bloquejat si fallen. |
| **503** | Desplegament privat reproduïble | P1 | 502 | **PARCIAL** | La webapp privada existeix, però cal documentar i provar el desplegament des de la versió exacta de `main`. |
| **504** | Versions i changelog | P2 | 501, 502 | **PENDENT** | Número de versió visible, notes de canvi, migracions associades i etiqueta Git per a cada publicació. |
| **505** | Control d'accés de la web publicada | P1 | 503 | **PARCIAL** | Accés privat verificat, procediment d'afegir/retirar usuaris i prova que una sessió no autoritzada no entra. |
| **506** | Compatibilitat entre versions | P0 | 004, 007, 504 | **PENDENT** | Matriu de versions, fixtures antics i prova d'importació/migració sense pèrdua. |
| **507** | Recuperació i rollback de publicació | P1 | 503, 504 | **PENDENT** | Tornar a l'última versió estable sense tocar dades locals i amb procediment documentat. |
| **508** | Guia d'ús i onboarding | P1 | 003, 101, 201, 301 | **PENDENT** | Guia breu dins l'app, projecte de demostració fictici i recorregut del primer projecte sense dades reals. |

## 5. Ordre recomanat

L'ordre no obliga, però minimitza reimplementacions:

1. **Base usable:** 002 → 003 → 004 → 006 → 007 → 009 → 010.
2. **Corpus local:** 101 → 102 → 103 → 105 → 107 → 104 → 110.
3. **Mètode:** 201 → 202 → 203 → 204 → 205 → 206 → 207 → 209 → 214 → 215 → 217.
4. **Escriptura:** 301 → 302 → 303 → 304 → 305 → 306 → 307 → 308 → 309 → 312 → 314.
5. **Profunditat:** 108, 111, 112, 208, 210–213, 216, 310, 311, 313.
6. **Operació:** 502 → 503 → 504 → 505 → 506 → 507 → 508.
7. **IA amb API:** 401–407 només quan el flux sense API ja sigui sòlid.

### Primer bloc recomanat

Per començar el desenvolupament real, la següent funció natural és la **002**. Consolida la base de dades local abans d'importar fonts o manuscrits. Després, **003** i **004** converteixen la maqueta actual en una eina segura per treballar-hi.

## 6. Registre d'implementacions

S'afegeix una fila després de cada funció acabada. No s'esborren entrades.

| Data | ID | PR/commit | Resultat | Notes |
|---|---:|---|---|---|
| 2026-07-21 | 001 | `main` | FET | Primera interfície navegable i responsive. |
| 2026-07-21 | 002/004/005/008 | `main` | PARCIAL | Base IndexedDB, JSON bàsic, shell PWA i interfície responsive inicials. |
| 2026-07-21 | 501/503/505 | `main` + Sites | PARCIAL | Codi fusionat a main i desplegament privat existent; encara no automatitzat. |
| 2026-07-21 | 002 | [PR #14](https://github.com/segueix/validaccio/pull/14) | FET | Esquema IndexedDB v2, transaccions, repositoris tipats i migració v1 fusionats a main. |
| 2026-07-21 | 003 | [PR #15](https://github.com/segueix/validaccio/pull/15) | FET | Biblioteca local de múltiples projectes fusionada a main. |
| 2026-07-22 | 004 | [PR #16](https://github.com/segueix/validaccio/pull/16) | FET | Paquet v2 amb manifest, SHA-256, límit de 5 MB, validació prèvia i compatibilitat v1; fusionat a main. |
| 2026-07-22 | 006 | [PR #17](https://github.com/segueix/validaccio/pull/17) | FET | Panell «Salut»: ús/quota via `storage.estimate`, persistència, última còpia registrada en exportar, avisos de risc graduats i accions de recuperació; fusionat a main. |
| 2026-07-22 | 007 | [PR #17](https://github.com/segueix/validaccio/pull/17) | FET | Pipeline de migració pur i provat (`migrations.ts`), còpia prèvia a `metadata` abans d'escriure i recuperació des de la còpia; s'executa en obrir amb bàner de recuperació. Fusionat a main. |
| 2026-07-22 | 009 | [PR #18](https://github.com/segueix/validaccio/pull/18) | FET | Proves d'integració amb `fake-indexeddb`: persistència, migració d'esquema en obrir, flux crític d'importació, rollback de transacció i runner de migració amb còpia prèvia/recuperació. 30 proves totals; lint i build verificats. |
| 2026-07-22 | 010 | [PR #19](https://github.com/segueix/validaccio/pull/19) | EN CURS | Tallafoc que embolcalla `fetch`: inventari de peticions (només mateix origen), mode sense xarxa persistent, consentiment previ per a hosts externs i registre d'intents. Prova que un enviament extern de fitxer queda bloquejat. 8 proves; lint i build verificats. |

## 7. Definició global de «fet»

Una funció només passa a `FET` quan:

- compleix el seu criteri d'acceptació;
- no envia dades fora del dispositiu sense consentiment;
- té migració o compatibilitat si modifica dades;
- té proves proporcionals i passen lint/build;
- inclou estats buit, carregant, error i recuperació quan pertoqui;
- actualitza aquest document i la documentació afectada;
- ha estat revisada i fusionada a `main`.

