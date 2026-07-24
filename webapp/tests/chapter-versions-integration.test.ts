import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import { type ChapterDraft } from "../lib/chapter-editor.ts";
import {
  createChapterVersion,
  prepareChapterRestoration,
} from "../lib/chapter-versions.ts";
import {
  chapterDraftRepository,
  chapterVersionRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";

function createDatabaseV14(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 14);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
      database.createObjectStore("chapterDrafts", { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

const draft: ChapterDraft = {
  id: "chapter-304",
  projectId: "project-a",
  manuscriptId: "manuscript-1",
  chapterId: "chapter-304",
  content: "Text actual que cal conservar.",
  revision: 3,
  wordCount: 5,
  createdAt: "2026-07-24T10:00:00.000Z",
  updatedAt: "2026-07-24T10:03:00.000Z",
  savedAt: null,
};

test("migra v14 → v15 i desa instantànies immutables", async () => {
  await createDatabaseV14();
  const database = await openLocalDatabase();
  assert.equal(database.objectStoreNames.contains("chapterVersions"), true);

  const version = createChapterVersion(
    draft,
    { label: "Primera instantània", author: "Daniel" },
    "2026-07-24T11:00:00.000Z",
    "version-304",
  );
  await chapterVersionRepository.add(version);
  const versions = await chapterVersionRepository.getAllForChapter(draft.id);
  assert.equal(versions.length, 1);
  assert.equal(versions[0].author, "Daniel");

  await assert.rejects(
    () => chapterVersionRepository.add({ ...version, content: "Sobreescrit" }),
    /ConstraintError/,
  );
});

test("restaura el capítol i crea la còpia prèvia dins la mateixa transacció", async () => {
  await chapterDraftRepository.save(draft, "2026-07-24T10:03:01.000Z");
  const target = createChapterVersion(
    { ...draft, content: "Text de la versió escollida.", revision: 1 },
    { label: "Versió escollida", author: "Daniel" },
    "2026-07-24T10:01:00.000Z",
    "version-target",
  );
  await chapterVersionRepository.add(target);
  const restoration = prepareChapterRestoration(
    draft,
    target,
    "Daniel",
    "2026-07-24T12:00:00.000Z",
    "version-before-restore",
  );

  await chapterVersionRepository.restore(
    restoration.restoredDraft,
    restoration.backupVersion,
    "2026-07-24T12:00:01.000Z",
  );

  const recovered = await chapterDraftRepository.get(draft.id);
  const versions = await chapterVersionRepository.getAllForChapter(draft.id);
  assert.equal(recovered?.content, "Text de la versió escollida.");
  assert.equal(recovered?.revision, 4);
  assert.equal(versions.length, 3);
  assert.equal(
    versions.find((version) => version.id === "version-before-restore")?.content,
    draft.content,
  );
});
