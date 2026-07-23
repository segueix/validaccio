import assert from "node:assert/strict";
import test from "node:test";

import {
  createCitableNote,
  filterNotes,
  formatNoteCitation,
  noteHasContent,
  noteInputFromReference,
  normalizeCitableNote,
} from "../lib/citable-notes.ts";

test("crea un extracte amb els tres registres separats i la font ancorada", () => {
  const note = createCitableNote(
    {
      projectId: "origen-tarot",
      sourceId: "source-1",
      referenceId: "ref-9",
      page: 12,
      quote: "  «deboixat, pintat e acabat»  ",
      paraphrase: "  L'albarà descriu un joc pintat a mà.  ",
      comment: "  Prova que el joc era un objecte de luxe.  ",
      tags: "albarà, visconti",
    },
    { id: "note-1", now: "2026-07-23T10:00:00.000Z" },
  );
  assert.equal(note.id, "note-1");
  assert.equal(note.sourceId, "source-1");
  assert.equal(note.referenceId, "ref-9");
  assert.equal(note.page, 12);
  assert.equal(note.quote, "«deboixat, pintat e acabat»");
  assert.equal(note.paraphrase, "L'albarà descriu un joc pintat a mà.");
  assert.equal(note.comment, "Prova que el joc era un objecte de luxe.");
  assert.deepEqual(note.tags, ["albarà", "visconti"]);
  assert.equal(note.createdAt, "2026-07-23T10:00:00.000Z");
  assert.equal(note.updatedAt, "2026-07-23T10:00:00.000Z");
});

test("rebutja extractes sense font, sense projecte o sense cap registre", () => {
  assert.throws(
    () => createCitableNote({ projectId: "", sourceId: "s", quote: "x" }),
    /projecte/,
  );
  assert.throws(
    () => createCitableNote({ projectId: "p", sourceId: "", quote: "x" }),
    /font/,
  );
  assert.throws(
    () =>
      createCitableNote({
        projectId: "p",
        sourceId: "s",
        quote: "   ",
        paraphrase: "",
        comment: "  ",
      }),
    /cita|paràfrasi|comentari/,
  );
  assert.equal(noteHasContent({ comment: "només un judici" }), true);
  assert.equal(noteHasContent({ quote: "  " }), false);
});

test("normalitza pàgines no vàlides a «sense pàgina» i la referència buida a null", () => {
  const note = createCitableNote({
    projectId: "p",
    sourceId: "s",
    referenceId: "   ",
    page: 0,
    comment: "sense pàgina",
  });
  assert.equal(note.page, null);
  assert.equal(note.referenceId, null);
});

test("construeix l'esborrany d'un extracte a partir d'una referència del PDF", () => {
  const input = noteInputFromReference({
    id: "ref-3",
    sourceId: "source-7",
    projectId: "origen-tarot",
    page: 5,
    text: "cita textual del PDF",
  });
  const note = createCitableNote(input, { id: "note-2" });
  assert.equal(note.sourceId, "source-7");
  assert.equal(note.referenceId, "ref-3");
  assert.equal(note.page, 5);
  assert.equal(note.quote, "cita textual del PDF");
});

test("formata la citació amb citekey i pàgina, i avisa si no hi ha citekey", () => {
  assert.equal(formatNoteCitation({ page: 12 }, "vismara1450"), "@vismara1450, p. 12");
  assert.equal(formatNoteCitation({ page: null }, "vismara1450"), "@vismara1450");
  assert.equal(formatNoteCitation({ page: 3 }, ""), "(font sense citekey), p. 3");
});

test("normalitza un extracte d'un esquema previ conservant identitat i dates", () => {
  const note = normalizeCitableNote({
    id: "note-legacy",
    projectId: "p",
    sourceId: "s",
    quote: "cita antiga",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
  });
  assert.equal(note.id, "note-legacy");
  assert.equal(note.paraphrase, "");
  assert.equal(note.comment, "");
  assert.equal(note.createdAt, "2026-07-20T09:00:00.000Z");
  assert.equal(note.updatedAt, "2026-07-21T09:00:00.000Z");
});

test("filtra per text lliure, per font i per etiqueta i ordena per modificació", () => {
  const notes = [
    createCitableNote(
      { projectId: "p", sourceId: "s1", quote: "joc de naips", tags: "naips" },
      { id: "n1", now: "2026-07-21T10:00:00.000Z" },
    ),
    createCitableNote(
      { projectId: "p", sourceId: "s2", comment: "tesi del tarot", tags: "tarot" },
      { id: "n2", now: "2026-07-23T10:00:00.000Z" },
    ),
    createCitableNote(
      { projectId: "p", sourceId: "s1", paraphrase: "sobre el tarot", tags: "tarot" },
      { id: "n3", now: "2026-07-22T10:00:00.000Z" },
    ),
  ];

  assert.deepEqual(
    filterNotes(notes, { query: "tarot" }).map((note) => note.id),
    ["n2", "n3"],
  );
  assert.deepEqual(
    filterNotes(notes, { sourceId: "s1" }).map((note) => note.id),
    ["n3", "n1"],
  );
  assert.deepEqual(
    filterNotes(notes, { tag: "TAROT" }).map((note) => note.id),
    ["n2", "n3"],
  );
});
