import assert from "node:assert/strict";
import test from "node:test";

import {
  citationTypeLabel,
  formatTags,
  normalizeCitation,
  parseTags,
  suggestCitekey,
} from "../lib/bibliography.ts";

test("genera un citekey a partir del cognom i l'any, sense accents", () => {
  assert.equal(
    suggestCitekey({ author: "García, Ana", date: "2020" }),
    "Garcia2020",
  );
  assert.equal(
    suggestCitekey({ author: "Joan Amades", date: "gener de 1930" }),
    "Amades1930",
  );
});

test("marca les fonts sense data amb «sd»", () => {
  assert.equal(suggestCitekey({ author: "Amades" }), "Amadessd");
});

test("recorre al títol quan no hi ha autor", () => {
  assert.equal(suggestCitekey({ title: "Tarot", date: "1500" }), "Tarot1500");
  assert.equal(suggestCitekey({}), "fontsd");
});

test("desambigua els citekeys repetits amb un sufix estable", () => {
  assert.equal(
    suggestCitekey({ author: "Amades", date: "1930" }, ["Amades1930"]),
    "Amades1930b",
  );
  assert.equal(
    suggestCitekey({ author: "Amades", date: "1930" }, [
      "Amades1930",
      "Amades1930b",
    ]),
    "Amades1930c",
  );
});

test("normalitza etiquetes: separa, retalla, elimina buides i duplicades", () => {
  assert.deepEqual(
    parseTags("tarot, història,, tarot\nesoterisme"),
    ["tarot", "història", "esoterisme"],
  );
  assert.equal(formatTags(["tarot", "història"]), "tarot, història");
});

test("normalitza una fitxa completant el citekey i retallant els camps", () => {
  const citation = normalizeCitation({
    author: "  Amades  ",
    title: "  El origen del Tarot  ",
    date: "1930",
    type: "llibre",
    tags: [" tarot ", "tarot", ""],
  });

  assert.equal(citation.author, "Amades");
  assert.equal(citation.title, "El origen del Tarot");
  assert.equal(citation.type, "llibre");
  assert.deepEqual(citation.tags, ["tarot"]);
  assert.equal(citation.citekey, "Amades1930");
});

test("conserva un citekey ja assignat (identificador estable)", () => {
  const citation = normalizeCitation({
    author: "Amades",
    date: "1930",
    citekey: "clau-manual",
  });
  assert.equal(citation.citekey, "clau-manual");
});

test("rebutja un tipus desconegut i cau a «altre»", () => {
  const citation = normalizeCitation({ author: "X", type: "inventat" as never });
  assert.equal(citation.type, "altre");
  assert.equal(citationTypeLabel("arxiu"), "Document d’arxiu");
});
