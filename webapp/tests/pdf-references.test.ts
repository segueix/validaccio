import assert from "node:assert/strict";
import test from "node:test";

import { createPdfReference, findMatches } from "../lib/pdf-references.ts";

test("crea una referència amb font, projecte, pàgina i fragment", () => {
  const reference = createPdfReference(
    {
      sourceId: "source-1",
      projectId: "project-a",
      page: 12,
      text: "  «deboixat, pintat e acabat»  ",
      note: "clau documental",
    },
    { id: "ref-1", now: "2026-07-22T10:00:00.000Z" },
  );
  assert.equal(reference.id, "ref-1");
  assert.equal(reference.page, 12);
  assert.equal(reference.text, "«deboixat, pintat e acabat»");
  assert.equal(reference.note, "clau documental");
});

test("rebutja referències sense font, projecte o pàgina vàlida", () => {
  assert.throws(
    () => createPdfReference({ sourceId: "", projectId: "p", page: 1, text: "" }),
    /font/,
  );
  assert.throws(
    () => createPdfReference({ sourceId: "s", projectId: "p", page: 0, text: "" }),
    /pàgina/,
  );
});

test("cerca coincidències amb context i número de pàgina", () => {
  const pages = [
    { page: 1, text: "La reina dona Maria encarregà un joc de naips." },
    { page: 2, text: "El joc de naips arribà a Milà en el context del pacte." },
  ];
  const matches = findMatches(pages, "joc de naips");
  assert.equal(matches.length, 2);
  assert.deepEqual(
    matches.map((match) => match.page),
    [1, 2],
  );
  assert.match(matches[0].snippet, /joc de naips/);
});

test("ignora consultes massa curtes i troba múltiples coincidències per pàgina", () => {
  assert.deepEqual(findMatches([{ page: 1, text: "abc" }], "a"), []);
  const matches = findMatches(
    [{ page: 3, text: "tarot i més tarot i encara més tarot" }],
    "tarot",
  );
  assert.equal(matches.length, 3);
  assert.ok(matches.every((match) => match.page === 3));
});
