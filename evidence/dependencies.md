# Plantilla de famílies de dependència (bifurcació obligatòria)

> Objectiu: separar explícitament vies de verificació independents per evitar doble comptatge i habilitar KO tècnic.
> Si un bloc aparentment únic conté subproves per vies diferents, s'ha de bifurcar abans de construir o recalcular la matriu ACH.

---

## Família Topològica

**Definició de via:** propietats estructurals/formals observables sense suport textual extern.

**Evidències membres:**
- EID-[...]
- EID-[...]

**Criteri d'independència:**
- No deriva d'interpretació documental ni d'operativa algorítmica.

**Dependència detectada (si n'hi ha):**
- [descriure derivacions internes]

---

## Família Algorítmica

**Definició de via:** regles de funcionament, procediments de càlcul o transformacions operatives.

**Evidències membres:**
- EID-[...]
- EID-[...]

**Criteri d'independència:**
- Verificable per reproducció mecànica, independentment de la justificació documental.

**Dependència detectada (si n'hi ha):**
- [descriure derivacions internes]

---

## Família Documental

**Definició de via:** fonts textuals, testimonis, registres i transmissió documental.

**Evidències membres:**
- EID-[...]
- EID-[...]

**Criteri d'independència:**
- No depèn de la mateixa cadena de còpia/citació quan es declara com a independent.

**Dependència detectada (si n'hi ha):**
- [descriure derivacions internes]

---

## Família Semàntica

**Definició de via:** significat intern de termes, categories conceptuals i coherència d'ús.

**Evidències membres:**
- EID-[...]
- EID-[...]

**Criteri d'independència:**
- No inferida únicament de la forma topològica ni de regles algorítmiques.

**Dependència detectada (si n'hi ha):**
- [descriure derivacions internes]

---

## Taula de control de bifurcació

| Bloc inicial | Subprova | Família assignada | Justificació de separació |
|---|---|---|---|
| [Bloc-X] | [Subprova-1] | [Topològica/Algorítmica/Documental/Semàntica] | [...] |
| [Bloc-X] | [Subprova-2] | [Topològica/Algorítmica/Documental/Semàntica] | [...] |

---

## Evidències independents confirmades

| EID | Família | Justificació d'independència |
|---|---|---|
| EID-[...] | [Família] | [...] |
