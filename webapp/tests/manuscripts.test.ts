// Funció 301 — Validació, extracció i separació original/còpia de treball.
import assert from "node:assert/strict";
import test from "node:test";

import {
  ManuscriptImportError,
  prepareManuscriptImport,
  validateManuscriptFile,
} from "../lib/manuscripts.ts";

test("accepta DOCX, TXT i Markdown i rebutja la resta", () => {
  assert.equal(
    validateManuscriptFile({ name: "llibre.docx", type: "", size: 10 }).kind,
    "docx",
  );
  assert.equal(
    validateManuscriptFile({ name: "llibre.txt", type: "", size: 10 }).kind,
    "text",
  );
  assert.equal(
    validateManuscriptFile({ name: "llibre.md", type: "", size: 10 }).kind,
    "markdown",
  );
  assert.throws(
    () =>
      validateManuscriptFile({
        name: "llibre.pdf",
        type: "application/pdf",
        size: 10,
      }),
    (error: unknown) =>
      error instanceof ManuscriptImportError && /DOCX, TXT o Markdown/.test(error.message),
  );
});

test("crea una còpia de treball i conserva una còpia independent dels bytes originals", async () => {
  const source = new TextEncoder().encode(
    "Primer paràgraf.\n\nSegon paràgraf amb més text.",
  ).buffer;
  const prepared = await prepareManuscriptImport({
    id: "manuscript-1",
    projectId: "project-a",
    file: { name: "llibre.txt", type: "text/plain", size: source.byteLength },
    data: source,
    now: "2026-07-24T10:00:00.000Z",
  });

  assert.equal(prepared.manuscript.workingText.includes("Segon paràgraf"), true);
  assert.equal(prepared.manuscript.paragraphCount, 2);
  assert.equal(prepared.manuscript.wordCount, 7);
  assert.equal(prepared.manuscript.originalSha256.length, 64);
  assert.notEqual(prepared.original.data, source);

  new Uint8Array(source)[0] = 0;
  assert.notEqual(new Uint8Array(prepared.original.data)[0], 0);
});
