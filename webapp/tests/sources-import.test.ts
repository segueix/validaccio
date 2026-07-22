import assert from "node:assert/strict";
import test from "node:test";

import {
  classifySource,
  createSourceRecord,
  MAX_SOURCE_BYTES,
  sourceKindLabel,
  validateSourceFile,
} from "../lib/source-library.ts";

test("classifica les fonts per MIME i, si cal, per extensió", () => {
  assert.equal(classifySource({ name: "a.pdf", type: "application/pdf" })?.kind, "pdf");
  assert.equal(
    classifySource({
      name: "a.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })?.kind,
    "docx",
  );
  // Markdown sovint arriba sense MIME: es classifica per extensió.
  assert.equal(classifySource({ name: "notes.md", type: "" })?.kind, "markdown");
  // MIME genèric → també per extensió.
  assert.equal(
    classifySource({ name: "foto.png", type: "application/octet-stream" })?.kind,
    "image",
  );
  assert.equal(classifySource({ name: "full.xlsx", type: "" }), null);
});

test("accepta una font vàlida i retorna el tipus", () => {
  const result = validateSourceFile({
    name: "manuscrit.pdf",
    type: "application/pdf",
    size: 2 * 1024 * 1024,
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.kind, "pdf");
});

test("rebutja un fitxer buit amb un error comprensible", () => {
  const result = validateSourceFile({ name: "buit.txt", type: "text/plain", size: 0 });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "empty-file");
    assert.match(result.message, /buit/);
  }
});

test("rebutja un fitxer massa gran indicant el límit", () => {
  const result = validateSourceFile({
    name: "enorme.pdf",
    type: "application/pdf",
    size: MAX_SOURCE_BYTES + 1,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "too-large");
    assert.match(result.message, /límit/);
  }
});

test("rebutja un tipus no admès", () => {
  const result = validateSourceFile({
    name: "full.xlsx",
    type: "application/vnd.ms-excel",
    size: 1024,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "unsupported-type");
});

test("crea la fitxa de la font amb metadades i projecte associat", () => {
  const record = createSourceRecord(
    { name: "  manuscrit.pdf  ", type: "application/pdf", size: 1234, kind: "pdf" },
    "project-a",
    { id: "source-1", now: "2026-07-22T16:00:00.000Z" },
  );
  assert.equal(record.id, "source-1");
  assert.equal(record.projectId, "project-a");
  assert.equal(record.name, "manuscrit.pdf");
  assert.equal(record.kind, "pdf");
  assert.equal(record.size, 1234);
  assert.equal(record.importedAt, "2026-07-22T16:00:00.000Z");
});

test("no crea cap fitxa sense projecte associat", () => {
  assert.throws(
    () =>
      createSourceRecord(
        { name: "x.pdf", type: "application/pdf", size: 10, kind: "pdf" },
        "",
      ),
    /projecte/,
  );
});

test("etiqueta cada tipus de font de manera llegible", () => {
  assert.equal(sourceKindLabel("pdf"), "PDF");
  assert.equal(sourceKindLabel("image"), "Imatge");
});
