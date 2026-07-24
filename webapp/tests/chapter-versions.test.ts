import assert from "node:assert/strict";
import test from "node:test";

import { type ChapterDraft } from "../lib/chapter-editor.ts";
import {
  compareChapterTexts,
  createChapterVersion,
  prepareChapterRestoration,
  summarizeTextDiff,
} from "../lib/chapter-versions.ts";

const draft: ChapterDraft = {
  id: "chapter-1",
  projectId: "project-a",
  manuscriptId: "manuscript-1",
  chapterId: "chapter-1",
  content: "Primera línia.\nSegona línia.",
  revision: 4,
  wordCount: 4,
  createdAt: "2026-07-24T10:00:00.000Z",
  updatedAt: "2026-07-24T10:04:00.000Z",
  savedAt: "2026-07-24T10:04:01.000Z",
};

test("crea una instantània amb autoria, origen i revisió traçables", () => {
  const version = createChapterVersion(
    draft,
    {
      label: "  Argument revisat  ",
      author: "  Daniel  ",
      note: "  Abans de contrastar les fonts. ",
    },
    "2026-07-24T11:00:00.000Z",
    "version-1",
  );

  assert.equal(version.label, "Argument revisat");
  assert.equal(version.author, "Daniel");
  assert.equal(version.note, "Abans de contrastar les fonts.");
  assert.equal(version.origin, "manual");
  assert.equal(version.sourceRevision, 4);
  assert.equal(version.wordCount, 4);
});

test("rebutja una instantània sense nom o autoria", () => {
  assert.throws(
    () =>
      createChapterVersion(
        draft,
        { label: "", author: "Daniel" },
        "2026-07-24T11:00:00.000Z",
        "version-1",
      ),
    /nom/,
  );
  assert.throws(
    () =>
      createChapterVersion(
        draft,
        { label: "Versió", author: " " },
        "2026-07-24T11:00:00.000Z",
        "version-1",
      ),
    /autoria/,
  );
});

test("compara línies afegides, eliminades i conservades", () => {
  const diff = compareChapterTexts(
    "Títol\nArgument antic\nConclusió",
    "Títol\nArgument nou\nConclusió\nNota",
  );
  assert.deepEqual(summarizeTextDiff(diff), {
    added: 2,
    removed: 1,
    unchanged: 2,
  });
  assert.equal(diff.find((line) => line.kind === "removed")?.text, "Argument antic");
  assert.equal(diff.find((line) => line.text === "Argument nou")?.afterLine, 2);
});

test("un text idèntic només conté línies conservades", () => {
  const diff = compareChapterTexts(draft.content, draft.content);
  assert.deepEqual(summarizeTextDiff(diff), {
    added: 0,
    removed: 0,
    unchanged: 2,
  });
});

test("prepara una restauració reversible sense destruir el text actual", () => {
  const target = createChapterVersion(
    { ...draft, content: "Text històric.", revision: 2 },
    { label: "Versió històrica", author: "Daniel" },
    "2026-07-24T10:02:00.000Z",
    "version-old",
  );
  const { backupVersion, restoredDraft } = prepareChapterRestoration(
    draft,
    target,
    "Daniel",
    "2026-07-24T12:00:00.000Z",
    "version-backup",
  );

  assert.equal(backupVersion.content, draft.content);
  assert.equal(backupVersion.origin, "pre-restauracio");
  assert.equal(backupVersion.restoredFromVersionId, "version-old");
  assert.equal(restoredDraft.content, "Text històric.");
  assert.equal(restoredDraft.revision, 5);
});

test("impedeix restaurar una versió d’un altre capítol", () => {
  const target = createChapterVersion(
    { ...draft, id: "chapter-2", chapterId: "chapter-2" },
    { label: "Altre capítol", author: "Daniel" },
    "2026-07-24T10:02:00.000Z",
    "version-other",
  );
  assert.throws(
    () => prepareChapterRestoration(draft, target, "Daniel"),
    /no pertany/,
  );
});
