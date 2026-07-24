// Funció 303 — Extracció i edició coherent de capítols.
import assert from "node:assert/strict";
import test from "node:test";

import {
  createChapterDraft,
  extractChapterContent,
  normalizeChapterDraft,
  updateChapterDraft,
} from "../lib/chapter-editor.ts";
import { type BookNode } from "../lib/book-structure.ts";
import { type ManuscriptRecord } from "../lib/manuscripts.ts";

const now = "2026-07-24T12:00:00.000Z";

function manuscript(workingText: string): ManuscriptRecord {
  return {
    id: "manuscript-1",
    projectId: "project-a",
    name: "llibre.md",
    kind: "markdown",
    mime: "text/markdown",
    size: workingText.length,
    originalSha256: "a".repeat(64),
    importedAt: now,
    updatedAt: now,
    workingText,
    wordCount: 20,
    paragraphCount: 8,
  };
}

function node(
  id: string,
  kind: BookNode["kind"],
  sourceParagraph: number,
  title: string,
): BookNode {
  return {
    id,
    projectId: "project-a",
    manuscriptId: "manuscript-1",
    parentId: null,
    kind,
    title,
    order: sourceParagraph,
    status: "pendent",
    objective: "",
    sourceParagraph,
    createdAt: now,
    updatedAt: now,
  };
}

test("extreu el capítol fins al següent capítol i conserva les seccions", () => {
  const source = manuscript(
    "# Llibre\n\n## Capítol 1\n\nPrimer paràgraf.\n\n### Secció 1.1\n\nSegon paràgraf.\n\n## Capítol 2\n\nText final.",
  );
  const chapters = [
    node("c1", "chapter", 2, "Capítol 1"),
    node("s1", "section", 4, "Secció 1.1"),
    node("c2", "chapter", 6, "Capítol 2"),
  ];
  assert.equal(
    extractChapterContent(source, chapters[0], chapters),
    "Primer paràgraf.\n\n### Secció 1.1\n\nSegon paràgraf.",
  );
});

test("el capítol conservador sense encapçalament conté tot el manuscrit", () => {
  const source = manuscript("Primer paràgraf.\n\nSegon paràgraf.");
  const fallback = node("c1", "chapter", 1, "llibre");
  assert.equal(
    extractChapterContent(source, fallback, [fallback]),
    "Primer paràgraf.\n\nSegon paràgraf.",
  );
});

test("crea l’esborrany i actualitza revisió i recompte", () => {
  const source = manuscript("## Capítol 1\n\nText inicial.");
  const chapter = node("c1", "chapter", 1, "Capítol 1");
  const draft = createChapterDraft(source, chapter, [chapter], now);
  const edited = updateChapterDraft(
    draft,
    "Text nou amb cinc paraules.",
    "2026-07-24T12:01:00.000Z",
  );
  assert.equal(draft.revision, 0);
  assert.equal(edited.revision, 1);
  assert.equal(edited.wordCount, 5);
  assert.equal(edited.savedAt, null);
});

test("normalitza una revisió invàlida sense alterar el contingut", () => {
  const source = manuscript("Text.");
  const chapter = node("c1", "chapter", 1, "llibre");
  const normalized = normalizeChapterDraft({
    ...createChapterDraft(source, chapter, [chapter], now),
    content: "  Text preservat.  ",
    revision: -3,
    wordCount: 99,
  });
  assert.equal(normalized.content, "  Text preservat.  ");
  assert.equal(normalized.revision, 0);
  assert.equal(normalized.wordCount, 2);
});

test("rebutja editar una part com si fos un capítol", () => {
  const source = manuscript("# Part I\n\nText.");
  const part = node("p1", "part", 1, "Part I");
  assert.throws(
    () => extractChapterContent(source, part, [part]),
    /Només es pot editar/,
  );
});
