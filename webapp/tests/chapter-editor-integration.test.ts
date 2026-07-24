// Funció 303 — Migració, autodesat transaccional i recuperació.
import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";

import {
  chapterDraftRepository,
  openLocalDatabase,
} from "../lib/local-db/index.ts";
import { type ChapterDraft } from "../lib/chapter-editor.ts";

function createDatabaseV13(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("validaccio-local", 13);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("metadata", { keyPath: "key" });
      const projects = database.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("updatedAt", "updatedAt");
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

const draft: ChapterDraft = {
  id: "chapter-1",
  projectId: "project-a",
  manuscriptId: "manuscript-1",
  chapterId: "chapter-1",
  content: "Primera versió coherent.",
  revision: 1,
  wordCount: 3,
  createdAt: "2026-07-24T12:00:00.000Z",
  updatedAt: "2026-07-24T12:01:00.000Z",
  savedAt: null,
};

test("migra v13 → v14 i recupera l’últim autodesat", async () => {
  await createDatabaseV13();
  const database = await openLocalDatabase();
  assert.equal(database.objectStoreNames.contains("chapterDrafts"), true);

  await chapterDraftRepository.save(draft, "2026-07-24T12:01:01.000Z");
  const recovered = await chapterDraftRepository.get("chapter-1");
  assert.equal(recovered?.content, "Primera versió coherent.");
  assert.equal(recovered?.savedAt, "2026-07-24T12:01:01.000Z");
});

test("una escriptura antiga no sobreescriu una revisió posterior", async () => {
  await chapterDraftRepository.save(
    {
      ...draft,
      content: "Segona versió coherent i completa.",
      revision: 2,
      updatedAt: "2026-07-24T12:02:00.000Z",
    },
    "2026-07-24T12:02:01.000Z",
  );
  await chapterDraftRepository.save(
    {
      ...draft,
      content: "Escriptura antiga.",
      revision: 1,
    },
    "2026-07-24T12:03:00.000Z",
  );

  const recovered = await chapterDraftRepository.get("chapter-1");
  assert.equal(recovered?.revision, 2);
  assert.equal(recovered?.content, "Segona versió coherent i completa.");
});
